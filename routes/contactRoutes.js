const express = require("express");
const router = express.Router();
const { submit, list, updateStatus } = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { contactValidator } = require("../utils/contactValidators");

router.post("/", validate(contactValidator), submit);
router.get("/", protect, list);
router.patch("/:id/status", protect, updateStatus);

module.exports = router;
