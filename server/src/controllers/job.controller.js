import mongoose from "mongoose";
import Ad from "../models/ad.model.js";
import Dispute from "../models/dispute.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import {
    PLATFORM_CONFIG,
    STANDARD_RATE_CARD,
    buildPricingBreakdown,
    buildVoiceInput,
    getCrossSellRecommendations,
    getRateCardItem,
    normaliseCoordinates,
} from "../utils/platform.utils.js";
import { findTrackingAd, processJobLifecycle } from "../utils/job.utils.js";
import { applyWalletCredit, applyWalletDebit } from "../utils/wallet.utils.js";
import { buildPublicUser, getNormalizedRole, hasMode } from "../utils/user.utils.js";

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const getComparableId = (value) => {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (value._id) {
        return String(value._id);
    }

    return String(value);
};

const isSameEntity = (left, right) => getComparableId(left) === getComparableId(right);

const jobPopulate = [
    { path: "customer", select: "Name emailId contact rating ratingCount verified coins" },
    { path: "employer", select: "Name emailId contact" },
    {
        path: "selectedWorker",
        select: "Name emailId contact rating ratingCount verified workerProfile subscription wallet",
    },
    {
        path: "applications.worker",
        select: "Name emailId contact rating ratingCount verified workerProfile subscription",
    },
];

const sortApplications = (applications = []) =>
    [...applications].sort((left, right) => {
        if (left.isBoosted !== right.isBoosted) {
            return left.isBoosted ? -1 : 1;
        }

        return new Date(right.submittedAt) - new Date(left.submittedAt);
    });

const ensureCustomerAccess = (req, res) => {
    if (!hasMode(req.user, "customer")) {
        res.status(403).json({
            success: false,
            message: "Customer access is required for this action",
        });
        return false;
    }

    if (req.user.activeMode !== "customer" && getNormalizedRole(req.user.role) !== "admin") {
        res.status(403).json({
            success: false,
            message: "Switch to Find a Worker mode to continue",
        });
        return false;
    }

    return true;
};

const ensureWorkerAccess = (req, res) => {
    if (!hasMode(req.user, "worker")) {
        res.status(403).json({
            success: false,
            message: "Worker access is required for this action",
        });
        return false;
    }

    return true;
};

const canAccessJob = (user, job) => {
    if (!user || !job) {
        return false;
    }

    if (getNormalizedRole(user.role) === "admin" || "customer") {
        return true;
    }

    if (isSameEntity(job.customer, user._id)) {
        return true;
    }

    if (isSameEntity(job.selectedWorker, user._id)) {
        return true;
    }

    return job.applications?.some(
        (application) => isSameEntity(application.worker, user._id),
    );
};

const queryNearbyWorkers = async ({ location, category, radiusKm }) => {
    if (!location?.coordinates?.length) {
        return [];
    }

    const [lng, lat] = location.coordinates;
    const maxDistance = (radiusKm || PLATFORM_CONFIG.defaultSearchRadiusKm) * 1000;

    return User.find({
        $or: [
            { availableModes: "worker" },
            { role: { $in: ["user", "employee", "employer", "labourer"] } },
        ],
        verified: true,
        isBlocked: false,
        "workerProfile.isAvailable": true,
        ...(category
            ? {
                  $or: [
                      { "workerProfile.categories": category },
                      { "workerProfile.categories": "General" },
                      { "workerProfile.categories": { $size: 0 } },
                  ],
              }
            : {}),
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
                $maxDistance: maxDistance,
            },
        },
    })
        .select(
            "Name contact rating ratingCount verified workerProfile subscription locationText",
        )
        .limit(25);
};

const refreshPricingForInspection = (job, finalQuotedAmount) => {
    job.pricing = buildPricingBreakdown({
        pricingModel: job.pricing.pricingModel,
        serviceCode: job.pricing.serviceCode,
        rocketMode: job.rocketMode?.enabled,
        coinsRedeemed: job.pricing.coinsRedeemed,
        finalQuotedAmount,
    });
};

const buildTrackingPayload = async (job) => {
    const ad =
        (await findTrackingAd(job.location, job.category)) ||
        (job.adSnapshot?.title ? job.adSnapshot : null);

    if (ad?.constructor?.modelName === "Ad") {
        job.adSnapshot = {
            title: ad.title,
            businessName: ad.businessName,
            imageUrl: ad.imageUrl,
            ctaText: ad.ctaText,
            ctaLink: ad.ctaLink,
        };
        await job.save();
    }

    return {
        trustAndSafety: job.trustAndSafety,
        warranty: job.warranty,
        crossSellRecommendations: job.crossSellRecommendations,
        trackingAd: ad?.constructor?.modelName === "Ad" ? job.adSnapshot : ad,
    };
};

