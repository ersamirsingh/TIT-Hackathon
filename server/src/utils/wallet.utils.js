import WalletTransaction from "../models/walletTransaction.model.js";
import { PLATFORM_CONFIG } from "./platform.utils.js";

export const syncWalletState = (user) => {
    const balance = Number(user.wallet?.balance || 0);
    const creditLimit = Number(
        user.wallet?.creditLimit ?? PLATFORM_CONFIG.workerCreditLimit,
    );

    user.wallet.balance = balance;
    user.wallet.creditLimit = creditLimit;

    if (balance <= creditLimit) {
        user.wallet.isBlocked = true;
        user.wallet.blockedReason =
            "Recharge your wallet through UPI to accept more jobs.";
        user.wallet.blockedAt = user.wallet.blockedAt || new Date();
    } else {
        user.wallet.isBlocked = false;
        user.wallet.blockedReason = "";
        user.wallet.blockedAt = undefined;
    }

    return user;
};

export const canDebitWallet = (user, amount) => {
    const currentBalance = Number(user.wallet?.balance || 0);
    const creditLimit = Number(
        user.wallet?.creditLimit ?? PLATFORM_CONFIG.workerCreditLimit,
    );

    return currentBalance - amount >= creditLimit;
};

const recordWalletTransaction = async ({
    user,
    jobId,
    type,
    amount,
    description,
    metadata = {},
}) => {
    await WalletTransaction.create({
        user: user._id,
        job: jobId,
        type,
        amount,
        description,
        balanceAfter: user.wallet.balance,
        metadata,
    });
};

export const applyWalletDebit = async ({
    user,
    amount,
    type,
    description,
    jobId,
    metadata = {},
}) => {
    if (!amount || amount <= 0) {
        throw new Error("Debit amount must be greater than zero");
    }

    if (!canDebitWallet(user, amount)) {
        syncWalletState(user);
        await user.save();
        throw new Error(
            "Wallet credit limit reached. Please recharge via UPI to continue.",
        );
    }

    user.wallet.balance = Number(user.wallet.balance || 0) - amount;

    if (type === "lead_fee") {
        user.wallet.lifetimeLeadFees =
            Number(user.wallet.lifetimeLeadFees || 0) + amount;
    }

    if (type === "boost_fee") {
        user.wallet.lifetimeBoostSpend =
            Number(user.wallet.lifetimeBoostSpend || 0) + amount;
    }

    syncWalletState(user);
    await user.save();

    await recordWalletTransaction({
        user,
        jobId,
        type,
        amount: -Math.abs(amount),
        description,
        metadata,
    });

    return user;
};

export const applyWalletCredit = async ({
    user,
    amount,
    type,
    description,
    jobId,
    metadata = {},
}) => {
    if (!amount || amount <= 0) {
        throw new Error("Credit amount must be greater than zero");
    }

    user.wallet.balance = Number(user.wallet.balance || 0) + amount;

    if (type === "upi_recharge") {
        user.wallet.lifetimeRecharge =
            Number(user.wallet.lifetimeRecharge || 0) + amount;
    }

    if (type === "lead_fee_refund") {
        user.wallet.lifetimeRefunds =
            Number(user.wallet.lifetimeRefunds || 0) + amount;
    }

    syncWalletState(user);
    await user.save();

    await recordWalletTransaction({
        user,
        jobId,
        type,
        amount: Math.abs(amount),
        description,
        metadata,
    });

    return user;
};
