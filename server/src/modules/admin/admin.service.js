import Ad from "../../models/ad.model.js";
import Dispute from "../../models/dispute.model.js";
import Job from "../../models/job.model.js";
import User from "../../models/user.model.js";
import Query from "../../models/query.model.js";
import { normaliseCoordinates } from "../../utils/platform.utils.js";
import { processPendingJobsLifecycle } from "../../utils/job.utils.js";
import bcrypt from "bcrypt";
import { applyWalletCredit } from "../../utils/wallet.utils.js";

export class AdminService {
    async getOverview() {
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

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dailyRevenue = await Job.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: { $ifNull: ["$pricing.platformRevenue", 0] } }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        const revenueTimeline = dailyRevenue.map(item => ({
            date: item._id,
            revenue: item.revenue
        }));

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [stuckJobsCount, disputedJobsCount] = await Promise.all([
            Job.countDocuments({
                status: { $in: ["worker_selected", "in_progress"] },
                $or: [
                    { "timeline.requestedAt": { $lt: twentyFourHoursAgo } },
                    { createdAt: { $lt: twentyFourHoursAgo } }
                ]
            }),
            Job.countDocuments({
                status: "disputed"
            })
        ]);
        const ambiguousJobs = stuckJobsCount + disputedJobsCount;

        const stuckJobs = await Job.find({
            status: { $in: ["worker_selected", "in_progress"] },
            $or: [
                { "timeline.requestedAt": { $lt: twentyFourHoursAgo } },
                { createdAt: { $lt: twentyFourHoursAgo } }
            ]
        }).populate("customer selectedWorker").limit(10);

        const suspiciousWorkers = await User.find({
            "wallet.balance": { $lt: -200 }
        }).limit(10);

        const blockedUsers = await User.find({
            "wallet.isBlocked": true
        }).limit(10);

