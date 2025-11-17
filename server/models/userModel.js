const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs');
const crypto=require('crypto');
const userSchema=new mongoose.Schema({
    fullName:{
        type:String,
        required:[true,'Every user must have a name'],
        unique:true,
    },
    email:{
        type:String,
        unique:[true,"Email already exist"],
        required:[true,"Please provide an email"],
        lowercase:true,
        validate:{
            validator:validator.isEmail,
            message:"Please provide a valid email",
        }
    },
    password:{
        type:String,
        required:true,
        minlength:8,
    },
    passwordConfirm:{
        type:String,
        required:[true,"Please provide Password Confirm"],
        validate:{
            validator:function(passwordConfirm){
                return this.password===passwordConfirm;
            },
            message:"Passwords are not same",
        }
    },
    lastLogin:{
        type:String,
        default:Date.now,
    },
    bio:{
        type:String,
        default:""
    },
    profilePic:{
        type:String,
        default:""
    },
    resetPasswordToken:String,
    resetPasswordTokenExpiresAt:Date,
    verificationToken:String,
    verificationTokenExpiresAt:Date,
},{timestamps:true})
userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        next();
    }
    this.password=await bcrypt.hash(this.password,12);
    this.passwordConfirm=undefined;
    next();
})
userSchema.methods.createResetToken=function(){
    const resetToken=crypto.randomBytes(32).toString('hex');

    this.resetPasswordToken=crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordTokenExpiresAt=Date.now()+15*60*1000;
    return resetToken;
}
const User=mongoose.model("AuthUser",userSchema);
module.exports=User;