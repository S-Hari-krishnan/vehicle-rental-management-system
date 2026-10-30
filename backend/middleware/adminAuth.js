// middleware/adminAuth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // adjust path if needed

const SECRET_KEY = process.env.JWT_SECRET;

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = { id: user._id, role: user.role };
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
};
