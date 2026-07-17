const BookModel = require("../models/BookModel");

const { escapeRegex } = require("../utils/helpers");

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

  if (search) {
    const trimmed = search.trim();
    if (trimmed) {
      const regex = new RegExp(escapeRegex(trimmed), "i");
      filter.$or = [{ name: regex }, { email: regex }, { mobile: regex }];
    }
  }

  if (status && status !== "All") {
    filter.status = status;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) {
      filter.createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const sortField = sortBy || "createdAt";
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

const delete_ = async (id) => {
  const booking = await BookModel.findByIdAndDelete(id);
  return booking;
};

module.exports = { create, list, getById, updateStatus, delete_ };
