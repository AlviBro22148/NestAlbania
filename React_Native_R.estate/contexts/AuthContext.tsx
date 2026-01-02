import api from "@/lib/axios-config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
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
    phoneNumber: string
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

  // Check authentication status
  const checkAuth = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (accessToken && refreshToken) {
        // Fetch user profile
        await fetchUserProfile();
      } else {
        // No tokens found - redirect to sign-up
        setUser(null);
        router.replace("/auth/sign-up");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
      // On error, redirect to sign-up
      router.replace("/auth/sign-up");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/api/auth/me");

      // Backend now returns isAgent, isAdmin, canCreateProperties
      const userData = response.data;

      // Check if user is banned
      if (userData.isBanned) {
        setIsBanned(true);
        setBanReason(userData.banReason || "Your account has been banned.");
        setUser(null);
        // Clear tokens
        await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId"]);
        return;
      }

      setIsBanned(false);
      setBanReason(null);

      setUser({
        ...userData,
        // Ensure these fields exist (fallback to calculated values if backend doesn't send them)
        isAgent: userData.isAgent ?? userData.role === "Agent",
        isAdmin: userData.isAdmin ?? userData.role === "Admin",
        canCreateProperties:
          userData.canCreateProperties ??
          (userData.role === "Agent" || userData.role === "Admin"),
      });

      // Store userId for token refresh
      await AsyncStorage.setItem("userId", response.data.id.toString());
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // If fetching profile fails, clear tokens
      await logout();
    }
  };

  // Login function with 2FA and ban support
  const login = async (
    username: string,
    password: string
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

      // Store tokens
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);

      // Fetch user profile
      await fetchUserProfile();

      // Store userId after fetching profile
      if (user) {
        await AsyncStorage.setItem("userId", user.id.toString());
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

      // Store tokens
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);

      // Fetch user profile
      await fetchUserProfile();

      // Store userId after fetching profile
      if (user) {
        await AsyncStorage.setItem("userId", user.id.toString());
      }

      // Navigate to main app
      router.replace("/");
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "2FA verification failed"
      );
    }
  };

  // Register function
  const register = async (
    username: string,
    email: string,
    password: string,
    phoneNumber: string
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();

      // Save tokens
      await AsyncStorage.setItem("accessToken", data.accessToken);
      await AsyncStorage.setItem("refreshToken", data.refreshToken);

      // Fetch user profile
      const userResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Auth/me`,
        {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
        }
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
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear tokens from storage
      await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId"]);

      // Clear user state
      setUser(null);
      setIsBanned(false);
      setBanReason(null);

      // Navigate to sign-in
      router.replace("/auth/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    await fetchUserProfile();
  };

  // Request agent role
  const requestAgentRole = async () => {
    try {
      const response = await api.post("/api/auth/request-agent-role");

      // Return success message from backend
      return Promise.resolve(response.data);
    } catch (error: any) {
      console.error("Error requesting agent role:", error);
      throw new Error(
        error.response?.data?.message || "Failed to request agent role"
      );
    }
  };

  // Clear ban status (used when user acknowledges ban and goes to login)
  const clearBanStatus = () => {
    setIsBanned(false);
    setBanReason(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    // Role check helpers
    isAgent: user?.role === "Agent" || false,
    isAdmin: user?.role === "Admin" || false,
    canCreateProperties:
      user?.role === "Agent" || user?.role === "Admin" || false,
    // Ban status
    isBanned,
    banReason,
    login,
    loginWith2FA,
    register,
    logout,
    refreshUser,
    requestAgentRole,
    clearBanStatus,
  };

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
