import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema(
    {
        pricingModel: {
            type: String,
            enum: ["standard", "inspection"],
            default: "inspection",
        },
        serviceCode: {
            type: String,
            default: "",
            trim: true,
        },
        serviceLabel: {
            type: String,
            default: "",
            trim: true,
        },
        standardRate: {
            type: Number,
            default: 0,
        },
        inspectionFee: {
            type: Number,
            default: 0,
        },
        trustSafetyFee: {
            type: Number,
            default: 15,
        },
        rocketModeFee: {
            type: Number,
            default: 0,
        },
        finalQuotedAmount: {
            type: Number,
            default: 0,
        },
        coinsRedeemed: {
            type: Number,
            default: 0,
        },
        subtotal: {
            type: Number,
            default: 0,
        },
        totalUserPayable: {
            type: Number,
            default: 0,
        },
        workerPayoutEstimate: {
            type: Number,
            default: 0,
        },
        platformRevenue: {
            type: Number,
            default: 0,
        },
    },
    { _id: false },
);

export default pricingSchema;
