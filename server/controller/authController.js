const jwt=require('jsonwebtoken');
const User = require('../models/userModel');
const templates=require('../mailtrap/emailTemplate.js');
const sendMail=require('../mailtrap/mailtrap.config.js');
const sendWelcomeEmail=require('../mailtrap/mailtrap.config.js');
const bcrypt=require('bcryptjs');
const cloudinary=require('../lib/cloudinary');
const crypto=require('crypto');
const generateTokenAndSetCookie=(res,id)=>{
    const token= jwt.sign({id},process.env.JWT_SECRET_KEY,{
        expiresIn:process.env.JWT_EXPIRE_IN,
    })
    res.cookie("token",token,{
        maxAge:90*24*60*60*1000,
        secure:process.env.NODE_ENV==='production',
        sameSite:"lax",
        // httpOnly:true,
    })
    return token;
}


exports.login=async(req,res)=>{
    try{
        const {email,password}=req.body;
        if(!email || !password){
            throw new Error("Provide email and password");
        }
        const user=await User.findOne({email});
        if(!user){
            throw new Error("Invalid Credentials");
        }
        const isPasswordValid=await bcrypt.compare(password,user.password);
        if(!isPasswordValid){
            throw new Error("Invalid Credentials");
        }
        generateTokenAndSetCookie(res,user._id);
        user.lastLogin=Date.now();
        await user.save({validateBeforeSave:false});
        res.status(200).json({
            status:'success',
            message:'Logged in successfully',
            user:{
                ...user._doc,
                password:undefined,
            }
        })
    }
    catch(err){
        return res.status(400).json({
            status:'fail',
            message:err.message,
        })
    }
}


exports.signup=async(req,res)=>{
    try{
        const {email,password,fullName,passwordConfirm}=req.body;
        if(!email || !password || !passwordConfirm || !fullName){
            throw new Error("All fields are necessary");
        }
        const userAlreadyExist=await User.findOne({email});
        if(userAlreadyExist){
            throw new Error("User already exists");
        }
        const verificationToken=Math.floor(100000+Math.random()*900000).toString();
        const newUser=await User.create({
            fullName,
            email,
            password,
            passwordConfirm,
            verificationToken,
            verificationTokenExpiresAt:Date.now()+15*60*1000,
        })
        const token=generateTokenAndSetCookie(res,newUser._id);
        await sendMail({
            email,
            subject:"Verification Code",
            html:templates.VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}",verificationToken),
        })
        res.status(201).json({
            status:'success',
            token,
            data:{
                User:newUser,
            }
        })
    }
    catch(err){
       
        return res.status(400).json({
            status:'fail',
            message:err.message,
        })
    }
}
exports.logout=(req,res)=>{
    res.clearCookie("token");
    res.status(200).json({
        status:'success',
        message:'Logged out successfully!',
    })
}
exports.verifyEmail=async(req,res)=>{
    
    try{
        const u = req.user;
        if(!u){
            throw new Error("User not found.");
        }
        else if(u.isVerified){
            throw new Error("User already verified.");
        }
        const {code}=req.body;
        if(!code){
            throw new Error("Please enter the verification code");
        }
        const user=await User.findOne({
            verificationToken:code,
            verificationTokenExpiresAt:{$gt:Date.now()}
        })
        if(!user){
            throw new Error("Invalid or expired verification code.");
        }
        user.isVerified=true;
        user.verificationToken=undefined;
        user.verificationTokenExpiresAt=undefined;
        await user.save({validateBeforeSave:false});
        // await sendWelcomeEmail({
        //     // email:user.email,
        //     name:user.name,
        // })
        res.status(200).json({
            status:'success',
            message:'Your email is verified',
        })
    }
    catch(err){
        return res.status(400).json({
            status:'fail',
            message:err.message,
        }) 
    }
}
exports.forgotPassword=async(req,res)=>{
    const {email}=req.body;
    try{
        if(!email){
            throw new Error("Please enter a valid email.");
        }
        const user=await User.findOne({email});
        if(!user){
            throw new Error("Please signup with this email.");
        }
        const resetToken=user.createResetToken();
        await user.save({validateBeforeSave:false});
        const resetURL=`${process.env.FRONTEND_URL}/forgot-password/${resetToken}`;
        
        await sendMail({
            email,
            subject:"Reset Password",
            html:templates.PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}",resetURL),
        })
        res.status(200).json({
            status:'success',
            message:"Email sent successfully!",
        })
    }
    catch(err){
        return res.status(400).json({
            status:'fail',
            message:err.message,
        }) 
    }
}
exports.resetPassword=async(req,res)=>{
    const {password,passwordConfirm}=req.body;
    try{
        const hashedToken=crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user=await User.findOne({resetPasswordToken:hashedToken,resetPasswordTokenExpiresAt:{$gt:Date.now()}});
        if(!user){
            throw new Error("Invalid or expired Token");
        }
        user.password=password;
        user.passwordConfirm=passwordConfirm;
        user.resetPasswordToken=undefined;
        user.resetPasswordTokenExpiresAt=undefined;
        await user.save();

        // const token=generateTokenAndSetCookie(res,user._id);
        res.status(200).json({
            status:'success',
            message:'Resetted password successfully!',
        })
    }
    catch(err){
        return res.status(400).json({
            status:'fail',
            message:err.message,
        })  
    }
}

