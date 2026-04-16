const cloudinary = require("../config/cloudinary");

const extractPublicId = (url) => {
  try {
    if (!url) return null;

    // Remove query params if any
    const cleanUrl = url.split("?")[0];

    // Example:
    // https://res.cloudinary.com/demo/image/upload/v1234567890/uploads/images/abc.jpg

    const parts = cleanUrl.split("/");

    const uploadIndex = parts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) return null;

    let publicIdParts = parts.slice(uploadIndex + 1);

    if (publicIdParts[0].startsWith("v")) {
      publicIdParts.shift();
    }

    let publicId = publicIdParts.join("/");
    publicId = publicId.replace(/\.[^/.]+$/, "");

    return publicId;
  } catch (err) {
    console.error("Error extracting public_id:", err);
    return null;
  }
};

/**
 * Delete file from Cloudinary using URL
 */
const deleteFromCloudinary = async (url) => {
  try {
    const publicId = extractPublicId(url);

    if (!publicId) {
      //throw new Error("Invalid Cloudinary URL");
      return {
        success: true,
        message: "Skipped deletion (invalid URL)",
      };
    }

    const isPDF = url.includes("/raw/") || url.endsWith(".pdf");

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: isPDF ? "raw" : "image",
    });

    return result;
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    throw err;
  }
};

module.exports = {
  extractPublicId,
  deleteFromCloudinary,
};
