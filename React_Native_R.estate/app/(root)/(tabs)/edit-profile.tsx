import InputModal from "@/components/InputModal";
import icons from "@/constants/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import api from "@/lib/axios-config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileEditScreen() {
  const { user, refreshUser, logout } = useAuth();
  const { showAlert, showToast } = useAlert();
  const { t } = useTranslation();

  // Stats state
  const [stats, setStats] = useState({
    propertyCount: 0,
    memberSince: "N/A",
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoadingStats(true);
      const response = await api.get("/api/auth/stats");
      setStats({
        propertyCount: response.data.propertyCount,
        memberSince: response.data.memberSince,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Form states
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || ""); // ✅ Add this
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    field:
      | "username"
      | "email"
      | "phoneNumber" // ✅ Add this
      | "currentPassword"
      | "newPassword"
      | "confirmPassword";
    title: string;
    placeholder: string;
    value: string;
    setValue: (val: string) => void;
    isPassword?: boolean;
    keyboardType?: "default" | "email-address" | "phone-pad"; // ✅ Add this
  } | null>(null);
  const [tempValue, setTempValue] = useState("");

  const openInputModal = (
    field:
      | "username"
      | "email"
      | "phoneNumber" // ✅ Add this
      | "currentPassword"
      | "newPassword"
      | "confirmPassword",
    title: string,
    placeholder: string,
    value: string,
    setValue: (val: string) => void,
    isPassword: boolean = false,
    keyboardType: "default" | "email-address" | "phone-pad" = "default" // ✅ Add this
  ) => {
    setTempValue(value);
    setModalConfig({
      field,
      title,
      placeholder,
      value,
      setValue,
      isPassword,
      keyboardType,
    });
    setModalVisible(true);
  };

  const saveFromModal = () => {
    if (modalConfig) {
      modalConfig.setValue(tempValue);
    }
    setModalVisible(false);
    setModalConfig(null);
  };

  const pickAndUploadImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert({
          type: "warning",
          title: t("common.error"),
          message: "Please allow access to your photos",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      showToast(t("errors.uploadFailed"), "error");
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) {
        showAlert({
          type: "error",
          title: t("common.error"),
          message: "You are not authenticated",
        });
        return;
      }

      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("file", {
        uri: imageUri,
        type: fileType,
        name: filename,
      } as any);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Auth/upload-profile-picture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      await refreshUser();
      showToast(t("profile.profileUpdated"), "success");
    } catch (error: any) {
      showToast(t("errors.uploadFailed"), "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.usernameEmpty"),
      });
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.invalidEmail"),
      });
      return;
    }

    // ✅ UPDATE PHONE VALIDATION
    if (phoneNumber) {
      // Remove spaces and dashes for validation
      const cleanPhone = phoneNumber.replace(/[\s-]/g, "");

      // Check if it starts with +
      if (!cleanPhone.startsWith("+")) {
        showAlert({
          type: "error",
          title: t("common.error"),
          message: "Phone number must start with country code.\n\nExamples:\n+355 69 123 4567 (Albania)\n+49 170 123 4567 (Germany)\n+1 555 123 4567 (USA)",
        });
        return;
      }

      // Validate format: + followed by 1-15 digits
      if (!/^\+[1-9]\d{1,14}$/.test(cleanPhone)) {
        showAlert({
          type: "error",
          title: t("common.error"),
          message: "Please enter a valid international phone number",
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Send cleaned phone number (without spaces)
      const cleanPhone = phoneNumber ? phoneNumber.replace(/[\s-]/g, "") : "";

      await api.put("/api/auth/update-profile", {
        username: username.trim(),
        email: email.trim(),
        phoneNumber: cleanPhone, // Send cleaned version
      });
      await refreshUser();
      showToast(t("profile.profileUpdated"), "success");
    } catch (error: any) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || t("errors.updateFailed"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.fillAllFields"),
      });
      return;
    }

    if (newPassword.length < 6) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.passwordTooShort"),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.passwordsDoNotMatch"),
      });
      return;
    }

    setLoading(true);
    try {
      await api.put("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      showToast(t("profile.passwordChanged"), "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (error: any) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || t("errors.updateFailed"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    showAlert({
      type: "warning",
      title: t("profile.deleteAccount"),
      message: t("profile.deleteAccountConfirm"),
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ],
    });
  };

  const confirmDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete("/api/auth/delete-account");
      showAlert({
        type: "success",
        title: t("profile.deleteAccount"),
        message: t("profile.accountDeleted"),
        buttons: [
          { text: t("common.done"), onPress: () => logout() },
        ],
      });
    } catch (error: any) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || t("errors.deleteFailed"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={icons.backArrow} className="w-6 h-6" />
        </TouchableOpacity>
        <Text className="text-xl font-rubik-bold text-black-300">
          {t("profile.editProfile")}
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Picture */}
        <View className="items-center py-8">
          <View className="relative">
            <Image
              source={{
                uri:
                  user?.profilePictureUrl || "https://via.placeholder.com/150",
              }}
              className="w-44 h-44 rounded-full border-4 border-primary-100"
            />
            {uploadingImage && (
              <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            )}
            <TouchableOpacity
              onPress={pickAndUploadImage}
              disabled={uploadingImage}
              className="absolute bottom-0 right-0 bg-primary-300 rounded-full p-3 shadow-lg"
            >
              <Image
                source={icons.edit}
                className="w-5 h-5"
                tintColor="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-rubik-bold text-black-300 mt-4">
            {user?.username}
          </Text>
          <Text className="text-sm font-rubik text-gray-500 mt-1">
            {user?.email}
          </Text>
        </View>

        {/* Account Information */}
        <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Text className="text-xl font-rubik-bold text-black-300 mb-4">
            👤 {t("profile.accountInformation")}
          </Text>

          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "username",
                t("auth.username"),
                t("placeholders.enterUsername"),
                username,
                setUsername
              )
            }
            className="mb-4"
          >
            <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
              {t("auth.username")}
            </Text>
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
              <Text className="font-rubik text-base text-black">
                {username}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "email",
                t("auth.email"),
                t("placeholders.enterEmail"),
                email,
                setEmail,
                false,
                "email-address"
              )
            }
            className="mb-4"
          >
            <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
              {t("auth.email")}
            </Text>
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
              <Text className="font-rubik text-base text-black">{email}</Text>
            </View>
          </TouchableOpacity>

          {/* Phone Number Field */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "phoneNumber",
                t("auth.phoneNumber"),
                "+355 69 123 4567", //Update placeholder to show format
                phoneNumber,
                setPhoneNumber,
                false,
                "phone-pad"
              )
            }
            className="mb-4"
          >
            <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
              {t("auth.phoneNumber")}
            </Text>

            {/* HELPER TEXT */}
            <Text className="text-xs text-gray-500 mb-1">
              Include country code (e.g., +355, +49, +1)
            </Text>
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
              <Text
                className={`font-rubik text-base ${phoneNumber ? "text-black" : "text-gray-400"}`}
              >
                {phoneNumber || "+355 69 123 4567"}
              </Text>
            </View>
          </TouchableOpacity>

          <View className="bg-white rounded-xl px-4 py-3 flex-row items-center justify-between">
            <Text className="font-rubik-semibold text-gray-700">
              {t("profile.accountType")}
            </Text>
            <View className="bg-primary-100 px-3 py-1.5 rounded-full">
              <Text className="text-xs font-rubik-bold text-primary-300">
                {user?.role || "User"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleUpdateProfile}
            disabled={loading}
            className="bg-primary-300 rounded-xl py-4 mt-4"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-center font-rubik-bold text-base">
                {t("profile.saveChanges")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Password Section */}
        <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <TouchableOpacity
            onPress={() => setShowPasswordSection(!showPasswordSection)}
            className="flex-row items-center justify-between mb-4"
          >
            <Text className="text-xl font-rubik-bold text-black-300">
              🔒 {t("profile.ChangeYourPassword")}
            </Text>
            <Text className="text-2xl text-primary-300">
              {showPasswordSection ? "−" : "+"}
            </Text>
          </TouchableOpacity>

          {showPasswordSection && (
            <>
              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "currentPassword",
                    t("profile.currentPassword"),
                    t("placeholders.enterPassword"),
                    currentPassword,
                    setCurrentPassword,
                    true
                  )
                }
                className="mb-4"
              >
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  {t("profile.currentPassword")}
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik text-base ${currentPassword ? "text-black" : "text-gray-400"}`}
                  >
                    {currentPassword
                      ? "••••••••"
                      : t("placeholders.enterPassword")}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "newPassword",
                    t("profile.newPassword"),
                    t("placeholders.enterPassword"),
                    newPassword,
                    setNewPassword,
                    true
                  )
                }
                className="mb-4"
              >
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  {t("profile.newPassword")}
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik text-base ${newPassword ? "text-black" : "text-gray-400"}`}
                  >
                    {newPassword ? "••••••••" : t("placeholders.enterPassword")}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "confirmPassword",
                    t("profile.confirmPassword"),
                    t("placeholders.enterPassword"),
                    confirmPassword,
                    setConfirmPassword,
                    true
                  )
                }
                className="mb-4"
              >
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  {t("profile.confirmPassword")}
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik text-base ${confirmPassword ? "text-black" : "text-gray-400"}`}
                  >
                    {confirmPassword
                      ? "••••••••"
                      : t("placeholders.enterPassword")}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={loading}
                className="bg-primary-300 rounded-xl py-4"
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-center font-rubik-bold text-base">
                    {t("profile.changePassword")}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Account Stats */}
        <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Text className="text-xl font-rubik-bold text-black-300 mb-4">
            📊 {t("profile.accountStats")}
          </Text>
          {loadingStats ? (
            <ActivityIndicator size="small" color="#0061FF" />
          ) : (
            <View className="flex-row justify-between">
              <View className="flex-1 items-center bg-white rounded-xl py-4 mr-2">
                <Text className="text-2xl font-rubik-extrabold text-primary-300">
                  {stats.propertyCount}
                </Text>
                <Text className="text-xs font-rubik text-gray-600 mt-1">
                  {stats.propertyCount === 1
                    ? `${t("common.likedProperty")}`
                    : `${t("profile.property")}`}
                </Text>
              </View>
              <View className="flex-1 items-center bg-white rounded-xl py-4 ml-2">
                <Text className="text-2xl font-rubik-extrabold text-primary-300">
                  {stats.memberSince}
                </Text>
                <Text className="text-xs font-rubik text-gray-600 mt-1">
                  {t("profile.memberSince")}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View className="mb-12 bg-red-50 rounded-2xl p-5 border border-red-200">
          <Text className="text-xl font-rubik-bold text-red-600 mb-2">
            ⚠️ {t("profile.dangerZone")}
          </Text>
          <Text className="text-sm font-rubik text-gray-600 mb-4">
            {t("profile.deleteAccountWarning")}
          </Text>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={loading}
            className="bg-red-500 rounded-xl py-4"
          >
            <Text className="text-white text-center font-rubik-bold text-base">
              {t("profile.deleteAccount")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {modalConfig && (
        <InputModal
          visible={modalVisible}
          title={modalConfig.title}
          placeholder={modalConfig.placeholder}
          value={tempValue}
          onChangeText={setTempValue}
          onClose={() => setModalVisible(false)}
          onSave={saveFromModal}
          keyboardType={modalConfig.keyboardType || "default"} // ✅ Update this
          multiline={false}
          numberOfLines={1}
        />
      )}
    </SafeAreaView>
  );
}
