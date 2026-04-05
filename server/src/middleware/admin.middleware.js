import authenticateUser from "./authenticate.middleware.js";

export const authenticateAdmin = async (req, res, next) => {
    await authenticateUser(req, res, async () => {
        if (req.user?.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access only",
            });
        }

        return next();
    });
};

export default authenticateAdmin;
