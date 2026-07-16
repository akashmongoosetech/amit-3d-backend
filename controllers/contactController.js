const contactService = require("../services/contactService");
const { sendSuccess } = require("../utils/responseHandler");

const submit = async (req, res, next) => {
  try {
    const { name, email, mobile, company, budget, message } = req.body;
    const contact = await contactService.submitContact({ name, email, mobile, company, budget, message });
    const msg = "Thanks for reaching out. We'll review your project and be in touch within one business day.";
    return sendSuccess(res, { id: contact._id, message: msg }, msg, 201);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { search, status, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
    const result = await contactService.listContacts({ search, status, fromDate, toDate, page, limit, sortBy, sortOrder });
    return sendSuccess(res, { contacts: result.contacts, pagination: result.pagination }, "Contacts fetched successfully");
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ["New", "Pending", "Talk", "Resolved"];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }
    const contact = await contactService.updateContactStatus(id, status);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }
    return sendSuccess(res, contact, `Status updated to ${status}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { submit, list, updateStatus };
