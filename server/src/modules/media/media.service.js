import mongoose from "mongoose";
import uploadToCloudinary from "../../utils/uploadToCloudinary.utils.js";
import Media from "../../models/media.model.js";
import Job from "../../models/job.model.js";
import { getNormalizedRole, hasMode } from "../../utils/user.utils.js";

const isSameEntity = (left, right) => String(left || "") === String(right || "");

export class MediaService {
    canAccessJobMedia(user, job) {
        const role = getNormalizedRole(user?.role);
        if (role === "admin" || role === "system_admin") return true;
        return isSameEntity(job.customer, user?._id) || isSameEntity(job.selectedWorker, user?._id);
    }

    getMediaQueryForViewer(user, job, requestedStage = "") {
        const role = getNormalizedRole(user?.role);

        if (
            role === "admin" ||
            role === "system_admin" ||
            isSameEntity(job.customer, user?._id) ||
            isSameEntity(job.selectedWorker, user?._id)
        ) {
            return {
                jobId: job._id,
                ...(requestedStage ? { stage: requestedStage } : {}),
            };
        }

        if (job.status === "broadcasting" && hasMode(user, "worker")) {
            const allowedStages = requestedStage
                ? [requestedStage].filter((stage) => ["customer_context", "before_work"].includes(stage))
                : ["customer_context", "before_work"];

            return {
                jobId: job._id,
                stage: { $in: allowedStages },
            };
        }

        return null;
    }

    canUploadStage(user, job, stage) {
        const role = getNormalizedRole(user?.role);
        if (role === "admin" || role === "system_admin") return true;

        if (["customer_context", "before_work"].includes(stage)) {
            return isSameEntity(job.customer, user?._id);
        }

        if (stage === "after_work") {
            return isSameEntity(job.selectedWorker, user?._id);
        }

        return false;
    }

    async uploadMedia(user, jobId, file, stage = "customer_context") {
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            throw new Error("Invalid jobId");
        }

        const job = await Job.findById(jobId);
        if (!job) {
            throw new Error("Job not found");
        }

        const trimmedStage = String(stage || "customer_context").trim();
        if (!["customer_context", "before_work", "after_work"].includes(trimmedStage)) {
            throw new Error("stage must be customer_context, before_work, or after_work");
        }

        if (!this.canAccessJobMedia(user, job) || !this.canUploadStage(user, job, trimmedStage)) {
            throw new Error("You are not allowed to upload proof for this stage");
        }

        if (!file) {
            throw new Error("No file uploaded");
        }

        const result = await uploadToCloudinary(file.buffer, `karigar/jobs/${jobId}/${trimmedStage}`);
        const mediaType = result.resource_type === "video" ? "video" : "image";

        const media = await Media.create({
            url: result.secure_url,
            public_id: result.public_id,
            type: mediaType,
            stage: trimmedStage,
            originalName: file.originalname || "",
            mimeType: file.mimetype || "",
            size: Number(file.size || 0),
            jobId,
            uploadedBy: user?._id,
        });

        return media;
    }

    async getMediaByJob(user, jobId, page = 1, limit = 20, stage = "") {
        if (!jobId) throw new Error("jobId is required");
        if (!mongoose.Types.ObjectId.isValid(jobId)) throw new Error("Invalid jobId");

        const job = await Job.findById(jobId);
        if (!job) throw new Error("Job not found");

        const query = this.getMediaQueryForViewer(user, job, stage);
        if (!query) {
            throw new Error("You are not allowed to view proof for this job");
        }

        const skip = (Number(page) - 1) * Number(limit);
        const media = await Media.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate("uploadedBy", "Name role activeMode")
            .select("url public_id type stage originalName mimeType size uploadedBy createdAt");

        const total = await Media.countDocuments(query);

        return {
            page: Number(page),
            total,
            count: media.length,
            data: media,
        };
    }
}
