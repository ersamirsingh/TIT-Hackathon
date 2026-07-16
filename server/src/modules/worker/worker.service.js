import Job from "../../models/job.model.js";
import User from "../../models/user.model.js";
import {
    PLATFORM_CONFIG,
    buildVoiceInput,
    normaliseCoordinates,
} from "../../utils/platform.utils.js";
import { applyWalletDebit } from "../../utils/wallet.utils.js";
import { hasMode } from "../../utils/user.utils.js";

export class WorkerService {
    ensureWorker(user) {
        if (!hasMode(user, "worker")) {
            throw new Error("Worker mode is not available for this account");
        }
    }

    calculateDistance(loc1, loc2) {
        if (!loc1?.coordinates?.length || !loc2?.coordinates?.length) {
            return null;
        }
        const [lon1, lat1] = loc1.coordinates;
        const [lon2, lat2] = loc2.coordinates;
        
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c; // Distance in km
        return d;
    }

    async updateAvailability(user, data) {
        this.ensureWorker(user);

        const { isAvailable, serviceRadiusKm, coordinates, locationText = "" } = data;
        const geoPoint = normaliseCoordinates(coordinates);

        if (geoPoint) {
            user.location = geoPoint;
            user.lastKnownLocationAt = new Date();
        }

        if (serviceRadiusKm !== undefined) {
            user.workerProfile.serviceRadiusKm = Math.max(1, Number(serviceRadiusKm));
        }

        if (isAvailable !== undefined) {
            user.workerProfile.isAvailable = Boolean(isAvailable);
        }

        if (locationText) {
            user.locationText = String(locationText).trim();
        }

        user.workerProfile.lastAvailabilityUpdateAt = new Date();
        await user.save();
        return user;
    }

    async updateWorkerProfile(user, data) {
        this.ensureWorker(user);

        const {
            headline,
            about,
            categories,
            languages,
            yearsExperience,
            serviceRadiusKm,
        } = data;

        if (headline !== undefined) {
            user.workerProfile.headline = String(headline).trim();
        }

        if (about !== undefined) {
            user.workerProfile.about = String(about).trim();
        }

        if (Array.isArray(categories)) {
            user.workerProfile.categories = categories.filter(Boolean);
        }

        if (Array.isArray(languages) && languages.length) {
            user.workerProfile.languages = languages;
        }

        if (yearsExperience !== undefined) {
            user.workerProfile.yearsExperience = Math.max(0, Number(yearsExperience));
        }

        if (serviceRadiusKm !== undefined) {
            user.workerProfile.serviceRadiusKm = Math.max(1, Number(serviceRadiusKm));
        }

        await user.save();
        return user;
    }

    async getWorkerFeed(user, radiusQuery) {
        this.ensureWorker(user);

        if (!user.location?.coordinates?.length) {
            throw new Error("Please update your GPS location first");
        }

        const [lng, lat] = user.location.coordinates;
        const radiusKm = Math.min(
            Number(radiusQuery || user.workerProfile?.serviceRadiusKm || 5),
            10
        );
        const now = Date.now();
        const hasEarlyAccess =
            user.subscription?.status === "active" &&
            user.subscription?.expiresAt &&
            new Date(user.subscription.expiresAt) > new Date();

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
                (application) => String(application.worker) === String(user._id),
            );
        });

        const jobsWithDistance = filteredJobs.map((job) => {
            const jobObj = job.toObject();
            jobObj.distanceKm = this.calculateDistance(user.location, job.location);
            return jobObj;
        });

        return {
            earlyAccessSeconds: hasEarlyAccess ? 0 : PLATFORM_CONFIG.verifiedProEarlyAccessSeconds,
            jobs: jobsWithDistance,
        };
    }

    async expressInterest(user, jobId, data) {
        this.ensureWorker(user);

        if (user.wallet?.isBlocked) {
            throw new Error("Your wallet is blocked at the credit limit. Recharge via UPI to accept more jobs.");
        }

        const {
            message = "",
            quoteAmount,
            quoteText = "",
            voiceInput,
            boostProfile = false,
        } = data;

        const job = await Job.findById(jobId);
        if (!job) {
            throw new Error("Job not found");
        }

        if (job.status !== "broadcasting") {
            throw new Error("This job is no longer accepting worker interest");
        }

        if (job.applications.some((application) => String(application.worker) === String(user._id))) {
            throw new Error("You have already shown interest in this job");
        }

        if (boostProfile) {
            await applyWalletDebit({
                user,
                amount: PLATFORM_CONFIG.workerBoostFee,
                type: "boost_fee",
                description: `Profile boost used for job "${job.title}"`,
                jobId: job._id,
            });
        }

        job.applicants.push(user._id);
        job.applications.push({
            worker: user._id,
            fullName: user.Name,
            contactNumber: user.contact,
            experience: `${user.workerProfile?.yearsExperience || 0} years`,
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
        return job;
    }

    async purchaseVerifiedPro(user) {
        this.ensureWorker(user);

        await applyWalletDebit({
            user,
            amount: PLATFORM_CONFIG.verifiedProFee,
            type: "verified_pro_subscription",
            description: "Verified Pro subscription purchase",
        });

        const startedAt = new Date();
        const expiresAt = new Date(startedAt.getTime() + PLATFORM_CONFIG.verifiedProDurationDays * 24 * 60 * 60 * 1000);

        user.subscription = {
            plan: "verified-pro",
            status: "active",
            startedAt,
            expiresAt,
            earlyAccessSeconds: PLATFORM_CONFIG.verifiedProEarlyAccessSeconds,
            amountPaid: PLATFORM_CONFIG.verifiedProFee,
        };
        user.workerProfile.isVerifiedPro = true;
        await user.save();
        return user;
    }
}
