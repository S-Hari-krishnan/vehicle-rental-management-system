const crypto = require("crypto");

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    hash: hashToken(token),
    expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
};

const buildResetUrl = (token) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
  return `${clientUrl}/reset-password/${token}`;
};

module.exports = { hashToken, createResetToken, buildResetUrl };
