const { body } = require("express-validator");

const contactValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2–100 characters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("mobile")
    .optional({ values: "falsy" })
    .trim()
    .isMobilePhone("any")
    .withMessage("Invalid mobile number"),

  body("company")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Company name must be at most 200 characters"),

  body("budget")
    .optional({ values: "falsy" })
    .trim(),

  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Message must be at least 10 characters")
    .isLength({ max: 5000 })
    .withMessage("Message must be at most 5000 characters"),
];

module.exports = { contactValidator };
