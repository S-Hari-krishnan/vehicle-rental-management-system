const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["bike", "car"],
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    pricePerDay: {
      type: Number,
      required: true,
      min: 1,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    rcDoc: String,
    insuranceDoc: String,
    vehicleImage: String,

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);