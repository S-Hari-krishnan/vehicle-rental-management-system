const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  console.error(err);

  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message || "File upload failed" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(err.errors || {}).map((item) => item.message),
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "A record with these details already exists" });
  }

  const status = err.status || err.statusCode || 500;
  const message =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "Server error"
      : err.message || "Server error";

  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };
