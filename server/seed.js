import { configDotenv } from "dotenv";
configDotenv();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./src/models/user.model.js";
import Job from "./src/models/job.model.js";

const CATEGORIES = ["Electrical", "Plumbing", "Appliance", "Cleaning", "Carpentry", "Painting", "General"];
const SERVICES = [
    ["ELE-01", "Ceiling Fan Repair", "Electrical"],
    ["ELE-02", "Short Circuit Fixing", "Electrical"],
    ["PLU-01", "Pipe Leakage Fix", "Plumbing"],
    ["APP-01", "AC Filter Cleaning", "Appliance"],
    ["CLN-01", "Deep Kitchen Cleaning", "Cleaning"],
    ["CAR-01", "Door Lock Replacement", "Carpentry"]
];

const seed = async () => {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.DB_KEY);
        console.log("Connected! Cleaning database of seeded test data...");

        // Clear previous seed data
        await User.deleteMany({ emailId: { $regex: /@seeded\.com|@karigar\.com/ } });
        await Job.deleteMany({ description: { $regex: /\[Seeded Job\]/ } });

        console.log("Seeding 5 System Admins...");
        const passwordHash = await bcrypt.hash("admin123", 12);
        const adminData = [];
        for (let i = 1; i <= 5; i++) {
            adminData.push({
                Name: `System Admin ${i}`,
                emailId: `admin${i}@karigar.com`,
                password: passwordHash,
                contact: `900000000${i}`,
                role: "system_admin",
                verified: true,
                activeMode: "customer"
            });
        }
        const admins = await User.insertMany(adminData);
        console.log(`Seeded ${admins.length} System Admins.`);

        console.log("Seeding 10 Users (5 Customers + 5 Workers)...");
        const customerData = [];
        const workerData = [];
        
        // Delhi/Bangalore Center Coordinate: [77.5946, 12.9716]
        const centerLng = 77.5946;
        const centerLat = 12.9716;

        for (let i = 1; i <= 5; i++) {
            const customerLng = centerLng + (Math.random() - 0.5) * 0.05;
            const customerLat = centerLat + (Math.random() - 0.5) * 0.05;
            customerData.push({
                Name: `Seeded Customer ${i}`,
                emailId: `customer${i}@seeded.com`,
                password: passwordHash,
                contact: `988880000${i}`,
                role: "user",
                activeMode: "customer",
                verified: true,
                location: {
                    type: "Point",
                    coordinates: [customerLng, customerLat]
                },
                locationText: `Customer Address ${i}, Bangalore`,
                wallet: { balance: 1000 }
            });
        }

        for (let i = 1; i <= 5; i++) {
            const workerLng = centerLng + (Math.random() - 0.5) * 0.05;
            const workerLat = centerLat + (Math.random() - 0.5) * 0.05;
            workerData.push({
                Name: `Seeded Karigar ${i}`,
                emailId: `worker${i}@seeded.com`,
                password: passwordHash,
                contact: `977770000${i}`,
                role: "user",
                activeMode: "worker",
                verified: true,
                location: {
                    type: "Point",
                    coordinates: [workerLng, workerLat]
                },
                locationText: `Worker Shed ${i}, Bangalore`,
                skills: [CATEGORIES[i % CATEGORIES.length], CATEGORIES[(i + 1) % CATEGORIES.length]],
                workerProfile: {
                    headline: `Reliable ${CATEGORIES[i % CATEGORIES.length]} Specialist`,
                    about: "Prompt, clean work. Certified technician.",
                    categories: [CATEGORIES[i % CATEGORIES.length], CATEGORIES[(i + 1) % CATEGORIES.length]],
                    languages: ["Hindi", "English"],
                    yearsExperience: i + 2,
                    serviceRadiusKm: 10,
                    isAvailable: true
                },
                wallet: { balance: 500 }
            });
        }

        const seededCustomers = await User.insertMany(customerData);
        const seededWorkers = await User.insertMany(workerData);
        console.log(`Seeded ${seededCustomers.length} Customers and ${seededWorkers.length} Workers.`);

        console.log("Seeding 200 Jobs...");
        const jobs = [];
        const statuses = ["broadcasting", "worker_selected", "in_progress", "completed", "cancelled"];

        for (let i = 1; i <= 200; i++) {
            const customer = seededCustomers[i % seededCustomers.length];
            const worker = seededWorkers[i % seededWorkers.length];
            
            // Random offset location within ~8km
            const jobLng = centerLng + (Math.random() - 0.5) * 0.08;
            const jobLat = centerLat + (Math.random() - 0.5) * 0.08;

            const category = CATEGORIES[i % CATEGORIES.length];
            const matchingService = SERVICES.find(s => s[2] === category) || ["GEN-01", "General Maintenance", "General"];
            
            const isInspection = i % 3 === 0;
            const status = statuses[i % statuses.length];
            
            // Backdate some jobs to simulate ambiguous/stale jobs (older than 24 hours)
            const isStale = i % 15 === 0;
            const createdAt = isStale 
                ? new Date(Date.now() - 48 * 3600 * 1000) 
                : new Date(Date.now() - (i % 24) * 3600 * 1000);

            const job = {
                title: `${category} Fix Request #${i}`,
                customer: customer._id,
                category,
                description: `[Seeded Job] Stamped fix request #${i} for ${category}. Please check problems.`,
                location: {
                    type: "Point",
                    coordinates: [jobLng, jobLat]
                },
                locationText: `Job site address #${i}, Bangalore`,
                status,
                pricing: {
                    pricingModel: isInspection ? "inspection" : "standard",
                    serviceCode: isInspection ? "" : matchingService[0],
                    serviceLabel: isInspection ? "" : matchingService[1],
                    standardRate: isInspection ? 0 : 250 + (i % 5) * 50,
                    inspectionFee: isInspection ? 99 : 0,
                    trustSafetyFee: 15,
                    rocketModeFee: (i % 7 === 0) ? 20 : 0,
                    totalUserPayable: isInspection ? 114 : 300 + (i % 5) * 50,
                    workerPayoutEstimate: isInspection ? 99 : 250 + (i % 5) * 50
                },
                rocketMode: i % 7 === 0,
                selectedWorker: (status !== "broadcasting") ? worker._id : null,
                createdAt,
                updatedAt: createdAt
            };

            // Set specific stages for timeline
            if (status === "worker_selected" || status === "in_progress") {
                job.timeline = {
                    workerSelectedAt: new Date(createdAt.getTime() + 10 * 60 * 1000),
                    workerArrivedAt: (status === "in_progress") ? new Date(createdAt.getTime() + 30 * 60 * 1000) : null
                };
            }

            jobs.push(job);
        }

        await Job.insertMany(jobs);
        console.log("Successfully seeded 200 jobs!");

    } catch (err) {
        console.error("Seeding failed:", err.message);
    } finally {
        await mongoose.connection.close();
        console.log("Database connection closed.");
    }
};

seed();
