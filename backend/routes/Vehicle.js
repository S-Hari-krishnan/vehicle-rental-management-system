const express = require("express");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const auth = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const upload = require("../middleware/upload");
const { validate, asyncHandler, z } = require("../middleware/validate");
const { writeLimiter } = require("../middleware/rateLimit");
const { uploadImage, uploadDocument, getDocumentUrl, destroyAsset } = require("../utils/cloudinary");
const { parseDateOnly, startOfTodayUTC } = require("../utils/date");

const router = express.Router();

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePriceParam = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const uploadFields = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "vehicleImage", maxCount: 1 },
  { name: "rcDoc", maxCount: 1 },
  { name: "insuranceDoc", maxCount: 1 },
]);

const vehicleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.enum(["bike", "car"]),
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  pricePerDay: z.coerce.number().min(1).max(1000000),
  location: z.string().trim().min(2).max(120),
  contactNumber: z.string().trim().min(6).max(20),
});

const vehicleUpdateSchema = vehicleSchema.partial();

const getPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  return { page, limit, skip: (page - 1) * limit };
};

const buildImageList = async (files) => {
  const uploaded = [];
  const candidates = [...(files?.images || []), ...(files?.vehicleImage || [])];

  for (const file of candidates.slice(0, 5)) {
    const image = await uploadImage(file.buffer);
    uploaded.push(image);
  }

  return uploaded;
};

const uploadDocuments = async (files) => {
  const documents = {};

  if (files?.rcDoc?.[0]) {
    const file = files.rcDoc[0];
    documents.rc = {
      ...(await uploadDocument(file.buffer)),
      originalName: file.originalname,
    };
  }

  if (files?.insuranceDoc?.[0]) {
    const file = files.insuranceDoc[0];
    documents.insurance = {
      ...(await uploadDocument(file.buffer)),
      originalName: file.originalname,
    };
  }

  return documents;
};

const destroyVehicleAssets = async (vehicle) => {
  await Promise.all([
    ...(vehicle.images || []).map((image) => destroyAsset(image.publicId, "image", "upload")),
    vehicle.documents?.rc?.publicId
      ? destroyAsset(
          vehicle.documents.rc.publicId,
          vehicle.documents.rc.resourceType || "auto",
          "authenticated"
        )
      : null,
    vehicle.documents?.insurance?.publicId
      ? destroyAsset(
          vehicle.documents.insurance.publicId,
          vehicle.documents.insurance.resourceType || "auto",
          "authenticated"
        )
      : null,
  ]);
};

const canManageVehicle = (vehicle, user) =>
  user && (user.role === "admin" || vehicle.ownerId.toString() === user.id);

// GET /vehicle/all — public search, filters, sorting and pagination
router.get(
  "/all",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const { search, type, location, minPrice, maxPrice, sort } = req.query;

    const filter = { approvalStatus: "approved", isAvailable: true };

    if (type && ["bike", "car"].includes(type)) filter.type = type;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { brand: regex }, { model: regex }, { location: regex }];
    }

    if (location) filter.location = new RegExp(escapeRegex(location), "i");

    const minPriceValue = parsePriceParam(minPrice);
    const maxPriceValue = parsePriceParam(maxPrice);

    if (minPriceValue !== null || maxPriceValue !== null) {
      filter.pricePerDay = {};
      if (minPriceValue !== null) filter.pricePerDay.$gte = minPriceValue;
      if (maxPriceValue !== null) filter.pricePerDay.$lte = maxPriceValue;
    }

    const sortOptions = {
      price_asc: { pricePerDay: 1 },
      price_desc: { pricePerDay: -1 },
      rating: { ratingAverage: -1, ratingCount: -1 },
      newest: { createdAt: -1 },
      name: { name: 1 },
    };

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .select("-documents -rcDoc -insuranceDoc -rejectionReason")
        .sort(sortOptions[sort] || sortOptions.newest)
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

// GET /vehicle/my-vehicles — owner only
router.get(
  "/my-vehicles",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owners can view their vehicles" });
    }

    const vehicles = await Vehicle.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ vehicles });
  })
);

// POST /vehicle/add — owner only
router.post(
  "/add",
  auth,
  writeLimiter,
  uploadFields,
  validate(vehicleSchema),
  asyncHandler(async (req, res) => {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owners can add vehicles" });
    }

    const images = await buildImageList(req.files);
    if (images.length === 0) {
      return res.status(400).json({ message: "At least one vehicle image is required" });
    }

    const documents = await uploadDocuments(req.files);

    const vehicle = await Vehicle.create({
      ...req.body,
      ownerId: req.user.id,
      images,
      vehicleImage: images[0].url,
      documents,
    });

    res.status(201).json({ message: "Vehicle added successfully", vehicle });
  })
);

// PUT /vehicle/update/:id — owner/admin only
router.put(
  "/update/:id",
  auth,
  writeLimiter,
  uploadFields,
  validate(vehicleUpdateSchema),
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    if (!canManageVehicle(vehicle, req.user)) {
      return res.status(403).json({ message: "Only the owner can update this vehicle" });
    }

    Object.assign(vehicle, req.body);

    const newImages = await buildImageList(req.files);
    if (newImages.length) {
      await Promise.all(
        (vehicle.images || []).map((image) => destroyAsset(image.publicId, "image", "upload"))
      );
      vehicle.images = newImages;
      vehicle.vehicleImage = newImages[0].url;
    }

    const newDocuments = await uploadDocuments(req.files);
    if (newDocuments.rc) {
      if (vehicle.documents?.rc?.publicId) {
        await destroyAsset(
          vehicle.documents.rc.publicId,
          vehicle.documents.rc.resourceType || "auto",
          "authenticated"
        );
      }
      vehicle.documents.rc = newDocuments.rc;
    }
    if (newDocuments.insurance) {
      if (vehicle.documents?.insurance?.publicId) {
        await destroyAsset(
          vehicle.documents.insurance.publicId,
          vehicle.documents.insurance.resourceType || "auto",
          "authenticated"
        );
      }
      vehicle.documents.insurance = newDocuments.insurance;
    }

    if (newDocuments.rc || newDocuments.insurance) {
      vehicle.approvalStatus = "pending";
      vehicle.rejectionReason = "";
    }

    await vehicle.save();

    res.status(200).json({ message: "Vehicle updated successfully", vehicle });
  })
);

// DELETE /vehicle/delete/:id — owner/admin only
router.delete(
  "/delete/:id",
  auth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    if (!canManageVehicle(vehicle, req.user)) {
      return res.status(403).json({ message: "Not allowed to delete this vehicle" });
    }

    await Promise.all([
      destroyVehicleAssets(vehicle),
      Booking.deleteMany({ vehicleId: vehicle._id }),
      Review.deleteMany({ vehicleId: vehicle._id }),
    ]);

    await vehicle.deleteOne();

    res.status(200).json({ message: "Vehicle deleted successfully" });
  })
);

// PUT /vehicle/:id/availability — owner/admin toggles visibility
router.put(
  "/:id/availability",
  auth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    if (!canManageVehicle(vehicle, req.user)) {
      return res.status(403).json({ message: "Not allowed to update this vehicle" });
    }

    if (typeof req.body.isAvailable !== "boolean") {
      return res.status(400).json({ message: "isAvailable must be true or false" });
    }

    vehicle.isAvailable = req.body.isAvailable;
    await vehicle.save();

    res.status(200).json({
      message: vehicle.isAvailable ? "Vehicle is now available" : "Vehicle is now unavailable",
      vehicle,
    });
  })
);

// POST /vehicle/:id/blocked-dates — owner/admin blocks a date range
router.post(
  "/:id/blocked-dates",
  auth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    if (!canManageVehicle(vehicle, req.user)) {
      return res.status(403).json({ message: "Not allowed to update this vehicle" });
    }

    const start = parseDateOnly(req.body.start);
    const end = parseDateOnly(req.body.end);

    if (!start || !end) return res.status(400).json({ message: "Valid start and end dates are required" });
    if (end < start) return res.status(400).json({ message: "End date must be after start date" });
    if (start < startOfTodayUTC()) {
      return res.status(400).json({ message: "Past dates cannot be blocked" });
    }

    vehicle.blockedDates.push({
      start,
      end,
      reason: String(req.body.reason || "Maintenance").trim().slice(0, 120),
    });
    await vehicle.save();

    res.status(201).json({ message: "Dates blocked successfully", vehicle });
  })
);

// DELETE /vehicle/:id/blocked-dates/:blockedId — owner/admin
router.delete(
  "/:id/blocked-dates/:blockedId",
  auth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    if (!canManageVehicle(vehicle, req.user)) {
      return res.status(403).json({ message: "Not allowed to update this vehicle" });
    }

    vehicle.blockedDates = vehicle.blockedDates.filter(
      (blocked) => blocked._id.toString() !== req.params.blockedId
    );
    await vehicle.save();

    res.status(200).json({ message: "Blocked dates removed", vehicle });
  })
);

// GET /vehicle/:id/availability — public booked + blocked ranges
router.get(
  "/:id/availability",
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id).select(
      "approvalStatus isAvailable blockedDates"
    );
    if (!vehicle || vehicle.approvalStatus !== "approved") {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const bookings = await Booking.find({
      vehicleId: req.params.id,
      status: { $in: ["pending", "confirmed"] },
    }).select("pickupDate dropDate status");

    res.status(200).json({
      isAvailable: vehicle.isAvailable,
      bookings,
      blockedDates: vehicle.blockedDates,
    });
  })
);

// GET /vehicle/:id/documents/:type — owner/admin only
router.get(
  "/:id/documents/:type",
  auth,
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    if (!["rc", "insurance"].includes(type)) {
      return res.status(400).json({ message: "Invalid document type" });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    if (!canManageVehicle(vehicle, req.user)) {
      return res.status(403).json({ message: "Not allowed to view these documents" });
    }

    const document = vehicle.documents?.[type];
    const legacyFilename = type === "rc" ? vehicle.rcDoc : vehicle.insuranceDoc;

    if (document?.publicId) {
      return res.status(200).json({
        url: getDocumentUrl(document),
        mimeType: document.mimeType || "application/octet-stream",
        originalName: document.originalName || "",
      });
    }

    if (legacyFilename) {
      return res.status(200).json({
        url: `/uploads/${legacyFilename}`,
        mimeType: legacyFilename.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/*",
        originalName: legacyFilename,
      });
    }

    return res.status(404).json({ message: "Document not found" });
  })
);

// GET /vehicle/:id — public for approved vehicles, owner/admin for others
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id).select(
      "-documents -rcDoc -insuranceDoc -rejectionReason"
    );
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const isManager =
      req.user && (req.user.role === "admin" || vehicle.ownerId.toString() === req.user.id);

    if (vehicle.approvalStatus !== "approved" && !isManager) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({ vehicle });
  })
);

module.exports = router;
