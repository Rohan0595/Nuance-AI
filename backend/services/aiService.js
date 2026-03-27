// services/aiService.js
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Core Groq call ─────────────────────────────────────────────────────────
async function callAI(system, userMessage, maxTokens = 900) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq API Error:", error.message || error);
    return "";
  }
}

function safeParseJSON(raw, fallback = {}) {
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("JSON parse failed. Raw string was:", raw.substring(0, 100) + "...");
    return fallback;
  }
}

// ─── Generate full context ────────────────────────────────────────────────────
async function generateContext(article) {
  // Cache check
  const { AIContext } = require("../models");
  try {
    const cached = await AIContext.findOne({ articleId: article.id });
    if (cached) return cached.toObject();
  } catch (_) {}

  const system = `You are an expert news analyst and context engine. Return ONLY valid JSON, no markdown fences, no commentary.`;
  const user = `
Analyze the following news article:
Headline: "${article.headline}"
Content/Summary: "${article.summary}"
Source: ${article.source}
Category: ${article.category}

Return a JSON object with EXACTLY these keys. Follow the instructions for each exactly:
{
  "aiSummary": "Provide a detailed yet concise summary. Focus on clearly explaining the core event and its key developments. Include: A strong opening overview (2-3 sentences capturing the essence), Key facts (who, what, when, where), Main developments or actions taken, Important data/statistics or official statements, and Any immediate outcomes or current status. Ensure it is informative, neutral, and avoids fluff.",
  "whyItMatters": "Explain why this news is important. Go beyond the surface and highlight its significance. Include: The broader relevance (economic, political, social, etc.), Who is affected and how, Why this issue deserves attention right now, Connections to larger trends or ongoing developments, and Potential risks or opportunities. Keep it concise but insight-rich.",
  "whatHappenedBefore": "Provide a clear and concise background to help understand context. Include: Key past events leading up to this, Important decisions or conflicts over time, Relevant organizations/individuals, A short timeline-style explanation if applicable, and Any previous similar incidents. Focus on essential context only.",
  "implications": "Analyze the implications in a structured way. Include: Short-term consequences (immediate effects), Long-term implications (future impact), Effects on different stakeholders, Possible best-case and worst-case scenarios, and What to watch next. Keep it concise but thoughtful.",
  "keyEntities": ["up to 5 key people, orgs, places"],
  "topicTags": ["3-5 topic tags"],
  "reelScript": "3 punchy sentences separated by newlines. First is a hook."
}`.trim();

  const raw = await callAI(system, user, 1500);
  const result = safeParseJSON(raw, {
    aiSummary: article.summary,
    whyItMatters: "Analysis unavailable.",
    whatHappenedBefore: "Background context unavailable.",
    implications: "Implications unavailable.",
    keyEntities: article.tags || [],
    topicTags: [article.category],
    reelScript: article.summary,
  });

  result.articleId = article.id;

  // Cache to DB
  try {
    await AIContext.findOneAndUpdate({ articleId: article.id }, result, { upsert: true, new: true });
  } catch (_) {}

  return result;
}

// ─── Generate summary only ────────────────────────────────────────────────────
async function generateSummary(article) {
  const system = `You are a concise news summarizer. Return ONLY JSON, no markdown.`;
  const user = `
Headline: "${article.headline}"
Content: "${(article.content || article.summary || "").slice(0, 2000)}"

Return: { "summary": "3-4 sentence summary", "bulletPoints": ["key point 1","key point 2","key point 3"] }`.trim();

  const raw = await callAI(system, user, 500);
  return safeParseJSON(raw, {
    summary: article.summary,
    bulletPoints: [],
  });
}

// ─── Generate reel script ─────────────────────────────────────────────────────
async function generateReel(article) {
  // Try context cache first
  const { AIContext } = require("../models");
  try {
    const cached = await AIContext.findOne({ articleId: article.id });
    if (cached?.reelScript) return { reelScript: cached.reelScript };
  } catch (_) {}

  const system = `You are a short-form video script writer. Return ONLY JSON, no markdown.`;
  const user = `
Headline: "${article.headline}"
Summary: "${article.summary}"

Return: { "reelScript": "3 sentences separated by newlines. Sentence 1: bold hook. Sentence 2: key fact. Sentence 3: why it matters." }`.trim();

  const raw = await callAI(system, user, 300);
  return safeParseJSON(raw, { reelScript: article.summary });
}

// ─── Generate POV Engine Debate ───────────────────────────────────────────────
async function generatePOV(article) {
  const { AIPOV } = require("../models");
  try {
    const cached = await AIPOV.findOne({ articleId: article.id });
    if (cached?.content) return cached.content;
  } catch (_) {}

  const system = `You are the POV Engine. Your job is to generate a comprehensive, structured, multi-layered debate JSON. Return ONLY valid JSON, no markdown formatting.`;
  const user = `
Analyze the following news article:
Headline: "${article.headline}"
Summary: "${article.summary}"
Content: "${(article.content || "").slice(0, 3000)}"

Structure the JSON response EXACTLY as follows:
{
  "debateFraming": {
    "motion": "A clear, sharp debate motion (as a question or strong statement)",
    "relevance": "Briefly explain why this debate is relevant right now"
  },
  "stakeholders": [
    { "name": "e.g., Government", "position": "Briefly describe interest or position" }
  ],
  "positioning": {
    "sideA": "e.g., Supports / In Favor",
    "sideB": "e.g., Opposes / Against"
  },
  "coreArguments": {
    "sideA": [
      { "title": "...", "detail": "Clearly explained reasoning, examples, or evidence" }
    ],
    "sideB": [
      { "title": "...", "detail": "Clearly explained reasoning, examples, or evidence" }
    ]
  },
  "evidence": [
    { "point": "Data, statistics, expert opinions, or historical parallels" }
  ],
  "rebuttals": {
    "sideA": [
      { "target": "Identify argument from Side B", "rebuttal": "Direct, logical rebuttal" }
    ],
    "sideB": [
      { "target": "Identify argument from Side A", "rebuttal": "Direct, logical rebuttal" }
    ]
  },
  "grayAreas": ["Highlight complexities, trade-offs, unintended consequences"],
  "scenarioAnalysis": {
    "sideABest": "Best-case scenario if Side A prevails",
    "sideAWorst": "Worst-case scenario if Side A prevails",
    "sideBBest": "Best-case scenario if Side B prevails",
    "sideBWorst": "Worst-case scenario if Side B prevails"
  },
  "futureOutlook": ["What developments should be watched next?", "How might this debate evolve?"],
  "neutralSynthesis": "Conclude with a balanced summary that weighs both sides objectively, emphasizes core tension, and maintains a neutral stance."
}`.trim();

  const raw = await callAI(system, user, 3500); // Massive token allowance for full response
  let result = null;
  try {
    result = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch (err) {
    console.error("POV Engine JSON parse failed", raw.slice(0, 100));
    return null;
  }

  try {
    await AIPOV.findOneAndUpdate({ articleId: article.id }, { articleId: article.id, content: result }, { upsert: true });
  } catch (_) {}

  return result;
}

module.exports = { generateContext, generateSummary, generateReel, generatePOV, callAI };
