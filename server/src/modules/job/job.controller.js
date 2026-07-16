import { JobService } from "./job.service.js";
import { buildPublicUser } from "../../utils/user.utils.js";
import { STANDARD_RATE_CARD } from "../../utils/platform.utils.js";

const jobService = new JobService();

export const getRateCard = async (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            rateCard: STANDARD_RATE_CARD,
        },
    });
};

export const createJob = async (req, res) => {
    try {
        const job = await jobService.createJob(req.user, req.body);
        return res.status(201).json({
            success: true,
            message: "Job created successfully and broadcasted to nearby workers",
            data: { job },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to create job",
        });
    }
};

export const listMyJobs = async (req, res) => {
    try {
        const jobs = await jobService.listMyJobs(req.user);
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

export const getJobDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await jobService.getJobDetails(req.user, jobId);
        return res.status(200).json({
            success: true,
            data: { job },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to get job details",
        });
    }
};

export const getJobMatches = async (req, res) => {
    try {
        const { jobId } = req.params;
        const matchedWorkers = await jobService.getJobMatches(req.user, jobId);
        return res.status(200).json({
            success: true,
            data: { matchedWorkers },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to get matches",
        });
    }
};

export const selectWorker = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { workerId } = req.body;
        const job = await jobService.selectWorker(req.user, jobId, workerId);
        return res.status(200).json({
            success: true,
            message: "Worker selected and deposit locked in escrow",
            data: { job },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Selection failed",
        });
    }
};

export const markWorkerArrived = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await jobService.markWorkerArrived(req.user, jobId);
        return res.status(200).json({
            success: true,
            message: "Worker arrival confirmed",
            data: { job },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Arrival confirmation failed",
        });
    }
};

export const cancelJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { reason } = req.body;
        const job = await jobService.cancelJob(req.user, jobId, reason);
        return res.status(200).json({
            success: true,
            message: "Job cancelled successfully",
            data: { job },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Cancellation failed",
        });
    }
};

export const markWorkCompleted = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await jobService.markWorkCompleted(req.user, jobId);
        return res.status(200).json({
            success: true,
            message: "Work marked as completed",
            data: { job },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Completion failed",
        });
    }
};

export const confirmJobCompletion = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { rating, review } = req.body;
        const job = await jobService.confirmJobCompletion(req.user, jobId, rating, review);
        return res.status(200).json({
            success: true,
            message: "Job completion confirmed and worker paid out",
            data: { job },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Confirmation failed",
        });
    }
};

export const raiseDispute = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { notes } = req.body;
        const job = await jobService.raiseDispute(req.user, jobId, notes);
        return res.status(200).json({
            success: true,
            message: "Dispute raised successfully",
            data: { job },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Dispute failed",
        });
    }
};

export const claimWarranty = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { claimNotes } = req.body;
        const job = await jobService.claimWarranty(req.user, jobId, claimNotes);
        return res.status(200).json({
            success: true,
            message: "Warranty claim raised and dispute logged",
            data: { job },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Claim failed",
        });
    }
};

export const getTrackingDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const trackingPayload = await jobService.getTrackingDetails(req.user, jobId);
        return res.status(200).json({
            success: true,
            data: trackingPayload,
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Tracking failed",
        });
    }
};
