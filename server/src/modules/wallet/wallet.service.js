import WalletTransaction from "../../models/walletTransaction.model.js";
import { applyWalletCredit } from "../../utils/wallet.utils.js";

export class WalletService {
    getWalletSummary(user) {
        return {
            wallet: user.wallet,
            coins: user.coins,
            subscription: user.subscription,
        };
    }

    async rechargeWallet(user, data) {
        const { amount, upiReference = "", upiApp = "" } = data;
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            throw new Error("A valid recharge amount is required");
        }

        await applyWalletCredit({
            user,
            amount: numericAmount,
            type: "upi_recharge",
            description: "Wallet recharge via UPI",
            metadata: {
                upiReference: String(upiReference || "").trim(),
                upiApp: String(upiApp || "").trim(),
            },
        });

        return user;
    }

    async listWalletTransactions(user) {
        const transactions = await WalletTransaction.find({ user: user._id })
            .sort({ createdAt: -1 })
            .limit(100);
        return transactions;
    }
}
