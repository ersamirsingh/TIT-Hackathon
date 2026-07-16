import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import redisClient from "../config/redis.config.js";
import { getCanonicalUserState } from "../utils/user.utils.js";

const getTokenFromRequest = (req) => {
    const cookieToken = req.cookies?.Token;
    if (cookieToken) {
        return cookieToken;
    }

    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }

    return null;
};

const authenticateUser = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access",
            });
        }

        if (!process.env.SECRET_KEY) {
            throw new Error("JWT secret is not configured");
        }

        const isBlockedToken = await redisClient.exists(`token:blacklist:${token}`);
        if (isBlockedToken) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again.",
            });
        }

        const payload = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(payload._id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked by the platform.",
            });
        }

        const canonicalState = getCanonicalUserState(user);
        const now = new Date();

        const needsNormalization =
            user.role !== canonicalState.role ||
            !Array.isArray(user.availableModes) ||
            user.availableModes.length === 0 ||
            user.activeMode !== canonicalState.activeMode;

        user.role = canonicalState.role;
        user.availableModes = canonicalState.availableModes;
        user.activeMode = canonicalState.activeMode;
        user.lastSeenAt = now;

        if (needsNormalization) {
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        role: canonicalState.role,
                        availableModes: canonicalState.availableModes,
                        activeMode: canonicalState.activeMode,
                        lastSeenAt: now,
                    },
                },
            );
        } else {
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        lastSeenAt: now,
                    },
                },
            );
        }

        req.user = user;
        req.token = token;
        req.auth = payload;

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || "Invalid token",
        });
    }
};

export default authenticateUser;
