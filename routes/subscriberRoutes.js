const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { subscribe, list, remove } = require("../controllers/subscriberController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { subscribeValidator } = require("../utils/subscriberValidators");

const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many subscription attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/subscribe", subscribeLimiter, validate(subscribeValidator), subscribe);
router.get("/subscribe", protect, list);
router.delete("/subscribe/:id", protect, remove);

module.exports = router;
