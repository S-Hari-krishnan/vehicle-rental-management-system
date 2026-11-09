const multer = require("multer");
const path = require("path");

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const documentMimeTypes = new Set([...imageMimeTypes, "application/pdf"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const documentExtensions = new Set([...imageExtensions, ".pdf"]);

const imageFields = new Set(["vehicleImage", "images", "avatar"]);
const documentFields = new Set(["rcDoc", "insuranceDoc"]);

const rejectUpload = (cb, message) => {
  const error = new Error(message);
  error.status = 400;
  return cb(error);
};

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (imageFields.has(file.fieldname)) {
    if (!imageMimeTypes.has(file.mimetype) || !imageExtensions.has(extension)) {
      return rejectUpload(cb, "Only JPG, PNG, WEBP or GIF images are allowed");
    }
    return cb(null, true);
  }

  if (documentFields.has(file.fieldname)) {
    if (!documentMimeTypes.has(file.mimetype) || !documentExtensions.has(extension)) {
      return rejectUpload(cb, "Documents must be an image or PDF");
    }
    return cb(null, true);
  }

  return rejectUpload(cb, "Unexpected file field");
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter,
});

module.exports = upload;
