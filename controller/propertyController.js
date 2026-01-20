const PropertyListing = require("../models/propertyListingmodel.js");
const fs = require("fs");
const path = require("path");

/**
 * ADD PROPERTY
 */
exports.addProperty = async (req, res) => {
  try {
    // Extract uploaded images
    const images = req.files?.map((file) => `/uploads/${file.filename}`);

    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one property image is required",
      });
    }

    const propertyData = {
      ...req.body,
      bedroom: Number(req.body.bedroom),
      bathroom: Number(req.body.bathroom),
      sizeSqft: Number(req.body.sizeSqft),
      propertyImages: images,
    };

    const property = await PropertyListing.create(propertyData);

    res.status(201).json({
      success: true,
      message: "Property added successfully",
      data: property,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET ALL PROPERTIES (WITH FILTERS)
 */
exports.getProperties = async (req, res) => {
  try {
    const {
      listingType,
      propertyType,
      bedroom,
      bathroom,
      subArea,
      minSqft,
      maxSqft,
      status,
    } = req.query;

    const filter = {};

    if (listingType) filter.listingType = listingType;
    if (propertyType) filter.propertyType = propertyType;
    if (bedroom) filter.bedroom = Number(bedroom);
    if (bathroom) filter.bathroom = Number(bathroom);
    if (subArea) filter.subArea = subArea;
    if (status !== undefined) filter.status = status === "true";

    if (minSqft || maxSqft) {
      filter.sizeSqft = {};
      if (minSqft) filter.sizeSqft.$gte = Number(minSqft);
      if (maxSqft) filter.sizeSqft.$lte = Number(maxSqft);
    }

    const properties = await PropertyListing.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET SINGLE PROPERTY
 */
exports.getPropertyById = async (req, res) => {
  try {
    const property = await PropertyListing.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE PROPERTY
 */
exports.updateProperty = async (req, res) => {
  try {
    const property = await PropertyListing.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const updateData = {
      ...req.body,
      bedroom: req.body.bedroom && Number(req.body.bedroom),
      bathroom: req.body.bathroom && Number(req.body.bathroom),
      sizeSqft: req.body.sizeSqft && Number(req.body.sizeSqft),
    };

    // 🔥 If new images uploaded → delete old images
    if (req.files && req.files.length > 0) {
      deleteImages(property.propertyImages);

      updateData.propertyImages = req.files.map(
        (file) => `/uploads/${file.filename}`,
      );
    }

    const updatedProperty = await PropertyListing.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: updatedProperty,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE STATUS (ACTIVE / INACTIVE)
 */
exports.updatePropertyStatus = async (req, res) => {
  try {
    if (typeof req.body.status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status must be boolean",
      });
    }

    const property = await PropertyListing.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated",
      data: property,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE PROPERTY
 */

const deleteImages = (images = []) => {
  images.forEach((imgPath) => {
    const fullPath = path.join(__dirname, "..", imgPath);

    if (fs.existsSync(fullPath)) {
      fs.unlink(fullPath, (err) => {
        if (err) console.error("Image delete error:", err.message);
      });
    }
  });
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await PropertyListing.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // 🔥 Delete all images from disk
    deleteImages(property.propertyImages);

    // 🔥 Delete DB record
    await property.deleteOne();

    res.status(200).json({
      success: true,
      message: "Property and images deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
