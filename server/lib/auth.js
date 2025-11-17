const User = require("../models/userModel")
const jwt=require('jsonwebtoken');

exports.protectRoute=async(req,res,next)=>{
    try{
        const token=req.cookies.token;
        if(!token){
            return res.status(401).json({success:false,message:"Unauthorized - No token provided"});
        }
        
        const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY);
        const user=await User.findById(decoded.id).select('-password');
        if(!user){
            return res.status(404).json({success:false,message:"User not found!"});
        } 
        req.user=user;
        next();
    }
    catch(err){
        console.log("Auth error:", err.message);
        return res.status(401).json({success:false,message:"Unauthorized - Invalid token"});
    }
}