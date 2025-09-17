import { SubTask } from "../models/subtasks.models.js";
import { Task } from "../models/task.models.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createSubtask=asyncHandler(async(req,res)=>{

    const {taskId}=req.params;
    if(!taskId){
        throw new ApiError(400,"Task id is required")
    }

    const existingTask=await Task.findById(taskId).lean();
    if(!existingTask){
        throw new ApiError(404,"Task not found")
    }

    const subTasks=await SubTask.create({
        title:req.body.title,
        task:taskId,
        isCompleted: req.body.isCompleted ?? false,
         createdBy: req.user?._id,
    })

    await subTasks.save();

    return res.status(201).json(new ApiResponse(201,subTasks,"Subtask created successfully"))

})

// This fetches all subtasks for that one task.
// So yes, one task can have multiple subtasks.
export const getSubtasksByTaskId=asyncHandler(async(req,res)=>{
    const {taskId}=req.params;
    if(!taskId){
        throw new ApiError(400,"Task id is required")
    }
    const existingTask=await Task.findById(taskId).lean();
    if(!existingTask){
        throw new ApiError(404,"Task not found")
    }
    const subtasks = await SubTask.find({ task: taskId })
    .populate("createdBy", "_id username email")
    .populate("task", "_id title description status priority")
    .lean();
//    subtasks
// Checks if subtasks is null or undefined.
// That would mean the query failed or didn’t return anything at all.
// subtasks.length === 0
// Even if subtasks exists, it could be an empty array ([]).
// That means the Task exists, but there are no subtasks linked to it.


if(!subtasks || subtasks.length === 0){
    return res.status(200).json(new ApiResponse(200,[], "No subtasks found for this task"));
}

    return res.status(200).json(new ApiResponse(200,subtasks,"Subtasks fetched successfully"))


})

export const updateSubtask=asyncHandler(async(req,res)=>{

    const {subtasks}=req.params;
    if(!subtasks){
        throw new ApiError(400,"Subtask id is required")
    }
    const existingsubtask=await SubTask.findById(subtasks);
    if(!existingsubtask){
        throw new ApiError(404,"Subtask not found")
    }


    const updatedSubtask = await SubTask.findByIdAndUpdate(subtasks,
    {
        // update fields one by one
        title: req.body.title, 
        isCompleted: req.body.isCompleted ?? false
    },
    {
        new: true,            // return updated doc
        runValidators: true   // enforce schema rules
    }
);

return  res.status(200).json(new ApiResponse(200,updatedSubtask,"Subtask updated successfully"))


    
})

export const deleteSubtask=asyncHandler(async(req,res)=>{
    const {subtaskId}=req.params;
    if(!subtaskId){
        throw new ApiError(400,"Subtask id is required")
    }
    const existingsubtask=await SubTask.findById(subtaskId);
    if(!existingsubtask){
        throw new ApiError(404,"Subtask not found")
    }
    await SubTask.findByIdAndDelete(subtaskId);
    return res.status(200).json(new ApiResponse(200,existingsubtask, "Subtask deleted successfully"))

});