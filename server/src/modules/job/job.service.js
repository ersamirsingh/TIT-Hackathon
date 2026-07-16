import mongoose from "mongoose";
import Ad from "../../models/ad.model.js";
import Dispute from "../../models/dispute.model.js";
import Job from "../../models/job.model.js";
import User from "../../models/user.model.js";
import {
    PLATFORM_CONFIG,
    STANDARD_RATE_CARD,
    buildPricingBreakdown,
    buildVoiceInput,
    getCrossSellRecommendations,
    getRateCardItem,
    normaliseCoordinates,
} from "../../utils/platform.utils.js";
import { findTrackingAd, processJobLifecycle } from "../../utils/job.utils.js";
import { applyWalletCredit, applyWalletDebit, handleSecurityDepositOnCancellation } from "../../utils/wallet.utils.js";
import { getNormalizedRole, hasMode } from "../../utils/user.utils.js";

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const getComparableId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value._id) return String(value._id);
    return String(value);
};

const isSameEntity = (left, right) => getComparableId(left) === getComparableId(right);

export const jobPopulate = [
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

export class JobService {
    ensureCustomerAccess(user) {
        if (!hasMode(user, "customer")) {
            throw new Error("Customer access is required for this action");
        }
        if (user.activeMode !== "customer" && getNormalizedRole(user.role) !== "admin") {
            throw new Error("Switch to Find a Worker mode to continue");
        }
    }

    ensureWorkerAccess(user) {
        if (!hasMode(user, "worker")) {
            throw new Error("Worker access is required for this action");
        }
    }

    canAccessJob(user, job) {
        if (!user || !job) return false;
        if (getNormalizedRole(user.role) === "admin" || getNormalizedRole(user.role) === "system_admin") return true;
        if (isSameEntity(job.customer, user._id)) return true;
        if (isSameEntity(job.selectedWorker, user._id)) return true;
        return job.applications?.some((application) => isSameEntity(application.worker, user._id));
    }

    async queryNearbyWorkers({ location, category, radiusKm }) {
        if (!location?.coordinates?.length) return [];
        const [lng, lat] = location.coordinates;
        const radiusKmCapped = Math.min(Number(radiusKm || PLATFORM_CONFIG.defaultSearchRadiusKm), 10);
        const maxDistance = radiusKmCapped * 1000;

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
            .select("Name contact rating ratingCount verified workerProfile subscription locationText")
            .limit(25);
    }

    async buildTrackingPayload(job) {
        const ad = (await findTrackingAd(job.location, job.category)) || (job.adSnapshot?.title ? job.adSnapshot : null);

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
    }

    async createJob(user, data) {
        this.ensureCustomerAccess(user);

        const {
            title,
            description,
            category = "General",
            pricingModel = "inspection",
            serviceCode = "",
            coinsRedeemed = 0,
            rocketMode = false,
            location,
            locationText = "",
            voiceInput,
        } = data;

        if (!title || !description) {
            throw new Error("Title and description are required");
        }

        const geoPoint = normaliseCoordinates(location);
        if (!geoPoint && !String(locationText).trim()) {
            throw new Error("A job requires a valid location to broadcast to nearby workers");
        }

        const voiceSnapshot = buildVoiceInput(voiceInput);
        const code = pricingModel === "standard" ? String(serviceCode).trim() : "";
        const rateCardItem = getRateCardItem(code, category);

        const pricing = buildPricingBreakdown({
            pricingModel,
            serviceCode: code,
            rocketMode,
            coinsRedeemed: Number(coinsRedeemed),
        });

        const activeWorkers = await this.queryNearbyWorkers({
            location: geoPoint || user.location,
            category,
            radiusKm: PLATFORM_CONFIG.defaultSearchRadiusKm,
        });

        const matchedWorkerIds = activeWorkers.map((w) => w._id);

        const job = await Job.create({
            title: String(title).trim(),
            description: String(description).trim(),
            category,
            pricingModel,
            serviceCode: pricing.serviceCode,
            serviceLabel: pricing.serviceLabel,
            pricing,
            rocketMode: {
                enabled: pricing.rocketModeFee > 0,
                workerBonus: pricing.rocketModeFee > 0 ? 30 : 0,
                platformShare: pricing.rocketModeFee > 0 ? 20 : 0,
            },
            voiceInput: voiceSnapshot || undefined,
            location: geoPoint || user.location || undefined,
            locationText: String(locationText || user.locationText || "").trim(),
            customer: user._id,
            employer: user._id,
            status: "broadcasting",
            matching: {
                searchRadiusKm: PLATFORM_CONFIG.defaultSearchRadiusKm,
                matchedWorkerIds,
                lastBroadcastAt: new Date(),
            },
            timeline: {
                requestedAt: new Date(),
            },
        });

        return job;
    }

    async listMyJobs(user) {
        const query =
            getNormalizedRole(user.role) === "admin" || getNormalizedRole(user.role) === "system_admin"
                ? {}
                : {
                      $or: [
                          { customer: user._id },
                          { selectedWorker: user._id },
                          { "applications.worker": user._id },
                      ],
                  };

        const jobs = await Job.find(query).populate(jobPopulate).sort({ createdAt: -1 });
        return jobs;
    }

    async getJobDetails(user, jobId) {
        const job = await Job.findById(jobId).populate(jobPopulate);
        if (!job) throw new Error("Job not found");
        if (!this.canAccessJob(user, job)) throw new Error("Access denied");
        return job;
    }

    async getJobMatches(user, jobId) {
        this.ensureCustomerAccess(user);
        const job = await Job.findById(jobId);
        if (!job) throw new Error("Job not found");
        if (!isSameEntity(job.customer, user._id)) throw new Error("Access denied");

        const matchedWorkers = await this.queryNearbyWorkers({
            location: job.location,
            category: job.category,
            radiusKm: job.matching?.searchRadiusKm,
        });

        return matchedWorkers;
    }

    async selectWorker(user, jobId, workerId) {
        this.ensureCustomerAccess(user);
        const job = await Job.findById(jobId).populate(jobPopulate);
        if (!job) throw new Error("Job not found");
        if (!isSameEntity(job.customer, user._id)) throw new Error("Access denied");
        if (job.status !== "broadcasting") throw new Error("Job is not available for worker selection");

        const targetWorker = await User.findById(workerId);
        if (!targetWorker) throw new Error("Selected worker not found");

        const securityDeposit = PLATFORM_CONFIG.securityDeposit || 50;
        if (targetWorker.wallet.balance < -200 + securityDeposit) {
            throw new Error("Worker wallet balance is below credit limit to accept this job");
        }

        await applyWalletDebit(targetWorker, securityDeposit, "Escrow Security Deposit for Job Selection", job._id);

        job.selectedWorker = targetWorker._id;
        job.status = "worker_selected";
        job.timeline.selectedAt = new Date();
        await job.save();

        const populated = await Job.findById(job._id).populate(jobPopulate);
        return populated;
    }

    async markWorkerArrived(user, jobId) {
        this.ensureWorkerAccess(user);
        const job = await Job.findById(jobId).populate(jobPopulate);
        if (!job) throw new Error("Job not found");
        if (!isSameEntity(job.selectedWorker, user._id)) throw new Error("You are not the assigned worker");
        if (job.status !== "worker_selected") throw new Error("Job is not in worker_selected state");

        job.status = "in_progress";
        job.timeline.workerArrivedAt = new Date();
        await job.save();
        return job;
    }

    async cancelJob(user, jobId, reason) {
        const job = await Job.findById(jobId).populate(jobPopulate);
        if (!job) throw new Error("Job not found");

        const isCustomer = isSameEntity(job.customer, user._id);
        const isWorker = isSameEntity(job.selectedWorker, user._id);
        const isAdmin = getNormalizedRole(user.role) === "admin" || getNormalizedRole(user.role) === "system_admin";

        if (!isCustomer && !isWorker && !isAdmin) throw new Error("Access denied");

        const cancelSource = isAdmin ? "admin" : isCustomer ? "customer" : "worker";

        await handleSecurityDepositOnCancellation(job, cancelSource, reason);

        job.status = "cancelled";
        job.cancellation = {
            cancelledBy: cancelSource,
            reason: String(reason || "").trim(),
            cancelledAt: new Date(),
        };

        await job.save();
        return job;
    }

    async markWorkCompleted(user, jobId) {
        this.ensureWorkerAccess(user);
        const job = await Job.findById(jobId).populate(jobPopulate);
        if (!job) throw new Error("Job not found");
        if (!isSameEntity(job.selectedWorker, user._id)) throw new Error("You are not the assigned worker");
        if (job.status !== "in_progress") throw new Error("Job must be in progress to complete");

        job.status = "completed_pending_confirmation";
        job.timeline.workCompletedAt = new Date();
        await job.save();
        return job;
    }

    async confirmJobCompletion(user, jobId, rating, review) {
        this.ensureCustomerAccess(user);
        const job = await Job.findById(jobId).populate(jobPopulate);
        if (!job) throw new Error("Job not found");
        if (!isSameEntity(job.customer, user._id)) throw new Error("Access denied");

        const allowed = ["in_progress", "completed_pending_confirmation"];
        if (!allowed.includes(job.status)) {
            throw new Error(`Job cannot be completed from ${job.status} stage`);
        }

        const worker = await User.findById(job.selectedWorker._id);
        if (!worker) throw new Error("Assigned worker not found");

        const securityDeposit = PLATFORM_CONFIG.securityDeposit || 50;
        await applyWalletCredit(worker, securityDeposit, "Escrow Security Deposit Refund on Completion", job._id);

        if (job.pricing?.workerPayoutEstimate > 0) {
            await applyWalletCredit(worker, job.pricing.workerPayoutEstimate, "Payout for job completion", job._id);
        }

        if (rating !== undefined) {
            const parsedRating = Math.max(1, Math.min(5, Number(rating)));
            job.finalRating = parsedRating;
            job.finalReview = String(review || "").trim();

            const currentCount = worker.ratingCount || 0;
            const currentRating = worker.rating || 5;
            worker.ratingCount = currentCount + 1;
            worker.rating = (currentRating * currentCount + parsedRating) / (currentCount + 1);
            await worker.save();
        }

        job.status = "completed";
        job.timeline.closedAt = new Date();

        if (job.pricing.pricingModel === "standard") {
            job.warranty = {
                status: "active",
                startsAt: new Date(),
                endsAt: addDays(new Date(), PLATFORM_CONFIG.warrantyValidityDays || 30),
                claimNotes: "",
            };
            job.crossSellRecommendations = getCrossSellRecommendations(job.category);
        }

        await job.save();
        return job;
    }

    async raiseDispute(user, jobId, notes) {
        const job = await Job.findById(jobId).populate(jobPopulate);
        if (!job) throw new Error("Job not found");

        const isCustomer = isSameEntity(job.customer, user._id);
        const isWorker = isSameEntity(job.selectedWorker, user._id);
        if (!isCustomer && !isWorker) throw new Error("Access denied");

        if (job.status !== "completed_pending_confirmation" && job.status !== "in_progress") {
            throw new Error("Disputes can only be raised for active in-progress or unconfirmed jobs");
        }

        job.status = "disputed";
        job.disputeState = {
            isRaised: true,
            notes: String(notes || "").trim(),
            raisedAt: new Date(),
        };
        await job.save();

        await Dispute.create({
            job: job._id,
            raisedBy: user._id,
            reason: String(notes || "").trim(),
            status: "pending",
        });

        return job;
    }

    async claimWarranty(user, jobId, claimNotes) {
        this.ensureCustomerAccess(user);
        const job = await Job.findById(jobId).populate(jobPopulate);
        if (!job) throw new Error("Job not found");
        if (!isSameEntity(job.customer, user._id)) throw new Error("Access denied");

        if (job.status !== "completed") throw new Error("Job is not completed yet");
        if (job.warranty?.status !== "active") throw new Error("No active warranty on this job");

        if (new Date() > job.warranty.endsAt) {
            job.warranty.status = "expired";
            await job.save();
            throw new Error("Warranty coverage period has expired");
        }

        job.status = "warranty_claimed";
        job.warranty.status = "claimed";
        job.warranty.claimNotes = String(claimNotes || "").trim();
        job.warranty.claimedAt = new Date();
        await job.save();

        await Dispute.create({
            job: job._id,
            raisedBy: user._id,
            reason: `Warranty claim: ${String(claimNotes || "").trim()}`,
            status: "pending",
        });

        return job;
    }

    async getTrackingDetails(user, jobId) {
        const job = await Job.findById(jobId);
        if (!job) throw new Error("Job not found");
        if (!this.canAccessJob(user, job)) throw new Error("Access denied");

        const payload = await this.buildTrackingPayload(job);
        return payload;
    }
}
