import Ad from "../models/ad.model.js";
import Dispute from "../models/dispute.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import { normaliseCoordinates } from "../utils/platform.utils.js";
import { processPendingJobsLifecycle } from "../utils/job.utils.js";

export const Overview = async (req, res) => {
    try {
        const [
            totalUsers,
            activeJobs,
            activeDisputes,
            availableWorkers,
            blockedWallets,
            activeSubscriptions,
            activeAds,
        ] = await Promise.all([
            User.countDocuments(),
            Job.countDocuments({
                status: {
                    $in: [
                        "broadcasting",
                        "worker_selected",
                        "in_progress",
                        "completed_pending_confirmation",
                    ],
                },
            }),
            Dispute.countDocuments({
                status: { $in: ["pending", "in-progress"] },
            }),
            User.countDocuments({
                availableModes: "worker",
                "workerProfile.isAvailable": true,
            }),
            User.countDocuments({
                "wallet.isBlocked": true,
            }),
            User.countDocuments({
                "subscription.status": "active",
            }),
            Ad.countDocuments({
                isActive: true,
            }),
        ]);

        const revenueData = await Job.aggregate([
            {
                $group: {
                    _id: null,
                    platformRevenue: { $sum: "$pricing.platformRevenue" },
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeJobs,
                activeDisputes,
                availableWorkers,
                blockedWallets,
                activeSubscriptions,
                activeAds,
                platformRevenue: revenueData[0]?.platformRevenue || 0,
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const listUsers = async (req, res) => {
    try {
        const users = await User.find()
            .limit(100)
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: { users },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const listJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .limit(100)
            .populate("customer", "Name emailId contact")
            .populate("selectedWorker", "Name emailId contact rating verified")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: { jobs },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const listDisputes = async (req, res) => {
    try {
        const disputes = await Dispute.find()
            .limit(100)
            .populate("job", "title status")
            .populate("raisedBy", "Name emailId contact")
            .populate("againstWorker", "Name emailId contact")
            .populate("mediator", "Name emailId contact")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: { disputes },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const resolveDispute = async (req, res) => {
    try {
        const { disputeId } = req.params;
        const { resolutionNotes = "" } = req.body;
        const dispute = await Dispute.findById(disputeId);

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: "Dispute not found",
            });
        }

        dispute.status = "resolved";
        dispute.resolutionNotes = String(resolutionNotes).trim();
        dispute.resolvedAt = new Date();
        await dispute.save();

        const job = await Job.findById(dispute.job);
        if (job && job.status === "disputed") {
            job.status = "completed";
            await job.save();
        }

        return res.status(200).json({
            success: true,
            message: "Dispute resolved successfully",
            data: { dispute },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const blockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.isBlocked = true;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User blocked successfully",
            data: { user },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.isBlocked = false;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User unblocked successfully",
            data: { user },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        await User.findByIdAndDelete(req.params.userId);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        await Job.findByIdAndDelete(req.params.jobId);

        return res.status(200).json({
            success: true,
            message: "Job deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const deleteDispute = async (req, res) => {
    try {
        const dispute = await Dispute.findById(req.params.disputeId);
        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: "Dispute not found",
            });
        }

        await Dispute.findByIdAndDelete(req.params.disputeId);

        return res.status(200).json({
            success: true,
            message: "Dispute deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const assignMediator = async (req, res) => {
    try {
        const { disputeId } = req.params;
        const { mediatorId } = req.body;
        const dispute = await Dispute.findById(disputeId);

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: "Dispute not found",
            });
        }

        const mediator = await User.findById(mediatorId);
        if (!mediator || mediator.role !== "mediator") {
            return res.status(404).json({
                success: false,
                message: "Mediator not found",
            });
        }

        dispute.mediator = mediatorId;
        dispute.status = "in-progress";
        await dispute.save();

        return res.status(200).json({
            success: true,
            message: "Mediator assigned successfully",
            data: { dispute },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const verifyUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.verified = true;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User verified successfully",
            data: { user },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const unverifyUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.verified = false;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User unverified successfully",
            data: { user },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const getJobDetails = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId)
            .populate("customer", "Name emailId contact")
            .populate("selectedWorker", "Name emailId contact");

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: { job },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const getDisputeDetails = async (req, res) => {
    try {
        const dispute = await Dispute.findById(req.params.disputeId)
            .populate("job")
            .populate("raisedBy", "Name emailId contact")
            .populate("againstWorker", "Name emailId contact")
            .populate("mediator", "Name emailId contact");

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: "Dispute not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: { dispute },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const getAllMediators = async (req, res) => {
    const mediators = await User.find({ role: "mediator" }).select("-password");
    return res.status(200).json({
        success: true,
        data: { mediators },
    });
};

export const getAllEmployers = async (req, res) => {
    const customers = await User.find({ availableModes: "customer" }).select("-password");
    return res.status(200).json({
        success: true,
        data: { customers },
    });
};

export const getAllLabourers = async (req, res) => {
    const workers = await User.find({ availableModes: "worker" }).select("-password");
    return res.status(200).json({
        success: true,
        data: { workers },
    });
};

export const listAds = async (req, res) => {
    const ads = await Ad.find().sort({ priority: -1, createdAt: -1 }).limit(100);
    return res.status(200).json({
        success: true,
        data: { ads },
    });
};

export const createAd = async (req, res) => {
    const {
        title,
        businessName,
        description = "",
        imageUrl = "",
        ctaText = "View Offer",
        ctaLink = "",
        category = "General",
        coordinates,
        radiusKm = 10,
        priority = 0,
        activeFrom,
        activeUntil,
    } = req.body;

    if (!title || !businessName) {
        return res.status(400).json({
            success: false,
            message: "title and businessName are required",
        });
    }

    const location = normaliseCoordinates(coordinates);
    const ad = await Ad.create({
        title: String(title).trim(),
        businessName: String(businessName).trim(),
        description: String(description).trim(),
        imageUrl: String(imageUrl).trim(),
        ctaText: String(ctaText).trim(),
        ctaLink: String(ctaLink).trim(),
        category: String(category).trim(),
        location: location || undefined,
        radiusKm: Number(radiusKm || 10),
        priority: Number(priority || 0),
        activeFrom: activeFrom ? new Date(activeFrom) : undefined,
        activeUntil: activeUntil ? new Date(activeUntil) : undefined,
    });

    return res.status(201).json({
        success: true,
        message: "Ad created successfully",
        data: { ad },
    });
};

export const toggleAdStatus = async (req, res) => {
    const ad = await Ad.findById(req.params.adId);
    if (!ad) {
        return res.status(404).json({
            success: false,
            message: "Ad not found",
        });
    }

    ad.isActive = !ad.isActive;
    await ad.save();

    return res.status(200).json({
        success: true,
        message: `Ad ${ad.isActive ? "activated" : "paused"} successfully`,
        data: { ad },
    });
};

export const runMaintenance = async (req, res) => {
    const processed = await processPendingJobsLifecycle();

    return res.status(200).json({
        success: true,
        message: "Lifecycle maintenance completed",
        data: { processed },
    });
};