export const getRateCard = async (req, res) =>
    res.status(200).json({
        success: true,
        data: {
            standardRateCard: STANDARD_RATE_CARD,
            inspectionFee: PLATFORM_CONFIG.inspectionFee,
            trustSafetyFee: PLATFORM_CONFIG.trustSafetyFee,
            leadFee: PLATFORM_CONFIG.leadFee,
            rocketModeUserFee: PLATFORM_CONFIG.rocketModeUserFee,
            boostFee: PLATFORM_CONFIG.workerBoostFee,
            verifiedProFee: PLATFORM_CONFIG.verifiedProFee,
        },
    });

export const createJob = async (req, res) => {
    try {
        if (!ensureCustomerAccess(req, res)) {
            return;
        }

        const {
            title,
            description,
            category = "General",
            employmentType = "Emergency",
            locationText,
            address = "",
            salaryMin,
            salaryMax,
            payFrequency = "Daily",
            skills = [],
            experienceLevel = "Entry Level",
            coordinates,
            pricingModel = "inspection",
            serviceCode = "",
            rocketMode = false,
            voiceInput,
            redeemCoins = 0,
        } = req.body;

        const trimmedTitle = String(title || "").trim();
        const trimmedDescription = String(description || "").trim();
        const trimmedLocation = String(locationText || req.user.locationText || "").trim();
        const parsedSkills = Array.isArray(skills) ? skills.filter(Boolean) : [];
        const parsedSalaryMin =
            salaryMin !== undefined && salaryMin !== null && salaryMin !== ""
                ? Number(salaryMin)
                : undefined;
        const parsedSalaryMax =
            salaryMax !== undefined && salaryMax !== null && salaryMax !== ""
                ? Number(salaryMax)
                : undefined;

        if (!trimmedTitle || !trimmedDescription || !trimmedLocation) {
            return res.status(400).json({
                success: false,
                message: "Title, description and location are required",
            });
        }

        if (parsedSkills.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one skill",
            });
        }

        if (
            parsedSalaryMin !== undefined &&
            parsedSalaryMax !== undefined &&
            parsedSalaryMin > parsedSalaryMax
        ) {
            return res.status(400).json({
                success: false,
                message: "Maximum salary must be greater than minimum salary",
            });
        }

        if (pricingModel === "standard" && !getRateCardItem(serviceCode)) {
            return res.status(400).json({
                success: false,
                message: "A valid standard service code is required for fixed-price jobs",
            });
        }

        const coinsRedeemed = Math.min(
            Math.max(0, Number(redeemCoins || 0)),
            Number(req.user.coins || 0),
        );

        if (coinsRedeemed > 0) {
            req.user.coins -= coinsRedeemed;
            await req.user.save();
        }

        const geoPoint = normaliseCoordinates(coordinates) || req.user.location;
        const pricing = buildPricingBreakdown({
            pricingModel,
            serviceCode,
            rocketMode,
            coinsRedeemed,
        });
        const nearbyWorkers = await queryNearbyWorkers({
            location: geoPoint,
            category,
            radiusKm:
                req.body.searchRadiusKm || req.user.workerProfile?.serviceRadiusKm || PLATFORM_CONFIG.defaultSearchRadiusKm,
        });

        const job = await Job.create({
            title: trimmedTitle,
            description: trimmedDescription,
            category,
            employmentType,
            serviceCode: pricing.serviceCode,
            serviceLabel: pricing.serviceLabel,
            pricingModel,
            salaryMin: parsedSalaryMin,
            salaryMax: parsedSalaryMax,
            payFrequency,
            wage:
                pricing.standardRate ||
                pricing.inspectionFee ||
                parsedSalaryMax ||
                parsedSalaryMin ||
                0,
            skills: parsedSkills,
            experienceLevel,
            locationText: trimmedLocation,
            address: String(address || "").trim(),
            employer: req.user._id,
            customer: req.user._id,
            location: geoPoint,
            voiceInput: buildVoiceInput(voiceInput, trimmedDescription, "customer"),
            pricing,
            rocketMode: {
                enabled: Boolean(rocketMode),
                workerBonus: PLATFORM_CONFIG.rocketModeWorkerBonus,
                platformShare: PLATFORM_CONFIG.rocketModePlatformShare,
            },
            matching: {
                searchRadiusKm:
                    req.body.searchRadiusKm || PLATFORM_CONFIG.defaultSearchRadiusKm,
                matchedWorkerIds: nearbyWorkers.map((worker) => worker._id),
                lastBroadcastAt: new Date(),
                priorityDispatchTriggeredAt: rocketMode ? new Date() : undefined,
            },
            crossSellRecommendations: getCrossSellRecommendations(category),
            timeline: {
                requestedAt: new Date(),
            },
        });

        return res.status(201).json({
            success: true,
            message: "Job request created and broadcast to nearby workers",
            data: {
                job,
                nearbyWorkerCount: nearbyWorkers.length,
                nearbyWorkers: nearbyWorkers.map((worker) => buildPublicUser(worker)),
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const listMyJobs = async (req, res) => {
    const jobs = await Job.find({
        $or: [
            { customer: req.user._id },
            { selectedWorker: req.user._id },
            { "applications.worker": req.user._id },
        ],
    })
        .populate(jobPopulate)
        .sort({ createdAt: -1 });

    for (const job of jobs) {
        await processJobLifecycle(job);
        job.applications = sortApplications(job.applications);
    }

    return res.status(200).json({
        success: true,
        data: { jobs },
    });
};

export const getJobDetails = async (req, res) => {
    const { jobId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid job id",
        });
    }

    const job = await Job.findById(jobId).populate(jobPopulate);
    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found",
        });
    }

    await processJobLifecycle(job);

    if (!canAccessJob(req.user, job)) {
        return res.status(403).json({
            success: false,
            message: "You are not allowed to access this job",
        });
    }

    job.applications = sortApplications(job.applications);
    const tracking = await buildTrackingPayload(job);

    return res.status(200).json({
        success: true,
        data: {
            job,
            tracking,
        },
    });
};

