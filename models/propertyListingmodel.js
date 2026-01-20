const mongoose = require("mongoose");

const propertyListingSchema = new mongoose.Schema(
  {
    propertyName: { type: String, required: true },

    listingType: {
      type: String,
      enum: ["buy", "sell", "rent", "offPlan"],
      required: true,
    },

    propertyType: { type: String, required: true },

    bedroom: { type: Number, required: true },
    bathroom: { type: Number, required: true },

    sizeSqft: { type: Number, required: true },

    address: { type: String, required: true },
    subArea: { type: String },

    propertyImages: [
      {
        type: String,
        required: true,
      },
    ],

    propertyDetails: { type: String, required: true },

    status: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PropertyListing", propertyListingSchema);
