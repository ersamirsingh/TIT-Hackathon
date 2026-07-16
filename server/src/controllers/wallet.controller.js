import WalletTransaction from "../models/walletTransaction.model.js";
import { applyWalletCredit } from "../utils/wallet.utils.js";
import { buildPublicUser } from "../utils/user.utils.js";

export const getWalletSummary = async (req, res) =>
    res.status(200).json({
        success: true,
        data: {
            wallet: req.user.wallet,
            coins: req.user.coins,
            subscription: req.user.subscription,
        },
    });

export const rechargeWallet = async (req, res) => {
    try {
        const { amount, upiReference = "", upiApp = "" } = req.body;
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid recharge amount is required",
            });
        }

        await applyWalletCredit({
            user: req.user,
            amount: numericAmount,
            type: "upi_recharge",
            description: "Wallet recharge via UPI",
            metadata: {
                upiReference: String(upiReference || "").trim(),
                upiApp: String(upiApp || "").trim(),
            },
        });

        return res.status(200).json({
            success: true,
            message: "Wallet recharged successfully",
            user: buildPublicUser(req.user),
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const listWalletTransactions = async (req, res) => {
    const transactions = await WalletTransaction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(100);

    return res.status(200).json({
        success: true,
        data: { transactions },
    });
};
