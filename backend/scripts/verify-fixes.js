require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const upload = require("../middleware/upload");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

const BASE_URL = (process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(
  /\/$/,
  ""
);
const EXPECT_RESET_LINK = process.env.EXPECT_RESET_LINK !== "false";

const results = [];

const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${detail ? ` (${detail})` : ""}`);
};

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { status: response.status, body };
};

const postJson = (path, payload, headers = {}) =>
  request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });

const expectUploadError = (file) =>
  new Promise((resolve) => upload.fileFilter({}, file, (error) => resolve(error)));

(async () => {
  const tag = `verify${Date.now()}`;
  const created = { users: [], vehicles: [], bookings: [], reviews: [] };

  const cleanup = async () => {
    await Review.deleteMany({ _id: { $in: created.reviews } });
    await Booking.deleteMany({ _id: { $in: created.bookings } });
    await Vehicle.deleteMany({ _id: { $in: created.vehicles } });
    await User.deleteMany({ _id: { $in: created.users } });
  };

  try {
    await mongoose.connect(process.env.MONGO_URI);

    // F1 - malformed ObjectIds must return 400, not 500
    const malformedVehicle = await request("/vehicle/not-an-id");
    check(
      "F1 malformed vehicle id returns 400",
      malformedVehicle.status === 400,
      `status=${malformedVehicle.status}`
    );

    const malformedReviews = await request("/reviews/vehicle/not-an-id");
    check(
      "F1 malformed reviews id returns 400",
      malformedReviews.status === 400,
      `status=${malformedReviews.status}`
    );

    const malformedDates = await request("/booking/booked-dates/not-an-id");
    check(
      "F1 malformed booked-dates id returns 400",
      malformedDates.status === 400,
      `status=${malformedDates.status}`
    );

    // F2 - non-numeric price filters must not crash the public list
    const badMinPrice = await request("/vehicle/all?minPrice=abc");
    const badMaxPrice = await request("/vehicle/all?maxPrice=abc");
    check("F2 invalid minPrice is ignored", badMinPrice.status === 200, `status=${badMinPrice.status}`);
    check("F2 invalid maxPrice is ignored", badMaxPrice.status === 200, `status=${badMaxPrice.status}`);

    // F3 - rejected uploads must carry a 400 status
    const badImage = await expectUploadError({
      fieldname: "images",
      originalname: "not-an-image.txt",
      mimetype: "text/plain",
    });
    check(
      "F3 invalid image upload maps to 400",
      badImage?.status === 400,
      `status=${badImage?.status}`
    );

    const badDocument = await expectUploadError({
      fieldname: "rcDoc",
      originalname: "not-a-document.exe",
      mimetype: "application/x-msdownload",
    });
    check(
      "F3 invalid document upload maps to 400",
      badDocument?.status === 400,
      `status=${badDocument?.status}`
    );

    // Create disposable records for F4 and F5
    const admin = await User.create({
      name: "Verify Admin",
      email: `admin-${tag}@example.com`,
      password: "VerifyPass123",
      role: "admin",
    });
    const user = await User.create({
      name: "Verify User",
      email: `user-${tag}@example.com`,
      password: "VerifyPass123",
      role: "user",
    });
    created.users.push(admin._id, user._id);

    const vehicle = await Vehicle.create({
      ownerId: user._id,
      name: "Verify Bike",
      type: "bike",
      brand: "Verify",
      model: "V1",
      pricePerDay: 100,
      location: "Test",
      contactNumber: "1234567890",
      approvalStatus: "approved",
    });
    created.vehicles.push(vehicle._id);

    const booking = await Booking.create({
      userId: user._id,
      ownerId: user._id,
      vehicleId: vehicle._id,
      pickupDate: new Date(),
      dropDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      totalPrice: 100,
      status: "completed",
      isReviewed: true,
    });
    created.bookings.push(booking._id);

    const review = await Review.create({
      userId: user._id,
      vehicleId: vehicle._id,
      bookingId: booking._id,
      rating: 5,
      comment: "Disposable verification review",
    });
    created.reviews.push(review._id);

    // F5 - known and unknown emails must produce the same message
    const known = await postJson("/auth/forgot-password", { email: user.email });
    const unknown = await postJson("/auth/forgot-password", {
      email: `nobody-${tag}@example.com`,
    });
    check(
      "F5 forgot-password messages are identical",
      known.status === 200 && unknown.status === 200 && known.body.message === unknown.body.message,
      `known="${known.body.message}" unknown="${unknown.body.message}"`
    );
    check(
      EXPECT_RESET_LINK
        ? "F5 development response still exposes reset link"
        : "F5 production response does not expose reset link",
      EXPECT_RESET_LINK ? Boolean(known.body.resetUrl) : !known.body.resetUrl,
      `hasResetUrl=${Boolean(known.body.resetUrl)}`
    );

    // F4 - admin deleting a review must reset booking.isReviewed
    const login = await postJson("/admin/login", {
      email: admin.email,
      password: "VerifyPass123",
    });
    check("temporary admin can log in", login.status === 200 && Boolean(login.body.token));

    const deleted = await request(`/reviews/${review._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${login.body.token}` },
    });
    const refreshed = await Booking.findById(booking._id).lean();
    check(
      "F4 deleting a review resets booking.isReviewed",
      deleted.status === 200 && refreshed?.isReviewed === false,
      `deleteStatus=${deleted.status} isReviewed=${refreshed?.isReviewed}`
    );
  } catch (error) {
    console.error("Verification crashed:", error);
    results.push({ name: "verification run", ok: false });
  } finally {
    try {
      await cleanup();
    } catch (error) {
      console.error("Cleanup failed:", error.message);
      results.push({ name: "cleanup", ok: false });
    }

    await mongoose.disconnect();

    const failed = results.filter((result) => !result.ok).length;
    console.log(`\n${results.length - failed}/${results.length} checks passed`);
    process.exit(failed === 0 ? 0 : 1);
  }
})();
