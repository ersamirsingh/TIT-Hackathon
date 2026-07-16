import apiClient from "./api/client.js";

export const loginRequest = async (payload) => {
  const { data } = await apiClient.post("/auth/login", payload);
  return data;
};

export const registerRequest = async (payload) => {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
};

export const logoutRequest = async () => {
  const { data } = await apiClient.post("/auth/logout");
  return data;
};

export const fetchSessionRequest = async () => {
  const { data } = await apiClient.get("/auth/me");
  return data;
};

export const updateModeRequest = async (activeMode) => {
  const { data } = await apiClient.patch("/auth/mode", { activeMode });
  return data;
};

export const updateProfileRequest = async (payload) => {
  const { data } = await apiClient.patch("/auth/profile", payload);
  return data;
};

export const updateLocationRequest = async (payload) => {
  const { data } = await apiClient.patch("/auth/location", payload);
  return data;
};
