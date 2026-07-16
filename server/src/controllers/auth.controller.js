import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import redisClient from "../config/redis.config.js";
import { validate } from "../utils/Validate.js";
import { normaliseCoordinates } from "../utils/platform.utils.js";
import { buildPublicUser, getCanonicalUserState } from "../utils/user.utils.js";

const getCookieOptions = () => {
    const maxAge = Number(process.env.JWT_MAX_AGE || 0);

    return {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        ...(Number.isFinite(maxAge) && maxAge > 0 ? { maxAge } : {}),
    };
};

const createToken = (user) => {
    if (!process.env.SECRET_KEY || !process.env.JWT_EXP) {
        throw new Error("JWT configuration missing");
    }

    const canonicalState = getCanonicalUserState(user);

    return jwt.sign(
        {
            _id: user._id,
            role: canonicalState.role,
            activeMode: canonicalState.activeMode,
            emailId: user.emailId,
        },
        process.env.SECRET_KEY,
        { expiresIn: process.env.JWT_EXP },
    );
};

export const Register = async (req, res) => {
    try {
        const {
            emailId,
            password,
            contact,
            Name,
            preferredLanguage = "Hindi",
            languages = ["Hindi"],
            activeMode = "customer",
            upiId = "",
            location,
            locationText = "",
            workerProfile = {},
        } = req.body;

        if (!emailId || !password || !contact || !Name) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided",
            });
        }

        const existingUser = await User.findOne({
            $or: [{ emailId: String(emailId).trim().toLowerCase() }, { contact: String(contact).trim() }],
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists.",
            });
        }

        const result = validate({ emailId, password, contact });
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const geoPoint = normaliseCoordinates(location);

        const user = await User.create({
            Name: String(Name).trim(),
            emailId: String(emailId).trim().toLowerCase(),
            password: hashedPassword,
            contact: String(contact).trim(),
            preferredLanguage,
            languages: Array.isArray(languages) && languages.length ? languages : ["Hindi"],
            availableModes: ["customer", "worker"],
            activeMode: ["customer", "worker"].includes(activeMode) ? activeMode : "customer",
            upiId: String(upiId || "").trim(),
            location: geoPoint || undefined,
            locationText: String(locationText || "").trim(),
            workerProfile: {
                ...workerProfile,
                languages:
                    Array.isArray(workerProfile.languages) && workerProfile.languages.length
                        ? workerProfile.languages
                        : Array.isArray(languages) && languages.length
                          ? languages
                          : ["Hindi"],
            },
        });

        const Token = createToken(user);
        res.cookie("Token", Token, getCookieOptions());

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            Token,
            user: buildPublicUser(user),
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Register controller error",
            error: err.message,
        });
    }
};

export const Login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!emailId || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            emailId: String(emailId).trim().toLowerCase(),
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const isMatched = await bcrypt.compare(password, user.password);
        if (!isMatched) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const Token = createToken(user);
        res.cookie("Token", Token, getCookieOptions());

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            Token,
            user: buildPublicUser(user),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message,
        });
    }
};

export const Logout = async (req, res) => {
    try {
        const token = req.token || req.cookies?.Token;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "No active session found",
            });
        }

        const payload = jwt.verify(token, process.env.SECRET_KEY);
        await redisClient.set(`token:blacklist:${token}`, "blocked");
        await redisClient.expireAt(`token:blacklist:${token}`, payload.exp);

        res.clearCookie("Token", getCookieOptions());

        return res.status(200).json({
            success: true,
            message: "User logged out successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message,
        });
    }
};

export const validUser = async (req, res) =>
    res.status(200).json({
        success: true,
        user: buildPublicUser(req.user),
        message: "Valid user",
    });

export const updateMode = async (req, res) => {
    const { activeMode } = req.body;

    if (!["customer", "worker"].includes(activeMode)) {
        return res.status(400).json({
            success: false,
            message: "activeMode must be either customer or worker",
        });
    }

    if (!req.user.availableModes.includes(activeMode)) {
        return res.status(403).json({
            success: false,
            message: "This mode is not enabled for your account",
        });
    }

    req.user.activeMode = activeMode;
    await req.user.save();

    return res.status(200).json({
        success: true,
        message: "App mode updated successfully",
        user: buildPublicUser(req.user),
    });
};

export const updateProfile = async (req, res) => {
    const {
        Name,
        contact,
        preferredLanguage,
        languages,
        upiId,
        skills,
        workerProfile,
        locationText,
    } = req.body;

    if (Name !== undefined) {
        req.user.Name = String(Name).trim();
    }

    if (contact !== undefined) {
        req.user.contact = String(contact).trim();
    }

    if (preferredLanguage !== undefined) {
        req.user.preferredLanguage = String(preferredLanguage).trim();
    }

    if (Array.isArray(languages) && languages.length) {
        req.user.languages = languages;
    }

    if (upiId !== undefined) {
        req.user.upiId = String(upiId).trim();
    }

    if (Array.isArray(skills)) {
        req.user.skills = skills.filter(Boolean);
    }

    if (locationText !== undefined) {
        req.user.locationText = String(locationText).trim();
    }

    if (workerProfile && typeof workerProfile === "object") {
        const currentWorkerProfile =
            typeof req.user.workerProfile?.toObject === "function"
                ? req.user.workerProfile.toObject()
                : req.user.workerProfile || {};

        req.user.workerProfile = {
            ...currentWorkerProfile,
            ...workerProfile,
        };
    }

    await req.user.save();

    return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: buildPublicUser(req.user),
    });
};

export const updateLocation = async (req, res) => {
    const { coordinates, locationText = "" } = req.body;
    const geoPoint = normaliseCoordinates(coordinates);
    const nextLocationText = String(locationText || req.user.locationText || "").trim();

    if (!geoPoint && !nextLocationText) {
        return res.status(400).json({
            success: false,
            message: "Provide coordinates or a location label",
        });
    }

    if (geoPoint) {
        req.user.location = geoPoint;
        req.user.lastKnownLocationAt = new Date();
    }

    if (locationText !== undefined || nextLocationText) {
        req.user.locationText = nextLocationText;
    }

    await req.user.save();

    return res.status(200).json({
        success: true,
        message: "Location updated successfully",
        user: buildPublicUser(req.user),
    });
};
