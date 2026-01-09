import { useAlert } from "@/contexts/AlertContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";

interface Notification {
  id: number;
  propertyId?: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  property?: {
    id: number;
    title: string;
    price: number;
    image?: string;
  };
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const { refreshCount, decrementCount, setCount } = useNotifications();
  const handleBack = useBackNavigation("/(root)/(tabs)/profile");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      const unreadOnly = filter === "unread";
      const response = await api.get(
        `/api/notifications?unreadOnly=${unreadOnly}`
      );
      setNotifications(response.data);

      // Update the global count based on actual unread notifications
      // When filtering by "unread", the count is the length of returned data
      // When filtering by "all", we need to count the unread ones
      if (unreadOnly) {
        setCount(response.data.length);
      } else {
        const unreadNotifications = response.data.filter(
          (n: Notification) => !n.isRead
        );
        setCount(unreadNotifications.length);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
  }, [filter]);

  const markAsRead = async (notificationId: number) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);

      // Update local state
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );

      // Decrement global count
      decrementCount();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all");

      // Update local state
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));

      // Reset global count to 0
      setCount(0);

      showToast(t("notifications.allMarkedRead"), "success");
    } catch (error) {
      console.error("Error marking all as read:", error);
      showToast(t("notifications.errorMarkingRead"), "error");
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      // Find the notification before deleting to check if it was unread
      const notification = notifications.find((n) => n.id === notificationId);
      const wasUnread = notification && !notification.isRead;

      await api.delete(`/api/notifications/${notificationId}`);

      // Update local state
      setNotifications(notifications.filter((n) => n.id !== notificationId));

      // If the deleted notification was unread, decrement the global count
      if (wasUnread) {
        decrementCount();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      showToast(t("notifications.errorDeleting"), "error");
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.propertyId) {
      router.push(`/(root)/properties/${notification.propertyId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "PriceChange":
        return "💰";
      case "StatusChange":
        return "🔔";
      case "NewProperty":
        return "🏠";
      case "AgentApproved":
      case "AgentRequestApproved":
        return "✅";
      case "AgentDeclined":
      case "AgentRequestRejected":
        return "❌";
      case "FeedbackResolved":
        return "🎉";
      default:
        return "📬";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t("notifications.justNow");
    if (seconds < 3600)
      return `${Math.floor(seconds / 60)}${t("notifications.minutesAgo")}`;
    if (seconds < 86400)
      return `${Math.floor(seconds / 3600)}${t("notifications.hoursAgo")}`;
    if (seconds < 604800)
      return `${Math.floor(seconds / 86400)}${t("notifications.daysAgo")}`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <SafeAreaView className="h-full bg-white flex items-center justify-center">
        <ActivityIndicator size="large" color="#0061FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white">
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-200">
        <View className="flex flex-row items-center justify-between mb-4">
          <View className="flex flex-row items-center">
            <TouchableOpacity onPress={handleBack} className="mr-3">
              <Image source={icons.backArrow} className="w-6 h-6" />
            </TouchableOpacity>
            <Text className="text-2xl font-rubik-bold text-black-300">
              {t("notifications.title")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/notification-settings")}
          >
            <Image source={icons.settings} className="w-6 h-6" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View className="flex flex-row gap-2">
          <TouchableOpacity
            onPress={() => setFilter("all")}
            className={`flex-1 py-2 rounded-lg ${
              filter === "all" ? "bg-primary-300" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-center font-rubik-semibold ${
                filter === "all" ? "text-white" : "text-black-300"
              }`}
            >
              {t("notifications.all")} ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("unread")}
            className={`flex-1 py-2 rounded-lg ${
              filter === "unread" ? "bg-primary-300" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-center font-rubik-semibold ${
                filter === "unread" ? "text-white" : "text-black-300"
              }`}
            >
              {t("notifications.unread")} ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mark All Read Button */}
      {unreadCount > 0 && (
        <View className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <TouchableOpacity
            onPress={markAllAsRead}
            className="flex flex-row items-center justify-center"
          >
            <Text className="text-primary-300 font-rubik-semibold">
              {t("notifications.markAllRead")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0061FF"
          />
        }
      >
        {notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-6xl mb-4">📬</Text>
            <Text className="text-xl font-rubik-bold text-black-300 mb-2">
              {t("notifications.noNotifications")}
            </Text>
            <Text className="text-base text-black-200 font-rubik text-center px-10">
              {t("notifications.noNotificationsDesc")}
            </Text>
          </View>
        ) : (
          <View className="px-5 py-4">
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                className={`mb-3 rounded-xl border p-4 ${
                  notification.isRead
                    ? "bg-white border-gray-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <View className="flex flex-row">
                  {/* Icon */}
                  <View className="mr-3">
                    <Text className="text-3xl">
                      {getNotificationIcon(notification.type)}
                    </Text>
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex flex-row items-start justify-between mb-1">
                      <Text className="text-base font-rubik-bold text-black-300 flex-1">
                        {notification.title}
                      </Text>
                      {!notification.isRead && (
                        <View className="w-2 h-2 bg-primary-300 rounded-full ml-2 mt-1" />
                      )}
                    </View>

                    <Text className="text-sm text-black-200 font-rubik mb-2">
                      {notification.message}
                    </Text>

                    {/* Property Preview */}
                    {notification.property && (
                      <View className="flex flex-row items-center mt-2 p-2 bg-white rounded-lg">
                        {notification.property.image && (
                          <Image
                            source={{ uri: notification.property.image }}
                            className="w-12 h-12 rounded-lg mr-2"
                          />
                        )}
                        <View className="flex-1">
                          <Text
                            className="text-sm font-rubik-semibold text-black-300"
                            numberOfLines={1}
                          >
                            {notification.property.title}
                          </Text>
                          <Text className="text-xs text-primary-300 font-rubik-bold">
                            ${notification.property.price.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View className="flex flex-row items-center justify-between mt-2">
                      <Text className="text-xs text-gray-500 font-rubik">
                        {getTimeAgo(notification.createdAt)}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          showAlert({
                            type: "warning",
                            title: t("notifications.deleteTitle"),
                            message: t("notifications.deleteMessage"),
                            buttons: [
                              { text: t("common.cancel"), style: "cancel" },
                              {
                                text: t("common.delete"),
                                style: "destructive",
                                onPress: () =>
                                  deleteNotification(notification.id),
                              },
                            ],
                          });
                        }}
                        className="p-1"
                      >
                        <Image
                          source={icons.trash}
                          className="w-4 h-4"
                          tintColor="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
