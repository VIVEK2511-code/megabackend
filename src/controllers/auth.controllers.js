import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
    emailVerificationMailGenerator,
    forgotPasswordMailGenContent,
    sendMail,
}         from "../utils/mail.js";
import crypto from "crypto";

import jwt from "jsonwebtoken";


export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, username, password } = req.body;
    if (!name || !email || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }
const existingUserByEmail = await User.findOne({ email }).lean();
const existingUserByUsername = await User.findOne({ username }).lean();

if (existingUserByEmail || existingUserByUsername) {
  throw new ApiError(400, "Email or username already exists. Please login.");
}
  const user = await User.create({
        name,
        email,
        username,
        password,
    });
    if (!user) throw new ApiError(500, "Unable to create user");

