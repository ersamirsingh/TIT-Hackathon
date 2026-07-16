import mongoose from "mongoose";

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

export default cancellationSchema;
