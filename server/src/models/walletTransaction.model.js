import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
        },
        type: {
            type: String,
            enum: [
                "lead_fee",
                "lead_fee_refund",
                "boost_fee",
                "verified_pro_subscription",
                "upi_recharge",
                "rocket_mode_bonus",
                "manual_adjustment",
            ],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        balanceAfter: {
            type: Number,
            required: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true },
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

const WalletTransaction = mongoose.model(
    "WalletTransaction",
    walletTransactionSchema,
);

export default WalletTransaction;
