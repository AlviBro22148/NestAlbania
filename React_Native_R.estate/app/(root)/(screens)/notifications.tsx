import { useAlert } from "@/contexts/AlertContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
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
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

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
      <SafeAreaView className="h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }, cardShadow]}>
        <View style={styles.headerRow}>
          <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("notifications.title")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/notification-settings")}
            style={[styles.settingsButton, { backgroundColor: colors.surfaceElevated }]}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilter("all")}
            style={[
              styles.filterTab,
              { backgroundColor: filter === "all" ? colors.primary : colors.surfaceElevated },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === "all" ? "#FFFFFF" : colors.text },
              ]}
            >
              {t("notifications.all")} ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("unread")}
            style={[
              styles.filterTab,
              { backgroundColor: filter === "unread" ? colors.primary : colors.surfaceElevated },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === "unread" ? "#FFFFFF" : colors.text },
              ]}
            >
              {t("notifications.unread")} ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mark All Read Button */}
      {unreadCount > 0 && (
        <View style={[styles.markAllContainer, { backgroundColor: colors.surfaceElevated }]}>
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            <Ionicons name="checkmark-done" size={18} color={colors.accent} />
            <Text style={[styles.markAllText, { color: colors.accent }]}>
              {t("notifications.markAllRead")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="notifications-outline" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("notifications.noNotifications")}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {t("notifications.noNotificationsDesc")}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {notifications.map((notification, index) => (
              <Animated.View
                key={notification.id}
                entering={FadeInDown.duration(300).delay(index * 50)}
              >
                <TouchableOpacity
                  onPress={() => handleNotificationPress(notification)}
                  style={[
                    styles.notificationCard,
                    {
                      backgroundColor: notification.isRead ? colors.surface : colors.primaryLight,
                      borderColor: notification.isRead ? colors.border : colors.primary,
                    },
                    cardShadow,
                  ]}
                >
                  <View style={styles.notificationRow}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={styles.iconEmoji}>
                        {getNotificationIcon(notification.type)}
                      </Text>
                    </View>

                    {/* Content */}
                    <View style={styles.notificationContent}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.notificationTitle, { color: colors.text }]}>
                          {notification.title}
                        </Text>
                        {!notification.isRead && (
                          <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
                        )}
                      </View>

                      <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                        {notification.message}
                      </Text>

                      {/* Property Preview */}
                      {notification.property && (
                        <View style={[styles.propertyPreview, { backgroundColor: colors.surfaceElevated }]}>
                          {notification.property.image && (
                            <Image
                              source={{ uri: notification.property.image }}
                              style={styles.propertyImage}
                            />
                          )}
                          <View style={styles.propertyDetails}>
                            <Text
                              style={[styles.propertyTitle, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {notification.property.title}
                            </Text>
                            <Text style={[styles.propertyPrice, { color: colors.accent }]}>
                              ${notification.property.price.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      )}

                      <View style={styles.notificationFooter}>
                        <Text style={[styles.timeText, { color: colors.textMuted }]}>
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
                          style={styles.deleteButton}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomLeftRadius: radius.cardLg,
    borderBottomRightRadius: radius.cardLg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  accentLine: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    letterSpacing: -0.3,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  filterTabText: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
  },
  markAllContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  markAllText: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIconContainer: {
    padding: spacing.xl,
    borderRadius: radius.full,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontFamily: 'Rubik-Bold',
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  notificationCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  notificationRow: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconEmoji: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontFamily: 'Rubik-Bold',
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
    marginTop: 6,
  },
  notificationMessage: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  propertyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  propertyImage: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  propertyDetails: {
    flex: 1,
  },
  propertyTitle: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 13,
  },
  propertyPrice: {
    fontFamily: 'Rubik-Bold',
    fontSize: 12,
    marginTop: 2,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 11,
  },
  deleteButton: {
    padding: spacing.xs,
  },
});

