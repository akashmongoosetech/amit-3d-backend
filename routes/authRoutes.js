const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { signup, login, getCurrentAdmin, logout, sendOtp, verifyOtp, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { signupValidator, loginValidator } = require("../utils/validators");
const upload = require("../config/multer");

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

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: "Too many OTP requests. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many verification attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", signupLimiter, upload.single("profileImage"), validate(signupValidator), signup);
router.post("/login", authLimiter, validate(loginValidator), login);
router.get("/me", protect, getCurrentAdmin);
router.post("/logout", protect, logout);
router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyLimiter, verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
