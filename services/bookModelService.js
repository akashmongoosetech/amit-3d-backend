const BookModel = require("../models/BookModel");

const { escapeRegex, sanitizeSort } = require("../utils/helpers");

const create = async (data) => {
  const booking = await BookModel.create({
    name: data.name,
    email: data.email,
    mobile: data.mobile,
    modelName: data.modelName || "",
    modelSize: data.modelSize,
    message: data.message,
    referenceImage: data.referenceImage || "",
  });
  return booking;
};

const list = async ({
  search,
  status,
  fromDate,
  toDate,
  page,
  limit,
  sortBy,
  sortOrder,
}) => {
  const filter = {};

  if (search && typeof search === "string") {
    const trimmed = search.trim();
    if (trimmed) {
      const regex = new RegExp(escapeRegex(trimmed), "i");
      filter.$or = [{ name: regex }, { email: regex }, { mobile: regex }];
    }
  }

  const ALLOWED_STATUSES = new Set(["New Order", "Contact", "Payment", "Start Project", "Complete", "On Way", "Delivered"]);
  if (status && status !== "All" && ALLOWED_STATUSES.has(status)) {
    filter.status = status;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate && typeof fromDate === "string" && !Number.isNaN(Date.parse(fromDate))) {
      filter.createdAt.$gte = new Date(fromDate);
    }
    if (toDate && typeof toDate === "string" && !Number.isNaN(Date.parse(toDate))) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
    if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const sortField = sanitizeSort(sortBy);
  const sortDir = sortOrder === "asc" ? 1 : -1;

  const [bookings, totalRecords] = await Promise.all([
    BookModel.find(filter)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limitNum),
    BookModel.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
    },
  };
};

const getById = async (id) => {
  const booking = await BookModel.findById(id);
  return booking;
};

const updateStatus = async (id, status) => {
  const booking = await BookModel.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  return booking;
};

const path = require("path");
const fs = require("fs").promises;

const delete_ = async (id) => {
  const booking = await BookModel.findByIdAndDelete(id);
  if (booking?.referenceImage && booking.referenceImage.startsWith("/uploads/")) {
    const safeName = path.basename(booking.referenceImage);
    try {
      await fs.unlink(path.join(__dirname, "..", "uploads", safeName));
    } catch (_) {
      /* ignore */
    }
  }
  return booking;
};

module.exports = { create, list, getById, updateStatus, delete_ };
