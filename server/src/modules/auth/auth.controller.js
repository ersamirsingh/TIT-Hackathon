import { AuthService } from "./auth.service.js";
import { buildPublicUser } from "../../utils/user.utils.js";

const authService = new AuthService();

export const Register = async (req, res) => {
    try {
        const user = await authService.register(req.body);
        const Token = authService.createToken(user);
        res.cookie("Token", Token, authService.getCookieOptions());

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            Token,
            user: buildPublicUser(user),
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Registration failed",
        });
    }
};

export const Login = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        const user = await authService.login(emailId, password);
        const Token = authService.createToken(user);
        res.cookie("Token", Token, authService.getCookieOptions());

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            Token,
            user: buildPublicUser(user),
        });
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: err.message || "Login failed",
        });
    }
};

export const Logout = async (req, res) => {
    try {
        const token = req.token || req.cookies?.Token;
        await authService.logout(token);
        res.clearCookie("Token", authService.getCookieOptions());

        return res.status(200).json({
            success: true,
            message: "User logged out successfully",
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Logout failed",
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
    try {
        const { activeMode } = req.body;
        const user = await authService.updateMode(req.user, activeMode);

        return res.status(200).json({
            success: true,
            message: "App mode updated successfully",
            user: buildPublicUser(user),
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to update mode",
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await authService.updateProfile(req.user, req.body);

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: buildPublicUser(user),
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to update profile",
        });
    }
};

export const updateLocation = async (req, res) => {
    try {
        const { coordinates, locationText } = req.body;
        const user = await authService.updateLocation(req.user, coordinates, locationText);

        return res.status(200).json({
            success: true,
            message: "Location updated successfully",
            user: buildPublicUser(user),
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to update location",
        });
    }
};

export const submitQuery = async (req, res) => {
    try {
        const query = await authService.submitQuery(req.body);

        return res.status(201).json({
            success: true,
            message: "Your query has been submitted successfully!",
            query,
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to submit query",
        });
    }
};
