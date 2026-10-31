const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    publicId: { type: String, default: "" },
    resourceType: { type: String, default: "image" },
    mimeType: { type: String, default: "" },
    originalName: { type: String, default: "" },
  },
  { _id: false }
);

const blockedDateSchema = new mongoose.Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    reason: { type: String, default: "Maintenance", trim: true },
  },
  { timestamps: true }
);

const vehicleSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["bike", "car"] },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    pricePerDay: { type: Number, required: true, min: 1 },
    location: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },

    images: { type: [imageSchema], default: [] },
    documents: {
      rc: { type: documentSchema, default: null },
      insurance: { type: documentSchema, default: null },
    },

    vehicleImage: String,
    rcDoc: String,
    insuranceDoc: String,

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "", trim: true },
    isAvailable: { type: Boolean, default: true },
    blockedDates: { type: [blockedDateSchema], default: [] },

    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

vehicleSchema.index({ approvalStatus: 1, isAvailable: 1, type: 1, pricePerDay: 1 });
vehicleSchema.index({ ownerId: 1 });
vehicleSchema.index({ location: 1 });
vehicleSchema.index({ ratingAverage: -1 });

module.exports = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
