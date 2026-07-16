import { Router } from "express";
import authenticateUser from "../middleware/authenticate.middleware.js";
import {
    getWalletSummary,
    listWalletTransactions,
    rechargeWallet,
} from "../controllers/wallet.controller.js";

const walletRouter = Router();

walletRouter.get("/", authenticateUser, getWalletSummary);
walletRouter.get("/transactions", authenticateUser, listWalletTransactions);
walletRouter.post("/recharge", authenticateUser, rechargeWallet);

export default walletRouter;
