// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { User } = require("../models");
const { protect } = require("../middleware/auth");

try {
  admin.initializeApp({ projectId: "nuance-ai-e9e6b" });
} catch (error) {} // prevent re-initialize errors

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Helper to generate JWT
const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });

// @route   POST /api/auth/register
// @desc    Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Please enter all fields." });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "User already exists." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });
    res.json({ success: true, token: generateToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
});

// @route   POST /api/auth/login
// @desc    Login user & get token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Please enter all fields." });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials." });
    
    // Check if user was registered via Google only
    if (!user.password && user.googleId) return res.status(400).json({ success: false, message: "Please login with Google." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials." });

    res.json({ success: true, token: generateToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// @route   POST /api/auth/phone
// @desc    Login or register via Firebase Phone Auth
router.post("/phone", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: "Missing idToken from frontend" });
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phone = decodedToken.phone_number;

    if (!phone) {
      return res.status(400).json({ success: false, message: "No phone number found in token." });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      const name = "User " + phone.slice(-4);
      user = await User.create({ name, phone });
    }

    res.json({ success: true, token: generateToken(user._id), user: { id: user._id, name: user.name, phone: user.phone } });
  } catch (error) {
    console.error("Firebase/DB Error:", error.message);
    res.status(500).json({ success: false, message: "Backend Error: " + error.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Generate password reset token
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "No account with that email found." });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Mock Email Service
    console.log(`\n\n--- MOCK EMAIL SEND ---\nTo: ${user.email}\nSubject: Password Reset\nBody: You requested a password reset. Use token: ${resetToken}\n(In production, link to frontend reset page)\n-----------------------\n\n`);

    res.json({ success: true, message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// @route   PUT /api/auth/me
// @desc    Update current user profile (name, password, topicsFollowing)
router.put("/me", protect, async (req, res) => {
  try {
    const { name, password, topicsFollowing } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (name) user.name = name;
    if (topicsFollowing) user.topicsFollowing = topicsFollowing;
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    
    await user.save();
    const updatedUser = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpires");
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("PUT /auth/me Error:", error.message);
    res.status(500).json({ success: false, message: "Server error during profile update." });
  }
});

module.exports = router;
