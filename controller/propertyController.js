const PropertyListing = require("../models/propertyListingmodel.js");
const fs = require("fs");
const path = require("path");
const { deleteFromCloudinary } = require("../utils/cloudinary.js");

/* ================== HELPERS ================== */
const parseArray = (value) =>
  value ? value.split(",").map((i) => i.trim()) : [];

/**
 * ================== ADD PROPERTY ==================
 */
exports.addProperty = async (req, res) => {
  try {
    const images = req.files?.propertyImages?.map((file) => file.path) || [];

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one property image is required",
      });
    }

    const brochure = req.files?.propertyBrochure?.[0].path || null;

    /* 🔥 AUTO-GENERATE SLUG IF NOT PROVIDED */
    let slug = req.body.slug;

    if (!slug || !slug.trim()) {
      slug = req.body.propertyName
        ?.toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    const baseSlug = slug;
    let counter = 1;

    while (await PropertyListing.exists({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const propertyData = {
      ...req.body,

      slug,

      /* NUMBERS */
      price: Number(req.body.price),
      bedroom: Number(req.body.bedroom),
      bathroom: Number(req.body.bathroom),
      sizeSqft: req.body.sizeSqft.trim(),

      /* ARRAYS */
      highlights: parseArray(req.body.highlights),
      featuresAmenities: parseArray(req.body.featuresAmenities),
      nearby: parseArray(req.body.nearby),
      extraHighlights: parseArray(req.body.extraHighlights),

      /* MEDIA / LINKS */
      videoLink: req.body.videoLink || null,
      googleMapUrl: req.body.googleMapUrl || null,

      propertyImages: images,
      propertyBrochure: brochure,
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
 * ================== GET ALL PROPERTIES (WITH FILTERS) ==================
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
      minPrice,
      maxPrice,
      status,
      developerName,
    } = req.query;

    const filter = {};

    if (listingType) filter.listingType = listingType;
    if (propertyType) filter.propertyType = propertyType;
    if (developerName) filter.developerName = developerName;
    if (bedroom) filter.bedroom = Number(bedroom);
    if (bathroom) filter.bathroom = Number(bathroom);
    if (subArea) filter.subArea = subArea;
    if (status !== undefined) filter.status = status === "true";

    /* PRICE FILTER */
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    /* SIZE FILTER */
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
 * ================== GET SINGLE PROPERTY (ID OR SLUG) ==================
 */
// exports.getSingleProperty = async (req, res) => {
//   try {
//     const { idOrSlug } = req.params;

//     const property = await PropertyListing.findOne({
//       $or: [{ _id: idOrSlug }, { slug: idOrSlug }],
//     });

//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: property,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Invalid ID or slug",
//     });
//   }
// };

exports.getSingleProperty = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    let property;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid Mongo ObjectId
      property = await PropertyListing.findById(idOrSlug);
    } else {
      // Slug
      property = await PropertyListing.findOne({ slug: idOrSlug });
    }

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
 * ================== UPDATE PROPERTY ==================
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

    /* 🔥 AUTO SLUG UPDATE */
    let slug = req.body.slug;

    if (!slug && req.body.propertyName) {
      slug = req.body.propertyName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    const updateData = {
      ...req.body,

      slug,

      price: req.body.price && Number(req.body.price),
      bedroom: req.body.bedroom && Number(req.body.bedroom),
      bathroom: req.body.bathroom && Number(req.body.bathroom),
      sizeSqft: req.body.sizeSqft && req.body.sizeSqft.trim(),

      videoLink: req.body.videoLink || null,
      googleMapUrl: req.body.googleMapUrl || null,
    };

    /* ARRAY UPDATES */
    if (req.body.highlights)
      updateData.highlights = parseArray(req.body.highlights);

    if (req.body.featuresAmenities)
      updateData.featuresAmenities = parseArray(req.body.featuresAmenities);

    if (req.body.nearby) updateData.nearby = parseArray(req.body.nearby);

    if (req.body.extraHighlights)
      updateData.extraHighlights = parseArray(req.body.extraHighlights);

    /* 🔥 IMAGE REPLACE */
    if (req.files?.propertyImages?.length) {
      //deleteFiles(property.propertyImages);
      await Promise.all(
        property.propertyImages.map((img) => deleteFromCloudinary(img)),
      );

      updateData.propertyImages = req.files.propertyImages.map(
        //(file) => `/uploads/images/${file.filename}`,
        (file) => {
          //console.log("File path:", file.filePath); // Debug log
          return file.path;
        },
      );
    }

    /* 🔥 BROCHURE REPLACE */
    if (req.files?.propertyBrochure?.[0]) {
      if (property.propertyBrochure) {
        //deleteFiles([property.propertyBrochure]);
        await deleteFromCloudinary(property.propertyBrochure);
      }
      // updateData.propertyBrochure = `/uploads/brochures/${req.files.propertyBrochure[0].filename}`;
      updateData.propertyBrochure = req.files.propertyBrochure[0].path;
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
 * ================== UPDATE STATUS ==================
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
 * ================== DELETE PROPERTY ==================
 */
const deleteFiles = (files = []) => {
  files.forEach((filePath) => {
    if (!filePath) return;

    const fullPath = path.join(__dirname, "..", filePath);

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error("File delete error:", err.message);
      }
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

    deleteFiles(property.propertyImages);
    if (property.propertyBrochure) {
      deleteFiles([property.propertyBrochure]);
    }

    await property.deleteOne();

    res.status(200).json({
      success: true,
      message: "Property, images and brochure deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
