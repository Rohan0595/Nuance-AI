// server.js  –  Entry point
require("dotenv").config();

const express     = require("express");
const cors        = require("cors");
const rateLimit   = require("express-rate-limit");
const path        = require("path");
const { connectDB }       = require("./config/db");
const apiRoutes           = require("./routes/api");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Connect DB (non-blocking – app works without it) ─────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
  ],
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting – protect AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 20,                   // max 20 AI calls/min per IP
  message: { success: false, error: "Too many requests. Please slow down." },
});

// General API limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

app.use("/api/context",     aiLimiter);
app.use("/api/summary",     aiLimiter);
app.use("/api/credibility", aiLimiter);
app.use("/api/reel",        aiLimiter);
app.use("/api",             apiLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api", apiRoutes);

// ─── Serve React build in production ─────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(buildPath));
  app.get("*", (req, res) => res.sendFile(path.join(buildPath, "index.html")));
}

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   AI News API  –  port ${PORT}            ║
╠════════════════════════════════════════╣
║  GET  /api/news                        ║
║  GET  /api/news/:id                    ║
║  GET  /api/search?q=                   ║
║  POST /api/context                     ║
║  POST /api/summary                     ║
║  POST /api/credibility                 ║
║  POST /api/reel                        ║
║  POST /api/save                        ║
║  GET  /api/saved                       ║
║  GET  /api/health                      ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
