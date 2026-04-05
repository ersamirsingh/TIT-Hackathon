import apiClient from "./api/client.js";

export const getWorkerFeedRequest = async () => {
  const { data } = await apiClient.get("/worker/feed");
  return data;
};

export const updateAvailabilityRequest = async (payload) => {
  const { data } = await apiClient.patch("/worker/availability", payload);
  return data;
};

export const updateWorkerProfileRequest = async (payload) => {
  const { data } = await apiClient.patch("/worker/profile", payload);
  return data;
};

export const expressInterestRequest = async (jobId, payload) => {
  const { data } = await apiClient.post(`/worker/jobs/${jobId}/interested`, payload);
  return data;
};

export const purchaseVerifiedProRequest = async () => {
  const { data } = await apiClient.post("/worker/subscription/verified-pro");
  return data;
};
