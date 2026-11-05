const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");
const { validateStrongPassword } = require("../utils/helpers");

const createAdmin = async (data) => {
  const { firstName, lastName, email, mobile, username, password, profileImage } = data;

  if (typeof email !== "string" || typeof mobile !== "string" || typeof username !== "string") {
    const error = new Error("Invalid registration data");
    error.statusCode = 400;
    throw error;
  }

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

  // First admin bootstraps as superadmin; all others default to admin (client role ignored)
  const count = await Admin.countDocuments();
  const role = count === 0 ? "superadmin" : "admin";

  const admin = await Admin.create({
    firstName,
    lastName,
    email,
    mobile,
    username,
    password,
    profileImage: profileImage || "",
    role,
  });

  const token = generateToken(admin);
  return { admin, token };
};

const authenticateAdmin = async (identifier, password) => {
  if (typeof identifier !== "string" || typeof password !== "string") {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }
  const admin = await Admin.findOne({
    $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }, { username: identifier.toLowerCase() }],
  }).select("+password +tokenVersion");

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
  if (typeof identifier !== "string") {
    const error = new Error("Email, username or mobile is required");
    error.statusCode = 400;
    throw error;
  }
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
  admin.verifyTokenExpires = null;
  await admin.save();

  return { otp, email: admin.email };
};

const verifyOtp = async (email, otp) => {
  if (typeof email !== "string" || typeof otp !== "string") {
    const error = new Error("Email and OTP are required");
    error.statusCode = 400;
    throw error;
  }
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select(
    "+otpHash +otpExpires +otpVerified +verifyToken +verifyTokenExpires"
  );
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
  admin.verifyTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
  await admin.save();

  return verifyToken;
};

const resetPassword = async (verifyToken, newPassword, confirmPassword) => {
  if (typeof verifyToken !== "string" || typeof newPassword !== "string" || typeof confirmPassword !== "string") {
    const error = new Error("Invalid reset request");
    error.statusCode = 400;
    throw error;
  }
  if (newPassword !== confirmPassword) {
    const error = new Error("Passwords do not match");
    error.statusCode = 400;
    throw error;
  }

  const admin = await Admin.findOne({ verifyToken, otpVerified: true }).select(
    "+verifyToken +verifyTokenExpires +otpVerified +tokenVersion"
  );
  if (!admin || !admin.verifyTokenExpires || admin.verifyTokenExpires < new Date()) {
    const error = new Error("Invalid or expired verification. Please start the reset process again.");
    error.statusCode = 400;
    throw error;
  }

  const policyError = validateStrongPassword(newPassword, {
    firstName: admin.firstName,
    lastName: admin.lastName,
  });
  if (policyError) {
    const error = new Error(policyError);
    error.statusCode = 400;
    throw error;
  }

  admin.password = newPassword;
  admin.otpVerified = false;
  admin.verifyToken = "";
  admin.verifyTokenExpires = null;
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save();

  return admin;
};

module.exports = { createAdmin, authenticateAdmin, getAdminById, sendOtp, verifyOtp, resetPassword };
