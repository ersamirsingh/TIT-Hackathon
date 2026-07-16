import { WalletService } from "./wallet.service.js";
import { buildPublicUser } from "../../utils/user.utils.js";

const walletService = new WalletService();

export const getWalletSummary = async (req, res) => {
    try {
        const summary = walletService.getWalletSummary(req.user);
        return res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to get wallet summary",
        });
    }
};

export const rechargeWallet = async (req, res) => {
    try {
        const user = await walletService.rechargeWallet(req.user, req.body);
        return res.status(200).json({
            success: true,
            message: "Wallet recharged successfully",
            user: buildPublicUser(user),
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Recharge failed",
        });
    }
};

export const listWalletTransactions = async (req, res) => {
    try {
        const transactions = await walletService.listWalletTransactions(req.user);
        return res.status(200).json({
            success: true,
            data: { transactions },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to list transactions",
        });
    }
};
