import mongoose from "mongoose";

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

export default disputeStateSchema;
