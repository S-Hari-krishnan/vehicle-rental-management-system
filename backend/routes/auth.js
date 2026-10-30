const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

router.post("/signup", async (req,res)=>{
    const {name,email,password,confirmPassword,role} = req.body;
    try{
        if(!name || !email || !password || !confirmPassword)
            return res.status(400).json({message:"all fields required!"});
        if (password !== confirmPassword)
            return res.status(400).json({ message: "Passwords do not match" });

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "Email already exists" });

        const allowedRoles = ["user", "owner"];

        if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role selected" });
        }

        const newUser = new User({
        name,
        email,
        password,
        role,
        });
        
        await newUser.save();

        res.status(200).json({message:"User registered successfully"});

    }catch(error){
        console.error(error);
        res.status(500).json({message:"Server error"});
    }
});

router.post("/login", async (req,res) => {
    const {email,password} = req.body;

    if(!email || !password){
        return res.status(400).json({message:"all fields required!"});
    }

    try{
        const user = await User.findOne({email});

        if(!user || !(await bcrypt.compare(password,user.password))){
            return res.status(401).json({message:"Invalid Credentials"});
        }

        const token = jwt.sign(
            {id:user._id,email,role:user.role},
            SECRET_KEY,
            {expiresIn:"1h"}
        );

        res.status(200).json({token, message:"Login Successful!", role:user.role,userId:user._id});
    } catch(error){
        res.status(500).json({error:"Server error during login"});
    }

});

module.exports = router;