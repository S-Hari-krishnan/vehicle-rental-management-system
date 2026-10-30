const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    name:
    {
        type:String,
        required:true,
        trim: true,
    },
    email:
    {
        type:String,
        unique:true,
        required:true,
        lowercase: true,
    },
    password:{
        type:String,
        required:true,
    },
    role: { 
        type: String, 
        enum: ["user", "owner","admin"], 
        default: "user" 
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// userSchema.methods.comparePassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// FIX - prevents OverwriteModelError
module.exports = mongoose.models.User || mongoose.model("User", userSchema);