import { Router } from "express";
import {
    Overview,
    assignMediator,
    blockUser,
    createAd,
    deleteDispute,
    deleteJob,
    deleteUser,
    getAllEmployers,
    getAllLabourers,
    getAllMediators,
    getDisputeDetails,
    getJobDetails,
    getUserDetails,
    listAds,
    listDisputes,
    listJobs,
    listUsers,
    resolveDispute,
    runMaintenance,
    toggleAdStatus,
    unblockUser,
    unverifyUser,
    verifyUser,
} from "../controllers/admin.controller.js";
import authenticateAdmin from "../middleware/admin.middleware.js";

const adminRouter = Router();

adminRouter.get("/overview", authenticateAdmin, Overview);
adminRouter.get("/list-users", authenticateAdmin, listUsers);
adminRouter.get("/list-jobs", authenticateAdmin, listJobs);
adminRouter.get("/list-disputes", authenticateAdmin, listDisputes);
adminRouter.patch("/disputes/:disputeId/resolve", authenticateAdmin, resolveDispute);
adminRouter.patch("/block-user/:userId", authenticateAdmin, blockUser);
adminRouter.patch("/unblock-user/:userId", authenticateAdmin, unblockUser);
adminRouter.delete("/delete-user/:userId", authenticateAdmin, deleteUser);
adminRouter.delete("/delete-job/:jobId", authenticateAdmin, deleteJob);
adminRouter.delete("/delete-dispute/:disputeId", authenticateAdmin, deleteDispute);
adminRouter.patch("/assign-mediator/:disputeId", authenticateAdmin, assignMediator);
adminRouter.patch("/verify-user/:userId", authenticateAdmin, verifyUser);
adminRouter.patch("/unverify-user/:userId", authenticateAdmin, unverifyUser);
adminRouter.get("/get-user-details/:userId", authenticateAdmin, getUserDetails);
adminRouter.get("/get-job-details/:jobId", authenticateAdmin, getJobDetails);
adminRouter.get(
    "/get-dispute-details/:disputeId",
    authenticateAdmin,
    getDisputeDetails,
);
adminRouter.get("/get-all-mediator", authenticateAdmin, getAllMediators);
adminRouter.get("/get-all-employer", authenticateAdmin, getAllEmployers);
adminRouter.get("/get-all-labourers", authenticateAdmin, getAllLabourers);
adminRouter.get("/ads", authenticateAdmin, listAds);
adminRouter.post("/ads", authenticateAdmin, createAd);
adminRouter.patch("/ads/:adId/toggle", authenticateAdmin, toggleAdStatus);
adminRouter.post("/maintenance/run", authenticateAdmin, runMaintenance);

export default adminRouter;
