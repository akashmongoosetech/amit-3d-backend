const authService = require("../services/authService");
const { sendOtpEmail } = require("../services/emailService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, mobile, username, password } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : "";
    const result = await authService.createAdmin({
      firstName,
      lastName,
      email,
      mobile,
      username,
      password,
      profileImage,
    });

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, { admin: result.admin, token: result.token }, "Admin registered successfully", 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.authenticateAdmin(identifier, password);

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, { admin: result.admin, token: result.token }, "Login successful");
  } catch (err) {
    next(err);
  }
};

const getCurrentAdmin = async (req, res, next) => {
  try {
    const admin = await authService.getAdminById(req.admin._id);
    return sendSuccess(res, admin);
  } catch (err) {
    next(err);
  }
};

const logout = async (_req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return sendSuccess(res, null, "Logged out successfully");
};

const sendOtp = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== "string")
      return sendError(res, "Email, username or mobile is required", 400);

    const { otp, email } = await authService.sendOtp(identifier);

    try {
      await sendOtpEmail(email, otp);
    } catch (emailErr) {
      console.error("sendOtpEmail failed:", emailErr.message);
      // Never expose OTP in API responses. Log only in non-production when explicitly enabled.
      const env = require("../config/env");
      if (env.NODE_ENV !== "production" && env.LOG_OTP_IN_CONSOLE) {
        console.log(`[DEV] OTP for ${email} generated (see secure logs)`);
      }
      return sendError(res, "Failed to send OTP email. Please check SMTP configuration and try again.", 500);
    }

    return sendSuccess(res, { message: "OTP sent to your email" }, "OTP sent to your email");
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp || typeof email !== "string" || typeof otp !== "string")
      return sendError(res, "Email and OTP are required", 400);

    const verifyToken = await authService.verifyOtp(email, otp);
    return sendSuccess(res, { verifyToken }, "OTP verified successfully");
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { verifyToken, password, confirmPassword } = req.body;
    if (
      !verifyToken ||
      !password ||
      !confirmPassword ||
      typeof verifyToken !== "string" ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return sendError(res, "verifyToken, password and confirmPassword are required", 400);
    }

    await authService.resetPassword(verifyToken, password, confirmPassword);
    return sendSuccess(res, null, "Password reset successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getCurrentAdmin, logout, sendOtp, verifyOtp, resetPassword };
