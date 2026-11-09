require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const path = require("path");
const User = require("../models/User");
const { cloudinary } = require("../config/cloudinary");

const BASE_URL = (process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(
  /\/$/,
  ""
);

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${detail ? ` (${detail})` : ""}`);
};

const warn = (name, detail = "") => {
  console.log(`WARN - ${name}${detail ? ` (${detail})` : ""}`);
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

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

const PDF = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj
trailer<</Root 1 0 R>>
%%EOF`,
  "utf8"
);

const publicIdFromUrl = (url = "") => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  return match ? match[1].replace(/\.[a-z0-9]+$/i, "") : "";
};

const isSignedDocumentUrl = (url = "") =>
  /res\.cloudinary\.com/.test(url) && /\/authenticated\/s--[^/]+--\//.test(url);

(async () => {
  const tag = `upload${Date.now()}`;
  let user = null;
  let token = "";
  let vehicleId = "";
  let avatarPublicId = "";

  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Create a disposable owner through the public signup endpoint
    const signup = await request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Upload Verify",
        email: `${tag}@example.com`,
        password: "VerifyPass123",
        confirmPassword: "VerifyPass123",
        role: "owner",
      }),
    });
    check("temporary owner signup", signup.status === 201, `status=${signup.status}`);

    const login = await request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `${tag}@example.com`, password: "VerifyPass123" }),
    });
    token = login.body?.token || "";
    check("temporary owner login", login.status === 200 && Boolean(token), `status=${login.status}`);

    user = await User.findOne({ email: `${tag}@example.com` });
    if (!user || !token) throw new Error("Temporary owner was not created");

    // Avatar upload
    const avatarForm = new FormData();
    avatarForm.append("name", "Upload Verify");
    avatarForm.append("avatar", new Blob([PNG], { type: "image/png" }), "avatar.png");
    const avatar = await request("/auth/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: avatarForm,
    });
    check(
      "avatar upload returns a Cloudinary URL",
      avatar.status === 200 && /res\.cloudinary\.com/.test(avatar.body?.user?.avatar || ""),
      `status=${avatar.status}`
    );
    avatarPublicId = publicIdFromUrl(avatar.body?.user?.avatar);

    // Vehicle image + RC + insurance document upload
    const vehicleForm = new FormData();
    vehicleForm.append("name", "Upload Verify Bike");
    vehicleForm.append("type", "bike");
    vehicleForm.append("brand", "Verify");
    vehicleForm.append("model", "V1");
    vehicleForm.append("pricePerDay", "100");
    vehicleForm.append("location", "Test City");
    vehicleForm.append("contactNumber", "1234567890");
    vehicleForm.append("images", new Blob([PNG], { type: "image/png" }), "bike.png");
    vehicleForm.append("rcDoc", new Blob([PDF], { type: "application/pdf" }), "rc.pdf");
    vehicleForm.append(
      "insuranceDoc",
      new Blob([PNG], { type: "image/png" }),
      "insurance.png"
    );

    const vehicle = await request("/vehicle/add", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: vehicleForm,
    });
    vehicleId = vehicle.body?.vehicle?._id || "";
    const createdVehicle = vehicle.body?.vehicle;

    check(
      "vehicle image uploads to Cloudinary",
      vehicle.status === 201 && /res\.cloudinary\.com/.test(createdVehicle?.images?.[0]?.url || ""),
      `status=${vehicle.status}`
    );
    check(
      "RC document uploads to Cloudinary",
      Boolean(createdVehicle?.documents?.rc?.publicId),
      `publicId=${createdVehicle?.documents?.rc?.publicId || "none"}`
    );
    check(
      "insurance document uploads to Cloudinary",
      Boolean(createdVehicle?.documents?.insurance?.publicId),
      `publicId=${createdVehicle?.documents?.insurance?.publicId || "none"}`
    );

    // Signed document access
    const rc = await request(`/vehicle/${vehicleId}/documents/rc`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    check(
      "RC document returns a signed Cloudinary URL",
      rc.status === 200 && isSignedDocumentUrl(rc.body?.url),
      `status=${rc.status}`
    );
    if (isSignedDocumentUrl(rc.body?.url)) {
      const download = await fetch(rc.body.url);

      if (download.status === 401) {
        warn(
          "RC PDF download blocked by Cloudinary account setting",
          "enable Settings > Security > 'Allow delivery of PDF and ZIP files'"
        );
      } else {
        check(
          "RC signed URL is downloadable",
          download.status === 200,
          `status=${download.status}`
        );
      }
    }

    const insurance = await request(`/vehicle/${vehicleId}/documents/insurance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    check(
      "insurance document returns a signed Cloudinary URL",
      insurance.status === 200 && isSignedDocumentUrl(insurance.body?.url),
      `status=${insurance.status}`
    );
    if (isSignedDocumentUrl(insurance.body?.url)) {
      const download = await fetch(insurance.body.url);
      check(
        "insurance signed URL is downloadable",
        download.status === 200,
        `status=${download.status}`
      );
    }

    // Delete vehicle through the API so Cloudinary assets are cleaned up
    const deleted = await request(`/vehicle/delete/${vehicleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    check("vehicle deletion succeeds", deleted.status === 200, `status=${deleted.status}`);
    vehicleId = "";
  } catch (error) {
    console.error("Upload verification crashed:", error);
    results.push({ name: "upload verification run", ok: false });
  } finally {
    try {
      if (vehicleId && token) {
        await request(`/vehicle/delete/${vehicleId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (avatarPublicId) {
        await cloudinary.uploader.destroy(avatarPublicId, { resource_type: "image" });
      }
      if (user?._id) {
        await User.deleteOne({ _id: user._id });
      }
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
