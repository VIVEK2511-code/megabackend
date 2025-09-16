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