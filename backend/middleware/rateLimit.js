const rateLimit = require("express-rate-limit");

const baseOptions = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
};

const globalLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  message: { message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 50,
  message: { message: "Too many authentication attempts. Please try again later." },
});

const writeLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { message: "Too many requests. Please slow down." },
});

module.exports = { globalLimiter, authLimiter, writeLimiter };
