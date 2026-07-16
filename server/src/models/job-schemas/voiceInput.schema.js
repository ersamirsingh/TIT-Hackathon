import mongoose from "mongoose";

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

export default voiceInputSchema;