exports.verifyToken=async(req,res,next)=>{
    const token=req.cookies.token;
    try{
        if(!token){
            throw new Error("Unauthorised-No token provided");
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY);
        if(!decoded){
            throw new Error("Unauthorised-Invalid token");
        }
        // console.log(decoded);
        const user=await User.findById(decoded.id).select('-password');
        if(!user){
            throw new Error("User not found");
        }
        req.user=user;
        next();
    }
    catch(err){
        return res.status(401).json({
            status:'fail',
            message:err.message,
        })
    }
}
exports.checkAuth=async(req,res)=>{
    try{
        const user=req.user;
        // console.log(user);
        if(!user){
            throw new Error("User not found");
        }
        res.status(200).json({
            status:'success',
            user,
        })
    }
    catch(err){
        res.status(400).json({
            status:'fail',
            message:err.message,
        })
    }
}
exports.updateProfile=async(req,res)=>{
    try{
        const {profilePic,bio,fullName}=req.body;

        if(!req.user || !req.user._id){
            return res.status(401).json({
                status:"fail",
                message:"User not authenticated"
            });
        }

        const userId=req.user._id;
        let updateUser;
        console.log("Starting profile update process - Cloudinary fix applied")

        if(!profilePic){
            updateUser=await User.findByIdAndUpdate(userId,{bio,fullName},{new:true});

        }
        else{
            try{
                // Ensure Cloudinary is properly configured before upload
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                    secure: true
                });
                
                console.log('Uploading to Cloudinary...');
                const upload=await cloudinary.uploader.upload(profilePic, {
                    folder: 'profile-pictures',
                    resource_type: 'image',
                    transformation: [
                        { width: 1000, height: 1000, crop: 'fill', gravity: 'face' },
                        { quality: 'auto' }
                    ]
                });
                console.log('Cloudinary upload successful:', upload.secure_url);
                updateUser=await User.findByIdAndUpdate(userId,{bio,fullName,profilePic:upload.secure_url},{new:true});
            }
            catch(err){
                console.log("Cloudinary error",err);
                return res.status(500).json({
                    status:"fail",
                    message:"Failed to upload image to Cloudinary: " + err.message
                });
            }
        }
        
        res.json({
            status:"success",
            user:updateUser,
        })
    }
    catch(err){
        console.log(err.message)
        res.status(400).json({
            status:"fail",
            message:err.message,
        })
    }
}