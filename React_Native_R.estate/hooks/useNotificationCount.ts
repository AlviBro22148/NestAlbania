import { useNotifications } from "@/contexts/NotificationContext";

/**
 * Hook to access notification count
 * This is now a wrapper around the NotificationContext
 * for backwards compatibility
 */
export const useNotificationCount = () => {
  return useNotifications();
};