import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/user.model.js";
import redisClient from "../../config/redis.config.js";
import { validate } from "../../utils/Validate.js";
import { normaliseCoordinates } from "../../utils/platform.utils.js";
import { getCanonicalUserState } from "../../utils/user.utils.js";
import Query from "../../models/query.model.js";

export class AuthService {
    getCookieOptions() {
        const maxAge = Number(process.env.JWT_MAX_AGE || 0);
        const isProduction = process.env.NODE_ENV === "production";
        return {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
            ...(Number.isFinite(maxAge) && maxAge > 0 ? { maxAge } : {}),
        };
    }

    createToken(user) {
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
    }

    async register(data) {
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
        } = data;

        if (!emailId || !password || !contact || !Name) {
            throw new Error("All required fields must be provided");
        }

        const existingUser = await User.findOne({
            $or: [{ emailId: String(emailId).trim().toLowerCase() }, { contact: String(contact).trim() }],
        });

        if (existingUser) {
            throw new Error("User already exists.");
        }

        const result = validate({ emailId, password, contact });
        if (!result.success) {
            throw new Error(result.message);
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

        return user;
    }

    async login(emailId, password) {
        if (!emailId || !password) {
            throw new Error("Email and password are required");
        }

        const user = await User.findOne({
            emailId: String(emailId).trim().toLowerCase(),
        });

        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isMatched = await bcrypt.compare(password, user.password);
        if (!isMatched) {
            throw new Error("Invalid credentials");
        }

        return user;
    }

    async logout(token) {
        if (!token) {
            throw new Error("No active session found");
        }
        const payload = jwt.verify(token, process.env.SECRET_KEY);
        await redisClient.set(`token:blacklist:${token}`, "blocked");
        await redisClient.expireAt(`token:blacklist:${token}`, payload.exp);
    }

    async updateMode(user, activeMode) {
        if (!["customer", "worker"].includes(activeMode)) {
            throw new Error("activeMode must be either customer or worker");
        }

        if (!user.availableModes.includes(activeMode)) {
            throw new Error("This mode is not enabled for your account");
        }

        user.activeMode = activeMode;
        await user.save();
        return user;
    }

    async updateProfile(user, profileData) {
        const {
            Name,
            contact,
            preferredLanguage,
            languages,
            upiId,
            skills,
            workerProfile,
            locationText,
        } = profileData;

        if (Name !== undefined) {
            user.Name = String(Name).trim();
        }

        if (contact !== undefined) {
            user.contact = String(contact).trim();
        }

        if (preferredLanguage !== undefined) {
            user.preferredLanguage = String(preferredLanguage).trim();
        }

        if (Array.isArray(languages) && languages.length) {
            user.languages = languages;
        }

        if (upiId !== undefined) {
            user.upiId = String(upiId).trim();
        }

        if (Array.isArray(skills)) {
            user.skills = skills.filter(Boolean);
        }

        if (locationText !== undefined) {
            user.locationText = String(locationText).trim();
        }

        if (workerProfile && typeof workerProfile === "object") {
            const currentWorkerProfile =
                typeof user.workerProfile?.toObject === "function"
                    ? user.workerProfile.toObject()
                    : user.workerProfile || {};

            user.workerProfile = {
                ...currentWorkerProfile,
                ...workerProfile,
            };
        }

        await user.save();
        return user;
    }

    async updateLocation(user, coordinates, locationText) {
        const geoPoint = normaliseCoordinates(coordinates);
        const nextLocationText = String(locationText || user.locationText || "").trim();

        if (!geoPoint && !nextLocationText) {
            throw new Error("Provide coordinates or a location label");
        }

        if (geoPoint) {
            user.location = geoPoint;
            user.lastKnownLocationAt = new Date();
        }

        if (locationText !== undefined || nextLocationText) {
            user.locationText = nextLocationText;
        }

        await user.save();
        return user;
    }

    async submitQuery(queryData) {
        const { name, email, phone, subject, message } = queryData;

        if (!name || !email || !subject || !message) {
            throw new Error("Please provide name, email, subject, and message");
        }

        const newQuery = await Query.create({
            name,
            email,
            phone: phone || "",
            subject,
            message,
        });

        return newQuery;
    }
}
