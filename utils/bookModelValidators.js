const { body } = require("express-validator");

const createBookModelValidator = [
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
    .notEmpty()
    .withMessage("Mobile number is required")
    .trim(),

  body("modelSize")
    .notEmpty()
    .withMessage("Model size is required")
    .trim(),

  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Message must be at least 10 characters")
    .isLength({ max: 5000 })
    .withMessage("Message must be at most 5000 characters"),

  body("modelName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Model name must be at most 200 characters"),
];

const updateStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
      "New Order",
      "Contact",
      "Payment",
      "Start Project",
      "Complete",
      "On Way",
      "Delivered",
    ])
    .withMessage("Invalid status value"),
];

module.exports = { createBookModelValidator, updateStatusValidator };
