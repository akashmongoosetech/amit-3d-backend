const express = require("express");
const router = express.Router();
const { signup, login, getCurrentAdmin, logout } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { signupValidator, loginValidator } = require("../utils/validators");

router.post("/signup", validate(signupValidator), signup);
router.post("/login", validate(loginValidator), login);
router.get("/me", protect, getCurrentAdmin);
router.post("/logout", protect, logout);

module.exports = router;
