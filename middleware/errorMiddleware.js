const { sendError } = require("../utils/responseHandler");

const multer = require("multer");

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size must be under 10 MB",
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join(". ");
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = (err.keyValue && Object.keys(err.keyValue)[0]) || "field";
    message = `An entry with this ${field} already exists`;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  if (process.env.NODE_ENV === "production") {
    // M6: never leak internal details; only allow safe 4xx messages
    const safe = statusCode < 500 ? message : "Internal Server Error";
    return sendError(res, safe, statusCode >= 500 ? 500 : statusCode);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: err.stack,
  });
};

module.exports = errorHandler;
