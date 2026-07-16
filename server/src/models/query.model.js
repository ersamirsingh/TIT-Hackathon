import mongoose from "mongoose";

const querySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["open", "resolved"],
            default: "open",
        },
        adminNotes: {
            type: String,
            default: "",
            trim: true,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        resolvedAt: Date,
    },
    { timestamps: true }
);

querySchema.index({ status: 1, createdAt: -1 });

const Query = mongoose.model("Query", querySchema);

export default Query;
