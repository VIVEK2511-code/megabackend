import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Project } from "../models/project.models.js";
import { Task } from "../models/task.models.js";

import { ProjectMember } from "../models/projectmember.models.js";
import { TaskStatusEnum, UserRolesEnum } from "../utils/constants.js";
import { ProjectNote } from "../models/notes.models.js";
import { User } from "../models/user.models.js";



export const getProjectsSummary = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 👉 “For this logged-in user (userId),
    //  find all the projects where their role is ADMIN. And also give me the full project details for each of those projects.”
    // Get projects where user is an admin or project manager
    const adminProjects = await ProjectMember.find({
        user: userId,
        role: { $in: UserRolesEnum.ADMIN },
    }).populate("project");


    const projectIds = adminProjects.map((member) => member.project._id);

      // Count total projects
    const totalProjects = projectIds.length;
    // Count tasks by status
    const AllTaskStats = await Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);
       // Get most active projects (by task count)
    const topFiveActiveProjects = await Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
            $group: {
                _id: "$project",
                taskCount: { $sum: 1 },
            },
        },
        { $sort: { taskCount: -1 } },
        { $limit: 5 },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalProjects,
                AllTaskStats,
                topFiveActiveProjects,
            },
            "Project summary fetched successfully",
        ),
    );
});

  export const getProjectDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get projects where user is an admin or project manager
    const adminProjects = await ProjectMember.find({
        user: userId,
        role: { $in: UserRolesEnum.ADMIN },
    }).populate("project");

    const projectIds = adminProjects.map((member) => member.project._id);

    // Get detailed project info
    const projects = await Project.find({ _id: { $in: projectIds } });

    // For each project, get member count and task completion rate
    const projectDetails = await Promise.all(
        projects.map(async (project) => {
            const memberCount = await ProjectMember.countDocuments({
                project: project._id,
            });

            const tasks = await Task.find({ project: project._id });
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(
                (task) => task.status === TaskStatusEnum.DONE,
            ).length;
            const completionRate =
                totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return {
                _id: project._id,
                name: project.name,
                description: project.description,
                createdAt: project.createdAt,
                memberCount,
                taskCount: totalTasks,
                completionRate: Math.round(completionRate),
            };
        }),
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                projectDetails,
                "Project details fetched successfully",
            ),
        );
});
export const getTeamOverview = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get projects where user is an admin
    const adminProjects = await ProjectMember.find({
        user: userId,
        role: { $in: UserRolesEnum.ADMIN },
    });

    const projectIds = adminProjects.map((member) => member.project);

    // Get all team members
    const teamMembers = await ProjectMember.find({
        project: { $in: projectIds },
    }).populate("user", "name email username avatar");

    // Count members by role
    const membersByRole = teamMembers.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
    }, {});

    // Get recently added members
    const recentMembers = await ProjectMember.find({
        project: { $in: projectIds },
    })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email username avatar")
        .populate("project", "name");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalMembers: teamMembers.length,
                membersByRole,
                recentMembers,
            },
            "Team overview fetched successfully",
        ),
    );
});
export const getMemberPerformance = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get projects where user is an admin
    const adminProjects = await ProjectMember.find({
        user: userId,
        role: { $in: UserRolesEnum.ADMIN },
    });

    const projectIds = adminProjects.map((member) => member.project);

    // Get all team members
    const teamMembers = await ProjectMember.find({
        project: { $in: projectIds },
    }).populate("user", "name email username avatar");

    const memberIds = teamMembers.map((member) => member.user._id);

    // Get tasks assigned to each member
    const memberPerformance = await Promise.all(
        memberIds.map(async (memberId) => {
            const user = teamMembers.find((m) =>
                m.user._id.equals(memberId),
            ).user;

            const assignedTasks = await Task.find({
                project: { $in: projectIds },
                assignedTo: memberId,
            });

            const totalTasks = assignedTasks.length;
            const completedTasks = assignedTasks.filter(
                (task) => task.status === TaskStatusEnum.DONE,
            ).length;
            const completionRate =
                totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return {
                user: {
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    avatar: user.avatar,
                },
                totalTasks,
                completedTasks,
                completionRate: Math.round(completionRate),
            };
        }),
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                memberPerformance,
                "Member performance fetched successfully",
            ),
        );
});
export const getTasksOverview = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get projects where user is an admin
    const adminProjects = await ProjectMember.find({
        user: userId,
        role: { $in: UserRolesEnum.ADMIN },
    });

    const projectIds = adminProjects.map((member) => member.project);

    // Tasks by status
    const tasksByStatus = await Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    // Tasks by priority
    const tasksByPriority = await Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
            $group: {
                _id: "$priority",
                count: { $sum: 1 },
            },
        },
    ]);

    // // Overdue tasks
    // const currentDate = new Date();
    // const overdueTasks = await Task.find({
    //     project: { $in: projectIds },
    //     dueDate: { $lt: currentDate },
    //     status: { $ne: TaskStatusEnum.DONE },
    // })
    //     .populate("project", "name")
    //     .populate("assignedTo", "name username avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                tasksByStatus,
                tasksByPriority,
            },
            "Tasks overview fetched successfully",
        ),
    );
});
