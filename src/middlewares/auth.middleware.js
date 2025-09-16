import ProjectMember from "../models/projectMember.model.js"
import asyncHandler from "../utils/api-response.js"
import {ApiError} from "../utils/api-error.js"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
export const verifyJWT=asyncHandler(async(req,resizeBy,next)=>{

    const token=req.cookies?.accessToken ||
    req.headers("Authorization")?.replace("Bearer ","");
    if(!token){
        
        throw new Error("Unauthorized access")
    }

    try{

        const decodedToken=jwt.verify(token,process.env.JWT_SECRET_KEY);
         

     const user=  await User.findById(decodedToken.id).select("-password -Token  -emailVerificationToken -emailVerificationExpiry ");

     if(!user){
        throw new ApiError(401,"Invalid access toekn")

     }
     req.user=user
     next();
    }catch{
       throw new ApiError(401,err?.message || "Invalid access token")
    }
})


export const validateProjectPermission = (Roles = []) => {
  return asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    if (!projectId) {
      throw new ApiError(400, "Invalid Project id");
    }

    const project = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id,
    });

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const givenRole = project.role;
    req.user.role = givenRole;

    if (!Roles.includes(givenRole)) {
      throw new ApiError(403, "Access denied");
    }

    next();
  });
};
