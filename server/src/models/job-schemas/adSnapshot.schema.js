import mongoose from "mongoose";

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

export default adSnapshotSchema;
