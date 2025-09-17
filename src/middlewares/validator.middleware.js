import {validtationResult } from "express-validator"
import {ApiError}  from "../utils/api-error.js"
export const validate=(req,res,next)=>{
    const errors=validtationResult(req)

    if(errors.empty()){
        return next()
    }
    const extractedErrror=[]
    errors.array().map((err)=>extractedErrror.push({
        [err.path]:err.msg
    }))

    throw new ApiError(422,"Recieved date is not valid",
        extractedErrror
    )

}
// 👉 Summary for Interview:
// This middleware integrates with express-validator to enforce input validation. 
// If the request data fails validation, it throws a 422 error with detailed messages.
//  If the data is valid, the request continues to the controller. It ensures only clean, valid data enters the system.

// step by Step

// Get validation results

// const errors = validationResult(req);


// Runs all the checks defined earlier in your routes (like check("email").isEmail() etc.).

// Check if errors are empty

// if (errors.isEmpty()) {
//     return next();
// }


// If no errors → move on to the next middleware/controller.

// Format the errors

// const extractedError = [];
// errors.array().map((err) =>
//     extractedError.push({ [err.path]: err.msg })
// );


// Converts errors into a clean array of objects.

// Example: [ { email: "Invalid email address" }, { password: "Password too short" } ]

// Throw custom error

// throw new ApiError(422, "Received data is not valid", extractedError);


// Uses your custom ApiError class.

// HTTP status 422 Unprocessable Entity → means request data is invalid.