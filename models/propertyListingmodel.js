const mongoose = require("mongoose");

const propertyListingSchema = new mongoose.Schema(
  {
    propertyName: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },

    listingType: {
      type: String,
      enum: ["buy", "rent"],
      required: true,
    },

    propertyType: { type: String, required: true },

    price: {
      type: String,
      required: true,
    },

    bedroom: { type: String, required: true },
    bathroom: { type: String, default: null },
    sizeSqft: { type: String, required: true },

    address: { type: String, required: true },
    subArea: { type: String },

    googleMapUrl: {
      type: String,
      default: null,
    },

    developerName: { type: String, required: true },

    propertyImages: [
      {
        type: String,
        required: true,
      },
    ],

    propertyBrochure: {
      type: String,
      default: null,
    },

    videoLink: {
      type: String,
      default: null,
    },

    propertyDetails: { type: String, required: true },

    highlights: {
      type: [String],
      default: [],
    },

    featuresAmenities: {
      type: [String],
      default: [],
    },

    nearby: {
      type: [String],
      default: [],
    },

    extraHighlights: {
      type: [String],
      default: [],
    },

    extraInfo: {
      type: [String],
      default: [],
    },

    status: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PropertyListing", propertyListingSchema);
