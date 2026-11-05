const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { submit, list, updateStatus } = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { contactValidator, contactStatusValidator } = require("../utils/contactValidators");

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many contact requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", contactLimiter, validate(contactValidator), submit);
router.get("/", protect, list);
router.patch("/:id/status", protect, validate(contactStatusValidator), updateStatus);

module.exports = router;
