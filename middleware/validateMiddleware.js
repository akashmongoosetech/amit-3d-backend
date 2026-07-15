const { validationResult } = require("express-validator");
const { sendError } = require("../utils/responseHandler");

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    next();
  };
};

module.exports = validate;
