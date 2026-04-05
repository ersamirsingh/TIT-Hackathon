import apiClient from "./api/client.js";

export const getRateCardRequest = async () => {
  const { data } = await apiClient.get("/job/rate-card");
  return data;
};

export const getMyJobsRequest = async () => {
  const { data } = await apiClient.get("/job/my/list");
  return data;
};

export const createJobRequest = async (payload) => {
  const { data } = await apiClient.post("/job/create", payload);
  return data;
};

export const getJobDetailsRequest = async (jobId) => {
  const { data } = await apiClient.get(`/job/${jobId}`);
  return data;
};

export const getJobMatchesRequest = async (jobId) => {
  const { data } = await apiClient.get(`/job/${jobId}/matches`);
  return data;
};

export const selectWorkerRequest = async (jobId, workerId) => {
  const { data } = await apiClient.post(`/job/${jobId}/select`, { workerId });
  return data;
};

export const cancelJobRequest = async (jobId, reason) => {
  const { data } = await apiClient.patch(`/job/${jobId}/cancel`, { reason });
  return data;
};

export const markWorkerArrivedRequest = async (jobId) => {
  const { data } = await apiClient.patch(`/job/${jobId}/arrived`);
  return data;
};

export const markWorkCompletedRequest = async (jobId, payload) => {
  const { data } = await apiClient.patch(`/job/${jobId}/complete`, payload);
  return data;
};

export const confirmJobCompletionRequest = async (jobId, payload) => {
  const { data } = await apiClient.patch(`/job/${jobId}/confirm`, payload);
  return data;
};

export const raiseDisputeRequest = async (jobId, payload) => {
  const { data } = await apiClient.patch(`/job/${jobId}/dispute`, payload);
  return data;
};

export const claimWarrantyRequest = async (jobId, payload) => {
  const { data } = await apiClient.patch(`/job/${jobId}/warranty-claim`, payload);
  return data;
};

export const getTrackingRequest = async (jobId) => {
  const { data } = await apiClient.get(`/job/${jobId}/tracking`);
  return data;
};
