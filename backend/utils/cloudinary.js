const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error("Cloudinary is not configured"));
    }

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(buffer);
  });

const uploadImage = async (buffer, folder = "vrms/vehicles") => {
  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "image",
    transformation: [{ width: 1600, height: 1200, crop: "limit", quality: "auto" }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
  };
};

const uploadDocument = async (buffer, folder = "vrms/documents") => {
  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "auto",
    type: "authenticated",
  });

  const mimeType =
    result.format === "pdf"
      ? "application/pdf"
      : `${result.resource_type || "image"}/${result.format || "jpeg"}`;

  return {
    publicId: result.public_id,
    resourceType: result.resource_type,
    mimeType,
  };
};

const getDocumentUrl = (document) => {
  if (!document?.publicId) return "";
  return cloudinary.url(document.publicId, {
    resource_type: document.resourceType || "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
  });
};

const destroyAsset = async (publicId, resourceType = "image", type = "upload") => {
  if (!publicId || !isCloudinaryConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type });
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message);
  }
};

module.exports = {
  uploadImage,
  uploadDocument,
  getDocumentUrl,
  destroyAsset,
};
