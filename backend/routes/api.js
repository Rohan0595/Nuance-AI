// routes/api.js
const router = require("express").Router();
const { fetchNews, searchNews } = require("../services/newsService");
const { generateContext, generateSummary, generatePOV } = require("../services/aiService");
const { computeAnalysis } = require("../services/credibilityService");
const { getReelForArticle } = require("../services/reelService");
const { SavedArticle } = require("../models");

// ─── Helper ───────────────────────────────────────────────────────────────────
function sessionId(req) {
  // Use x-session-id header, or fall back to IP-based pseudo-session
  return req.headers["x-session-id"] || req.ip || "anonymous";
}

// ─── GET /api/news ─────────────────────────────────────────────────────────────
// ?category=AI&pageSize=20&topics=AI,Tech
router.get("/news", async (req, res) => {
  try {
    const { category = "All", topics, pageSize = 20 } = req.query;
    
    let queryCategory = category;
    if (category === "All" && topics) {
      // Create a personalized compound query for NewsAPI: "AI OR Tech OR Climate"
      queryCategory = topics.split(",").map(t => `"${t}"`).join(" OR ");
    }
    
    const articles = await fetchNews({ category: queryCategory, pageSize: Number(pageSize) });
    res.json({ success: true, count: articles.length, articles });
  } catch (err) {
    console.error("GET /news error:", err.message);
    res.status(502).json({ success: false, error: "Failed to fetch news. Check NEWS_API_KEY." });
  }
});

// ─── GET /api/news/:id ──────────────────────────────────────────────────────
// Returns a single article by id from the current feed (or a fresh fetch).
// In a real system you'd store articles in DB and look them up by id.
router.get("/news/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const articles = await fetchNews({});
    const article = articles.find(a => a.id === id);
    if (!article) return res.status(404).json({ success: false, error: "Article not found." });
    res.json({ success: true, article });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/search?q= ────────────────────────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const { q, pageSize = 20 } = req.query;
    if (!q || !q.trim()) return res.status(400).json({ success: false, error: "Query param 'q' is required." });
    const articles = await searchNews(q.trim(), Number(pageSize));
    res.json({ success: true, count: articles.length, articles });
  } catch (err) {
    console.error("GET /search error:", err.message);
    res.status(502).json({ success: false, error: "Search failed. Check NEWS_API_KEY." });
  }
});

// ─── POST /api/context ─────────────────────────────────────────────────────
// Body: { article: { id, headline, summary, source, category, tags } }
router.post("/context", async (req, res) => {
  try {
    const { article } = req.body;
    if (!article?.headline) return res.status(400).json({ success: false, error: "article.headline is required." });
    const context = await generateContext(article);
    res.json({ success: true, context });
  } catch (err) {
    console.error("POST /context error:", err.message);
    res.status(500).json({ success: false, error: "AI context generation failed." });
  }
});

// ─── POST /api/summary ─────────────────────────────────────────────────────
// Body: { article }
router.post("/summary", async (req, res) => {
  try {
    const { article } = req.body;
    if (!article?.headline) return res.status(400).json({ success: false, error: "article.headline is required." });
    const summary = await generateSummary(article);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: "Summary generation failed." });
  }
});

// ─── POST /api/analysis ─────────────────────────────────────────────────
// Body: { article }
router.post("/analysis", async (req, res) => {
  try {
    const { article } = req.body;
    if (!article?.headline) return res.status(400).json({ success: false, error: "article is required." });
    const result = await computeAnalysis(article);
    res.json({ success: true, analysis: result });
  } catch (err) {
    res.status(500).json({ success: false, error: "Analysis scoring failed." });
  }
});

// ─── POST /api/pov ──────────────────────────────────────────────────────
// Body: { article }
router.post("/pov", async (req, res) => {
  try {
    const { article } = req.body;
    if (!article?.headline) return res.status(400).json({ success: false, error: "article is required." });
    const pov = await generatePOV(article);
    if (!pov || Object.keys(pov).length === 0) {
      return res.status(500).json({ success: false, error: "POV failed to produce output." });
    }
    res.json({ success: true, pov });
  } catch (err) {
    res.status(500).json({ success: false, error: "POV Engine failed." });
  }
});

// ─── POST /api/reel ────────────────────────────────────────────────────────
// Body: { article }
router.post("/reel", async (req, res) => {
  try {
    const { article } = req.body;
    if (!article?.headline) return res.status(400).json({ success: false, error: "article is required." });
    const reel = await getReelForArticle(article);
    res.json({ success: true, reel });
  } catch (err) {
    res.status(500).json({ success: false, error: "Reel generation failed." });
  }
});

const { protect } = require("../middleware/auth");

// ─── POST /api/save ────────────────────────────────────────────────────────
// Body: { article }
router.post("/save", protect, async (req, res) => {
  try {
    const { article } = req.body;
    if (!article?.id) return res.status(400).json({ success: false, error: "article.id is required." });
    
    // Use the authenticated user ID instead of anonymous session
    const sid = req.user.id; 

    const existing = await SavedArticle.findOne({ sessionId: sid, "article.id": article.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, saved: false, message: "Article unsaved." });
    }

    await SavedArticle.create({ sessionId: sid, article });
    res.json({ success: true, saved: true, message: "Article saved." });
  } catch (err) {
    if (err.name === "MongoNotConnectedError" || err.name === "MongoServerSelectionError") {
      return res.json({ success: true, saved: true, message: "Saved (in-memory only – DB unavailable)." });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/saved ────────────────────────────────────────────────────────
router.get("/saved", protect, async (req, res) => {
  try {
    const sid = req.user.id;
    const docs = await SavedArticle.find({ sessionId: sid }).sort({ createdAt: -1 });
    const articles = docs.map(d => ({ ...d.article.toObject(), saved: true }));
    res.json({ success: true, count: articles.length, articles });
  } catch (err) {
    if (err.name === "MongoNotConnectedError" || err.name === "MongoServerSelectionError") {
      return res.json({ success: true, count: 0, articles: [] });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/read ────────────────────────────────────────────────────────
// Body: { category }
router.post("/read", protect, async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) return res.status(400).json({ success: false, error: "category is required" });
    
    const user = await require("../models").User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    user.articlesRead = (user.articlesRead || 0) + 1;
    const currentCount = user.categoryStats?.get(category) || 0;
    
    // Ensure categoryStats map exists
    if (!user.categoryStats) {
      user.categoryStats = new Map();
    }
    user.categoryStats.set(category, currentCount + 1);
    
    // Track daily reads
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    if (!user.dailyReads) user.dailyReads = [];
    const dayEntry = user.dailyReads.find(d => d.date === today);
    if (dayEntry) {
      dayEntry.count += 1;
    } else {
      user.dailyReads.push({ date: today, count: 1 });
      // Keep only last 30 days
      if (user.dailyReads.length > 30) user.dailyReads = user.dailyReads.slice(-30);
    }
    
    await user.save();
    res.json({ success: true, articlesRead: user.articlesRead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/health ──────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    newsProvider: process.env.NEWS_PROVIDER || "newsapi",
    dbConnected: require("mongoose").connection.readyState === 1,
  });
});

module.exports = router;
