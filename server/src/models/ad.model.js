import mongoose from "mongoose";

const geoPointSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        },
    },
    { _id: false },
);

const adSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        businessName: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        imageUrl: {
            type: String,
            default: "",
            trim: true,
        },
        ctaText: {
            type: String,
            default: "View Offer",
            trim: true,
        },
        ctaLink: {
            type: String,
            default: "",
            trim: true,
        },
        category: {
            type: String,
            default: "General",
            trim: true,
        },
        location: {
            type: geoPointSchema,
            default: () => ({ type: "Point", coordinates: [0, 0] }),
        },
        radiusKm: {
            type: Number,
            default: 10,
            min: 1,
        },
        priority: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        activeFrom: Date,
        activeUntil: Date,
    },
    { timestamps: true },
);

adSchema.index({ location: "2dsphere" });
adSchema.index({ isActive: 1, activeFrom: 1, activeUntil: 1 });

const Ad = mongoose.model("Ad", adSchema);

export default Ad;
