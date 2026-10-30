const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const auth = require("../middleware/authMiddleware");

// -----------------------------
// Create booking
// -----------------------------
router.post("/create", auth, async (req, res) => {
  try {
    const { vehicleId, pickupDate, dropDate } = req.body;

    if (!vehicleId || !pickupDate || !dropDate) {
      return res.status(400).json({
        message: "Vehicle, pickup date and drop date are required",
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    // Optional safety: owner should not book their own vehicle
    if (vehicle.ownerId.toString() === req.user.id) {
      return res.status(400).json({
        message: "You cannot book your own vehicle",
      });
    }

    const start = new Date(pickupDate);
    const end = new Date(dropDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid date format",
      });
    }

    const days = (end - start) / (1000 * 60 * 60 * 24);

    if (days <= 0) {
      return res.status(400).json({
        message: "Drop date must be after pickup date",
      });
    }

    // Only pending and confirmed bookings should block dates.
    // Cancelled/completed bookings should not block new bookings.
    const existingBookings = await Booking.find({
      vehicleId,
      status: { $in: ["pending", "confirmed"] },
    });

    const isBooked = existingBookings.some((b) => {
      const existingStart = new Date(b.pickupDate);
      const existingEnd = new Date(b.dropDate);

      return start <= existingEnd && end >= existingStart;
    });

    if (isBooked) {
      return res.status(400).json({
        message: "Vehicle not available for selected dates",
        available: false,
      });
    }

    const totalPrice = days * vehicle.pricePerDay;

    const newBooking = new Booking({
      userId: req.user.id,
      ownerId: vehicle.ownerId,
      vehicleId,
      pickupDate,
      dropDate,
      totalPrice,
      status: "pending",
    });

    await newBooking.save();

    res.status(201).json({
      message: "Booking created successfully",
      available: true,
      booking: newBooking,
    });
  } catch (err) {
    console.log("Create booking error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// -----------------------------
// User bookings
// -----------------------------
router.get("/user", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (err) {
    console.log("User bookings error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// -----------------------------
// Owner bookings
// -----------------------------
router.get("/owner", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ ownerId: req.user.id })
      .populate("vehicleId")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (err) {
    console.log("Owner bookings error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// -----------------------------
// Get booked dates for a vehicle
// Used by date picker frontend
// -----------------------------
router.get("/booked-dates/:vehicleId", async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const bookings = await Booking.find({
      vehicleId,
      status: { $in: ["pending", "confirmed"] },
    });

    res.status(200).json({ bookings });
  } catch (err) {
    console.log("Booked dates error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// -----------------------------
// User cancels own booking
// -----------------------------
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to cancel this booking",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        message: "Completed booking cannot be cancelled",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "Booking is already cancelled",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (err) {
    console.log("Cancel booking error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// -----------------------------
// Owner updates booking status
// Owner can confirm, complete, or cancel
// -----------------------------
router.put("/:id/status", auth, async (req, res) => {
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

    if (booking.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to update this booking",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled booking cannot be updated",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        message: "Completed booking cannot be updated",
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      message: "Booking status updated successfully",
      booking,
    });
  } catch (err) {
    console.log("Update booking status error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;