export const getJobMatches = async (req, res) => {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found",
        });
    }

    if (
        getNormalizedRole(req.user.role) !== "admin" &&
        !isSameEntity(job.customer, req.user._id)
    ) {
        return res.status(403).json({
            success: false,
            message: "Only the customer can view matches",
        });
    }

    const nearbyWorkers = await queryNearbyWorkers({
        location: job.location,
        category: job.category,
        radiusKm: job.matching?.searchRadiusKm || PLATFORM_CONFIG.defaultSearchRadiusKm,
    });

    return res.status(200).json({
        success: true,
        data: {
            nearbyWorkers: nearbyWorkers.map((worker) => buildPublicUser(worker)),
        },
    });
};

export const selectWorker = async (req, res) => {
    try {
        const { workerId } = req.body;
        const job = await Job.findById(req.params.jobId).populate(jobPopulate);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        if (
            getNormalizedRole(req.user.role) !== "customer" &&
            !isSameEntity(job.customer, req.user._id)
        ) {
            return res.status(403).json({
                success: false,
                message: "Only the customer can select a worker",
            });
        }

        if (!["broadcasting", "worker_selected"].includes(job.status)) {
            return res.status(400).json({
                success: false,
                message: "This job is no longer open for worker selection",
            });
        }

        const application = job.applications.find(
            (entry) => isSameEntity(entry.worker, workerId),
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Worker has not shown interest in this job",
            });
        }

        const worker = await User.findById(workerId);
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        await applyWalletDebit({
            user: worker,
            amount: PLATFORM_CONFIG.leadFee,
            type: "lead_fee",
            description: `Lead fee charged for job "${job.title}"`,
            jobId: job._id,
        });

        if (job.rocketMode?.enabled && !job.rocketMode?.bonusCreditedAt) {
            await applyWalletCredit({
                user: worker,
                amount: PLATFORM_CONFIG.rocketModeWorkerBonus,
                type: "rocket_mode_bonus",
                description: `Rocket Mode priority dispatch bonus for "${job.title}"`,
                jobId: job._id,
            });
            job.rocketMode.bonusCreditedAt = new Date();
        }

        job.selectedWorker = worker._id;
        job.assignedLaborer = worker._id;
        job.status = "worker_selected";
        job.timeline.selectedAt = new Date();
        job.leadFee.amount = PLATFORM_CONFIG.leadFee;
        job.leadFee.chargedToWorker = worker._id;
        job.leadFee.chargedAt = new Date();
        job.leadFee.isRefunded = false;

        job.applications = job.applications.map((entry) => ({
            ...entry.toObject(),
            status:
                isSameEntity(entry.worker, worker._id) ? "selected" : "rejected",
        }));

        await job.save();
        await job.populate(jobPopulate);

        return res.status(200).json({
            success: true,
            message: "Worker selected successfully",
            data: {
                job,
                selectedWorker: buildPublicUser(worker),
            },
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const markWorkerArrived = async (req, res) => {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found",
        });
    }

    if (
        getNormalizedRole(req.user.role) !== "admin" &&
        !isSameEntity(job.selectedWorker, req.user._id)
    ) {
        return res.status(403).json({
            success: false,
            message: "Only the selected worker can mark arrival",
        });
    }

    job.status = "in_progress";
    job.timeline.workerArrivedAt = new Date();
    await job.save();

    return res.status(200).json({
        success: true,
        message: "Worker arrival marked",
        data: { job },
    });
};

