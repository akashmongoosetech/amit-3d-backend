const Subscriber = require("../models/Subscriber");
const { escapeRegex } = require("../utils/helpers");

const subscribe = async (email) => {
  const trimmed = email.trim().toLowerCase();

  const exists = await Subscriber.findOne({ email: trimmed });
  if (exists) {
    const error = new Error("This email is already subscribed");
    error.statusCode = 409;
    throw error;
  }

  const subscriber = await Subscriber.create({ email: trimmed });
  return subscriber;
};

const listSubscribers = async ({ search, page, limit, sortBy, sortOrder }) => {
  const filter = {};

  if (search) {
    const trimmed = search.trim();
    if (trimmed) {
      filter.email = new RegExp(escapeRegex(trimmed), "i");
    }
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const sortField = sortBy || "createdAt";
  const sortDir = sortOrder === "asc" ? 1 : -1;

  const [subscribers, totalRecords] = await Promise.all([
    Subscriber.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limitNum),
    Subscriber.countDocuments(filter),
  ]);

  return {
    subscribers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
    },
  };
};

const removeSubscriber = async (id) => {
  const subscriber = await Subscriber.findByIdAndDelete(id);
  if (!subscriber) {
    const error = new Error("Subscriber not found");
    error.statusCode = 404;
    throw error;
  }
  return subscriber;
};

module.exports = { subscribe, listSubscribers, removeSubscriber };
