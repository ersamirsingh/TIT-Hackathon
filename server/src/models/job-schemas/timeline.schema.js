import mongoose from "mongoose";

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

export default timelineSchema;
