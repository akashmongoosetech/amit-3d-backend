const { body } = require("express-validator");
const Admin = require("../models/Admin");

const signupValidator = [
  body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2–50 characters"),

  body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2–50 characters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("mobile")
    .notEmpty()
    .withMessage("Mobile number is required")
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .matches(/^\d{10,15}$/)
    .withMessage("Mobile number must be 10–15 digits"),

  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain one special character")
    .custom(async (value, { req }) => {
      if (value.toLowerCase().includes(req.body.firstName?.toLowerCase())) {
        throw new Error("Password must not contain your first name");
      }
    })
    .custom(async (value, { req }) => {
      if (value.toLowerCase().includes(req.body.lastName?.toLowerCase())) {
        throw new Error("Password must not contain your last name");
      }
    }),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom(async (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
    }),
];

const loginValidator = [
  body("identifier")
    .notEmpty()
    .withMessage("Email, mobile or username is required")
    .trim(),

  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { signupValidator, loginValidator };
