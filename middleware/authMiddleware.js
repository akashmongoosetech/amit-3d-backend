const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { sendError } = require("../utils/responseHandler");

const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendError(res, "Not authenticated. Please log in.", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return sendError(res, "Admin belonging to this token no longer exists", 401);
    }
    if (!admin.isActive) {
      return sendError(res, "Your account has been deactivated", 403);
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

module.exports = { protect };
