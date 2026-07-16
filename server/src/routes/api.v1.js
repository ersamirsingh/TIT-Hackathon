import { Router } from "express";
import adminRouter from "../modules/admin/admin.route.js";
import authRouter from "../modules/auth/auth.route.js";
import jobRouter from "../modules/job/job.route.js";
import walletRouter from "../modules/wallet/wallet.route.js";
import workerRouter from "../modules/worker/worker.route.js";
import uploadRouter from "../modules/media/media.route.js";
import aiRouter from "../modules/agent/index.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/job", jobRouter);
router.use("/worker", workerRouter);
router.use("/wallet", walletRouter);
router.use("/admin", adminRouter);
router.use('/media', uploadRouter);
router.use("/ai", aiRouter);

export default router;
