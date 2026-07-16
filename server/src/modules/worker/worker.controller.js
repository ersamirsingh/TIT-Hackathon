import { WorkerService } from "./worker.service.js";
import { buildPublicUser } from "../../utils/user.utils.js";

const workerService = new WorkerService();

export const updateAvailability = async (req, res) => {
    try {
        const user = await workerService.updateAvailability(req.user, req.body);
        return res.status(200).json({
            success: true,
            message: "Worker availability updated",
            user: buildPublicUser(user),
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to update availability",
        });
    }
};

export const updateWorkerProfile = async (req, res) => {
    try {
        const user = await workerService.updateWorkerProfile(req.user, req.body);
        return res.status(200).json({
            success: true,
            message: "Worker profile updated",
            user: buildPublicUser(user),
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to update worker profile",
        });
    }
};

export const getWorkerFeed = async (req, res) => {
    try {
        const feedData = await workerService.getWorkerFeed(req.user, req.query.radiusKm);
        return res.status(200).json({
            success: true,
            data: feedData,
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to get feed",
        });
    }
};

export const expressInterest = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await workerService.expressInterest(req.user, jobId, req.body);
        return res.status(201).json({
            success: true,
            message: req.body.boostProfile
                ? "Interest submitted and your profile was boosted to the top"
                : "Interest submitted successfully",
            data: { jobId: job._id },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to express interest",
        });
    }
};

export const purchaseVerifiedPro = async (req, res) => {
    try {
        const user = await workerService.purchaseVerifiedPro(req.user);
        return res.status(200).json({
            success: true,
            message: "Verified Pro activated",
            user: buildPublicUser(user),
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Purchase failed",
        });
    }
};
