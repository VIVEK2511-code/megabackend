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
  
export const updateNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;   // only noteId from URL
    const { content } = req.body;    // new note content

    // 1. Validate inputs
    if (!noteId) {
        throw new ApiError(400, "Note ID is required");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    // 2. Find the note
    const existingNote = await ProjectNote.findById(noteId);
    if (!existingNote) {
        throw new ApiError(404, "Note not found");
    }

    // 3. Check if the logged-in user is the author of this note
    if (existingNote.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this note");
    }

    // 4. Update note content
    existingNote.content = content.trim();
    await existingNote.save();

    // 5. Populate updated note for response
    const updatedNote = await ProjectNote.findById(noteId)
        .select("-__v")
        .populate("project", "name")
        .populate("createdBy", "_id name email username avatar")
        .lean();

    // 6. Return response
    return res
        .status(200)
        .json(new ApiResponse(200, updatedNote, "Note updated successfully"));
});


export const deleteNote=asyncHandler(async(req,res)=>{
  const {noteId,memerId}=req.params;
  if(!noteId){
    throw new ApiError(400,"Note id is required")
  }
  
  const deleteNote=await ProjectNote.findOneAndDelete(
    {
    _id:noteId,
    createdBy:memberId,
    }
  );
  if(!deleteNote){
    throw new ApiError(404,"Note not found or you are not authorized to delete this note")
  };
  return res.status(200).json(new ApiResponse(200,deleteNote,"Note deleted successfully"))
});

export const getNotesofMember=asyncHandler(async(req,res)=>{

         const userId = req.user?._id;
         // get all member ids of the user in all projects
         const projectMembers = await ProjectMember.find({ user: userId })
        .select("_id project")
        .lean();

        //projectMembers is the array we got from:
        //If this user doesn’t belong to any project, the array will be empty [].
       // projectMembers?.length === 0
      // ?. is optional chaining (safely checks length only if projectMembers is not null or undefined).
     // If there are no project memberships, this condition is true.
         if (projectMembers?.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "No projects found for this user"));
    }
     // get all member ids
    const projectMemberIds = projectMembers.map((member) => member._id);
    
    // find all notes created by these member ids
     const notes = await ProjectNote.find({
        createdBy: { $in: projectMemberIds },
    })
        .select("-__v")
        .populate("project", "name description ")
        .populate({
            path: "createdBy",
            select: "user",
            populate: {
                path: "user",
                select: "_id name email username avatar",
            },
        })
        .lean();
            return res
        .status(200)
        .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});