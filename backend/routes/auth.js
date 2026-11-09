const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const { authLimiter, writeLimiter } = require("../middleware/rateLimit");
const { validate, asyncHandler, z, passwordSchema } = require("../middleware/validate");
const { uploadImage } = require("../utils/cloudinary");
const { hashToken, createResetToken, buildResetUrl } = require("../utils/passwordReset");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  avatar: user.avatar || "",
  role: user.role,
  createdAt: user.createdAt,
});

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, SECRET_KEY, {
    expiresIn: "7d",
  });

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().email("Enter a valid email").toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["user", "owner"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

router.post(
  "/signup",
  authLimiter,
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const newUser = await User.create({ name, email, password, role });

    res.status(201).json({
      message: "User registered successfully",
      user: publicUser(newUser),
    });
  })
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    res.status(200).json({
      token,
      message: "Login Successful!",
      role: user.role,
      userId: user._id,
      user: publicUser(user),
    });
  })
);

router.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  })
);

router.put(
  "/profile",
  auth,
  writeLimiter,
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, phone } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }
      user.name = trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: "Enter a valid email" });
      }
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ message: "Email already exists" });
      user.email = normalizedEmail;
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim().slice(0, 20);
    }

    if (req.file) {
      const image = await uploadImage(req.file.buffer, "vrms/avatars");
      user.avatar = image.url;
    }

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user: publicUser(user) });
  })
);

router.put(
  "/change-password",
  auth,
  authLimiter,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      return res.status(400).json({ message: passwordResult.error.issues[0].message });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  })
);

router.post(
  "/forgot-password",
  authLimiter,
  validate(z.object({ email: z.string().trim().email("Enter a valid email").toLowerCase() })),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const message =
      "If an account with that email exists, a reset link has been generated.";

    if (!user) {
      return res.status(200).json({ message });
    }

    const { token, hash, expires } = createResetToken();
    user.resetPasswordTokenHash = hash;
    user.resetPasswordExpires = expires;
    await user.save();

    if (process.env.NODE_ENV !== "production") {
      const resetUrl = buildResetUrl(token);
      console.log(`Password reset link for ${user.email}: ${resetUrl}`);
      return res.status(200).json({ message, resetUrl });
    }

    return res.status(200).json({ message });
  })
);

router.post(
  "/reset-password/:token",
  authLimiter,
  validate(
    z
      .object({
        password: passwordSchema,
        confirmPassword: z.string().optional(),
      })
      .refine((data) => data.confirmPassword === undefined || data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
  ),
  asyncHandler(async (req, res) => {
    const tokenHash = hashToken(req.params.token);

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    user.password = req.body.password;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  })
);

module.exports = router;
