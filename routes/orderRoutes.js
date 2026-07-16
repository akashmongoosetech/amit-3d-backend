const express = require("express");
const router = express.Router();
const {
  getAll,
  getById,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { updateOrderStatusValidator } = require("../utils/orderValidators");

router.get("/", protect, getAll);

router.get("/:id", protect, getById);

router.patch(
  "/:id/status",
  protect,
  validate(updateOrderStatusValidator),
  updateOrderStatus
);

module.exports = router;
