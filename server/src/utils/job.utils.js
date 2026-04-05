import Ad from "../models/ad.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import { applyWalletCredit } from "./wallet.utils.js";
import { PLATFORM_CONFIG } from "./platform.utils.js";

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export const activateWarranty = (job, closedAt = new Date()) => {
    job.timeline.closedAt = closedAt;
    job.warranty.status = "active";
    job.warranty.startsAt = closedAt;
    job.warranty.endsAt = addDays(closedAt, PLATFORM_CONFIG.warrantyDays);
};

export const processJobLifecycle = async (job) => {
    let changed = false;
    const now = new Date();

    if (
        job.status === "completed_pending_confirmation" &&
        job.timeline?.disputeWindowEndsAt &&
        now >= job.timeline.disputeWindowEndsAt
    ) {
        job.status = "completed";
        activateWarranty(job, job.timeline.disputeWindowEndsAt);
        changed = true;
    }

    const abandonmentReference =
        job.timeline?.workerArrivedAt || job.timeline?.selectedAt;

    if (
        ["worker_selected", "in_progress"].includes(job.status) &&
        abandonmentReference &&
        now >= addHours(new Date(abandonmentReference), PLATFORM_CONFIG.abandonedRefundHours)
    ) {
        job.status = "cancelled";
        job.cancellation.cancelledBy = "system";
        job.cancellation.cancelledAt = now;
        job.cancellation.reason =
            "Job abandoned before completion. Lead fee refunded automatically.";

        if (
            job.leadFee?.chargedToWorker &&
            !job.leadFee?.isRefunded
        ) {
            const worker = await User.findById(job.leadFee.chargedToWorker);
            if (worker) {
                await applyWalletCredit({
                    user: worker,
                    amount: job.leadFee.amount || PLATFORM_CONFIG.leadFee,
                    type: "lead_fee_refund",
                    description: "Auto-refund because the job was abandoned.",
                    jobId: job._id,
                });
            }

            job.leadFee.isRefunded = true;
            job.leadFee.refundedAt = now;
            job.timeline.abandonedRefundAt = now;
        }

        changed = true;
    }

    if (
        job.warranty?.status === "active" &&
        job.warranty?.endsAt &&
        now >= job.warranty.endsAt
    ) {
        job.warranty.status = "expired";
        changed = true;
    }

    if (changed) {
        await job.save();
    }

    return job;
};

export const processPendingJobsLifecycle = async () => {
    const jobs = await Job.find({
        status: {
            $in: [
                "worker_selected",
                "in_progress",
                "completed_pending_confirmation",
                "completed",
            ],
        },
    });

    let processed = 0;
    for (const job of jobs) {
        await processJobLifecycle(job);
        processed += 1;
    }

    return processed;
};

export const findTrackingAd = async (location, category) => {
    if (!location?.coordinates?.length) {
        return null;
    }

    const [lng, lat] = location.coordinates;
    const now = new Date();

    const ads = await Ad.find({
        isActive: true,
        $and: [
            {
                $or: [{ activeFrom: { $exists: false } }, { activeFrom: { $lte: now } }],
            },
            {
                $or: [
                    { activeUntil: { $exists: false } },
                    { activeUntil: { $gte: now } },
                ],
            },
            {
                $or: [{ category: category || "General" }, { category: "General" }],
            },
        ],
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
                $maxDistance: 25_000,
            },
        },
    })
        .sort({ priority: -1, createdAt: -1 })
        .limit(1);

    return ads[0] || null;
};
