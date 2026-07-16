const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
      default: "",
    },
    company: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Company name must be at most 200 characters"],
    },
    budget: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [5000, "Message must be at most 5000 characters"],
    },
    status: {
      type: String,
      enum: ["New", "Pending", "Talk", "Resolved"],
      default: "New",
    },
  },
  {
    timestamps: true,
  }
);

contactSchema.index({ name: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ mobile: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Contact", contactSchema);
