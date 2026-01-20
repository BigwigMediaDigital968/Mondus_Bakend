const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  addProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  updatePropertyStatus,
  deleteProperty,
} = require("../controller/propertyController");

// CREATE (with images)
router.post("/", upload.array("propertyImages", 10), addProperty);

// READ
router.get("/", getProperties);
router.get("/:id", getPropertyById);

// UPDATE (with optional images)
router.put("/:id", upload.array("propertyImages", 10), updateProperty);

// STATUS
router.patch("/:id/status", updatePropertyStatus);

// DELETE
router.delete("/:id", deleteProperty);

module.exports = router;
