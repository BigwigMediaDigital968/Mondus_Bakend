// models/Prompt.js
const mongoose = require("mongoose");

const notifySchema = new mongoose.Schema(
  {
    purpose: { type: String },
    category: { type: String },
    bedrooms: { type: String },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notify", notifySchema);
