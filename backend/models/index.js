// models/index.js  –  all Mongoose schemas

const mongoose = require("mongoose");
const { Schema } = mongoose;

// ─── Article (also used as cache doc) ────────────────────────────────────────
const ArticleSchema = new Schema(
  {
    externalId: { type: String, unique: true, sparse: true }, // provider's id / url hash
    headline:   { type: String, required: true },
    summary:    { type: String, default: "" },
    content:    { type: String, default: "" },
    source:     { type: String, default: "Unknown" },
    category:   { type: String, default: "General" },
    url:        { type: String, default: "" },
    imageUrl:   { type: String, default: "" },
    publishedAt:{ type: Date,   default: Date.now },
    tags:       [{ type: String }],

    // Derived / display fields
    imageGradient: { type: String, default: "linear-gradient(135deg,#0f172a,#1e1b4b)" },
    accentColor:   { type: String, default: "#818cf8" },
    readTime:      { type: String, default: "3 min" },
  },
  { timestamps: true }
);

ArticleSchema.index({ category: 1, publishedAt: -1 });
ArticleSchema.index({ headline: "text", summary: "text", tags: "text" });

// ─── Cached News Feed ─────────────────────────────────────────────────────────
const NewsCacheSchema = new Schema({
  cacheKey:   { type: String, unique: true, required: true }, // e.g. "feed:AI" or "search:climate"
  articles:   [ArticleSchema],
  fetchedAt:  { type: Date, default: Date.now },
  expiresAt:  { type: Date, required: true },
});

NewsCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ─── Saved Articles ───────────────────────────────────────────────────────────
const SavedArticleSchema = new Schema(
  {
    sessionId:  { type: String, required: true, index: true }, // browser session or userId
    article:    { type: ArticleSchema, required: true },
  },
  { timestamps: true }
);

// ─── AI Context Cache ─────────────────────────────────────────────────────────
const AIContextSchema = new Schema(
  {
    articleId:        { type: String, required: true, unique: true },
    aiSummary:        String,
    whyItMatters:     String,
    whatHappenedBefore: String,
    implications:     String,
    keyEntities:      [String],
    topicTags:        [String],
    reelScript:       String,
    credibilityScore: Number,
    credibilityLabel: String,
    credibilityFactors: Schema.Types.Mixed,
  },
  { timestamps: true }
);

// ─── Credibility Scores ───────────────────────────────────────────────────────
const CredibilityScoreSchema = new Schema(
  {
    articleId:   { type: String, required: true, unique: true },
    score:       { type: Number, min: 0, max: 100 },
    label:       { type: String, enum: ["High", "Medium", "Low", "Unknown"], default: "Unknown" },
    factors: {
      sourceReputation: Number,
      sentimentBias:    Number,
      factDensity:      Number,
      clickbaitScore:   Number,
    },
    explanation: String,
  },
  { timestamps: true }
);

// ─── Users (optional, for authenticated save) ─────────────────────────────────
const UserSchema = new Schema(
  {
    name:            { type: String },
    email:           { type: String, unique: true, sparse: true },
    password:        { type: String },
    googleId:        { type: String, unique: true, sparse: true },
    phone:           { type: String, unique: true, sparse: true },
    resetPasswordToken:   { type: String },
    resetPasswordExpires: { type: Date },

    sessionId:       { type: String, unique: true, sparse: true },
    topicsFollowing: [String],
    articlesRead:    { type: Number, default: 0 },
    reelsWatched:    { type: Number, default: 0 },
    articlesSaved:   { type: Number, default: 0 },
    categoryStats:   { type: Map, of: Number, default: {} },
    dailyReads:      [{ date: { type: String }, count: { type: Number, default: 0 } }],
  },
  { timestamps: true }
);

// ─── AI POV Engine Cache ──────────────────────────────────────────────────────
const AIPOVSchema = new Schema(
  {
    articleId: { type: String, required: true, unique: true },
    content:   Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = {
  Article:          mongoose.model("Article", ArticleSchema),
  NewsCache:        mongoose.model("NewsCache", NewsCacheSchema),
  SavedArticle:     mongoose.model("SavedArticle", SavedArticleSchema),
  AIContext:        mongoose.model("AIContext", AIContextSchema),
  CredibilityScore: mongoose.model("CredibilityScore", CredibilityScoreSchema),
  User:             mongoose.model("User", UserSchema),
  AIPOV:            mongoose.model("AIPOV", AIPOVSchema),
};
