import { Router } from "express";
import { diagnoseJob, matchWorker } from "./ai.controller.js";
import authenticateUser from "../../middleware/authenticate.middleware.js";

const aiRouter = Router();

aiRouter.post("/diagnose", authenticateUser, diagnoseJob);
aiRouter.post("/match", authenticateUser, matchWorker);

export default aiRouter;
