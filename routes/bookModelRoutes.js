const express = require("express");
const router = express.Router();
const {
  create,
  getAll,
  getById,
  updateStatus,
  delete_,
  getStatuses,
} = require("../controllers/bookModelController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const {
  createBookModelValidator,
  updateStatusValidator,
} = require("../utils/bookModelValidators");
const upload = require("../config/multer");

router.get("/statuses", getStatuses);

router.post(
  "/",
  upload.single("referenceImage"),
  validate(createBookModelValidator),
  create
);

router.get("/", protect, getAll);

router.get("/:id", protect, getById);

router.patch(
  "/:id/status",
  protect,
  validate(updateStatusValidator),
  updateStatus
);

router.delete("/:id", protect, delete_);

module.exports = router;
