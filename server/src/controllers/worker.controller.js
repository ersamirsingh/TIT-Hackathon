import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import {
    PLATFORM_CONFIG,
    buildVoiceInput,
    normaliseCoordinates,
} from "../utils/platform.utils.js";
import { applyWalletDebit } from "../utils/wallet.utils.js";
import { buildPublicUser, hasMode } from "../utils/user.utils.js";

const ensureWorker = (req, res) => {
    if (!hasMode(req.user, "worker")) {
        res.status(403).json({
            success: false,
            message: "Worker mode is not available for this account",
        });
        return false;
    }

    return true;
};

export const updateAvailability = async (req, res) => {
    if (!ensureWorker(req, res)) {
        return;
    }

    const { isAvailable, serviceRadiusKm, coordinates, locationText = "" } = req.body;
    const geoPoint = normaliseCoordinates(coordinates);

    if (geoPoint) {
        req.user.location = geoPoint;
        req.user.lastKnownLocationAt = new Date();
    }

    if (serviceRadiusKm !== undefined) {
        req.user.workerProfile.serviceRadiusKm = Math.max(1, Number(serviceRadiusKm));
    }

    if (isAvailable !== undefined) {
        req.user.workerProfile.isAvailable = Boolean(isAvailable);
    }

    if (locationText) {
        req.user.locationText = String(locationText).trim();
    }

    req.user.workerProfile.lastAvailabilityUpdateAt = new Date();
    await req.user.save();

    return res.status(200).json({
        success: true,
        message: "Worker availability updated",
        user: buildPublicUser(req.user),
    });
};

export const updateWorkerProfile = async (req, res) => {
    if (!ensureWorker(req, res)) {
        return;
    }

    const {
        headline,
        about,
        categories,
        languages,
        yearsExperience,
        serviceRadiusKm,
    } = req.body;

    if (headline !== undefined) {
        req.user.workerProfile.headline = String(headline).trim();
    }

    if (about !== undefined) {
        req.user.workerProfile.about = String(about).trim();
    }

    if (Array.isArray(categories)) {
        req.user.workerProfile.categories = categories.filter(Boolean);
    }

    if (Array.isArray(languages) && languages.length) {
        req.user.workerProfile.languages = languages;
    }

    if (yearsExperience !== undefined) {
        req.user.workerProfile.yearsExperience = Math.max(0, Number(yearsExperience));
    }

    if (serviceRadiusKm !== undefined) {
        req.user.workerProfile.serviceRadiusKm = Math.max(1, Number(serviceRadiusKm));
    }

    await req.user.save();

    return res.status(200).json({
        success: true,
        message: "Worker profile updated",
        user: buildPublicUser(req.user),
    });
};

export const getWorkerFeed = async (req, res) => {
    if (!ensureWorker(req, res)) {
        return;
    }

    if (!req.user.location?.coordinates?.length) {
        return res.status(400).json({
            success: false,
            message: "Please update your GPS location first",
        });
    }

    const [lng, lat] = req.user.location.coordinates;
    const radiusKm =
        Number(req.query.radiusKm || req.user.workerProfile?.serviceRadiusKm || 5);
    const now = Date.now();
    const hasEarlyAccess =
        req.user.subscription?.status === "active" &&
        req.user.subscription?.expiresAt &&
        new Date(req.user.subscription.expiresAt) > new Date();

        
    const jobs = await Job.find({
        status: "broadcasting",
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
                $maxDistance: radiusKm * 1000,
            },
        },
    })
        .populate("customer", "Name verified rating ratingCount")
        .sort({ "rocketMode.enabled": -1, createdAt: -1 })
        .limit(50);
    const filteredJobs = jobs.filter((job) => {
        if (
            !hasEarlyAccess &&
            now - new Date(job.createdAt).getTime() <
                PLATFORM_CONFIG.verifiedProEarlyAccessSeconds * 1000
        ) {
            return false;
        }

        return !job.applications.some(
            (application) => String(application.worker) === String(req.user._id),
        );
    });

    return res.status(200).json({
        success: true,
        data: {
            earlyAccessSeconds: hasEarlyAccess
                ? 0
                : PLATFORM_CONFIG.verifiedProEarlyAccessSeconds,
            jobs: filteredJobs,
        },
    });
};

export const expressInterest = async (req, res) => {
    try {
        if (!ensureWorker(req, res)) {
            return;
        }

        if (req.user.wallet?.isBlocked) {
            return res.status(403).json({
                success: false,
                message:
                    "Your wallet is blocked at the credit limit. Recharge via UPI to accept more jobs.",
            });
        }

        const {
            message = "",
            quoteAmount,
            quoteText = "",
            voiceInput,
            boostProfile = false,
        } = req.body;

        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        if (job.status !== "broadcasting") {
            return res.status(400).json({
                success: false,
                message: "This job is no longer accepting worker interest",
            });
        }

        if (
            job.applications.some(
                (application) => String(application.worker) === String(req.user._id),
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "You have already shown interest in this job",
            });
        }

        if (boostProfile) {
            await applyWalletDebit({
                user: req.user,
                amount: PLATFORM_CONFIG.workerBoostFee,
                type: "boost_fee",
                description: `Profile boost used for job "${job.title}"`,
                jobId: job._id,
            });
        }

        job.applicants.push(req.user._id);
        job.applications.push({
            worker: req.user._id,
            fullName: req.user.Name,
            contactNumber: req.user.contact,
            experience: `${req.user.workerProfile?.yearsExperience || 0} years`,
            message: String(message).trim(),
            quoteAmount:
                quoteAmount !== undefined && quoteAmount !== null && quoteAmount !== ""
                    ? Number(quoteAmount)
                    : undefined,
            quoteText: String(quoteText || "").trim(),
            voiceInput: buildVoiceInput(voiceInput, quoteText, "worker"),
            isBoosted: Boolean(boostProfile),
            boostFeeCharged: boostProfile ? PLATFORM_CONFIG.workerBoostFee : 0,
            boostChargedAt: boostProfile ? new Date() : undefined,
        });

        await job.save();

        return res.status(201).json({
            success: true,
            message: boostProfile
                ? "Interest submitted and your profile was boosted to the top"
                : "Interest submitted successfully",
            data: { jobId: job._id },
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const purchaseVerifiedPro = async (req, res) => {
    try {
        if (!ensureWorker(req, res)) {
            return;
        }

        await applyWalletDebit({
            user: req.user,
            amount: PLATFORM_CONFIG.verifiedProFee,
            type: "verified_pro_subscription",
            description: "Verified Pro subscription purchase",
        });

        const startedAt = new Date();
        const expiresAt = new Date(
            startedAt.getTime() +
                PLATFORM_CONFIG.verifiedProDurationDays * 24 * 60 * 60 * 1000,
        );

        req.user.subscription = {
            plan: "verified-pro",
            status: "active",
            startedAt,
            expiresAt,
            earlyAccessSeconds: PLATFORM_CONFIG.verifiedProEarlyAccessSeconds,
            amountPaid: PLATFORM_CONFIG.verifiedProFee,
        };
        req.user.workerProfile.isVerifiedPro = true;
        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "Verified Pro activated",
            user: buildPublicUser(req.user),
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
