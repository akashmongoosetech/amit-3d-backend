const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const env = require("../config/env");
const { sendError } = require("../utils/responseHandler");

const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || typeof token !== "string") {
    return sendError(res, "Not authenticated. Please log in.", 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("+tokenVersion");
    if (!admin) {
      return sendError(res, "Admin belonging to this token no longer exists", 401);
    }
    if (!admin.isActive) {
      return sendError(res, "Your account has been deactivated", 403);
    }
    // Token revocation: bumped on password change/reset (H7)
    if (typeof decoded.tv === "number" && decoded.tv !== (admin.tokenVersion || 0)) {
      return sendError(res, "Session revoked. Please log in again.", 401);
    }
    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, "Token expired. Please log in again.", 401);
    }
    return sendError(res, "Invalid token. Please log in again.", 401);
  }
};

// Role-based access control (H1). Usage: authorize("superadmin")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return sendError(res, "Not authenticated. Please log in.", 401);
    }
    if (!roles.includes(req.admin.role)) {
      return sendError(res, "Forbidden: insufficient permissions", 403);
    }
    next();
  };
};

module.exports = { protect, authorize };
