const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const bookModelRoutes = require("./routes/bookModelRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const { sendError } = require("./utils/responseHandler");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Verto3D API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/book-model", bookModelRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("*", (_req, res) => {
  return sendError(res, "Route not found", 404);
});

app.use(errorHandler);

module.exports = app;
