import mongoose from "mongoose";

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

export default warrantySchema;
