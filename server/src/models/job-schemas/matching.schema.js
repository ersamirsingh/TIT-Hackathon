import mongoose from "mongoose";

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

export default matchingSchema;
