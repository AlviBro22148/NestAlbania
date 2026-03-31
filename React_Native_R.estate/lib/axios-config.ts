import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";
import { authStorage } from "./storage";

const API_URL = "http://192.168.1.4:5175";

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add token (MMKV is synchronous, no async needed!)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // MMKV is synchronous - much faster than AsyncStorage
    const token = authStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle token expiration and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If no config or not a 401, reject immediately
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // If we've already retried this request, don't try again
    if (originalRequest._retry) {
      await handleSessionExpired();
      return Promise.resolve({ data: null });
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // MMKV is synchronous - no await needed
      const refreshToken = authStorage.getRefreshToken();
      const userId = authStorage.getUserId();

      if (!refreshToken || !userId) {
        processQueue(null, null);
        isRefreshing = false;
        await handleSessionExpired();
        return Promise.resolve({ data: null });
      }

      // Call refresh endpoint
      const response = await axios.post(`${API_URL}/api/auth/refresh-tokens`, {
        userId: userId,
        refreshToken: refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Store new tokens (MMKV - synchronous)
      authStorage.setAccessToken(accessToken);
      if (newRefreshToken) {
        authStorage.setRefreshToken(newRefreshToken);
      }

      // Update the original request with new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Process queued requests
      processQueue(null, accessToken);
      isRefreshing = false;

      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(null, null);
      isRefreshing = false;
      await handleSessionExpired();
      return Promise.resolve({ data: null });
    }
  },
);

// Handle session expiration - clear tokens and redirect to sign-in
const handleSessionExpired = async () => {
  try {
    // Clear MMKV storage (synchronous)
    authStorage.clearAll();

    // Redirect to sign-in page
    router.replace("/auth/sign-in");
  } catch (error) {
    // Silent fail in production
  }
};

// Export utility functions
export const logout = async () => {
  await handleSessionExpired();
  return true;
};

export const isAuthenticated = (): boolean => {
  // MMKV is synchronous - instant check
  return authStorage.hasTokens();
};

export const getToken = (): string | undefined => {
  return authStorage.getAccessToken();
};

// Legacy function for compatibility (no longer needed with MMKV but kept for API compatibility)
export const updateTokenCache = (
  accessToken: string,
  refreshToken: string,
  userId: string,
) => {
  authStorage.setTokens(accessToken, refreshToken, userId);
};

export const clearTokenCache = () => {
  authStorage.clearAll();
};

export const refreshTokenCache = () => {
  // No-op with MMKV since it's synchronous and always reads from storage
};

export default api;
