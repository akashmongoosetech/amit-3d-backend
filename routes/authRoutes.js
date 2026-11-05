const express = require("express");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { signup, login, getCurrentAdmin, logout, sendOtp, verifyOtp, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { signupValidator, loginValidator, otpRequestValidator, otpVerifyValidator, resetPasswordValidator } = require("../utils/validators");
const upload = require("../config/multer");
const env = require("../config/env");
const Admin = require("../models/Admin");
const { sendError } = require("../utils/responseHandler");

// C1: Gate public admin signup. Allows first-admin bootstrap, setup key, or
// authenticated superadmin. Set ALLOW_PUBLIC_SIGNUP=true only for dev/demo.
const signupGate = async (req, res, next) => {
  try {
    if (env.ALLOW_PUBLIC_SIGNUP) return next();
    const count = await Admin.countDocuments();
    if (count === 0) return next();
    const setupKey = req.headers["x-setup-key"] || req.body.setupKey;
    if (env.ADMIN_SETUP_KEY && setupKey === env.ADMIN_SETUP_KEY) return next();
    // Allow authenticated superadmin to create other admins
    const header = req.headers.authorization;
    const cookieToken = req.cookies && req.cookies.token;
    const token = cookieToken || (header && header.startsWith("Bearer ") ? header.split(" ")[1] : null);
    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (admin && admin.isActive && admin.role === "superadmin") {
          req.admin = admin;
          return next();
        }
      } catch (_) {
        /* fall through to 403 */
      }
    }
    return sendError(res, "Admin registration is disabled. Contact a superadmin.", 403);
  } catch (err) {
    return next(err);
  }
};

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

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many password reset attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", signupLimiter, signupGate, upload.single("profileImage"), validate(signupValidator), signup);
router.post("/login", authLimiter, validate(loginValidator), login);
router.get("/me", protect, getCurrentAdmin);
router.post("/logout", protect, logout);
router.post("/send-otp", otpLimiter, validate(otpRequestValidator), sendOtp);
router.post("/verify-otp", verifyLimiter, validate(otpVerifyValidator), verifyOtp);
router.post("/reset-password", resetLimiter, validate(resetPasswordValidator), resetPassword);

module.exports = router;
