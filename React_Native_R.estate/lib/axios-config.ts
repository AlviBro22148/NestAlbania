import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

const API_URL = "http://192.168.1.5:5175";

// In-memory token cache to avoid AsyncStorage reads on every request
let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;
let cachedUserId: string | null = null;

// Initialize token cache from AsyncStorage
const initTokenCache = async () => {
  cachedAccessToken = await AsyncStorage.getItem('accessToken');
  cachedRefreshToken = await AsyncStorage.getItem('refreshToken');
  cachedUserId = await AsyncStorage.getItem('userId');
};

// Call on app start
initTokenCache();

// Request deduplication - prevent duplicate in-flight requests
const pendingRequests = new Map<string, Promise<any>>();

const getRequestKey = (config: InternalAxiosRequestConfig): string => {
  return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`;
};

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Slightly longer timeout for slow networks
  headers: {
    'Content-Type': 'application/json',
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

// Request interceptor - Add token using cached value (faster than AsyncStorage)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Use cached token for faster access
    if (cachedAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${cachedAccessToken}`;
    } else {
      // Fallback to AsyncStorage if cache is empty
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        cachedAccessToken = token;
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
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
      // Use cached values first, fallback to AsyncStorage
      const refreshToken = cachedRefreshToken || await AsyncStorage.getItem('refreshToken');
      const userId = cachedUserId || await AsyncStorage.getItem('userId');

      if (!refreshToken || !userId) {
        // No tokens available - handle session expiration and redirect
        processQueue(null, null);
        isRefreshing = false;
        await handleSessionExpired();
        return Promise.resolve({ data: null });
      }

      // Call refresh endpoint with correct DTO structure
      const response = await axios.post(`${API_URL}/api/auth/refresh-tokens`, {
        userId: userId,
        refreshToken: refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Store new tokens and update cache
      await AsyncStorage.setItem('accessToken', accessToken);
      cachedAccessToken = accessToken;
      if (newRefreshToken) {
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        cachedRefreshToken = newRefreshToken;
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
  }
);

// Handle session expiration - clear tokens and redirect to sign-in
const handleSessionExpired = async () => {
  try {
    // Clear both cache and AsyncStorage
    cachedAccessToken = null;
    cachedRefreshToken = null;
    cachedUserId = null;
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId']);

    // Redirect to sign-in page
    // Use replace to prevent going back to authenticated pages
    router.replace('/auth/sign-in');
  } catch (error) {
    // Silent fail in production
  }
};

// Export utility functions
export const logout = async () => {
  await handleSessionExpired();
  return true;
};

export const isAuthenticated = async (): Promise<boolean> => {
  // Use cached value first for faster check
  if (cachedAccessToken) return true;
  const token = await AsyncStorage.getItem('accessToken');
  if (token) cachedAccessToken = token;
  return !!token;
};

export const getToken = async (): Promise<string | null> => {
  // Use cached value first
  if (cachedAccessToken) return cachedAccessToken;
  const token = await AsyncStorage.getItem('accessToken');
  if (token) cachedAccessToken = token;
  return token;
};

// Update cache when tokens are set externally (e.g., after login)
export const updateTokenCache = (accessToken: string, refreshToken: string, userId: string) => {
  cachedAccessToken = accessToken;
  cachedRefreshToken = refreshToken;
  cachedUserId = userId;
};

// Refresh the token cache from AsyncStorage
export const refreshTokenCache = async () => {
  await initTokenCache();
};

export default api;