        return {
            totalUsers,
            activeJobs,
            activeDisputes,
            availableWorkers,
            blockedWallets,
            activeSubscriptions,
            activeAds,
            platformRevenue: revenueData[0]?.platformRevenue || 0,
            revenueTimeline,
            ambiguousJobs,
            stuckJobs,
            suspiciousWorkers,
            blockedUsers,
        };
    }

    async listUsers(query = {}) {
        const users = await User.find(query).sort({ createdAt: -1 });
        return users;
    }

    async listJobs(query = {}) {
        const jobs = await Job.find(query).populate("customer selectedWorker").sort({ createdAt: -1 });
        return jobs;
    }

    async listDisputes(query = {}) {
        const disputes = await Dispute.find(query).populate("job raisedBy mediator").sort({ createdAt: -1 });
        return disputes;
    }

    async resolveDispute(disputeId, action, notes) {
        const dispute = await Dispute.findById(disputeId);
        if (!dispute) throw new Error("Dispute not found");

        dispute.status = "resolved";
        dispute.resolvedAt = new Date();
        dispute.resolutionNotes = notes;
        await dispute.save();

        const job = await Job.findById(dispute.job);
        if (job) {
            job.status = action === "refund" ? "cancelled" : "completed";
            await job.save();

            // Resolve the 12 + 12 = 24 rupees security deposits based on admin action
            const employerId = job.customer._id || job.customer;
            const workerId = job.selectedWorker?._id || job.selectedWorker;

            if (action === "refund") {
                // Employer gets all (24)
                const employer = await User.findById(employerId);
                if (employer) {
                    await applyWalletCredit({
                        user: employer,
                        amount: 24,
                        type: "security_deposit_refund",
                        description: "Dispute Resolved: 100% Refunded to Employer",
                        jobId: job._id,
                    });
                    await employer.save();
                }
            } else if (action === "release") {
                // Worker gets all (24)
                if (workerId) {
                    const worker = await User.findById(workerId);
                    if (worker) {
                        await applyWalletCredit({
                            user: worker,
                            amount: 24,
                            type: "security_deposit_refund",
                            description: "Dispute Resolved: 100% Released to Worker",
                            jobId: job._id,
                        });
                        await worker.save();
                    }
                }
            } else if (action === "split") {
                // Refund 12 to both (standard split/no fault)
                const employer = await User.findById(employerId);
                if (employer) {
                    await applyWalletCredit({
                        user: employer,
                        amount: 12,
                        type: "security_deposit_refund",
                        description: "Dispute Resolved: Split Refund to Employer (50%)",
                        jobId: job._id,
                    });
                    await employer.save();
                }
                if (workerId) {
                    const worker = await User.findById(workerId);
                    if (worker) {
                        await applyWalletCredit({
                            user: worker,
                            amount: 12,
                            type: "security_deposit_refund",
                            description: "Dispute Resolved: Split Refund to Worker (50%)",
                            jobId: job._id,
                        });
                        await worker.save();
                    }
                }
            }
        }

        return dispute;
    }

    async blockUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        user.isBlocked = true;
        await user.save();
        return user;
    }

    async unblockUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        user.isBlocked = false;
        await user.save();
        return user;
    }

    async deleteUser(userId) {
        const user = await User.findByIdAndDelete(userId);
        if (!user) throw new Error("User not found");
        return user;
    }

    async deleteJob(jobId) {
        const job = await Job.findByIdAndDelete(jobId);
        if (!job) throw new Error("Job not found");
        return job;
    }

    async deleteDispute(disputeId) {
        const dispute = await Dispute.findByIdAndDelete(disputeId);
        if (!dispute) throw new Error("Dispute not found");
        return dispute;
    }

    async assignMediator(disputeId, mediatorId) {
        const dispute = await Dispute.findById(disputeId);
        if (!dispute) throw new Error("Dispute not found");

        const mediator = await User.findById(mediatorId);
        if (!mediator) throw new Error("Mediator not found");

        dispute.mediator = mediatorId;
        dispute.status = "in-progress";
        await dispute.save();
        return dispute;
    }

    async verifyUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        user.verified = true;
        await user.save();
        return user;
    }

    async unverifyUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        user.verified = false;
        await user.save();
        return user;
    }

    async getUserDetails(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        return user;
    }

    async getJobDetails(jobId) {
        const job = await Job.findById(jobId).populate("customer selectedWorker");
        if (!job) throw new Error("Job not found");
        return job;
    }

    async getDisputeDetails(disputeId) {
        const dispute = await Dispute.findById(disputeId).populate("job raisedBy mediator");
        if (!dispute) throw new Error("Dispute not found");
        return dispute;
    }

    async getAllMediators() {
        return User.find({ role: "admin" }).select("Name emailId contact");
    }

    async getAllEmployers() {
        return User.find({ availableModes: "customer" }).select("Name emailId contact verified");
    }

    async getAllLabourers() {
        return User.find({ availableModes: "worker" }).select("Name emailId contact verified");
    }

    async listAds(query = {}) {
        return Ad.find(query).sort({ createdAt: -1 });
    }

    async createAd(data) {
        const { title, businessName, imageUrl, ctaText, ctaLink, location, radiusKm = 10, category = "General" } = data;

        if (!title || !businessName || !ctaLink) {
            throw new Error("Missing required ad fields");
        }

        const geoPoint = normaliseCoordinates(location);
        if (!geoPoint) {
            throw new Error("A sponsored ad requires target coordinates");
        }

        const ad = await Ad.create({
            title,
            businessName,
            imageUrl,
            ctaText: ctaText || "Learn More",
            ctaLink,
            targetLocation: geoPoint,
            targetRadiusKm: Number(radiusKm),
            targetCategory: category,
        });

        return ad;
    }

    async toggleAdStatus(adId) {
        const ad = await Ad.findById(adId);
        if (!ad) throw new Error("Ad not found");
        ad.isActive = !ad.isActive;
        await ad.save();
        return ad;
    }

    async runMaintenance() {
        const details = await processPendingJobsLifecycle();
        return details;
    }

    async createSystemAdmin(callingUser, data) {
        if (callingUser.role !== "system_admin") {
            throw new Error("Unauthorized: Only System Admins can perform this action");
        }

        const { Name, emailId, contact, password } = data;
        if (!Name || !emailId || !contact || !password) {
            throw new Error("All fields (Name, emailId, contact, password) are required");
        }

        const existingUser = await User.findOne({
            $or: [{ emailId: String(emailId).trim().toLowerCase() }, { contact: String(contact).trim() }],
        });
        if (existingUser) {
            throw new Error("User with this email or contact already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const adminUser = await User.create({
            Name: String(Name).trim(),
            emailId: String(emailId).trim().toLowerCase(),
            contact: String(contact).trim(),
            password: hashedPassword,
            role: "system_admin",
            verified: true,
            activeMode: "customer",
            availableModes: ["customer", "worker"],
        });

        return adminUser;
    }

    async getQueries() {
        return Query.find({}).sort({ createdAt: -1 });
    }

    async resolveQuery(queryId, resolutionNotes) {
        if (!resolutionNotes || !String(resolutionNotes).trim()) {
            throw new Error("Resolution notes are required");
        }

        const query = await Query.findById(queryId);
        if (!query) throw new Error("Query not found");

        query.status = "resolved";
        query.resolutionNotes = String(resolutionNotes).trim();
        query.resolvedAt = new Date();
        await query.save();
        return query;
    }
}
