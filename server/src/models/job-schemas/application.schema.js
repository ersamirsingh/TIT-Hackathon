import mongoose from "mongoose";
import voiceInputSchema from "./voiceInput.schema.js";

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

export default applicationSchema;
