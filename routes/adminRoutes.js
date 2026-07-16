const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const {
  updateProfileValidator,
  changePasswordValidator,
} = require("../utils/adminValidators");
const upload = require("../config/multer");

router.get("/profile", protect, getProfile);

router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  validate(updateProfileValidator),
  updateProfile
);

router.put(
  "/change-password",
  protect,
  validate(changePasswordValidator),
  changePassword
);

module.exports = router;
