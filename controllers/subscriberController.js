const subscriberService = require("../services/subscriberService");
const { sendWelcomeEmail } = require("../services/emailService");
const { sendSuccess } = require("../utils/responseHandler");

const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const subscriber = await subscriberService.subscribe(email);

    try {
      await sendWelcomeEmail(email);
    } catch (emailErr) {
      console.error("sendWelcomeEmail failed:", emailErr.message);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV] Welcome email for ${email} — skipped due to SMTP error`);
      }
    }

    return sendSuccess(res, { id: subscriber._id, email: subscriber.email }, "Thank you for subscribing! Please check your inbox.", 201);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { search, page, limit, sortBy, sortOrder } = req.query;
    const result = await subscriberService.listSubscribers({ search, page, limit, sortBy, sortOrder });
    return sendSuccess(res, { subscribers: result.subscribers, pagination: result.pagination }, "Subscribers fetched successfully");
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await subscriberService.removeSubscriber(id);
    return sendSuccess(res, null, "Subscriber removed successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { subscribe, list, remove };
