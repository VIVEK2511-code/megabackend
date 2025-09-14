import { ApiResponse } from "../utils/api-response"

const healthCheck=  async(req,res)=>{
    try{

        await console.log("logic is connected to db")
        res.status(200).json(new ApiResponse(200,{message:"server is running"}))

    }catch(error){

    }

}

export {healthCheck}