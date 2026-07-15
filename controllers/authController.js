const authService = require("../services/authService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, mobile, username, password, profileImage } = req.body;
    const result = await authService.createAdmin({
      firstName,
      lastName,
      email,
      mobile,
      username,
      password,
      profileImage,
    });

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, { admin: result.admin, token: result.token }, "Admin registered successfully", 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.authenticateAdmin(identifier, password);

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, { admin: result.admin, token: result.token }, "Login successful");
  } catch (err) {
    next(err);
  }
};

const getCurrentAdmin = async (req, res, next) => {
  try {
    const admin = await authService.getAdminById(req.admin._id);
    return sendSuccess(res, admin);
  } catch (err) {
    next(err);
  }
};

const logout = async (_req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return sendSuccess(res, null, "Logged out successfully");
};

module.exports = { signup, login, getCurrentAdmin, logout };
