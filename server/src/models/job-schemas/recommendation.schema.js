import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
    {
        serviceCode: String,
        title: String,
        description: String,
    },
    { _id: false },
);

export default recommendationSchema;
