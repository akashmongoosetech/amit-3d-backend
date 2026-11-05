const connectDB = require("./config/db");
const app = require("./app");
const env = require("./config/env");

const start = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Failed to connect to database:", err.message);
    process.exit(1);
  }
  const server = app.listen(env.PORT || 5000, () => {
    console.log(`Server running on port ${env.PORT || 5000}`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

start();
