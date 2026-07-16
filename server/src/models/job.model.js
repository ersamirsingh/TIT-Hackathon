import mongoose from "mongoose";
import geoPointSchema from "./job-schemas/geoPoint.schema.js";
import voiceInputSchema from "./job-schemas/voiceInput.schema.js";
import applicationSchema from "./job-schemas/application.schema.js";
import pricingSchema from "./job-schemas/pricing.schema.js";
import timelineSchema from "./job-schemas/timeline.schema.js";
import warrantySchema from "./job-schemas/warranty.schema.js";
import cancellationSchema from "./job-schemas/cancellation.schema.js";
import matchingSchema from "./job-schemas/matching.schema.js";
import adSnapshotSchema from "./job-schemas/adSnapshot.schema.js";
import recommendationSchema from "./job-schemas/recommendation.schema.js";
import disputeStateSchema from "./job-schemas/disputeState.schema.js";

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: [
                "General",
                "Cleaning",
                "Electrical",
                "Plumbing",
                "Painting",
                "Appliance",
                "Carpentry",
                "Other",
            ],
            default: "General",
        },
        employmentType: {
            type: String,
            enum: ["Part-time", "Full-time", "Emergency"],
            default: "Part-time",
        },
        serviceCode: {
            type: String,
            default: "",
            trim: true,
        },
        serviceLabel: {
            type: String,
            default: "",
            trim: true,
        },
        pricingModel: {
            type: String,
            enum: ["standard", "inspection"],
            default: "inspection",
        },
        wage: Number,
        salaryMin: Number,
        salaryMax: Number,
        payFrequency: {
            type: String,
            default: "Daily",
        },
        experienceLevel: {
            type: String,
            enum: ["Entry Level", "Intermediate", "Advanced", "Expert"],
            default: "Entry Level",
        },
        locationText: {
            type: String,
            default: "",
            trim: true,
        },
        address: {
            type: String,
            default: "",
            trim: true,
        },
        skills: {
            type: [String],
            default: [],
        },
        voiceInput: {
            type: voiceInputSchema,
            default: () => ({}),
        },
        employer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        applicants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        applications: {
            type: [applicationSchema],
            default: [],
        },
        assignedLaborer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        selectedWorker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: [
                "broadcasting",
                "worker_selected",
                "in_progress",
                "completed_pending_confirmation",
                "completed",
                "cancelled",
                "disputed",
                "warranty_claimed",
            ],
            default: "broadcasting",
        },
        location: {
            type: geoPointSchema,
            default: () => ({ type: "Point", coordinates: [0, 0] }),
        },
        pricing: {
            type: pricingSchema,
            default: () => ({}),
        },
        rocketMode: {
            enabled: {
                type: Boolean,
                default: false,
            },
            workerBonus: {
                type: Number,
                default: 30,
            },
            platformShare: {
                type: Number,
                default: 20,
            },
            bonusCreditedAt: Date,
        },
        leadFee: {
            amount: {
                type: Number,
                default: 20,
            },
            chargedToWorker: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            chargedAt: Date,
            refundedAt: Date,
            isRefunded: {
                type: Boolean,
                default: false,
            },
        },
        matching: {
            type: matchingSchema,
            default: () => ({}),
        },
        timeline: {
            type: timelineSchema,
            default: () => ({}),
        },
        warranty: {
            type: warrantySchema,
            default: () => ({}),
        },
        cancellation: {
            type: cancellationSchema,
            default: () => ({}),
        },
        disputeState: {
            type: disputeStateSchema,
            default: () => ({}),
        },
        trustAndSafety: {
            verifiedIdTracking: {
                type: Boolean,
                default: true,
            },
            sosEnabled: {
                type: Boolean,
                default: true,
            },
            warrantyIncluded: {
                type: Boolean,
                default: true,
            },
        },
        adSnapshot: {
            type: adSnapshotSchema,
            default: () => ({}),
        },
        crossSellRecommendations: {
            type: [recommendationSchema],
            default: [],
        },
        finalRating: Number,
        finalReview: String,
        coinsAwarded: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true },
);

jobSchema.index({ location: "2dsphere" });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ customer: 1, status: 1 });
jobSchema.index({ selectedWorker: 1, status: 1 });

const Job = mongoose.model("Job", jobSchema);

export default Job;
