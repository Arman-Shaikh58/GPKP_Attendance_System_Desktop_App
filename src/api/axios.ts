import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { deleteValue, getValue, setValue } from '@/utils/electronStoreService';
import { toast } from 'sonner';


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
    // API Caching: Serve from cache if offline and GET request
    if (!navigator.onLine && config.method === 'get') {
      const cacheKey = `api_cache_${config.url}_${JSON.stringify(config.params || {})}`;
      const cachedItem = localStorage.getItem(cacheKey);
      if (cachedItem) {
        const { data } = JSON.parse(cachedItem);
        // Throw a special error object that the response interceptor can catch and resolve
        throw {
          __isCachedResponse: true,
          data,
          status: 200,
          statusText: 'OK (Cached)',
          headers: {},
          config,
        };
      }
    }

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

    // API Caching: Cache successful GET requests
    if (response.config.method === 'get' && response.status === 200) {
      try {
        const cacheKey = `api_cache_${response.config.url}_${JSON.stringify(response.config.params || {})}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          data: response.data, // content is already decrypted here
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn("Failed to cache response:", e);
      }
    }

    return response;
  },

  async (error) => {
    // API Caching: Return cached response if available
    if (error.__isCachedResponse) {
      return Promise.resolve(error);
    }

    const originalRequest = error.config;

    // API Caching Fallback: If network error or server error, try cache
    if ((!error.response || error.response.status >= 500) && originalRequest.method === 'get') {
      const cacheKey = `api_cache_${originalRequest.url}_${JSON.stringify(originalRequest.params || {})}`;
      const cachedItem = localStorage.getItem(cacheKey);
      if (cachedItem) {
        const { data } = JSON.parse(cachedItem);
        toast.error("Unable to connect to server. Showing cached data.");

        // Return a mock response object shaped like a real axios response
        return Promise.resolve({
          data,
          status: 200,
          statusText: 'OK (Cached Fallback)',
          headers: {},
          config: originalRequest,
        });
      }
    }

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
