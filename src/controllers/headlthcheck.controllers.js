import { ApiResponse } from "../utils/api-response"

const healthCheck=(req,res)=>{
    res.status(200).json(
        new ApiResponse(200,{message:"server is running"}))

}