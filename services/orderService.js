const BookModel = require("../models/BookModel");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const list = async ({ search, page, limit, sortBy, sortOrder }) => {
  const filter = { status: "Payment" };

  if (search) {
    const trimmed = search.trim();
    if (trimmed) {
      const regex = new RegExp(escapeRegex(trimmed), "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { mobile: regex },
        { modelName: regex },
      ];
    }
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const sortField = sortBy || "createdAt";
  const sortDir = sortOrder === "asc" ? 1 : -1;

  const [orders, totalRecords] = await Promise.all([
    BookModel.find(filter)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limitNum),
    BookModel.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
    },
  };
};

const getById = async (id) => {
  const order = await BookModel.findOne({ _id: id, status: "Payment" });
  return order;
};

const updateOrderStatus = async (id, orderStatus) => {
  const order = await BookModel.findByIdAndUpdate(
    id,
    { orderStatus },
    { new: true, runValidators: true }
  );
  return order;
};

module.exports = { list, getById, updateOrderStatus };
