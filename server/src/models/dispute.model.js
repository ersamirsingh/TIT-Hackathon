import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        mediator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        againstWorker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        issue: {
            type: String,
            required: true,
            trim: true,
        },
        resolutionNotes: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "in-progress", "resolved"],
            default: "pending",
        },
        evidenceUrls: {
            type: [String],
            default: [],
        },
        resolvedAt: Date,
    },
    { timestamps: true },
);

const Dispute = mongoose.model("Dispute", disputeSchema);

export default Dispute;
