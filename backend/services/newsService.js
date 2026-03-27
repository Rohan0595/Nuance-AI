// services/newsService.js
const axios = require("axios");
const NodeCache = require("node-cache");
const { v4: uuidv4 } = require("uuid");
const { NewsCache } = require("../models");

const memCache = new NodeCache({ stdTTL: Number(process.env.NEWS_CACHE_TTL) || 300 });

// ─── Category → color mapping ─────────────────────────────────────────────────
const ACCENT = {
  AI:          { accent: "#818cf8", g1: "#0f172a", g2: "#1e1b4b" },
  Geopolitics: { accent: "#f87171", g1: "#1a0a0a", g2: "#2d1515" },
  Climate:     { accent: "#2dd4bf", g1: "#0c1a1a", g2: "#042f2e" },
  Tech:        { accent: "#c084fc", g1: "#0a0a1a", g2: "#1a1a2e" },
  Economy:     { accent: "#fbbf24", g1: "#1a1000", g2: "#2d1f00" },
  Health:      { accent: "#4ade80", g1: "#0a1a00", g2: "#1a2e00" },
  Science:     { accent: "#38bdf8", g1: "#001a2e", g2: "#002d47" },
  General:     { accent: "#94a3b8", g1: "#111827", g2: "#1e293b" },
};

function categoryColors(cat) {
  return ACCENT[cat] || ACCENT.General;
}