export const cancelJob = async (req, res) => {
    const { reason = "" } = req.body;
    const job = await Job.findById(req.params.jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found",
        });
    }

    const isCustomer = isSameEntity(job.customer, req.user._id);
    const isWorker = isSameEntity(job.selectedWorker, req.user._id);
    const isAdmin = getNormalizedRole(req.user.role) === "admin";

    if (!isCustomer && !isWorker && !isAdmin) {
        return res.status(403).json({
            success: false,
            message: "You are not allowed to cancel this job",
        });
    }

    job.status = "cancelled";
    job.cancellation.cancelledBy = isAdmin ? "admin" : isCustomer ? "customer" : "worker";
    job.cancellation.reason = String(reason || "").trim();
    job.cancellation.cancelledAt = new Date();

    if (
        (isCustomer || isAdmin) &&
        job.timeline?.workerArrivedAt &&
        job.leadFee?.chargedToWorker &&
        !job.leadFee?.isRefunded
    ) {
        const worker = await User.findById(job.leadFee.chargedToWorker);
        if (worker) {
            await applyWalletCredit({
                user: worker,
                amount: job.leadFee.amount || PLATFORM_CONFIG.leadFee,
                type: "lead_fee_refund",
                description: `Lead fee refunded because the customer cancelled "${job.title}" after arrival`,
                jobId: job._id,
            });
        }

        job.leadFee.isRefunded = true;
        job.leadFee.refundedAt = new Date();
    }

    await job.save();

    return res.status(200).json({
        success: true,
        message: "Job cancelled successfully",
        data: { job },
    });
};

export const markWorkCompleted = async (req, res) => {
    const { finalQuotedAmount, workSummary = "" } = req.body;
    const job = await Job.findById(req.params.jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found",
        });
    }

    if (
        getNormalizedRole(req.user.role) !== "admin" &&
        !isSameEntity(job.selectedWorker, req.user._id)
    ) {
        return res.status(403).json({
            success: false,
            message: "Only the selected worker can mark work completed",
        });
    }

    if (Number(finalQuotedAmount || 0) > 0) {
        refreshPricingForInspection(job, Number(finalQuotedAmount));
    }

    job.status = "completed_pending_confirmation";
    job.timeline.workCompletedAt = new Date();
    job.timeline.disputeWindowEndsAt = addHours(
        job.timeline.workCompletedAt,
        PLATFORM_CONFIG.disputeWindowHours,
    );
    job.crossSellRecommendations = getCrossSellRecommendations(job.category);
    job.finalReview = String(workSummary || job.finalReview || "").trim();

    await job.save();

    return res.status(200).json({
        success: true,
        message: "Work marked completed. The customer now has 2 hours to dispute it.",
        data: {
            job,
            crossSellRecommendations: job.crossSellRecommendations,
        },
    });
};

