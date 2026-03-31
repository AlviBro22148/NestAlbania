// contexts/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
  useMemo,
} from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import api from "@/lib/axios-config";
import { authStorage } from "@/lib/storage";
import { useAuth } from "./AuthContext";
import { router } from "expo-router";

// Throttle refresh to prevent API calls during rapid navigation
const REFRESH_THROTTLE_MS = 30000; // 30 seconds

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | null;
  pushEnabled: boolean;
  unreadCount: number;
  registerPushNotifications: () => Promise<boolean>;
  refreshCount: () => Promise<void>;
  incrementCount: () => void;
  decrementCount: () => void;
  setCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastRegisteredUserId = useRef<string | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const hasFetchedCountRef = useRef(false);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Safe push registration function
  const registerPushNotifications = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices");
      return false;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Permission not granted for push notifications");
        return false;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.log("Project ID not found");
        return false;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = tokenData.data;

      if (token) {
        setExpoPushToken(token);
        setPushEnabled(true);

        // Save token to storage for logout cleanup
        authStorage.setPushToken(token);

        if (isAuthenticated) {
          // Safe backend registration
          const currentStoredUserId = authStorage.getUserId();

          const response = await api.post("/api/notifications/push-token", {
            token,
            platform: Platform.OS,
            deviceName: Device.deviceName || `${Platform.OS} Device`,
          });
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#0061FF",
            sound: "default",
          });

          await Notifications.setNotificationChannelAsync("chat", {
            name: "Chat Messages",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#10B981",
            sound: "default",
          });
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error registering for push notifications:", error);
      return false;
    }
  }, [isAuthenticated, user?.id]);

  // Unread notifications (with throttling)
  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      hasFetchedCountRef.current = false;
      return;
    }

    // Throttle: skip if we refreshed recently
    const now = Date.now();
    if (hasFetchedCountRef.current && now - lastRefreshRef.current < REFRESH_THROTTLE_MS) {
      return;
    }

    try {
      lastRefreshRef.current = now;
      const response = await api.get("/api/notifications?unreadOnly=true");
      setUnreadCount(response.data.length);
      hasFetchedCountRef.current = true;
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  }, [isAuthenticated]);

  const incrementCount = useCallback(() => setUnreadCount((prev) => prev + 1), []);
  const decrementCount = useCallback(() => setUnreadCount((prev) => Math.max(0, prev - 1)), []);
  const setCount = useCallback((count: number) => setUnreadCount(Math.max(0, count)), []);

  // Reset push state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setPushEnabled(false);
      lastRegisteredUserId.current = null;
      setExpoPushToken(null);
    }
  }, [isAuthenticated]);

  // Auto-register notifications on login OR when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const previousUserId = lastRegisteredUserId.current;
      const currentUserId = user.id;

      // ALWAYS re-register if user ID is different (including first login)
      if (previousUserId !== currentUserId) {
        lastRegisteredUserId.current = currentUserId;

        // Delay registration to avoid blocking app startup
        const timer = setTimeout(() => {
          registerPushNotifications()
            .then((success) => {})
            .catch((error) => {
              console.error("[Notifications] Registration error:", error);
            });
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user?.id, registerPushNotifications]);

  // Load initial unread count
  useEffect(() => {
    if (isAuthenticated) {
      refreshCount();
    }
  }, [isAuthenticated, refreshCount]);

  // Notification listeners
  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data as
          | Record<string, any>
          | undefined;
        if (data?.type !== "chat") incrementCount();
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, any>
          | undefined;
        if (data?.type === "chat" && data?.conversationId) {
          router.push(`/(root)/chat/${data.conversationId}`);
        } else if (data?.propertyId) {
          router.push(`/(root)/properties/${data.propertyId}` as any);
        } else {
          router.push("/notifications");
        }
      });

    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // CRITICAL: Memoize context value - only primitive values in deps
  // Functions are stable (useCallback with empty deps) so not included
  const value = useMemo(() => ({
    expoPushToken,
    pushEnabled,
    unreadCount,
    registerPushNotifications,
    refreshCount,
    incrementCount,
    decrementCount,
    setCount,
  }), [expoPushToken, pushEnabled, unreadCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return context;
};
