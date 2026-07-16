const { body } = require("express-validator");

const updateOrderStatusValidator = [
  body("orderStatus")
    .notEmpty()
    .withMessage("Order status is required")
    .isIn(["Start Create","Model Complete", "Dispatched", "Shipped"])
    .withMessage("Order status must be one of: Start Create, Model Complete, Dispatched, Shipped"),
];

module.exports = { updateOrderStatusValidator };
