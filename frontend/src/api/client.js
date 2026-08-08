import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage';

export const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isRefreshRequest = originalRequest?.url?.includes('/api/accounts/login/refresh/');

    if (status !== 401 || originalRequest?._retry || isRefreshRequest) {
      return Promise.reject(error);
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      clearTokens();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // ROTATE_REFRESH_TOKENS is enabled: when the backend sends a new refresh
      // token, save it immediately so the next refresh uses the latest token.
      refreshPromise ??= axios.post(`${API_BASE_URL}/api/accounts/login/refresh/`, { refresh });
      const { data } = await refreshPromise;
      refreshPromise = null;

      setTokens({ access: data.access, refresh: data.refresh });
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      clearTokens();
      window.dispatchEvent(new Event('auth:logout'));
      window.location.assign('/login');
      return Promise.reject(refreshError);
    }
  },
);
