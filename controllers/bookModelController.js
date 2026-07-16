const bookModelService = require("../services/bookModelService");
const { sendSuccess } = require("../utils/responseHandler");

const create = async (req, res, next) => {
  try {
    const { name, email, mobile, modelName, modelSize, message } = req.body;
    const referenceImage = req.file
      ? `/uploads/${req.file.filename}`
      : "";

    const booking = await bookModelService.create({
      name,
      email,
      mobile,
      modelName,
      modelSize,
      message,
      referenceImage,
    });

    const msg =
      "Booking request submitted successfully! We'll review your project and be in touch within one business day.";
    return sendSuccess(res, { id: booking._id }, msg, 201);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const {
      search,
      status,
      fromDate,
      toDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;
    const result = await bookModelService.list({
      search,
      status,
      fromDate,
      toDate,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return sendSuccess(
      res,
      { bookings: result.bookings, pagination: result.pagination },
      "Bookings fetched successfully"
    );
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await bookModelService.getById(id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    return sendSuccess(res, booking, "Booking fetched successfully");
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await bookModelService.updateStatus(id, status);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    return sendSuccess(res, booking, `Status updated to ${status}`);
  } catch (err) {
    next(err);
  }
};

const delete_ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await bookModelService.delete_(id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    return sendSuccess(res, null, "Booking deleted successfully");
  } catch (err) {
    next(err);
  }
};

const getStatuses = async (_req, res) => {
  const statuses = [
    "New Order",
    "Contact",
    "Payment",
    "Start Project",
    "Complete",
    "On Way",
    "Delivered",
  ];
  return sendSuccess(res, statuses, "Statuses fetched successfully");
};

module.exports = { create, getAll, getById, updateStatus, delete_, getStatuses };
