import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { deleteValue, getValue, setValue } from '@/utils/electronStoreService';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const encryptBody = async (data: any) => {
  if (!data) return data;

  try {
    const json = JSON.stringify(data);
    const encrypted = await window.secureAPI.encrypt(json);
    return { payload: encrypted };
  } catch (e) {
    console.error("Encryption failed:", e);
    return data; // fallback
  }
};

const decryptBody = async (data: any) => {
  if (!data?.payload) return data;

  try {
    const decryptedJson = await window.secureAPI.decrypt(data.payload);
    return JSON.parse(decryptedJson);
  } catch (e) {
    console.error("Decryption failed:", e);
    return data;
  }
};


apiClient.interceptors.request.use(
  async (config) => {
    const token = await getValue('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data) {
      config.data = await encryptBody(config.data);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  async (response) => {
    response.data = await decryptBody(response.data);
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getValue('refreshToken');
        if (!refreshToken) return Promise.reject(error);

        const response = await apiClient.post(`/auth/refresh`, {
          refreshToken,
        });

        const { newAccessToken, newRefreshToken } = response.data;
        await setValue('accessToken', newAccessToken);
        await setValue('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await deleteValue('accessToken');
        await deleteValue('refreshToken');
        window.location.reload();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
