import CustomButton from "@/components/CustomButton";
import InputModal from "@/components/InputModal";
import { useAlert } from "@/contexts/AlertContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";

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
  const handleBack = useBackNavigation("/(root)/(tabs)/profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  if (loading) {
    return (
      <SafeAreaView className="h-full bg-white flex items-center justify-center">
        <ActivityIndicator size="large" color="#0061FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
      >
        {/* Header */}
        <View className="flex flex-row items-center justify-between mt-5">
          <TouchableOpacity onPress={handleBack}>
            <Image source={icons.backArrow} className="w-6 h-6" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold">
            {t("notificationSettings.title")}
          </Text>
          <View className="w-6" />
        </View>

        {/* Info Card */}
        <View className="mt-8 bg-blue-50 rounded-xl p-5 border border-blue-200">
          <Text className="text-blue-800 font-rubik-bold text-base mb-2">
            🔔 {t("notificationSettings.infoTitle")}
          </Text>
          <Text className="text-blue-700 font-rubik text-sm">
            {t("notificationSettings.infoDesc")}
          </Text>
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
