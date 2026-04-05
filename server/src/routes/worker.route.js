import { Router } from "express";
import authenticateUser from "../middleware/authenticate.middleware.js";
import {
    expressInterest,
    getWorkerFeed,
    purchaseVerifiedPro,
    updateAvailability,
    updateWorkerProfile,
} from "../controllers/worker.controller.js";

const workerRouter = Router();

workerRouter.get("/feed", authenticateUser, getWorkerFeed);
workerRouter.patch("/availability", authenticateUser, updateAvailability);
workerRouter.patch("/profile", authenticateUser, updateWorkerProfile);
workerRouter.post("/jobs/:jobId/interested", authenticateUser, expressInterest);
workerRouter.post(
    "/subscription/verified-pro",
    authenticateUser,
    purchaseVerifiedPro,
);

export default workerRouter;
