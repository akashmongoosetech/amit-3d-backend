const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role, tv: admin.tokenVersion || 0 },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

module.exports = generateToken;
