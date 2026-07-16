import mongoose from "mongoose";

const geoPointSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        },
    },
    { _id: false },
);

const voiceInputSchema = new mongoose.Schema(
    {
        transcript: {
            type: String,
            default: "",
            trim: true,
        },
        language: {
            type: String,
            default: "Hindi",
            trim: true,
        },
        audioUrl: {
            type: String,
            default: "",
            trim: true,
        },
        speakerRole: {
            type: String,
            enum: ["customer", "worker"],
            default: "customer",
        },
    },
    { _id: false },
);

const applicationSchema = new mongoose.Schema(
    {
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fullName: String,
        contactNumber: String,
        experience: String,
        message: String,
        quoteAmount: Number,
        quoteText: String,
        voiceInput: {
            type: voiceInputSchema,
            default: () => ({}),
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["interested", "selected", "rejected", "withdrawn"],
            default: "interested",
        },
        isBoosted: {
            type: Boolean,
            default: false,
        },
        boostFeeCharged: {
            type: Number,
            default: 0,
        },
        boostChargedAt: Date,
    },
    { _id: true },
);

const pricingSchema = new mongoose.Schema(
    {
        pricingModel: {
            type: String,
            enum: ["standard", "inspection"],
            default: "inspection",
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
        standardRate: {
            type: Number,
            default: 0,
        },
        inspectionFee: {
            type: Number,
            default: 0,
        },
        trustSafetyFee: {
            type: Number,
            default: 15,
        },
        rocketModeFee: {
            type: Number,
            default: 0,
        },
        finalQuotedAmount: {
            type: Number,
            default: 0,
        },
        coinsRedeemed: {
            type: Number,
            default: 0,
        },
        subtotal: {
            type: Number,
            default: 0,
        },
        totalUserPayable: {
            type: Number,
            default: 0,
        },
        workerPayoutEstimate: {
            type: Number,
            default: 0,
        },
        platformRevenue: {
            type: Number,
            default: 0,
        },
    },
    { _id: false },
);

const timelineSchema = new mongoose.Schema(
    {
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        selectedAt: Date,
        workerArrivedAt: Date,
        workCompletedAt: Date,
        disputeWindowEndsAt: Date,
        closedAt: Date,
        abandonedRefundAt: Date,
    },
    { _id: false },
);

const warrantySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ["inactive", "active", "claimed", "expired"],
            default: "inactive",
        },
        startsAt: Date,
        endsAt: Date,
        claimNotes: {
            type: String,
            default: "",
        },
        claimedAt: Date,
    },
    { _id: false },
);

const cancellationSchema = new mongoose.Schema(
    {
        cancelledBy: {
            type: String,
            enum: ["customer", "worker", "admin", "system", ""],
            default: "",
        },
        reason: {
            type: String,
            default: "",
        },
        cancelledAt: Date,
    },
    { _id: false },
);

const matchingSchema = new mongoose.Schema(
    {
        searchRadiusKm: {
            type: Number,
            default: 5,
        },
        matchedWorkerIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastBroadcastAt: Date,
        priorityDispatchTriggeredAt: Date,
    },
    { _id: false },
);

const adSnapshotSchema = new mongoose.Schema(
    {
        title: String,
        businessName: String,
        imageUrl: String,
        ctaText: String,
        ctaLink: String,
    },
    { _id: false },
);

const recommendationSchema = new mongoose.Schema(
    {
        serviceCode: String,
        title: String,
        description: String,
    },
    { _id: false },
);

const disputeStateSchema = new mongoose.Schema(
    {
        isRaised: {
            type: Boolean,
            default: false,
        },
        notes: {
            type: String,
            default: "",
        },
        raisedAt: Date,
    },
    { _id: false },
);

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
