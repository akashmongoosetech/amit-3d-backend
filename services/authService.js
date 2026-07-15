const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");
const { sendError } = require("../utils/responseHandler");

const createAdmin = async (data) => {
  const { firstName, lastName, email, mobile, username, password, profileImage } = data;

  const existingEmail = await Admin.findOne({ email });
  if (existingEmail) {
    const error = new Error("An admin with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const existingMobile = await Admin.findOne({ mobile });
  if (existingMobile) {
    const error = new Error("An admin with this mobile number already exists");
    error.statusCode = 409;
    throw error;
  }

  const existingUsername = await Admin.findOne({ username });
  if (existingUsername) {
    const error = new Error("An admin with this username already exists");
    error.statusCode = 409;
    throw error;
  }

  const admin = await Admin.create({
    firstName,
    lastName,
    email,
    mobile,
    username,
    password,
    profileImage: profileImage || "",
  });

  const token = generateToken(admin);
  return { admin, token };
};

const authenticateAdmin = async (identifier, password) => {
  const admin = await Admin.findOne({
    $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }, { username: identifier.toLowerCase() }],
  }).select("+password");

  if (!admin) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  if (!admin.isActive) {
    const error = new Error("Your account has been deactivated. Contact support.");
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(admin);
  return { admin, token };
};

const getAdminById = async (id) => {
  const admin = await Admin.findById(id);
  if (!admin) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }
  return admin;
};

module.exports = { createAdmin, authenticateAdmin, getAdminById };
