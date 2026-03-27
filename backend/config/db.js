// config/db.js
const mongoose = require("mongoose");

const CATEGORY_COLORS = {
  AI:         { accent: "#818cf8", gradientStop: "#1e1b4b" },
  Geopolitics:{ accent: "#f87171", gradientStop: "#2d1515" },
  Climate:    { accent: "#2dd4bf", gradientStop: "#042f2e" },
  Tech:       { accent: "#c084fc", gradientStop: "#1a1a2e" },
  Economy:    { accent: "#fbbf24", gradientStop: "#2d1f00" },
  Health:     { accent: "#4ade80", gradientStop: "#1a2e00" },
  Science:    { accent: "#38bdf8", gradientStop: "#0c1e2e" },
  General:    { accent: "#94a3b8", gradientStop: "#1e293b" },
};

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ainews", {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.warn("⚠️  Running without database – saves/cache disabled");
  }
}

module.exports = { connectDB, CATEGORY_COLORS };