// ─── Read-time estimator ──────────────────────────────────────────────────────
function estimateReadTime(text = "") {
  if (!text) return "1 min";
  const words = text.split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min`;
}

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Keyword → category mapper ────────────────────────────────────────────────
function guessCategory(text = "") {
  const t = text.toLowerCase();
  if (/\b(ai|gpt|llm|openai|anthropic|deepmind|neural|machine learning)\b/.test(t)) return "AI";
  if (/\b(climate|carbon|arctic|glacier|emissions|warming|fossil)\b/.test(t)) return "Climate";
  if (/\b(war|military|nato|geopolit|sanction|diplomat|treaty|china|russia|taiwan)\b/.test(t)) return "Geopolitics";
  if (/\b(tech|apple|google|meta|microsoft|startup|software|chip|semiconductor)\b/.test(t)) return "Tech";
  if (/\b(stock|fed|rate|gdp|inflation|recession|bank|economy|market)\b/.test(t)) return "Economy";
  if (/\b(health|cancer|vaccine|drug|fda|hospital|disease|clinical|trial)\b/.test(t)) return "Health";
  if (/\b(space|nasa|quantum|physics|biology|crispr|genome|science)\b/.test(t)) return "Science";
  return "General";
}

// ─── Extract simple tags ──────────────────────────────────────────────────────
function extractTags(title = "", description = "") {
  const words = `${title} ${description}`.match(/\b[A-Z][a-zA-Z]{3,}\b/g) || [];
  return [...new Set(words)].slice(0, 5);
}

// ─── Transform: NewsAPI → internal format ─────────────────────────────────────
function transformNewsAPI(article, idx) {
  const category = guessCategory(`${article.title} ${article.description}`);
  const { accent, g1, g2 } = categoryColors(category);
  return {
    id: `newsapi-${uuidv4()}`,
    headline: article.title || "Untitled",
    summary: article.description || "",
    content: article.content || article.description || "",
    source: article.source?.name || "Unknown",
    category,
    time: relativeTime(article.publishedAt),
    readTime: estimateReadTime(article.content || article.description),
    saved: false,
    url: article.url || "",
    imageUrl: article.urlToImage || "",
    imageGradient: `linear-gradient(135deg, ${g1} 0%, ${g2} 50%, ${g1} 100%)`,
    accentColor: accent,
    tags: extractTags(article.title, article.description),
    publishedAt: article.publishedAt,
  };
}

// ─── Transform: GNews → internal format ──────────────────────────────────────
function transformGNews(article) {
  const category = guessCategory(`${article.title} ${article.description}`);
  const { accent, g1, g2 } = categoryColors(category);
  return {
    id: `gnews-${uuidv4()}`,
    headline: article.title || "Untitled",
    summary: article.description || "",
    content: article.content || "",
    source: article.source?.name || "Unknown",
    category,
    time: relativeTime(article.publishedAt),
    readTime: estimateReadTime(article.content || article.description),
    saved: false,
    url: article.url || "",
    imageUrl: article.image || "",
    imageGradient: `linear-gradient(135deg, ${g1} 0%, ${g2} 50%, ${g1} 100%)`,
    accentColor: accent,
    tags: extractTags(article.title, article.description),
    publishedAt: article.publishedAt,
  };
}

// ─── Transform: Guardian → internal format ───────────────────────────────────
function transformGuardian(article) {
  const category = guessCategory(`${article.webTitle} ${article.fields?.bodyText || ""}`);
  const { accent, g1, g2 } = categoryColors(category);
  const body = article.fields?.bodyText || article.fields?.standfirst || "";
  return {
    id: `guardian-${uuidv4()}`,
    headline: article.webTitle || "Untitled",
    summary: article.fields?.standfirst || article.fields?.trailText || body.slice(0, 200),
    content: body,
    source: "The Guardian",
    category,
    time: relativeTime(article.webPublicationDate),
    readTime: estimateReadTime(body),
    saved: false,
    url: article.webUrl || "",
    imageUrl: article.fields?.thumbnail || "",
    imageGradient: `linear-gradient(135deg, ${g1} 0%, ${g2} 50%, ${g1} 100%)`,
    accentColor: accent,
    tags: (article.tags || []).map(t => t.webTitle).slice(0, 5),
    publishedAt: article.webPublicationDate,
  };
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function fetchFromNewsAPI(query, category, pageSize = 20) {
  const params = {
    apiKey: process.env.NEWS_API_KEY,
    pageSize,
    language: "en",
  };
  let url;
  const catMap = { Economy: "business", Health: "health", Science: "science", Tech: "technology", General: "general" };

  if (query) {
    url = "https://newsapi.org/v2/everything";
    params.q = query;
    params.sortBy = "relevancy";
  } else if (category && category !== "All" && !catMap[category]) {
    // Custom predefined topics (like AI, Geopolitics, Climate) require searching ALL recent articles.
    url = "https://newsapi.org/v2/everything";
    params.q = category.toLowerCase();
    params.sortBy = "relevancy";
  } else {
    // Standard broad categories
    url = "https://newsapi.org/v2/top-headlines";
    if (category && category !== "All") params.category = catMap[category];
    params.country = "us";
  }

  const { data } = await axios.get(url, { params, timeout: 8000 });
  return (data.articles || []).map(transformNewsAPI);
}

async function fetchFromGNews(query, category, max = 10) {
  const params = {
    token: process.env.GNEWS_API_KEY,
    max,
    lang: "en",
    sortby: "publishedAt",
  };
  let url;
  if (query) {
    url = "https://gnews.io/api/v4/search";
    params.q = query;
  } else {
    url = "https://gnews.io/api/v4/top-headlines";
    if (category && category !== "All") params.topic = category.toLowerCase();
  }
  const { data } = await axios.get(url, { params, timeout: 8000 });
  return (data.articles || []).map(transformGNews);
}

async function fetchFromGuardian(query, section, pageSize = 20) {
  const params = {
    "api-key": process.env.GUARDIAN_API_KEY,
    "page-size": pageSize,
    "show-fields": "standfirst,trailText,bodyText,thumbnail",
    "show-tags": "keyword",
    "order-by": "newest",
  };
  if (query) params.q = query;
  if (section && section !== "All") params.section = section.toLowerCase();
  const { data } = await axios.get("https://content.guardianapis.com/search", { params, timeout: 8000 });
  return (data.response?.results || []).map(transformGuardian);
}

// ─── Public API ───────────────────────────────────────────────────────────────
const provider = (process.env.NEWS_PROVIDER || "newsapi").toLowerCase();

async function fetchNews({ category = "All", pageSize = 20 } = {}) {
  const cacheKey = `feed:${category}`;

  // 1. Memory cache (fastest)
  const hit = memCache.get(cacheKey);
  if (hit) return hit;

  // 2. DB cache
  try {
    const dbCache = await NewsCache.findOne({ cacheKey, expiresAt: { $gt: new Date() } });
    if (dbCache) {
      memCache.set(cacheKey, dbCache.articles);
      return dbCache.articles;
    }
  } catch (_) { /* DB may not be connected */ }

  // 3. Live fetch
  let articles = [];
  try {
    if (provider === "gnews")    articles = await fetchFromGNews(null, category, pageSize);
    else if (provider === "guardian") articles = await fetchFromGuardian(null, category, pageSize);
    else                              articles = await fetchFromNewsAPI(null, category, pageSize);
  } catch (err) {
    console.error("News fetch error:", err.message);
    throw err;
  }

  // 4. Store in caches
  const ttl = Number(process.env.NEWS_CACHE_TTL) || 300;
  memCache.set(cacheKey, articles);
  try {
    await NewsCache.findOneAndUpdate(
      { cacheKey },
      { cacheKey, articles, fetchedAt: new Date(), expiresAt: new Date(Date.now() + ttl * 1000) },
      { upsert: true }
    );
  } catch (_) {}

  return articles;
}

async function searchNews(query, pageSize = 20) {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const hit = memCache.get(cacheKey);
  if (hit) return hit;

  let articles = [];
  if (provider === "gnews")         articles = await fetchFromGNews(query, null, pageSize);
  else if (provider === "guardian") articles = await fetchFromGuardian(query, null, pageSize);
  else                               articles = await fetchFromNewsAPI(query, null, pageSize);

  memCache.set(cacheKey, articles, 120); // shorter cache for searches
  return articles;
}

module.exports = { fetchNews, searchNews };
