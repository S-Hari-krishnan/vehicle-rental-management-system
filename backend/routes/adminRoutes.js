const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Review = require("../models/Review");
const adminAuth = require("../middleware/adminAuth");
const { authLimiter, writeLimiter } = require("../middleware/rateLimit");
const { validate, asyncHandler, z } = require("../middleware/validate");
const { destroyAsset } = require("../utils/cloudinary");
const { createResetToken, buildResetUrl } = require("../utils/passwordReset");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPagination = (query, defaultLimit = 20) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

const destroyVehicleAssets = async (vehicles) => {
  const tasks = [];

  for (const vehicle of vehicles) {
    for (const image of vehicle.images || []) {
      if (image.publicId) tasks.push(destroyAsset(image.publicId, "image", "upload"));
    }
    for (const key of ["rc", "insurance"]) {
      const document = vehicle.documents?.[key];
      if (document?.publicId) {
        tasks.push(
          destroyAsset(
            document.publicId,
            document.resourceType || "auto",
            "authenticated"
          )
        );
      }
    }
  }

  await Promise.all(tasks);
};

router.post(
  "/login",
  authLimiter,
  validate(
    z.object({
      email: z.string().trim().email("Enter a valid email").toLowerCase(),
      password: z.string().min(1, "Password is required"),
    })
  ),
  asyncHandler(async (req, res) => {
    const admin = await User.findOne({ email: req.body.email });

    if (!admin || admin.role !== "admin") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(req.body.password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      role: admin.role,
      admin: { _id: admin._id, email: admin.email, name: admin.name },
    });
  })
);

router.get(
  "/stats",
  adminAuth,
  asyncHandler(async (req, res) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalOwners,
      totalAdmins,
      totalVehicles,
      pendingVehicles,
      totalBookings,
      activeBookings,
      revenueResult,
      monthlyRevenue,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "owner" }),
      User.countDocuments({ role: "admin" }),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ approvalStatus: "pending" }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ["pending", "confirmed"] } }),
      Booking.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Booking.aggregate([
        { $match: { status: "completed", completedAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$completedAt" } },
            revenue: { $sum: "$totalPrice" },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.find()
        .populate("userId", "name email")
        .populate("vehicleId", "name type")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      totalUsers,
      totalOwners,
      totalAdmins,
      totalVehicles,
      pendingVehicles,
      totalBookings,
      activeBookings,
      totalRevenue: revenueResult[0]?.total || 0,
      monthlyRevenue,
      recentBookings,
    });
  })
);

router.get(
  "/users",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (["user", "owner", "admin"].includes(req.query.role)) filter.role = req.query.role;

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      users,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  })
);

router.post(
  "/user/:id/reset-link",
  adminAuth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { token, hash, expires } = createResetToken();
    user.resetPasswordTokenHash = hash;
    user.resetPasswordExpires = expires;
    await user.save();

    res.status(200).json({
      message: "Password reset link generated. Send this link to the user.",
      resetUrl: buildResetUrl(token),
      expiresAt: expires,
    });
  })
);

router.delete(
  "/user/:id",
  adminAuth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin accounts cannot be deleted" });
    }

    const ownerVehicles = await Vehicle.find({ ownerId: user._id });
    const vehicleIds = ownerVehicles.map((vehicle) => vehicle._id);

    await destroyVehicleAssets(ownerVehicles);

    await Promise.all([
      Booking.deleteMany({
        $or: [{ userId: user._id }, { ownerId: user._id }, { vehicleId: { $in: vehicleIds } }],
      }),
      Review.deleteMany({
        $or: [{ userId: user._id }, { vehicleId: { $in: vehicleIds } }],
      }),
      Vehicle.deleteMany({ ownerId: user._id }),
    ]);

    await user.deleteOne();

    res.status(200).json({ message: "User and related data deleted" });
  })
);

router.get(
  "/bookings",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (["pending", "confirmed", "completed", "cancelled"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("userId", "name email")
        .populate("vehicleId", "name type images vehicleImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    res.status(200).json({
      bookings,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  })
);

router.delete(
  "/booking/:id",
  adminAuth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    await Promise.all([
      Review.deleteMany({ bookingId: booking._id }),
      booking.deleteOne(),
    ]);

    res.status(200).json({ message: "Booking deleted" });
  })
);

router.put(
  "/booking/:id/status",
  adminAuth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    booking.status = status;
    if (status === "completed") booking.completedAt = new Date();
    if (status === "cancelled") {
      booking.cancellationReason = String(req.body.reason || "Cancelled by admin").slice(0, 300);
    }

    await booking.save();

    res.status(200).json({ message: "Booking status updated successfully", booking });
  })
);

router.get(
  "/vehicles",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (["pending", "approved", "rejected"].includes(req.query.status)) {
      filter.approvalStatus = req.query.status;
    }

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      filter.$or = [{ name: regex }, { brand: regex }, { model: regex }, { location: regex }];
    }

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate("ownerId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Vehicle.countDocuments(filter),
    ]);

    res.status(200).json({
      vehicles,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  })
);

router.post(
  "/vehicle/approve/:id",
  adminAuth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: "approved", rejectionReason: "" },
      { new: true }
    );

    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.status(200).json({ message: "Vehicle approved", vehicle });
  })
);

router.post(
  "/vehicle/reject/:id",
  adminAuth,
  writeLimiter,
  validate(z.object({ reason: z.string().trim().min(3, "Rejection reason is required").max(300) })),
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: "rejected", rejectionReason: req.body.reason },
      { new: true }
    );

    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.status(200).json({ message: "Vehicle rejected", vehicle });
  })
);

router.delete(
  "/vehicle/:id",
  adminAuth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    await destroyVehicleAssets([vehicle]);

    await Promise.all([
      Booking.deleteMany({ vehicleId: vehicle._id }),
      Review.deleteMany({ vehicleId: vehicle._id }),
      vehicle.deleteOne(),
    ]);

    res.status(200).json({ message: "Vehicle deleted" });
  })
);

module.exports = router;
