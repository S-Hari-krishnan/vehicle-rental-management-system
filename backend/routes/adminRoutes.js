// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const adminAuth = require("../middleware/adminAuth");

const SECRET_KEY = process.env.JWT_SECRET;

// ------------------ Admin Login (separate) ------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email });

    if (!admin) return res.status(401).json({ message: "Invalid credentials(user not found)" });
    if (admin.role !== "admin") return res.status(403).json({ message: "Not an admin" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials(password does not match)" });

    const token = jwt.sign({ id: admin._id, role: admin.role }, SECRET_KEY, { expiresIn: "7d" });

    res.status(200).json({ token, admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Dashboard stats ------------------
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalOwners = await User.countDocuments({ role: "owner" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalVehicles = await Vehicle.countDocuments();
    const totalBookings = await Booking.countDocuments();

    res.status(200).json({ totalUsers, totalOwners, totalAdmins, totalVehicles, totalBookings });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ List all users ------------------
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Delete a user (cascade) ------------------
router.delete("/user/:id", adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Delete bookings by user
    await Booking.deleteMany({ userId });

    // If owner, delete their vehicles and bookings for those vehicles
    const ownerVehicles = await Vehicle.find({ ownerId: userId });
    const vehicleIds = ownerVehicles.map(v => v._id);
    if (vehicleIds.length > 0) {
      await Booking.deleteMany({ vehicleId: { $in: vehicleIds } });
      // Optionally remove images from storage here
      await Vehicle.deleteMany({ ownerId: userId });
    }

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User and related data deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ List all bookings ------------------
router.get("/bookings", adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate("vehicleId", "name type")
      .sort({ createdAt: -1 });
    res.status(200).json({ bookings });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Delete a booking ------------------
router.delete("/booking/:id", adminAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    await Booking.findByIdAndDelete(bookingId);

    res.status(200).json({ message: "Booking deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Manage vehicles (approve/reject/delete) ------------------
router.get("/vehicles", adminAuth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("ownerId", "name email");
    res.status(200).json({ vehicles });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/vehicle/approve/:id", adminAuth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: "approved" },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({ message: "Vehicle approved", vehicle });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/vehicle/reject/:id", adminAuth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: "rejected" },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({ message: "Vehicle rejected", vehicle });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/vehicle/:id", adminAuth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // delete bookings for this vehicle
    await Booking.deleteMany({ vehicleId: vehicle._id });

    // optionally remove files from storage here

    await vehicle.deleteOne({vehicleId: vehicle._id});
    res.status(200).json({ message: "Vehicle deleted" });
  } catch (err) {
    res.status(500).json({ message: `Server error` });
    console.log(err);
  }
});

router.put("/booking/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["confirmed", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid booking status",
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        message: "Completed booking cannot be updated",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled booking cannot be updated",
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      message: "Booking status updated successfully",
      booking,
    });
  } catch (err) {
    console.log("Admin booking status update error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
