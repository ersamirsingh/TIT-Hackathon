import axios from "axios";

const TOKEN_KEY = "karigar_auth_token";

export const getStoredAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
};

export const setStoredAuthToken = (token) => {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
};

export const clearStoredAuthToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
};

let clickedBtn = null;

if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button, a.k-btn, .k-btn, .btn, input[type='submit'], input[type='button']");
    if (btn) {
      clickedBtn = btn;
      // Clear after the current event tick to prevent unrelated/background calls from capturing it
      setTimeout(() => {
        clickedBtn = null;
      }, 0);
    }
  }, true); // Use capture phase
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Disable button if request was triggered by a click
  if (clickedBtn) {
    config.clickedBtn = clickedBtn;
    clickedBtn.disabled = true;
    clickedBtn.classList.add("pointer-events-none", "opacity-50");
    clickedBtn = null;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => {
    // Re-enable button on response success
    if (response.config?.clickedBtn) {
      response.config.clickedBtn.disabled = false;
      response.config.clickedBtn.classList.remove("pointer-events-none", "opacity-50");
    }
    return response;
  },
  (error) => {
    // Re-enable button on response error
    if (error.config?.clickedBtn) {
      error.config.clickedBtn.disabled = false;
      error.config.clickedBtn.classList.remove("pointer-events-none", "opacity-50");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
