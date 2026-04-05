const LEGACY_ROLE_MAP = {
    employee: "user",
    employer: "user",
    labourer: "user",
};

export const getNormalizedRole = (role) =>
    LEGACY_ROLE_MAP[role] || role || "user";

export const getAvailableModes = (user) => {
    if (Array.isArray(user?.availableModes) && user.availableModes.length > 0) {
        return user.availableModes;
    }

    const role = user?.role;

    if (role === "admin" || role === "mediator") {
        return ["customer"];
    }

    return ["customer", "worker"];
};

export const getActiveMode = (user) => {
    if (["customer", "worker"].includes(user?.activeMode)) {
        return user.activeMode;
    }

    return getAvailableModes(user).includes("customer") ? "customer" : "worker";
};

export const getCanonicalUserState = (user) => ({
    role: getNormalizedRole(user?.role),
    availableModes: getAvailableModes(user),
    activeMode: getActiveMode(user),
});

export const buildPublicUser = (user) => {
    const canonicalState = getCanonicalUserState(user);

    return {
        _id: user._id,
        Name: user.Name,
        emailId: user.emailId,
        contact: user.contact,
        role: canonicalState.role,
        availableModes: canonicalState.availableModes,
        activeMode: canonicalState.activeMode,
        preferredLanguage: user.preferredLanguage,
        languages: user.languages,
        verified: user.verified,
        rating: user.rating,
        ratingCount: user.ratingCount,
        coins: user.coins,
        wallet: user.wallet,
        workerProfile: user.workerProfile,
        subscription: user.subscription,
        locationText: user.locationText,
        upiId: user.upiId,
    };
};

export const hasMode = (user, mode) => getAvailableModes(user).includes(mode);
