const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { signup, login, getCurrentAdmin, logout } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { signupValidator, loginValidator } = require("../utils/validators");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many signup attempts. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", signupLimiter, validate(signupValidator), signup);
router.post("/login", authLimiter, validate(loginValidator), login);
router.get("/me", protect, getCurrentAdmin);
router.post("/logout", protect, logout);

module.exports = router;
