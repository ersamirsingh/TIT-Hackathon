import mongoose from "mongoose";

export const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.DB_KEY);
        console.log("DB connection successful");
    } catch (err) {
        console.error("DB Connection error:", err.message);
        throw err;
    }
};
