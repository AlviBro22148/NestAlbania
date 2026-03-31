import CustomButton from "@/components/CustomButton";
import InputModal from "@/components/InputModal";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  InteractionManager,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import icons from "@/constants/icons";
import { shadows, shadowsDark } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";

interface NotificationPreferences {
  priceChangeAlerts: boolean;
  statusChangeAlerts: boolean;
  newPropertyAlerts: boolean;
  maxPrice?: number;
  minBedrooms?: number;
  preferredCity?: string;
}

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const { showToast } = useAlert();
  const { isAdmin } = useAuth();
  const { colors, isDark } = useTheme();
  const { pushEnabled, registerPushNotifications, expoPushToken } =
    useNotifications();
  const handleBack = useBackNavigation("/(root)/profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [clearingTokens, setClearingTokens] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    priceChangeAlerts: true,
    statusChangeAlerts: true,
    newPropertyAlerts: false,
  });

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>(null);
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await api.get("/api/notifications/preferences");
      setPreferences(response.data);
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await api.put("/api/notifications/preferences", preferences);
      showToast(t("notificationSettings.saved"), "success");
    } catch (error) {
      console.error("Error saving preferences:", error);
      showToast(t("notificationSettings.errorSaving"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      setEnablingPush(true);
      const success = await registerPushNotifications();
      if (success) {
        showToast(t("notificationSettings.pushEnabled"), "success");
      } else {
        showToast(t("notificationSettings.pushPermissionDenied"), "error");
      }
    } catch (error) {
      console.error("Error enabling push notifications:", error);
      showToast(t("notificationSettings.pushError"), "error");
    } finally {
      setEnablingPush(false);
    }
  };

  const handleTestPushNotification = async () => {
    try {
      setTestingPush(true);
      await api.post("/api/notifications/test-push");
      showToast("Test notification sent! Check your device.", "success");
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      const message =
        error.response?.data?.message || "Failed to send test notification";
      showToast(message, "error");
    } finally {
      setTestingPush(false);
    }
  };

  const handleClearAllTokens = async () => {
    try {
      setClearingTokens(true);
      const response = await api.delete("/api/notifications/debug-clear-all-tokens");
      showToast(`Cleared ${response.data.clearedCount} tokens. Re-enable notifications on each device.`, "success");
    } catch (error: any) {
      console.error("Error clearing tokens:", error);
      const message = error.response?.data?.message || "Failed to clear tokens";
      showToast(message, "error");
    } finally {
      setClearingTokens(false);
    }
  };

  const openInputModal = (
    field: keyof NotificationPreferences,
    title: string,
    placeholder: string,
    currentValue: any,
    keyboardType: any = "default"
  ) => {
    setModalConfig({ field, title, placeholder, keyboardType });
    setTempValue(currentValue?.toString() || "");
    setModalVisible(true);
  };

  const saveFromModal = () => {
    if (modalConfig) {
      const { field } = modalConfig;
      let value: any = tempValue;

      if (field === "maxPrice" || field === "minBedrooms") {
        value = tempValue ? parseFloat(tempValue) : undefined;
      }

      setPreferences({ ...preferences, [field]: value });
    }
    setModalVisible(false);
    setTempValue("");
  };

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[styles.header, { backgroundColor: colors.surface }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
          >
            <Image source={icons.backArrow} style={styles.backIcon} tintColor={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("notificationSettings.title")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t("notificationSettings.infoDesc")}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Info Card */}
        <View className="mt-8 bg-blue-50 rounded-xl p-5 border border-blue-200">
          <Text className="text-blue-800 font-rubik-bold text-base mb-2">
            🔔 {t("notificationSettings.infoTitle")}
          </Text>
          <Text className="text-blue-700 font-rubik text-sm">
            {t("notificationSettings.infoDesc")}
          </Text>
        </View>

        {/* Push Notifications Section */}
        <View className="mt-8">
          <Text className="text-xl font-rubik-bold text-black-300 mb-4">
            {t("notificationSettings.pushNotifications")}
          </Text>

          <View className="bg-gray-50 rounded-xl p-5">
            <View className="flex flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-base font-rubik-bold text-black-300 mb-1">
                  📱 {t("notificationSettings.enablePush")}
                </Text>
                <Text className="text-sm text-black-200 font-rubik">
                  {t("notificationSettings.enablePushDesc")}
                </Text>
              </View>
              {pushEnabled ? (
                <View className="bg-green-100 px-3 py-1.5 rounded-full">
                  <Text className="text-green-700 font-rubik-medium text-sm">
                    {t("common.enabled")}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleEnablePushNotifications}
                  disabled={enablingPush}
                  className="bg-primary-300 px-4 py-2 rounded-full"
                >
                  {enablingPush ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-rubik-medium text-sm">
                      {t("common.enable")}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            {pushEnabled && (
              <View className="mt-3 pt-3 border-t border-gray-200">
                <Text className="text-xs text-gray-500 font-rubik mb-3">
                  {Platform.OS === "ios" ? "iOS" : "Android"} •{" "}
                  {t("notificationSettings.deviceRegistered")}
                </Text>
                <TouchableOpacity
                  onPress={handleTestPushNotification}
                  disabled={testingPush}
                  className="bg-purple-500 px-4 py-2.5 rounded-lg flex-row items-center justify-center"
                >
                  {testingPush ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-rubik-medium text-sm">
                      Send Test Notification
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Admin-only: Clear all tokens for debugging */}
                {isAdmin && (
                  <TouchableOpacity
                    onPress={handleClearAllTokens}
                    disabled={clearingTokens}
                    className="bg-red-500 px-4 py-2.5 rounded-lg flex-row items-center justify-center mt-3"
                  >
                    {clearingTokens ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white font-rubik-medium text-sm">
                        🗑️ Clear ALL Push Tokens (Debug)
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Alert Types */}
        <View className="mt-8">
          <Text className="text-xl font-rubik-bold text-black-300 mb-4">
            {t("notificationSettings.alertTypes")}
          </Text>

          {/* Price Change Alerts */}
          <View className="bg-gray-50 rounded-xl p-5 mb-4">
            <View className="flex flex-row items-center justify-between mb-2">
              <View className="flex-1 mr-4">
                <Text className="text-base font-rubik-bold text-black-300 mb-1">
                  💰 {t("notificationSettings.priceChanges")}
                </Text>
                <Text className="text-sm text-black-200 font-rubik">
                  {t("notificationSettings.priceChangesDesc")}
                </Text>
              </View>
              <Switch
                value={preferences.priceChangeAlerts}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, priceChangeAlerts: value })
                }
                trackColor={{ false: "#D1D5DB", true: "#60A5FA" }}
                thumbColor={
                  preferences.priceChangeAlerts ? "#0061FF" : "#F3F4F6"
                }
              />
            </View>
          </View>

          {/* Status Change Alerts */}
          <View className="bg-gray-50 rounded-xl p-5 mb-4">
            <View className="flex flex-row items-center justify-between mb-2">
              <View className="flex-1 mr-4">
                <Text className="text-base font-rubik-bold text-black-300 mb-1">
                  🔔 {t("notificationSettings.statusChanges")}
                </Text>
                <Text className="text-sm text-black-200 font-rubik">
                  {t("notificationSettings.statusChangesDesc")}
                </Text>
              </View>
              <Switch
                value={preferences.statusChangeAlerts}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, statusChangeAlerts: value })
                }
                trackColor={{ false: "#D1D5DB", true: "#60A5FA" }}
                thumbColor={
                  preferences.statusChangeAlerts ? "#0061FF" : "#F3F4F6"
                }
              />
            </View>
          </View>

          {/* New Property Alerts */}
          <View className="bg-gray-50 rounded-xl p-5 mb-4">
            <View className="flex flex-row items-center justify-between mb-2">
              <View className="flex-1 mr-4">
                <Text className="text-base font-rubik-bold text-black-300 mb-1">
                  🏠 {t("notificationSettings.newProperties")}
                </Text>
                <Text className="text-sm text-black-200 font-rubik">
                  {t("notificationSettings.newPropertiesDesc")}
                </Text>
              </View>
              <Switch
                value={preferences.newPropertyAlerts}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, newPropertyAlerts: value })
                }
                trackColor={{ false: "#D1D5DB", true: "#60A5FA" }}
                thumbColor={
                  preferences.newPropertyAlerts ? "#0061FF" : "#F3F4F6"
                }
              />
            </View>
          </View>
        </View>

        {/* Preferences (shown when new property alerts enabled) */}
        {preferences.newPropertyAlerts && (
          <View className="mt-8">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
              {t("notificationSettings.preferences")}
            </Text>

            {/* Max Price */}
            <TouchableOpacity
              onPress={() =>
                openInputModal(
                  "maxPrice",
                  t("notificationSettings.maxPrice"),
                  "500000",
                  preferences.maxPrice,
                  "numeric"
                )
              }
              className="mb-4"
            >
              <Text className="text-sm font-rubik-medium mb-2">
                {t("notificationSettings.maxPrice")}
              </Text>
              <View className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center">
                <Text className="text-primary-300 font-rubik-bold mr-2">$</Text>
                <Text
                  className={`font-rubik flex-1 ${
                    preferences.maxPrice ? "text-black" : "text-gray-400"
                  }`}
                >
                  {preferences.maxPrice?.toLocaleString() ||
                    t("notificationSettings.anyPrice")}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Min Bedrooms */}
            <TouchableOpacity
              onPress={() =>
                openInputModal(
                  "minBedrooms",
                  t("notificationSettings.minBedrooms"),
                  "2",
                  preferences.minBedrooms,
                  "numeric"
                )
              }
              className="mb-4"
            >
              <Text className="text-sm font-rubik-medium mb-2">
                {t("notificationSettings.minBedrooms")}
              </Text>
              <View className="border border-gray-300 rounded-lg px-4 py-3">
                <Text
                  className={`font-rubik ${
                    preferences.minBedrooms ? "text-black" : "text-gray-400"
                  }`}
                >
                  {preferences.minBedrooms ||
                    t("notificationSettings.anyBedrooms")}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Preferred City */}
            <TouchableOpacity
              onPress={() =>
                openInputModal(
                  "preferredCity",
                  t("notificationSettings.preferredCity"),
                  "New York",
                  preferences.preferredCity,
                  "default"
                )
              }
              className="mb-4"
            >
              <Text className="text-sm font-rubik-medium mb-2">
                {t("notificationSettings.preferredCity")}
              </Text>
              <View className="border border-gray-300 rounded-lg px-4 py-3">
                <Text
                  className={`font-rubik ${
                    preferences.preferredCity ? "text-black" : "text-gray-400"
                  }`}
                >
                  {preferences.preferredCity ||
                    t("notificationSettings.anyCity")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Save Button */}
        <View className="mt-8">
          <CustomButton
            title={saving ? t("common.saving") : t("common.save")}
            onPress={savePreferences}
            className="bg-primary-300"
            disabled={saving}
          />
        </View>

        {/* Tips */}
        <View className="mt-6 bg-yellow-50 rounded-xl p-5 border border-yellow-200">
          <Text className="text-lg font-rubik-bold text-yellow-800 mb-3">
            💡 {t("notificationSettings.tips")}
          </Text>
          <Text className="text-yellow-700 font-rubik text-sm mb-2">
            • {t("notificationSettings.tip1")}
          </Text>
          <Text className="text-yellow-700 font-rubik text-sm mb-2">
            • {t("notificationSettings.tip2")}
          </Text>
          <Text className="text-yellow-700 font-rubik text-sm">
            • {t("notificationSettings.tip3")}
          </Text>
        </View>
      </ScrollView>

      {/* Input Modal */}
      {modalConfig && (
        <InputModal
          visible={modalVisible}
          title={modalConfig.title}
          placeholder={modalConfig.placeholder}
          value={tempValue}
          onChangeText={setTempValue}
          onClose={() => setModalVisible(false)}
          onSave={saveFromModal}
          keyboardType={modalConfig.keyboardType}
          multiline={false}
          numberOfLines={1}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Rubik-Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Rubik-Regular",
    marginTop: 2,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  accentLine: {
    height: 3,
    marginTop: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
});

