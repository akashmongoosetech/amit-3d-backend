const adminService = require("../services/adminService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const getProfile = async (req, res, next) => {
  try {
    const admin = await adminService.getProfile(req.admin._id);
    return sendSuccess(res, admin, "Profile fetched successfully");
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.profileImage = `/uploads/${req.file.filename}`;
    }
    const admin = await adminService.updateProfile(req.admin._id, data);
    return sendSuccess(res, admin, "Profile updated successfully");
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    await adminService.changePassword(req.admin._id, currentPassword, newPassword, confirmPassword);
    return sendSuccess(res, null, "Password changed successfully");
  } catch (err) {
    next(err);
  }
};

const listAdmins = async (req, res, next) => {
  try {
    const { search } = req.query;
    const admins = await adminService.listAdmins(search);
    return sendSuccess(res, admins, "Admins fetched successfully");
  } catch (err) {
    next(err);
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    if (req.admin._id.toString() === req.params.id) {
      return sendError(res, 400, "You cannot delete your own account");
    }
    await adminService.removeAdmin(req.params.id);
    return sendSuccess(res, null, "Admin deleted successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, changePassword, listAdmins, deleteAdmin };
