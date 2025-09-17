import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ProjectNote } from "../models/notes.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";


export const createNote=asyncHandler(async(req,res)=>{
  const {projectId}=req.params;
  if(!projectId){
    throw new ApiError(400,"Project id is required")
  }
  const existingProject=await Project.findById(projectId).lean();
  if(!existingProject){
    throw new ApiError(404,"Project not found")
  }
  const existingmember=await ProjectMember.findOne({
    project:projectId,
    member:req.user?._id
  }).lean();
  if(!existingmember){
    throw new ApiError(403,"You are not a member of this project")
  }

  const newNote = await ProjectNote.create({
        project: projectId,
        content,
        createdBy: existingmember._id,
    });
     if (!newNote) {
        throw new ApiError(500, "Failed to create note");
    }
    await newNote.save();
    return res.status(201).json(new ApiResponse(201,newNote,"Note created successfully"))
  });

  export const getNotesByProjectId=asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    if(!projectId){
      throw new ApiError(400,"Project id is required")
    }
    const existingProject=await Project.findById(projectId).lean();
    if(!existingProject){
      throw new ApiError(404,"Project not found")
    }
    const notes=await ProjectNote.find({project:projectId})
    .populate("createdBy","_id username email")
    .populate("project","_id name description")
    .lean();
    return res.status(200).json(new ApiResponse(200,notes,"Notes fetched successfully"))
  })

  export const getNotebyId=asyncHandler(async(req,res)=>{
    const {noteId}=req.params;
    if(!noteId){
      throw new ApiError(400,"Note id is required")
    }

    // get the member id of the user in the project
    const existingMember = await ProjectMember.findOne({
        user: req.user?._id,
    });
    if (!existingMember) {
        throw new ApiError(403, "You are not a member of this project");
    }
     const note = await ProjectNote.findOne({
        _id: noteId,
    })
        .select("-__v")
        .populate("project", "name")
        .populate({
            path: "createdBy",
            select: "user",
            populate: {
                path: "user",
                select: "_id name email username avatar",
            },
        })
        .lean();

    if (!note) {
        throw new ApiError(404, "Note not found");
    }
    return res.status(200).json(new ApiResponse(200,note,"Note fetched successfully"))
  })
  


