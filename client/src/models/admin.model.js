import apiClient from "./api/client.js";

export const getAdminOverviewRequest = async () => {
  const { data } = await apiClient.get("/admin/overview");
  return data;
};

export const getAdminUsersRequest = async () => {
  const { data } = await apiClient.get("/admin/list-users");
  return data;
};

export const getAdminUserDetailsRequest = async (userId) => {
  const { data } = await apiClient.get(`/admin/get-user-details/${userId}`);
  return data;
};

export const getAdminJobsRequest = async () => {
  const { data } = await apiClient.get("/admin/list-jobs");
  return data;
};

export const getAdminJobDetailsRequest = async (jobId) => {
  const { data } = await apiClient.get(`/admin/get-job-details/${jobId}`);
  return data;
};

export const getAdminDisputesRequest = async () => {
  const { data } = await apiClient.get("/admin/list-disputes");
  return data;
};

export const getAdminDisputeDetailsRequest = async (disputeId) => {
  const { data } = await apiClient.get(`/admin/get-dispute-details/${disputeId}`);
  return data;
};

export const resolveDisputeRequest = async (disputeId, payload) => {
  const { data } = await apiClient.patch(`/admin/disputes/${disputeId}/resolve`, payload);
  return data;
};

export const assignMediatorRequest = async (disputeId, mediatorId) => {
  const { data } = await apiClient.patch(`/admin/assign-mediator/${disputeId}`, {
    mediatorId,
  });
  return data;
};

export const getMediatorsRequest = async () => {
  const { data } = await apiClient.get("/admin/get-all-mediator");
  return data;
};

export const getCustomersRequest = async () => {
  const { data } = await apiClient.get("/admin/get-all-employer");
  return data;
};

export const getWorkersRequest = async () => {
  const { data } = await apiClient.get("/admin/get-all-labourers");
  return data;
};

export const verifyUserRequest = async (userId) => {
  const { data } = await apiClient.patch(`/admin/verify-user/${userId}`);
  return data;
};

export const unverifyUserRequest = async (userId) => {
  const { data } = await apiClient.patch(`/admin/unverify-user/${userId}`);
  return data;
};

export const blockUserRequest = async (userId) => {
  const { data } = await apiClient.patch(`/admin/block-user/${userId}`);
  return data;
};

export const unblockUserRequest = async (userId) => {
  const { data } = await apiClient.patch(`/admin/unblock-user/${userId}`);
  return data;
};

export const deleteUserRequest = async (userId) => {
  const { data } = await apiClient.delete(`/admin/delete-user/${userId}`);
  return data;
};

export const deleteJobRequest = async (jobId) => {
  const { data } = await apiClient.delete(`/admin/delete-job/${jobId}`);
  return data;
};

export const deleteDisputeRequest = async (disputeId) => {
  const { data } = await apiClient.delete(`/admin/delete-dispute/${disputeId}`);
  return data;
};

export const getAdsRequest = async () => {
  const { data } = await apiClient.get("/admin/ads");
  return data;
};

export const createAdRequest = async (payload) => {
  const { data } = await apiClient.post("/admin/ads", payload);
  return data;
};

export const toggleAdRequest = async (adId) => {
  const { data } = await apiClient.patch(`/admin/ads/${adId}/toggle`);
  return data;
};

export const runMaintenanceRequest = async () => {
  const { data } = await apiClient.post("/admin/maintenance/run");
  return data;
};
