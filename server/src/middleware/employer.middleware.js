import authenticateUser from "./authenticate.middleware.js";

const authenticateEmployer = async (req, res, next) => {
    await authenticateUser(req, res, async () => {
        if (!req.user?.availableModes?.includes("customer")) {
            return res.status(403).json({
                success: false,
                message: "Customer mode is required for this action",
            });
        }

        return next();
    });
};

export default authenticateEmployer;
