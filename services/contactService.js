const Contact = require("../models/Contact");

const { escapeRegex } = require("../utils/helpers");

const submitContact = async (data) => {
  const contact = await Contact.create({
    name: data.name,
    email: data.email,
    mobile: data.mobile || "",
    company: data.company || "",
    budget: data.budget || "",
    message: data.message,
  });

  return contact;
};

const listContacts = async ({ search, status, fromDate, toDate, page, limit, sortBy, sortOrder }) => {
  const filter = {};

  if (search) {
    const trimmed = search.trim();
    if (trimmed) {
      const regex = new RegExp(escapeRegex(trimmed), "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { mobile: regex },
      ];
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

  const [contacts, totalRecords] = await Promise.all([
    Contact.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limitNum),
    Contact.countDocuments(filter),
  ]);

  return {
    contacts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
    },
  };
};

const updateContactStatus = async (id, status) => {
  const contact = await Contact.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  return contact;
};

module.exports = { submitContact, listContacts, updateContactStatus };
