import { Router } from "express";
import {
    Login,
    Logout,
    Register,
    updateLocation,
    updateMode,
    updateProfile,
    validUser,
} from "../controllers/auth.controller.js";
import authenticateUser from "../middleware/authenticate.middleware.js";

const authRouter = Router();

authRouter.post("/register", Register);
authRouter.post("/login", Login);
authRouter.post("/logout", authenticateUser, Logout);
authRouter.get("/me", authenticateUser, validUser);
authRouter.patch("/mode", authenticateUser, updateMode);
authRouter.patch("/profile", authenticateUser, updateProfile);
authRouter.patch("/location", authenticateUser, updateLocation);

export default authRouter;
