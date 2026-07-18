const express = require("express");
const router = express.Router();
const { subscribe, list, remove } = require("../controllers/subscriberController");
const { protect } = require("../middleware/authMiddleware");

router.post("/subscribe", subscribe);
router.get("/subscribe", protect, list);
router.delete("/subscribe/:id", protect, remove);

module.exports = router;