export const confirmJobCompletion = async (req, res) => {
    const { rating, review = "" } = req.body;
    const job = await Job.findById(req.params.jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found",
        });
    }

    if (
        getNormalizedRole(req.user.role) !== "admin" &&
        !isSameEntity(job.customer, req.user._id)
    ) {
        return res.status(403).json({
            success: false,
            message: "Only the customer can confirm job completion",
        });
    }

    const now = new Date();
    job.status = "completed";
    job.timeline.closedAt = now;
    job.warranty.status = "active";
    job.warranty.startsAt = now;
    job.warranty.endsAt = addDays(now, PLATFORM_CONFIG.warrantyDays);
    job.finalReview = String(review || "").trim();

    if (rating !== undefined) {
        const numericRating = Math.max(1, Math.min(5, Number(rating)));
        job.finalRating = numericRating;

        const worker = await User.findById(job.selectedWorker);
        if (worker) {
            const currentTotal = Number(worker.rating || 0) * Number(worker.ratingCount || 0);
            worker.ratingCount = Number(worker.ratingCount || 0) + 1;
            worker.rating = Number(
                ((currentTotal + numericRating) / worker.ratingCount).toFixed(2),
            );
            worker.workerProfile.totalJobsCompleted =
                Number(worker.workerProfile?.totalJobsCompleted || 0) + 1;
            worker.workerProfile.recentReviews = [
                {
                    jobId: job._id,
                    reviewerId: req.user._id,
                    reviewerName: req.user.Name || "",
                    rating: numericRating,
                    review: String(review || "").trim(),
                    createdAt: now,
                },
                ...(worker.workerProfile?.recentReviews || []),
            ].slice(0, 12);
            await worker.save();
        }

        if (
            numericRating === 5 &&
            job.timeline?.disputeWindowEndsAt &&
            now <= job.timeline.disputeWindowEndsAt
        ) {
            const customer = await User.findById(job.customer);
            if (customer) {
                customer.coins =
                    Number(customer.coins || 0) +
                    PLATFORM_CONFIG.manualFiveStarCoinReward;
                await customer.save();
                job.coinsAwarded = PLATFORM_CONFIG.manualFiveStarCoinReward;
            }
        }
    }

    await job.save();

    return res.status(200).json({
        success: true,
        message: "Job confirmed and warranty activated",
        data: { job },
    });
};

export const raiseDispute = async (req, res) => {
    const { issue, evidenceUrls = [] } = req.body;
    const job = await Job.findById(req.params.jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found",
        });
    }

    if (
        getNormalizedRole(req.user.role) !== "admin" &&
        !isSameEntity(job.customer, req.user._id)
    ) {
        return res.status(403).json({
            success: false,
            message: "Only the customer can raise a dispute",
        });
    }

    if (!issue) {
        return res.status(400).json({
            success: false,
            message: "Please describe the issue",
        });
    }

    const dispute = await Dispute.create({
        job: job._id,
        raisedBy: req.user._id,
        againstWorker: job.selectedWorker,
        issue: String(issue).trim(),
        evidenceUrls,
    });

    job.status = "disputed";
    job.disputeState.isRaised = true;
    job.disputeState.notes = String(issue).trim();
    job.disputeState.raisedAt = new Date();
    await job.save();

    return res.status(201).json({
        success: true,
        message: "Dispute raised successfully",
        data: { dispute, job },
    });
};

export const claimWarranty = async (req, res) => {
    const { notes = "" } = req.body;
    const job = await Job.findById(req.params.jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found",
        });
    }

    if (
        getNormalizedRole(req.user.role) !== "admin" &&
        !isSameEntity(job.customer, req.user._id)
    ) {
        return res.status(403).json({
            success: false,
            message: "Only the customer can claim the warranty",
        });
    }

    if (
        job.warranty?.status !== "active" ||
        !job.warranty?.endsAt ||
        new Date() > job.warranty.endsAt
    ) {
        return res.status(400).json({
            success: false,
            message: "The 7-day Karigar warranty is no longer active",
        });
    }

    job.status = "warranty_claimed";
    job.warranty.status = "claimed";
    job.warranty.claimNotes = String(notes).trim();
    job.warranty.claimedAt = new Date();

    const worker = await User.findById(job.selectedWorker);
    if (worker) {
        worker.activeCases = Number(worker.activeCases || 0) + 1;
        await worker.save();
    }

    await job.save();

    return res.status(200).json({
        success: true,
        message: "Warranty claim registered. The original worker must return to fix it.",
        data: { job },
    });
};

export const getTrackingDetails = async (req, res) => {
    const job = await Job.findById(req.params.jobId).populate(jobPopulate);
    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found",
        });
    }

    await processJobLifecycle(job);

    if (!canAccessJob(req.user, job)) {
        return res.status(403).json({
            success: false,
            message: "You are not allowed to access this tracking view",
        });
    }

    const tracking = await buildTrackingPayload(job);

    return res.status(200).json({
        success: true,
        data: {
            job,
            tracking,
        },
    });
};
