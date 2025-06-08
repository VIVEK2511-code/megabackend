import mongoose ,{Schema} from "mongoose";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import crypto from "crypto"
const userSchema=new Schema({
    avatar:{
        type:{
            url:String,
            localpath:string
        },
        default:{
            url:`https://placehold.co/600x400`,
            localpath:""
        }
    },
    username:{
        type:string,
        required:true,
        unique:true,
        lowecase:true,
        trim:true,
        index:true
    },
    email:{
          type:string,
        required:true,
        unique:true,
        lowecase:true,
        trim:true,

    },
    fullname:{
       type:string,
       required:true ,
    },
    password:{
       type:string,
       required:[true,"password is required"] ,
    },
    isEmailVerified:{
       type:Boolean,
      default:false,
    },
    forgotPasswordToken:{
       type:string,
    },
     forgotPasswordToken:{
       type:Date,
    
    },
    refreshToken:{
        type:string,
    },
     emailVerificationToken:{
       type:string,
    },
    emailVerificationExpiry:{
       type:Date,
    }

},{timestamps:true})

// userSchema.pre("save", async function (next) {
//     if (!this.isModified("password")) return next(); // Only hash if password is modified
//     this.password = await bcrypt.hash(this.password, 10); // Hash the password
//     next(); // Continue saving
// });


if(this.isModified("password")){
    this.password=await bcrypt.hash(this.password,10)
}
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.genertateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
);
};

userSchema.methods.generateTemporaryToken=function(){
    const unHashedToken=crypto.randomBytes(20).toString("hex")

   const hashToken= crypto.createHash("sha256").update(unHashedToken).digest("hex")
   const tokenExpiry=Date.now()+(20*60*1000)  //20min

   return {hashToken,unHashedToken,tokenExpiry}
}
export const User=mongoose.model("User",userSchema)