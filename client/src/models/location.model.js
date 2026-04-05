export const getBrowserCoordinates = (options = {}) =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      reject(new Error("Location access is not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        const fallbackMessage =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Your location could not be determined."
              : error.code === error.TIMEOUT
                ? "Location request timed out."
                : "Could not fetch your current location.";

        reject(new Error(fallbackMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
        ...options,
      },
    );
  });
