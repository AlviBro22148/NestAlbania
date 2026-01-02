import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

const API_URL = "http://192.168.1.6:5175";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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

// Request interceptor - Add token to every request
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
      await handleLogout();
      return Promise.reject(error);
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
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!refreshToken || !userId) {
        // No tokens available - silently logout without throwing errors
        processQueue(null, null);
        isRefreshing = false;
        await handleLogout();
        // Return a resolved promise to prevent error spam in console
        return Promise.resolve({ data: null });
      }

      // Call refresh endpoint with correct DTO structure
      const response = await axios.post(`${API_URL}/api/auth/refresh-tokens`, {
        userId: userId,
        refreshToken: refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Store new tokens
      await AsyncStorage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
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
      await handleLogout();
      // Return resolved promise instead of rejecting to prevent error spam
      return Promise.resolve({ data: null });
    } 
  }
);

// Centralized logout handler
const handleLogout = async () => {
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId']);
    // Redirect to sign-up page
    router.replace('/auth/sign-up');
  } catch (error) {
    // Silently handle errors during logout
  }
};

// Export utility functions
export const logout = async () => {
  await handleLogout();
  // Return a flag so the app knows to navigate to sign-in
  return true;
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem('accessToken');
  return !!token;
};

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('accessToken');
};

export default api;

