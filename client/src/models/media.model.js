import apiClient from "./api/client.js";

export const uploadMediaRequest = async (jobId, { file, stage }) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("stage", stage);

  const { data } = await apiClient.post(`/media/upload/${jobId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

export const getJobMediaRequest = async (jobId, params = {}) => {
  const { data } = await apiClient.get(`/media/list/${jobId}`, { params });
  return data;
};
