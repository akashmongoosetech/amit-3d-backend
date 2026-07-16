const mongoose = require("mongoose");

const bookModelSchema = new mongoose.Schema(
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
      required: [true, "Mobile number is required"],
      trim: true,
    },
    modelName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Model name must be at most 200 characters"],
    },
    modelSize: {
      type: String,
      required: [true, "Model size is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [5000, "Message must be at most 5000 characters"],
    },
    referenceImage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "New Order",
        "Contact",
        "Payment",
        "Start Project",
        "Complete",
        "On Way",
        "Delivered",
      ],
      default: "New Order",
    },
  },
  {
    timestamps: true,
  }
);

bookModelSchema.index({ name: 1 });
bookModelSchema.index({ email: 1 });
bookModelSchema.index({ mobile: 1 });
bookModelSchema.index({ modelSize: 1 });
bookModelSchema.index({ status: 1 });
bookModelSchema.index({ createdAt: -1 });

module.exports = mongoose.model("BookModel", bookModelSchema);
