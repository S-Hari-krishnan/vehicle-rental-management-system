require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

async function createOrUpdateAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");
    console.log("Connected DB:", mongoose.connection.name);

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.findOneAndUpdate(
      { email },
      {
        name: "Admin",
        email,
        password: hashedPassword,
        role: "admin",
      },
      {
        new: true,
        upsert: true,
      }
    );

    console.log("Admin ready successfully");
    console.log("Admin ID:", admin._id);
    console.log("Email:", email);

    process.exit(0);
  } catch (error) {
    console.log("Create admin error:", error);
    process.exit(1);
  }
}

createOrUpdateAdmin();