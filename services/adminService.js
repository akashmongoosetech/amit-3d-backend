const Admin = require("../models/Admin");

const getProfile = async (id) => {
  const admin = await Admin.findById(id);
  if (!admin) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }
  return admin;
};

const updateProfile = async (id, data) => {
  const allowedFields = ["firstName", "lastName", "email", "mobile", "username", "profileImage"];
  const changedFields = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      changedFields[field] = data[field];
    }
  }

  if (Object.keys(changedFields).length === 0) {
    const error = new Error("No fields to update");
    error.statusCode = 400;
    throw error;
  }

  if (changedFields.email) {
    const existing = await Admin.findOne({ email: changedFields.email, _id: { $ne: id } });
    if (existing) {
      const error = new Error("An admin with this email already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  if (changedFields.mobile) {
    const existing = await Admin.findOne({ mobile: changedFields.mobile, _id: { $ne: id } });
    if (existing) {
      const error = new Error("An admin with this mobile number already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  if (changedFields.username) {
    const existing = await Admin.findOne({ username: changedFields.username, _id: { $ne: id } });
    if (existing) {
      const error = new Error("An admin with this username already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  const admin = await Admin.findByIdAndUpdate(id, { $set: changedFields }, { new: true, runValidators: true });

  if (!admin) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }

  return admin;
};

const changePassword = async (id, currentPassword, newPassword, confirmPassword) => {
  if (newPassword !== confirmPassword) {
    const error = new Error("Passwords do not match");
    error.statusCode = 400;
    throw error;
  }

  const admin = await Admin.findById(id).select("+password");
  if (!admin) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error("Current password is incorrect");
    error.statusCode = 401;
    throw error;
  }

  const isSame = await admin.comparePassword(newPassword);
  if (isSame) {
    const error = new Error("New password must be different from the current password");
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error("Password must be at least 8 characters");
    error.statusCode = 400;
    throw error;
  }

  if (!/[A-Z]/.test(newPassword)) {
    const error = new Error("Password must contain one uppercase letter");
    error.statusCode = 400;
    throw error;
  }

  if (!/[a-z]/.test(newPassword)) {
    const error = new Error("Password must contain one lowercase letter");
    error.statusCode = 400;
    throw error;
  }

  if (!/[0-9]/.test(newPassword)) {
    const error = new Error("Password must contain one number");
    error.statusCode = 400;
    throw error;
  }

  if (!/[^A-Za-z0-9]/.test(newPassword)) {
    const error = new Error("Password must contain one special character");
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.toLowerCase().includes(admin.firstName?.toLowerCase())) {
    const error = new Error("Password must not contain your first name");
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.toLowerCase().includes(admin.lastName?.toLowerCase())) {
    const error = new Error("Password must not contain your last name");
    error.statusCode = 400;
    throw error;
  }

  admin.password = newPassword;
  await admin.save();

  return admin;
};

module.exports = { getProfile, updateProfile, changePassword };
