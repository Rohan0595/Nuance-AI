// middleware/auth.js
const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      req.user = decoded; // { id }
      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
};

// Optional auth - attaches user to req if token exists, but doesn't block if not
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    } catch (error) {
      // ignore
    }
  }
  next();
};

module.exports = { protect, optionalAuth };
