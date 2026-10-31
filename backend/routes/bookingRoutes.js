const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const auth = require("../middleware/authMiddleware");
const { validate, asyncHandler, z } = require("../middleware/validate");
const { writeLimiter } = require("../middleware/rateLimit");
const { parseDateOnly, startOfTodayUTC, diffDays, rangesOverlap } = require("../utils/date");

const router = express.Router();

const MAX_RENTAL_DAYS = 365;

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const createBookingSchema = z.object({
  vehicleId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid vehicle id"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  dropDate: z.string().min(1, "Drop date is required"),
});

const runCreation = async (session, { userId, vehicleId, start, end }) => {
  const query = Vehicle.findOne({
    _id: vehicleId,
    approvalStatus: "approved",
    isAvailable: true,
  });
  if (session) query.session(session);
  const vehicle = await query;

  if (!vehicle) throw httpError(404, "Vehicle not found or not available");

  if (vehicle.ownerId.toString() === userId) {
    throw httpError(400, "You cannot book your own vehicle");
  }

  const blockedConflict = (vehicle.blockedDates || []).some((blocked) =>
    rangesOverlap(start, end, new Date(blocked.start), new Date(blocked.end))
  );
  if (blockedConflict) {
    throw httpError(400, "Vehicle is not available for the selected dates");
  }

  const conflictQuery = Booking.findOne({
    vehicleId,
    status: { $in: ["pending", "confirmed"] },
    pickupDate: { $lte: end },
    dropDate: { $gte: start },
  });
  if (session) conflictQuery.session(session);
  const conflict = await conflictQuery;

  if (conflict) {
    throw httpError(409, "Vehicle is already booked for the selected dates");
  }

  const days = diffDays(start, end);
  const bookingData = {
    userId,
    ownerId: vehicle.ownerId,
    vehicleId: vehicle._id,
    pickupDate: start,
    dropDate: end,
    totalPrice: days * vehicle.pricePerDay,
    status: "pending",
  };

  const [booking] = session
    ? await Booking.create([bookingData], { session })
    : [await Booking.create(bookingData)];

  return booking;
};

// POST /booking/create
router.post(
  "/create",
  auth,
  writeLimiter,
  validate(createBookingSchema),
  asyncHandler(async (req, res) => {
    const start = parseDateOnly(req.body.pickupDate);
    const end = parseDateOnly(req.body.dropDate);

    if (!start || !end) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start < startOfTodayUTC()) {
      return res.status(400).json({ message: "Pickup date cannot be in the past" });
    }

    const days = diffDays(start, end);
    if (days <= 0) {
      return res.status(400).json({ message: "Drop date must be after pickup date" });
    }
    if (days > MAX_RENTAL_DAYS) {
      return res.status(400).json({ message: `Bookings cannot exceed ${MAX_RENTAL_DAYS} days` });
    }

    const payload = {
      userId: req.user.id,
      vehicleId: req.body.vehicleId,
      start,
      end,
    };

    const session = await mongoose.startSession();
    let booking;

    try {
      try {
        await session.withTransaction(async () => {
          booking = await runCreation(session, payload);
        });
      } catch (error) {
        const transactionUnsupported =
          error.code === 20 || /replica set|mongos|transaction/i.test(error.message || "");

        if (!transactionUnsupported) throw error;

        booking = await runCreation(null, payload);
      }
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      throw error;
    } finally {
      await session.endSession();
    }

    res.status(201).json({
      message: "Booking created successfully",
      available: true,
      booking,
    });
  })
);

// GET /booking/user
router.get(
  "/user",
  auth,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  })
);

// GET /booking/owner
router.get(
  "/owner",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Owner access required" });
    }

    const filter = req.user.role === "admin" ? {} : { ownerId: req.user.id };
    const bookings = await Booking.find(filter)
      .populate("vehicleId")
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  })
);

// GET /booking/booked-dates/:vehicleId
router.get(
  "/booked-dates/:vehicleId",
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({
      vehicleId: req.params.vehicleId,
      status: { $in: ["pending", "confirmed"] },
    }).select("pickupDate dropDate status");

    res.status(200).json({ bookings });
  })
);

// PUT /booking/:id/cancel — user cancels own booking
router.put(
  "/:id/cancel",
  auth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not allowed to cancel this booking" });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ message: "Completed booking cannot be cancelled" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    booking.status = "cancelled";
    booking.cancellationReason = String(req.body.reason || "Cancelled by user").slice(0, 300);
    await booking.save();

    res.status(200).json({ message: "Booking cancelled successfully", booking });
  })
);

// PUT /booking/:id/status — owner/admin confirms, completes or cancels
router.put(
  "/:id/status",
  auth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ["confirmed", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isManager =
      req.user.role === "admin" || booking.ownerId.toString() === req.user.id;
    if (!isManager) {
      return res.status(403).json({ message: "You are not allowed to update this booking" });
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    if (booking.status === "pending" && status === "completed") {
      return res.status(400).json({ message: "Confirm the booking before completing it" });
    }

    booking.status = status;
    if (status === "completed") {
      booking.completedAt = new Date();
    }
    if (status === "cancelled") {
      booking.cancellationReason = String(
        req.body.reason || "Cancelled by vehicle owner"
      ).slice(0, 300);
    }

    await booking.save();

    res.status(200).json({ message: "Booking status updated successfully", booking });
  })
);

module.exports = router;
