
import Project from "../models/project.model.js";
import { ApiError } from "../utils/api-error";


const getNotes=async(req,res)=>{
      const {projectid}=req.params;

      const project=await Project.findById(projectid);
        if(!project){
            throw new ApiError(404,"Project not found")
        }

        await 

}