export const PLATFORM_CONFIG = {
    inspectionFee: 50,
    trustSafetyFee: 15,
    leadFee: 20,
    workerBoostFee: 10,
    rocketModeUserFee: 50,
    rocketModeWorkerBonus: 30,
    rocketModePlatformShare: 20,
    verifiedProFee: 149,
    verifiedProDurationDays: 30,
    verifiedProEarlyAccessSeconds: 10,
    workerCreditLimit: -200,
    manualFiveStarCoinReward: 25,
    disputeWindowHours: 2,
    abandonedRefundHours: 24,
    warrantyDays: 7,
    defaultSearchRadiusKm: 5,
};

export const STANDARD_RATE_CARD = [
    {
        serviceCode: "fan-installation",
        title: "Fan Installation",
        category: "Electrical",
        price: 150,
    },
    {
        serviceCode: "switchboard-repair",
        title: "Switchboard Repair",
        category: "Electrical",
        price: 120,
    },
    {
        serviceCode: "tap-replacement",
        title: "Tap Replacement",
        category: "Plumbing",
        price: 180,
    },
    {
        serviceCode: "pipe-leak-fix",
        title: "Pipe Leak Fix",
        category: "Plumbing",
        price: 220,
    },
    {
        serviceCode: "ac-service-basic",
        title: "AC Service (Basic)",
        category: "Appliance",
        price: 499,
    },
    {
        serviceCode: "deep-cleaning-room",
        title: "Deep Cleaning (1 Room)",
        category: "Cleaning",
        price: 299,
    },
    {
        serviceCode: "door-lock-repair",
        title: "Door Lock Repair",
        category: "Carpentry",
        price: 199,
    },
];

const CROSS_SELL_MAP = {
    Electrical: [
        {
            serviceCode: "ac-service-basic",
            title: "AC Deep Cleaning",
            description: "Prevent summer breakdowns with a deep cleaning visit.",
        },
        {
            serviceCode: "switchboard-repair",
            title: "Safety Check for Switchboards",
            description:
                "Get nearby boards inspected before small faults turn risky.",
        },
    ],
    Plumbing: [
        {
            serviceCode: "tap-replacement",
            title: "Kitchen Tap Service",
            description: "Bundle a tap check-up with this plumbing visit.",
        },
    ],
    Cleaning: [
        {
            serviceCode: "deep-cleaning-room",
            title: "Full Home Deep Cleaning",
            description:
                "Schedule a follow-up cleaning and save another emergency trip.",
        },
    ],
};

export const getRateCardItem = (serviceCode) =>
    STANDARD_RATE_CARD.find((item) => item.serviceCode === serviceCode) || null;

export const normaliseCoordinates = (coordinates) => {
    if (!coordinates) {
        return null;
    }

    const lat = Number(
        coordinates.lat ?? coordinates.latitude ?? coordinates.coordinates?.[1],
    );
    const lng = Number(
        coordinates.lng ?? coordinates.longitude ?? coordinates.coordinates?.[0],
    );

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }

    return {
        type: "Point",
        coordinates: [lng, lat],
    };
};

export const buildVoiceInput = (
    voiceInput,
    fallbackText = "",
    speakerRole = "customer",
) => {
    if (!voiceInput && !fallbackText) {
        return {
            transcript: "",
            language: "Hindi",
            audioUrl: "",
            speakerRole,
        };
    }

    return {
        transcript: (voiceInput?.transcript || fallbackText || "").trim(),
        language: (voiceInput?.language || "Hindi").trim(),
        audioUrl: (voiceInput?.audioUrl || "").trim(),
        speakerRole,
    };
};

export const buildPricingBreakdown = ({
    pricingModel,
    serviceCode,
    rocketMode = false,
    coinsRedeemed = 0,
    finalQuotedAmount = 0,
}) => {
    const rateCardItem =
        pricingModel === "standard" ? getRateCardItem(serviceCode) : null;
    const standardRate = rateCardItem?.price || 0;
    const inspectionFee =
        pricingModel === "inspection" ? PLATFORM_CONFIG.inspectionFee : 0;
    const rocketModeFee = rocketMode ? PLATFORM_CONFIG.rocketModeUserFee : 0;
    const subtotal =
        standardRate +
        inspectionFee +
        PLATFORM_CONFIG.trustSafetyFee +
        rocketModeFee +
        Math.max(0, Number(finalQuotedAmount || 0));

    const totalUserPayable = Math.max(0, subtotal - Math.max(0, coinsRedeemed));
    const workerPayoutEstimate =
        standardRate +
        inspectionFee +
        Math.max(0, Number(finalQuotedAmount || 0)) +
        (rocketMode ? PLATFORM_CONFIG.rocketModeWorkerBonus : 0);
    const platformRevenue =
        PLATFORM_CONFIG.trustSafetyFee +
        (rocketMode ? PLATFORM_CONFIG.rocketModePlatformShare : 0);

    return {
        pricingModel,
        serviceCode: rateCardItem?.serviceCode || serviceCode || "",
        serviceLabel: rateCardItem?.title || "",
        standardRate,
        inspectionFee,
        trustSafetyFee: PLATFORM_CONFIG.trustSafetyFee,
        rocketModeFee,
        finalQuotedAmount: Math.max(0, Number(finalQuotedAmount || 0)),
        coinsRedeemed: Math.max(0, Number(coinsRedeemed || 0)),
        subtotal,
        totalUserPayable,
        workerPayoutEstimate,
        platformRevenue,
    };
};

export const getCrossSellRecommendations = (category) =>
    CROSS_SELL_MAP[category] || CROSS_SELL_MAP.General || [];
