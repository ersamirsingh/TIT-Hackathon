import { AdminService } from "./admin.service.js";
import { buildPublicUser } from "../../utils/user.utils.js";

const adminService = new AdminService();

export const Overview = async (req, res) => {
    try {
        const stats = await adminService.getOverview();
        return res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to load overview data",
        });
    }
};

export const listUsers = async (req, res) => {
    try {
        const users = await adminService.listUsers();
        return res.status(200).json({
            success: true,
            data: { users },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to list users",
        });
    }
};

export const listJobs = async (req, res) => {
    try {
        const jobs = await adminService.listJobs();
        return res.status(200).json({
            success: true,
            data: { jobs },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to list jobs",
        });
    }
};

export const listDisputes = async (req, res) => {
    try {
        const disputes = await adminService.listDisputes();
        return res.status(200).json({
            success: true,
            data: { disputes },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to list disputes",
        });
    }
};

export const resolveDispute = async (req, res) => {
    try {
        const { disputeId } = req.params;
        const { action, notes } = req.body;
        const dispute = await adminService.resolveDispute(disputeId, action, notes);
        return res.status(200).json({
            success: true,
            message: "Dispute resolved successfully",
            data: { dispute },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Resolution failed",
        });
    }
};

export const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await adminService.blockUser(userId);
        return res.status(200).json({
            success: true,
            message: "User blocked successfully",
            data: { user: buildPublicUser(user) },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to block user",
        });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await adminService.unblockUser(userId);
        return res.status(200).json({
            success: true,
            message: "User unblocked successfully",
            data: { user: buildPublicUser(user) },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to unblock user",
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await adminService.deleteUser(userId);
        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to delete user",
        });
    }
};

export const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        await adminService.deleteJob(jobId);
        return res.status(200).json({
            success: true,
            message: "Job deleted successfully",
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to delete job",
        });
    }
};

export const deleteDispute = async (req, res) => {
    try {
        if (req.user?.role !== "system_admin") {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Only System Admins can delete disputes",
            });
        }
        const { disputeId } = req.params;
        await adminService.deleteDispute(disputeId);
        return res.status(200).json({
            success: true,
            message: "Dispute deleted successfully",
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to delete dispute",
        });
    }
};

export const assignMediator = async (req, res) => {
    try {
        const { disputeId } = req.params;
        const { mediatorId } = req.body;
        const dispute = await adminService.assignMediator(disputeId, mediatorId);
        return res.status(200).json({
            success: true,
            message: "Mediator assigned successfully",
            data: { dispute },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Assignment failed",
        });
    }
};

export const verifyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await adminService.verifyUser(userId);
        return res.status(200).json({
            success: true,
            message: "User verified successfully",
            data: { user: buildPublicUser(user) },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Verification failed",
        });
    }
};

export const unverifyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await adminService.unverifyUser(userId);
        return res.status(200).json({
            success: true,
            message: "User verification revoked successfully",
            data: { user: buildPublicUser(user) },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to unverify user",
        });
    }
};

export const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await adminService.getUserDetails(userId);
        return res.status(200).json({
            success: true,
            data: { user: buildPublicUser(user) },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to load user details",
        });
    }
};

export const getJobDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await adminService.getJobDetails(jobId);
        return res.status(200).json({
            success: true,
            data: { job },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to load job details",
        });
    }
};

export const getDisputeDetails = async (req, res) => {
    try {
        const { disputeId } = req.params;
        const dispute = await adminService.getDisputeDetails(disputeId);
        return res.status(200).json({
            success: true,
            data: { dispute },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to load dispute details",
        });
    }
};

export const getAllMediators = async (req, res) => {
    try {
        const mediators = await adminService.getAllMediators();
        return res.status(200).json({
            success: true,
            data: { mediators },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to load mediators",
        });
    }
};

export const getAllEmployers = async (req, res) => {
    try {
        const employers = await adminService.getAllEmployers();
        return res.status(200).json({
            success: true,
            data: { employers },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to load employers",
        });
    }
};

export const getAllLabourers = async (req, res) => {
    try {
        const labourers = await adminService.getAllLabourers();
        return res.status(200).json({
            success: true,
            data: { labourers },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to load labourers",
        });
    }
};

export const listAds = async (req, res) => {
    try {
        const ads = await adminService.listAds();
        return res.status(200).json({
            success: true,
            data: { ads },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to list ads",
        });
    }
};

export const createAd = async (req, res) => {
    try {
        const ad = await adminService.createAd(req.body);
        return res.status(201).json({
            success: true,
            message: "Sponsored ad created successfully",
            data: { ad },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to create ad",
        });
    }
};

export const toggleAdStatus = async (req, res) => {
    try {
        const { adId } = req.params;
        const ad = await adminService.toggleAdStatus(adId);
        return res.status(200).json({
            success: true,
            message: ad.isActive ? "Ad status enabled" : "Ad status disabled",
            data: { ad },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to toggle ad status",
        });
    }
};

export const runMaintenance = async (req, res) => {
    try {
        const details = await adminService.runMaintenance();
        return res.status(200).json({
            success: true,
            message: "Maintenance completed successfully",
            data: { details },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Maintenance failed",
        });
    }
};

export const createSystemAdmin = async (req, res) => {
    try {
        const adminUser = await adminService.createSystemAdmin(req.user, req.body);
        return res.status(201).json({
            success: true,
            message: "System Admin created successfully",
            user: buildPublicUser(adminUser),
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to create System Admin",
        });
    }
};

export const getQueries = async (req, res) => {
    try {
        const queries = await adminService.getQueries();
        return res.status(200).json({
            success: true,
            data: { queries },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to load support queries",
        });
    }
};

export const resolveQuery = async (req, res) => {
    try {
        const { queryId } = req.params;
        const { resolutionNotes } = req.body;
        const query = await adminService.resolveQuery(queryId, resolutionNotes);
        return res.status(200).json({
            success: true,
            message: "Support query resolved successfully",
            data: { query },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to resolve query",
        });
    }
};
