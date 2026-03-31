import api, { updateTokenCache, clearTokenCache } from "@/lib/axios-config";
import { authStorage } from "@/lib/storage";
import { router } from "expo-router";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// User type definition with Agent role support
interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string; // "User" | "Agent" | "Admin"
  profilePictureUrl?: string;
  properties?: any[];
  createdAt?: string;
  updatedAt?: string | null;
  // Agent/Admin permissions from backend
  isAgent?: boolean;
  isAdmin?: boolean;
  canCreateProperties?: boolean;
  // Ban status
  isBanned?: boolean;
  banReason?: string;
}

// Login response type
interface LoginResponse {
  requires2FA?: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  isBanned?: boolean;
  banReason?: string;
}

// Auth context type with Agent support
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  // Role check helpers
  isAgent: boolean;
  isAdmin: boolean;
  canCreateProperties: boolean;
  // Ban status
  isBanned: boolean;
  banReason: string | null;
  login: (username: string, password: string) => Promise<LoginResponse>;
  loginWith2FA: (username: string, code: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    phoneNumber: string,
    city: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  requestAgentRole: () => Promise<void>;
  clearBanStatus: () => void;
}

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication status (MMKV is synchronous - much faster!)
  const checkAuth = async () => {
    try {
      // MMKV synchronous check - instant
      if (authStorage.hasTokens()) {
        // Fetch user profile
        await fetchUserProfile();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/api/auth/me");

      const userData = response.data;

      // Check if user is banned
      if (userData.isBanned) {
        setIsBanned(true);
        setBanReason(userData.banReason || "Your account has been banned.");
        setUser(null);
        // Clear tokens (MMKV - synchronous)
        authStorage.clearAll();
        return;
      }

      setIsBanned(false);
      setBanReason(null);

      setUser({
        ...userData,
        isAgent: userData.isAgent ?? userData.role === "Agent",
        isAdmin: userData.isAdmin ?? userData.role === "Admin",
        canCreateProperties:
          userData.canCreateProperties ??
          (userData.role === "Agent" || userData.role === "Admin"),
      });

      // Store userId (MMKV - synchronous)
      authStorage.setUserId(response.data.id.toString());
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Clear tokens on failure
      authStorage.clearAll();
      setUser(null);
    }
  };

  // Login function with 2FA and ban support
  const login = async (
    username: string,
    password: string,
  ): Promise<LoginResponse> => {
    try {
      const response = await api.post("/api/auth/login", {
        username,
        password,
      });

      const data = response.data;

      // Check if user is banned
      if (data.isBanned) {
        setIsBanned(true);
        setBanReason(data.banReason || "Your account has been banned.");
        setUser(null);
        return {
          isBanned: true,
          banReason: data.banReason,
          message: data.message || "Your account has been banned.",
        };
      }

      // Check if 2FA is required
      if (data.requires2FA) {
        return {
          requires2FA: true,
          message: data.message || "Verification code sent to your email",
        };
      }

      // Normal login (no 2FA)
      const { accessToken, refreshToken } = data;

      // Store tokens (MMKV - synchronous, instant!)
      authStorage.setAccessToken(accessToken);
      authStorage.setRefreshToken(refreshToken);

      // Fetch user profile (this saves userId)
      await fetchUserProfile();

      // Update token cache for axios (userId now saved by fetchUserProfile)
      const userId = authStorage.getUserId();
      if (userId) {
        updateTokenCache(accessToken, refreshToken, userId);
      }

      // Navigate to main app
      router.replace("/");

      return { requires2FA: false, isBanned: false };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  // Login with 2FA verification code
  const loginWith2FA = async (username: string, code: string) => {
    try {
      const response = await api.post("/api/auth/login-with-2fa", {
        username,
        code,
      });

      const data = response.data;

      // Check if user is banned
      if (data.isBanned) {
        setIsBanned(true);
        setBanReason(data.banReason || "Your account has been banned.");
        setUser(null);
        throw new Error(data.banReason || "Your account has been banned.");
      }

      const { accessToken, refreshToken } = data;

      // Store tokens (MMKV - synchronous)
      authStorage.setAccessToken(accessToken);
      authStorage.setRefreshToken(refreshToken);

      // Fetch user profile (this saves userId)
      await fetchUserProfile();

      // Update token cache
      const userId = authStorage.getUserId();
      if (userId) {
        updateTokenCache(accessToken, refreshToken, userId);
      }

      // Navigate to main app
      router.replace("/");
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "2FA verification failed",
      );
    }
  };

  // Register function
  const register = async (
    username: string,
    email: string,
    password: string,
    phoneNumber: string,
    city: string,
  ) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
            phoneNumber,
            city,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();

      // Save tokens (MMKV - synchronous)
      authStorage.setAccessToken(data.accessToken);
      authStorage.setRefreshToken(data.refreshToken);

      // Fetch user profile
      const userResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Auth/me`,
        {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
        },
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser({
          ...userData,
          isAgent: userData.isAgent ?? userData.role === "Agent",
          isAdmin: userData.isAdmin ?? userData.role === "Admin",
          canCreateProperties:
            userData.canCreateProperties ??
            (userData.role === "Agent" || userData.role === "Admin"),
        });
        // Store userId (MMKV - synchronous)
        authStorage.setUserId(userData.id.toString());
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Deactivate push token on backend before clearing tokens

      // Clear tokens (MMKV - synchronous, instant!)
      authStorage.clearAll();
      authStorage.clearPushToken();

      // Clear axios token cache
      clearTokenCache();

      // Clear user state
      setUser(null);
      setIsBanned(false);
      setBanReason(null);

      // Navigate to sign-in
      router.replace("/auth/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  // Refresh user data
  const refreshUser = async () => {
    await fetchUserProfile();
  };

  // Request agent role
  const requestAgentRole = useCallback(async () => {
    try {
      const response = await api.post("/api/auth/request-agent-role");
      return Promise.resolve(response.data);
    } catch (error: any) {
      console.error("Error requesting agent role:", error);
      throw new Error(
        error.response?.data?.message || "Failed to request agent role",
      );
    }
  }, []);

  // Clear ban status
  const clearBanStatus = useCallback(() => {
    setIsBanned(false);
    setBanReason(null);
  }, []);

  // Memoize context value
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAgent: user?.role === "Agent" || false,
      isAdmin: user?.role === "Admin" || false,
      canCreateProperties:
        user?.role === "Agent" || user?.role === "Admin" || false,
      isBanned,
      banReason,
      login,
      loginWith2FA,
      register,
      logout,
      refreshUser,
      requestAgentRole,
      clearBanStatus,
    }),
    [user, loading, isBanned, banReason],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
