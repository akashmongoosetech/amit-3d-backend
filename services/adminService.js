const Admin = require("../models/Admin");
const fs = require("fs").promises;
const path = require("path");
const { validateStrongPassword, escapeRegex, sanitizeSort } = require("../utils/helpers");

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

  if (changedFields.profileImage) {
    const current = await Admin.findById(id);
    if (current?.profileImage && current.profileImage.startsWith("/uploads/")) {
      // M8: safe path resolution + awaited cleanup (no fire-and-forget)
      const safeName = path.basename(current.profileImage);
      const oldPath = path.join(__dirname, "..", "uploads", safeName);
      try {
        await fs.unlink(oldPath);
      } catch (_) {
        /* already removed — ignore */
      }
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
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save();

  return admin;
};

const listAdmins = async (search, page = 1, limit = 20, sortBy, sortOrder) => {
  const filter = { isActive: { $ne: false } };
  if (search && typeof search === "string") {
    const trimmed = search.trim();
    if (trimmed) {
      const regex = new RegExp(escapeRegex(trimmed), "i");
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }
  }
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;
  const sortField = sanitizeSort(sortBy);
  const sortDir = sortOrder === "asc" ? 1 : -1;
  const [admins, total] = await Promise.all([
    Admin.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limitNum),
    Admin.countDocuments(filter),
  ]);
  return {
    admins,
    pagination: { page: pageNum, limit: limitNum, totalRecords: total, totalPages: Math.ceil(total / limitNum) },
  };
};

const removeAdmin = async (id) => {
  const admin = await Admin.findByIdAndDelete(id);
  if (!admin) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }
  // M8: cleanup profile image on delete
  if (admin.profileImage && admin.profileImage.startsWith("/uploads/")) {
    const safeName = path.basename(admin.profileImage);
    try {
      await fs.unlink(path.join(__dirname, "..", "uploads", safeName));
    } catch (_) {
      /* ignore */
    }
  }
  return admin;
};

module.exports = { getProfile, updateProfile, changePassword, listAdmins, removeAdmin };
