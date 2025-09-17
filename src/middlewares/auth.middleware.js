// import ProjectMember from "../models/projectMember.model.js"
// import asyncHandler from "../utils/api-response.js"
// import {ApiError} from "../utils/api-error.js"
// import jwt from "jsonwebtoken"
// import User from "../models/user.model.js"
// export const verifyJWT=asyncHandler(async(req,resizeBy,next)=>{

//     const token=req.cookies?.accessToken ||
//     req.headers("Authorization")?.replace("Bearer ","");
//     if(!token){
        
//         throw new Error("Unauthorized access")
//     }

//     try{

//         const decodedToken=jwt.verify(token,process.env.JWT_SECRET_KEY);
         

//      const user=  await User.findById(decodedToken.id).select("-password -Token  -emailVerificationToken -emailVerificationExpiry ");

//      if(!user){
//         throw new ApiError(401,"Invalid access toekn")

//      }
//      req.user=user
//      next();
//     }catch{
//        throw new ApiError(401,err?.message || "Invalid access token")
//     }
// })
// export const validateProjectPermission = (Roles = []) => {
//   return asyncHandler(async (req, res, next) => {
//     const { projectId } = req.params;

//     if (!projectId) {
//       throw new ApiError(400, "Invalid Project id");
//     }

//     const project = await ProjectMember.findOne({
//       project: projectId,
//       user: req.user._id,
//     });

//     if (!project) {
//       throw new ApiError(404, "Project not found");
//     }

//     const givenRole = project.role;
//     req.user.role = givenRole;

//     if (!Roles.includes(givenRole)) {
//       throw new ApiError(403, "Access denied");
//     }

//     next();
//   });
// };

import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { UserRolesEnum } from "../utils/constants.js";
import { ProjectMember } from "../models/projectmember.models.js";

export const verifyToken = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized Access ");
        }

        const decodeToken = await jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
        );

        const user = await User.findById(decodeToken?._id).select(
            "-password -refreshToken",
        );
        if (!user) {
            throw new ApiError(
                401,
                "User is not Authorized to access this link ",
            );
        }


        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error.message || "invalid token ");
    }
});

// Middleware to check if user has required project role

export const hasProjectRole = (allowedRoles = []) => {
    return asyncHandler(async (req, res, next) => {

        //The logged-in user is a member of the project.
        //The user’s role (Admin, Manager, Member, etc.) is allowed to perform the action.
        const userId = req.user?._id;
        const projectId = req.params.projectId || req.body.projectId;


        //If no user → they aren’t logged in.

        //If no project ID → request is invalid.
        if (!userId) {
            throw new ApiError(401, "Unauthorized: User not logged in");
        }

        if (!projectId) {
            throw new ApiError(400, "Project ID is required");
        }

        // Check if the user is a member of the project
        //Looks in the ProjectMember collection to see if this user is part of the given project.
        const member = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!member) {
            throw new ApiError(
                403,
                "Forbidden: You are not a member of this project",
            );
        }

        // Check if user has one of the allowed roles

        if (!allowedRoles.includes(member.role)) {
            throw new ApiError(
                403,
                "Forbidden: You do not have permission to perform this action",
            );
        }

        // Attach role info to req if needed later
        req.projectRole = member.role;

        next();
    });
};