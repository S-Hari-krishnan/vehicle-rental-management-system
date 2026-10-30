require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

//const { createServer } = require("http");
//const httpServer = createServer(app);

const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/Vehicle");
const BookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(express.json());

app.use(cors({
  orgin: process.env.CLIENT_URI,
  credentials:true,
}));

app.use("/uploads", express.static(path.join(__dirname,"uploads")));


app.use("/auth", authRoutes);
app.use("/vehicle",vehicleRoutes);
app.use("/booking", BookingRoutes);
app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
  console.log("MongoDB connected");
  app.listen(PORT,()=> console.log(`Server running on port ${PORT}`));
})
.catch((err)=>{
  console.error("mongodb connection failed:",err.message);
});
