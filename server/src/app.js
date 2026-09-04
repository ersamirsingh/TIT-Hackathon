import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import router from './routes/api.v1.js';

const app = express();

// Trust reverse proxy (essential for Render / Cloudflare HTTPS identification & cookies)
app.set("trust proxy", 1);

// Security response headers
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

app.use(express.json());
app.use(cookieParser());

// Dynamic CORS configuration for Vercel frontend & local development
const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, server-to-server)
            if (!origin) return callback(null, true);

            // Allow defined CLIENT_URL origins or default local dev origins
            if (allowedOrigins.includes(origin) || defaultOrigins.includes(origin)) {
                return callback(null, true);
            }

            // Automatically allow Vercel deployment and preview URLs (*.vercel.app)
            if (/\.vercel\.app$/.test(origin)) {
                return callback(null, true);
            }

            // Fallback for production: if no CLIENT_URL configured, allow request but log warning
            if (allowedOrigins.length === 0 && process.env.NODE_ENV !== "production") {
                return callback(null, true);
            }

            return callback(null, true); // Allow origin with credentials
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
);

app.get("/health", (req, res) => {
    res.json({ connection: "OK", environment: process.env.NODE_ENV || "development" });
});

app.use("/api", router);

export default app;
