import mongoose from "mongoose";

const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  { _id: false },
);

const workerProfileSchema = new mongoose.Schema(
  {
    headline: {
      type: String,
      default: "",
      trim: true,
    },
    about: {
      type: String,
      default: "",
      trim: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: ["Hindi"],
    },
    yearsExperience: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceRadiusKm: {
      type: Number,
      default: 5,
      min: 1,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    isVerifiedPro: {
      type: Boolean,
      default: false,
    },
    boostEligible: {
      type: Boolean,
      default: true,
    },
    totalJobsCompleted: {
      type: Number,
      default: 0,
    },
    recentReviews: {
      type: [
        new mongoose.Schema(
          {
            jobId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Job",
            },
            reviewerId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            reviewerName: {
              type: String,
              default: "",
              trim: true,
            },
            rating: {
              type: Number,
              min: 1,
              max: 5,
            },
            review: {
              type: String,
              default: "",
              trim: true,
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
          { _id: true },
        ),
      ],
      default: [],
    },
    penalties: {
      type: Number,
      default: 0,
    },
    lastAvailabilityUpdateAt: Date,
  },
  { _id: false },
);

const walletSchema = new mongoose.Schema(
  {
    balance: {
      type: Number,
      default: 0,
    },
    creditLimit: {
      type: Number,
      default: -200,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedReason: {
      type: String,
      default: "",
    },
    blockedAt: Date,
    lifetimeRecharge: {
      type: Number,
      default: 0,
    },
    lifetimeLeadFees: {
      type: Number,
      default: 0,
    },
    lifetimeBoostSpend: {
      type: Number,
      default: 0,
    },
    lifetimeRefunds: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["none", "verified-pro"],
      default: "none",
    },
    status: {
      type: String,
      enum: ["inactive", "active", "expired"],
      default: "inactive",
    },
    startedAt: Date,
    expiresAt: Date,
    earlyAccessSeconds: {
      type: Number,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "password must be at least 6 characters long"],
    },
    aadhar: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin", "mediator"],
      default: "user",
      required: true,
    },
    availableModes: {
      type: [String],
      default: ["customer", "worker"],
      validate: {
        validator: (modes) =>
          Array.isArray(modes) &&
          modes.length > 0 &&
          modes.every((mode) => ["customer", "worker"].includes(mode)),
        message: "availableModes must only contain customer/worker",
      },
    },
    activeMode: {
      type: String,
      enum: ["customer", "worker"],
      default: "customer",
    },
    preferredLanguage: {
      type: String,
      default: "Hindi",
      trim: true,
    },
    languages: {
      type: [String],
      default: ["Hindi"],
    },
    skills: {
      type: [String],
      default: [],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    location: {
      type: geoPointSchema,
      default: () => ({ type: "Point", coordinates: [0, 0] }),
    },
    locationText: {
      type: String,
      default: "",
      trim: true,
    },
    lastKnownLocationAt: Date,
    activeCases: {
      type: Number,
      default: 0,
    },
    workerProfile: {
      type: workerProfileSchema,
      default: () => ({}),
    },
    wallet: {
      type: walletSchema,
      default: () => ({}),
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },
    coins: {
      type: Number,
      default: 0,
      min: 0,
    },
    upiId: {
      type: String,
      default: "",
      trim: true,
    },
    lastSeenAt: Date,
  },
  { timestamps: true },
);

userSchema.index({ location: "2dsphere" });
userSchema.index({ activeMode: 1, verified: 1 });
userSchema.index({
  "workerProfile.isAvailable": 1,
  "workerProfile.serviceRadiusKm": 1,
});

const User = mongoose.model("User", userSchema);

export default User;
