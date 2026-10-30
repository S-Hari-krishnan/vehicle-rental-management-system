const express = require("express");
const Vehicle = require("../models/Vehicle");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// GET all vehicles (public route)
router.get("/all", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      approvalStatus: "approved",
      isAvailable: true,
    });

    res.status(200).json({ vehicles });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/add",
    auth,
    upload.fields([
        {name:"vehicleImage",maxCount:1}, 
        { name: "rcDoc", maxCount: 1 },
        { name: "insuranceDoc", maxCount: 1 }
    ]),
    async (req,res)=>{
    try{
        if(req.user.role!== "owner"){
            return res.status(403).json({message:"only owners can add Vehicles"});
        }

        const ownerId = req.user.id;

        const {
        name,
        type,
        brand,
        model,
        pricePerDay,
        location,
        contactNumber,
        } = req.body;

        const vehicleImage = req.files["vehicleImage"]?.[0].filename;
        const rcDoc = req.files["rcDoc"]?.[0].filename;
        const insuranceDoc = req.files["insuranceDoc"]?.[0].filename;

        const newVehicle = new Vehicle({
            ownerId,
            name,
            type,
            brand,
            model,
            pricePerDay,
            location,
            contactNumber,
            rcDoc,
            insuranceDoc,
            vehicleImage,
        });

        await newVehicle.save();
        res.status(200).json({message:"Vehicle added successfully"});

    }catch(err){
        res.status(500).json({message:"server error",error:err})
    };
});

router.get("/my-vehicles",auth, async (req,res)=>{
    try{
        if(req.user.role!=="owner"){
            return res.status(403).json({message:"Only owners can view their vehicles"})
        }

        const ownerId = req.user.id;

        const vehicles = await Vehicle.find({ownerId});

        res.status(200).json({vehicles});
    }catch(err){
        res.status(500).json({message:"server error",error:err});
    }
});



// GET single vehicle by id (public to owner only)
router.get("/:id", async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // // only owner (or admin) should view full details here
    // if (vehicle.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    res.status(200).json({ vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// UPDATE vehicle (owner only)
router.put(
  "/update/:id",
  auth,
  upload.fields([
    { name: "vehicleImage", maxCount: 1 },
    { name: "rcDoc", maxCount: 1 },
    { name: "insuranceDoc", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const vehicleId = req.params.id;
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

      // Only owner who created this vehicle (or admin) can update
      if (vehicle.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Only owner can update this vehicle" });
      }

      // Update text fields (if present)
      const updatableFields = [
        "name",
        "type",
        "brand",
        "model",
        "pricePerDay",
        "location",
        "contactNumber",
      ];
      updatableFields.forEach((f) => {
        if (req.body[f] !== undefined) vehicle[f] = req.body[f];
      });

      // Update files if provided
      if (req.files) {
        if (req.files["vehicleImage"] && req.files["vehicleImage"][0]) {
          vehicle.vehicleImage = req.files["vehicleImage"][0].filename;
        }
        if (req.files["rcDoc"] && req.files["rcDoc"][0]) {
          vehicle.rcDoc = req.files["rcDoc"][0].filename;
        }
        if (req.files["insuranceDoc"] && req.files["insuranceDoc"][0]) {
          vehicle.insuranceDoc = req.files["insuranceDoc"][0].filename;
        }
      }

      await vehicle.save();
      res.status(200).json({ message: "Vehicle updated successfully", vehicle });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err });
    }
  }
);

// DELETE vehicle (owner only)
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (vehicle.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed to delete" });
    }

    await Vehicle.findByIdAndDelete(vehicleId);
    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;