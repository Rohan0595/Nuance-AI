// services/credibilityService.js
const { CredibilityScore } = require("../models");
const { callAI } = require("./aiService");

async function computeAnalysis(article) {
  // Cache check
  try {
    const cached = await CredibilityScore.findOne({ articleId: article.id });
    if (cached) return cached.toObject();
  } catch (_) {}

  let trustScore = 70, trustExplanation = "Trust score unavailable.";
  let biasScore = 50, biasExplanation = "Bias analysis unavailable.";
  let misinfoScore = 20, misinfoExplanation = "Misinformation analysis unavailable.";

  try {
    const system = "You are an expert news analyst. Return ONLY valid JSON, no markdown formatting.";
    const userMessage = `Headline: "${article.headline}"\nSummary: "${article.summary}"\nSource: ${article.source}
    
Analyze the following article to provide a comprehensive analysis based on these exact criteria.
1. Trust Score (0-100, 100=highest trust): Judge based on Source Credibility, Cross Source Consistency, Content Quality, Authoritativeness.
2. Bias Score (0-100, 100=highest bias): Judge based on Language Bias, Framing Bias, Source Bias.
3. Misinformation Score (0-100, 100=highest misinfo): Judge based on Source Credibility, Cross Source Consistency, Content Red flags.

Return EXACTLY this JSON format:
{
  "trustScore": 85,
  "trustExplanation": "2-3 sentences explaining the trust score...",
  "biasScore": 20,
  "biasExplanation": "2-3 sentences explaining the bias score...",
  "misinfoScore": 5,
  "misinfoExplanation": "2-3 sentences explaining the misinformation score..."
}`;

    // Generate context using Groq
    const raw = await callAI(system, userMessage, 800);
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    
    trustScore = parsed.trustScore ?? trustScore;
    trustExplanation = parsed.trustExplanation || trustExplanation;
    biasScore = parsed.biasScore ?? biasScore;
    biasExplanation = parsed.biasExplanation || biasExplanation;
    misinfoScore = parsed.misinfoScore ?? misinfoScore;
    misinfoExplanation = parsed.misinfoExplanation || misinfoExplanation;
  } catch (err) {
    console.error("Analysis generation failed:", err.message);
  }

  const result = {
    articleId: article.id,
    trustScore, trustExplanation,
    biasScore, biasExplanation,
    misinfoScore, misinfoExplanation
  };

  // Cache to DB
  try {
    await CredibilityScore.findOneAndUpdate({ articleId: article.id }, result, { upsert: true });
  } catch (_) {}

  return result;
}

module.exports = { computeAnalysis };
