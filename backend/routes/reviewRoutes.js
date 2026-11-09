const express = require("express");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const auth = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminAuth");
const { validate, asyncHandler, z } = require("../middleware/validate");
const { writeLimiter } = require("../middleware/rateLimit");

const router = express.Router();

const reviewSchema = z.object({
  bookingId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid booking id"),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Review must be at least 3 characters").max(1000),
});

const refreshVehicleRating = async (vehicleId) => {
  const stats = await Review.aggregate([
    { $match: { vehicleId } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const average = stats[0]?.average || 0;
  const count = stats[0]?.count || 0;

  await Vehicle.findByIdAndUpdate(vehicleId, {
    ratingAverage: Math.round(average * 10) / 10,
    ratingCount: count,
  });
};

// POST /reviews
router.post(
  "/",
  auth,
  writeLimiter,
  validate(reviewSchema),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.body.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only review your own bookings" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Only completed bookings can be reviewed" });
    }

    if (booking.isReviewed) {
      return res.status(409).json({ message: "This booking has already been reviewed" });
    }

    let review;
    try {
      review = await Review.create({
        userId: req.user.id,
        vehicleId: booking.vehicleId,
        bookingId: booking._id,
        rating: req.body.rating,
        comment: req.body.comment,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: "This booking has already been reviewed" });
      }
      throw error;
    }

    booking.isReviewed = true;
    await booking.save();

    await refreshVehicleRating(booking.vehicleId);

    res.status(201).json({ message: "Review submitted successfully", review });
  })
);

// GET /reviews/vehicle/:vehicleId
router.get(
  "/vehicle/:vehicleId",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ vehicleId: req.params.vehicleId })
        .populate("userId", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ vehicleId: req.params.vehicleId }),
    ]);

    res.status(200).json({
      reviews,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  })
);

// DELETE /reviews/:id — admin moderation
router.delete(
  "/:id",
  adminAuth,
  asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    await review.deleteOne();

    if (review.bookingId) {
      await Booking.findByIdAndUpdate(review.bookingId, { isReviewed: false });
    }

    await refreshVehicleRating(review.vehicleId);

    res.status(200).json({ message: "Review deleted" });
  })
);

module.exports = router;
