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

export default geoPointSchema;
