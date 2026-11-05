const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const bookModelRoutes = require("./routes/bookModelRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const subscriberRoutes = require("./routes/subscriberRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const { sendError } = require("./utils/responseHandler");

const app = express();

app.set("trust proxy", 1);

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "blob:"],
  connectSrc: ["'self'", env.CLIENT_URL],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"],
};
if (env.NODE_ENV === "production") {
  cspDirectives.upgradeInsecureRequests = [];
}
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: { useDefaults: false, directives: cspDirectives },
  })
);
const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return cb(null, true);

    const allowed = env.CLIENT_URL.replace(/\/+$/, "");
    const incoming = origin.replace(/\/+$/, "");
    cb(null, allowed === incoming);
  },
  credentials: true,
};
app.use(cors(corsOptions));
// M13: JSON APIs don't need 5mb (uploads are multipart); reduce body abuse surface
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

// M5: global abuse backstop (strict per-route limiters still apply)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", globalLimiter);

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Verto3D API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/book-model", bookModelRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/newsletter", subscriberRoutes);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    etag: true,
    dotfiles: "deny",
    index: false,
  })
);

app.use((_req, res) => {
  return sendError(res, "Route not found", 404);
});

app.use(errorHandler);

module.exports = app;
