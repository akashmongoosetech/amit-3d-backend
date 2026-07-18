const crypto = require("crypto");
const bcrypt = require("bcryptjs");
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

const sendOtp = async (identifier) => {
  const trimmed = identifier.trim().toLowerCase();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

  const admin = await Admin.findOne(
    isEmail
      ? { email: trimmed }
      : { $or: [{ username: trimmed }, { mobile: trimmed }] }
  );

  if (!admin) {
    const error = new Error("No account found with that email, username or mobile");
    error.statusCode = 404;
    throw error;
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  admin.otpHash = otpHash;
  admin.otpExpires = new Date(Date.now() + 600000);
  admin.otpVerified = false;
  admin.verifyToken = "";
  await admin.save();

  return { otp, email: admin.email };
};

const verifyOtp = async (email, otp) => {
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin || !admin.otpHash || !admin.otpExpires) {
    const error = new Error("No OTP request found. Please request a new OTP.");
    error.statusCode = 400;
    throw error;
  }

  if (admin.otpExpires < new Date()) {
    admin.otpHash = "";
    admin.otpExpires = null;
    await admin.save();
    const error = new Error("OTP has expired. Please request a new one.");
    error.statusCode = 400;
    throw error;
  }

  const isValid = await bcrypt.compare(otp, admin.otpHash);
  if (!isValid) {
    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  const verifyToken = crypto.randomBytes(32).toString("hex");
  admin.otpHash = "";
  admin.otpExpires = null;
  admin.otpVerified = true;
  admin.verifyToken = verifyToken;
  await admin.save();

  return verifyToken;
};

const resetPassword = async (verifyToken, newPassword, confirmPassword) => {
  if (newPassword !== confirmPassword) {
    const error = new Error("Passwords do not match");
    error.statusCode = 400;
    throw error;
  }

  const admin = await Admin.findOne({ verifyToken, otpVerified: true });
  if (!admin) {
    const error = new Error("Invalid or expired verification. Please start the reset process again.");
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error("Password must be at least 8 characters");
    error.statusCode = 400;
    throw error;
  }

  admin.password = newPassword;
  admin.otpVerified = false;
  admin.verifyToken = "";
  await admin.save();

  return admin;
};

module.exports = { createAdmin, authenticateAdmin, getAdminById, sendOtp, verifyOtp, resetPassword };
