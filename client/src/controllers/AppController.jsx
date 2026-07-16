import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  fetchSessionRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  updateLocationRequest,
  updateModeRequest,
  updateProfileRequest,
} from "../models/auth.model.js";
import {
  clearStoredAuthToken,
  setStoredAuthToken,
} from "../models/api/client.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async ({ silent = false } = {}) => {
    try {
      const response = await fetchSessionRequest();
      setUser(response.user);
      return response.user;
    } catch (error) {
      if (error?.response?.status === 401) {
        clearStoredAuthToken();
      }
      setUser(null);
      if (!silent && error?.response?.status && error.response.status !== 401) {
        toast.error(error.response?.data?.message || "Could not refresh session");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession({ silent: true });
  }, []);

  const login = async (payload) => {
    const response = await loginRequest(payload);
    setStoredAuthToken(response.Token);
    setUser(response.user);
    toast.success("Welcome back");
    return response.user;
  };

  const register = async (payload) => {
    const response = await registerRequest(payload);
    setStoredAuthToken(response.Token);
    setUser(response.user);
    toast.success("Account created");
    return response.user;
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      if (error?.response?.status && error.response.status !== 401) {
        throw error;
      }
    } finally {
      clearStoredAuthToken();
    }
    setUser(null);
    toast.success("Logged out");
  };

  const updateMode = async (activeMode) => {
    const response = await updateModeRequest(activeMode);
    setUser(response.user);
    toast.success(`Switched to ${activeMode === "worker" ? "Work as a Karigar" : "Find a Worker"}`);
    return response.user;
  };

  const updateProfile = async (payload) => {
    const response = await updateProfileRequest(payload);
    setUser(response.user);
    toast.success("Profile updated");
    return response.user;
  };

  const updateLocation = async (payload) => {
    const response = await updateLocationRequest(payload);
    setUser(response.user);
    toast.success("Location synced");
    return response.user;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        refreshSession,
        updateMode,
        updateProfile,
        updateLocation,
        setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppController() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppController must be used inside AppProvider");
  }

  return context;
}
