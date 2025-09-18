import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/user.models.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import { Project } from "../models/project.models.js";
import { projectInvitationMailGenContent } from "../utils/mail.js";

import { sendMail } from "../utils/mail.js";
import { Task } from "../models/task.models.js";

export const addProjectMember=asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    const { userId, role } = req.body;
    if(!projectId){
        throw new ApiError(400,"Project id is required")
    }
        // check if project is exists
    const existingProject = await Project.findById(projectId);
    if (!existingProject) throw new ApiError(404, "Project not found ");

    // check if user is exists
    const existingUser = await User.findById(userId).lean();
    if (!existingUser) throw new ApiError(404, "User not found ");
     // check if user is already a member of the project
    const existingMember = await ProjectMember.findOne({
        user: userId,
        project: projectId,
    }).lean();
    if (existingMember) throw new ApiError(409, "User is already a member of the project");

    
    const newProjectMember = await ProjectMember.create({
        user: userId,
        project: projectId,
        role,
    });

    if (!newProjectMember) throw new ApiError(500, "Failed to add member to the project");

    await newProjectMember.save();

    return res.status(201).json(new ApiResponse(201,newProjectMember,"Member added to the project successfully"))
});


export const getProjectMembers=asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    if(!projectId){
        throw new ApiError(400,"Project id is required")
    }
    const existingProject = await Project.findById(projectId).lean();
    if (!existingProject) throw new ApiError(404, "Project not found ");


    const projectMembers = await ProjectMember.find({ project: projectId })
    .populate("user", "_id username email")
    .populate("project", "_id name description")
    .lean();

    if (!projectMembers || projectMembers.length === 0) {
        return res.status(200).json(new ApiResponse(200,[], "No members found for this project"));
    }
    return res.status(200).json(new ApiResponse(200,projectMembers,"Project members fetched successfully"))
});

export const updatememberRole=asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    const {memberId,role}=req.body;
    if(!projectId){
        throw new ApiError(400,"Project id is required")
    }
    const existingProject = await Project.findById(projectId).lean();
    if (!existingProject) throw new ApiError(404, "Project not found ");

    const existingMember = await ProjectMember.findOneAndUpdate({
        _id: memberId,
        project: projectId,
    });
    if (!existingMember) throw new ApiError(404, "Member not found in this project");

    existingMember.role = role || existingMember.role;

    await existingMember.save();
    return res.status(200).json(new ApiResponse(200,existingMember,"Member role updated successfully"))
});

export const removeProjectMember=asyncHandler(async(req,res)=>{
    const {projectId}=req.params;
    const {memberId}=req.body;
    if(!projectId){
        throw new ApiError(400,"Project id is required")
    }
      // check if member exists before remove
    const existingMember = await ProjectMember.findOne({
        _id: memberId,
        project: projectId,
    });
    if (!existingMember)
        throw new ApiError(409, "User is not a member of the project");

        const deleteMember = await ProjectMember.deleteOne({
        _id: memberId,
        project: projectId,
    });

    if (!deleteMember || deleteMember.deletedCount === 0)
        throw new ApiError(500, "Unable to remove member from project");

        const updateTasks = await Task.updateMany(
        { project: projectId, assignedTo: memberId },
        { $unset: { assignedTo: "" } },
    );
    if (!updateTasks)
        throw new ApiError(500, "Unable to update tasks for removed member");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                updatedTask: updateTasks, // The updated task object
                deletedMember: deleteMember, // The deleted member info
            },
            "Member removed from project successfully",
        ),
    );
});

export const addMemberByEmail = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { email, role } = req.body; //validation handled in middleware
    if (!projectId) {
        throw new ApiError(400, "Project id is required");
    }


     // check if project is exists
    const existingProject = await Project.findById(projectId);
    if (!existingProject) throw new ApiError(404, "Project not found ");



        // check if user is exists before add
    const existingUser = await User.findOne({ email })
        .select(
            "-password  -__v -refreshToken -role -createdAt -updatedAt -isEmailVerified -emailVerificationToken -emailVerificationExpires -resetPasswordToken -resetPasswordExpires",
        )
        .lean();
    if (!existingUser) throw new ApiError(404, "User not found");
        // check if user is already a member of the project
    const existingMember = await ProjectMember.findOne({
        user: existingUser._id,
        project: projectId,
    });

    if ( existingMember)
        throw new ApiError(409, "User is already a member of the project");

      const newProjectMember = await ProjectMember.create({
        user: existingUser._id,
        project: projectId,
        role,
    });
     if (!newProjectMember)
        throw new ApiError(500, "Unable to add member to project");
 // send email invitation to the user
    const emailContent = projectInvitationMailGenContent(
        existingUser.name,
        existingProject.name,
        existingProject.description,
        `${process.env.FRONTEND_URL}/projects/${projectId}`,
    );

    await sendMail({
        email: existingUser.email,
        subject: `Invitation to join project: ${existingProject.name}`,
        mailGenContent: emailContent,
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                _id: newProjectMember._id,
                user: existingUser,
                project: existingProject,
                role: newProjectMember.role,
            },
            "Member added to project successfully",
        ),
    );
});


