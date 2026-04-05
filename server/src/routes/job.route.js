import { Router } from "express";
import {
    cancelJob,
    claimWarranty,
    confirmJobCompletion,
    createJob,
    getJobDetails,
    getJobMatches,
    getRateCard,
    getTrackingDetails,
    listMyJobs,
    markWorkCompleted,
    markWorkerArrived,
    raiseDispute,
    selectWorker,
} from "../controllers/job.controller.js";
import authenticateUser from "../middleware/authenticate.middleware.js";

const jobRouter = Router();

jobRouter.get("/rate-card", getRateCard);
jobRouter.get("/my/list", authenticateUser, listMyJobs);
jobRouter.post("/create", authenticateUser, createJob);
jobRouter.get("/:jobId", authenticateUser, getJobDetails);
jobRouter.get("/:jobId/matches", authenticateUser, getJobMatches);
jobRouter.post("/:jobId/select", authenticateUser, selectWorker);
jobRouter.patch("/:jobId/cancel", authenticateUser, cancelJob);
jobRouter.patch("/:jobId/arrived", authenticateUser, markWorkerArrived);
jobRouter.patch("/:jobId/complete", authenticateUser, markWorkCompleted);
jobRouter.patch("/:jobId/confirm", authenticateUser, confirmJobCompletion);
jobRouter.patch("/:jobId/dispute", authenticateUser, raiseDispute);
jobRouter.patch("/:jobId/warranty-claim", authenticateUser, claimWarranty);
jobRouter.get("/:jobId/tracking", authenticateUser, getTrackingDetails);

export default jobRouter;
