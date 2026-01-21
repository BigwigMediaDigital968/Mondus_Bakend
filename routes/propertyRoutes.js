const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  addProperty,
  getProperties,
  getSingleProperty,
  updateProperty,
  updatePropertyStatus,
  deleteProperty,
} = require("../controller/propertyController");

// CREATE (with images)
router.post(
  "/",
  upload.fields([
    { name: "propertyImages", maxCount: 10 },
    { name: "propertyBrochure", maxCount: 1 },
  ]),
  addProperty,
);

// UPDATE (with optional images)
router.put(
  "/:id",
  upload.fields([
    { name: "propertyImages", maxCount: 10 },
    { name: "propertyBrochure", maxCount: 1 },
  ]),
  updateProperty,
);

// READ
router.get("/", getProperties);
router.get("/:idOrSlug", getSingleProperty);

// STATUS
router.patch("/:id/status", updatePropertyStatus);

// DELETE
router.delete("/:id", deleteProperty);

// Handle Error
router.use((err, req, res, next) => {
  if (err?.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
});

module.exports = router;
