const { body } = require("express-validator");

const subscribeValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage("Email too long"),
];

module.exports = { subscribeValidator };
