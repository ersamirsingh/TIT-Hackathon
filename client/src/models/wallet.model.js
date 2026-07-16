import apiClient from "./api/client.js";

export const getWalletSummaryRequest = async () => {
  const { data } = await apiClient.get("/wallet");
  return data;
};

export const getWalletTransactionsRequest = async () => {
  const { data } = await apiClient.get("/wallet/transactions");
  return data;
};

export const rechargeWalletRequest = async (payload) => {
  const { data } = await apiClient.post("/wallet/recharge", payload);
  return data;
};
