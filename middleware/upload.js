const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
// ✅ Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir("uploads/images");
ensureDir("uploads/brochures");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "propertyBrochure") {
      cb(null, "uploads/brochures");
    } else {
      cb(null, "uploads/images");
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname).toLowerCase());
  },
});

const imageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "image/bmp",
  "image/tiff",
];

const imageExt = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
  ".bmp",
  ".tiff",
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // ✅ PDF brochure
  if (
    file.fieldname === "propertyBrochure" &&
    file.mimetype === "application/pdf" &&
    ext === ".pdf"
  ) {
    return cb(null, true);
  }

  // ✅ Property images
  if (
    file.fieldname === "propertyImages" &&
    imageMimeTypes.includes(file.mimetype) &&
    imageExt.includes(ext)
  ) {
    return cb(null, true);
  }

  cb(
    new multer.MulterError(
      "LIMIT_FILE_TYPE",
      "Invalid file type. Only images and PDF brochure allowed",
    ),
  );
};

const newStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (file.fieldname === "propertyBrochure") {
      const cleanName = file.originalname.replace(/\s+/g, "_").split(".")[0];

      return {
        folder: "uploads/brochures",
        resource_type: "raw", // IMPORTANT for pdf
        type: "upload",
        format: "pdf",
        access_mode: "public",
        public_id: `brochure_${cleanName}_${Date.now()}`,
      };
    } else {
      return {
        folder: "uploads/images",
        allowed_formats: [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "svg",
          "avif",
          "bmp",
          "tiff",
        ],
      };
    }
  },
});

const newUpload = multer({
  storage: newStorage,
  limits: {
    fileSize: 40 * 1024 * 1024, // increase for brochure
    files: 21, // 10 images + 1 brochure
  },
  fileFilter: fileFilter,
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 21, // 10 images + 1 brochure
  },
});

module.exports = { upload, newUpload };
