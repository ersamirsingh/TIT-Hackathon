import { configDotenv } from "dotenv";
configDotenv();

import app from "./src/app.js";
import { connectToDB } from "./src/config/db.config.js";
import redisClient from "./src/config/redis.config.js";
import { processPendingJobsLifecycle } from "./src/utils/job.utils.js";

const PORT = process.env.PORT || 3000;

const bootstrap = async () => {
    await Promise.all([connectToDB(), redisClient.connect()]);

    await processPendingJobsLifecycle();
    setInterval(() => {
        processPendingJobsLifecycle().catch((error) => {
            console.error("Lifecycle maintenance error:", error.message);
        });
    }, 60_000);

    app.listen(PORT, () => {
        console.log(`app listening on port ${PORT}`);
    });
};

bootstrap().catch((error) => {
    console.error("Server bootstrap failed:", error.message);
});
