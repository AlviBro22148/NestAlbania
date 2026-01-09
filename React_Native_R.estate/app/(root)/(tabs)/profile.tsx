import LanguageSelector from "@/components/LanguageSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useChat } from "@/contexts/ChatContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "../../../constants/icons";

export default function ProfileScreen() {
  const { user, logout, refreshUser, requestAgentRole } = useAuth();
  const { t, i18n } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const { totalUnreadCount, conversations } = useChat();
  const [uploading, setUploading] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [requestingAgent, setRequestingAgent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser(); // Triggers the context to fetch latest user data/role
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  interface SettingsItemProp {
    icon: ImageSourcePropType;
    title: string;
    onPress?: () => void;
    textStyle?: string;
    showArrow?: boolean;
    style?: string;
    tintColor?: string;
  }

  const SettingsItem = ({
    icon,
    title,
    onPress,
    textStyle,
    showArrow = true,
    tintColor,
  }: SettingsItemProp) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-row items-center justify-between py-3"
    >
      <View className="flex flex-row items-center gap-3">
        <Image
          source={icon}
          className="size-6"
          style={tintColor ? { tintColor } : undefined}
        />
        <Text
          className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}
        >
          {title}
        </Text>
      </View>

      {showArrow && <Image source={icons.rightArrow} className="size-5" />}
    </TouchableOpacity>
  );

  const handleLanguageSelect = (langCode: string) => {
    i18n.changeLanguage(langCode);
    const langName = langCode === "en" ? "English 🇺🇸" : "Shqip 🇦🇱";
    // Alert.alert(t("common.success"), `Language changed to ${langName}`);
  };

  // Handle agent role request
  const handleRequestAgentRole = () => {
    showAlert({
      type: "info",
      title: t("profile.becomeAgent") || "Become an Agent",
      message:
        t("profile.becomeAgentConfirm") ||
        "Submit request to become a real estate agent? An administrator will review your application.",
      buttons: [
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: t("profile.requestAgent") || "Request Agent Role",
          onPress: async () => {
            try {
              setRequestingAgent(true);
              await requestAgentRole();

              showAlert({
                type: "success",
                title: t("common.success") || "Success",
                message:
                  t("profile.agentRequestSent") ||
                  "Your agent request has been submitted. An administrator will review it shortly.",
                buttons: [
                  {
                    text: "OK",
                    onPress: () => {
                      refreshUser();
                    },
                  },
                ],
              });
            } catch (error: any) {
              showAlert({
                type: "error",
                title: t("common.error") || "Error",
                message:
                  error.message ||
                  t("errors.requestFailed") ||
                  "Request failed",
              });
            } finally {
              setRequestingAgent(false);
            }
          },
        },
      ],
    });
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        showAlert({
          type: "error",
          title: t("common.error"),
          message:
            "Sorry, we need camera roll permissions to upload a profile picture.",
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
      console.error("Error picking image:", error);
      showToast(t("errors.uploadFailed"), "error");
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);

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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Upload failed");
      }

      await refreshUser();
      showToast(t("profile.profileUpdated"), "success");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      showToast(t("errors.uploadFailed"), "error");
    } finally {
      setUploading(false);
    }
  };

  // Settings array - conditionally show "My Properties" for Agents/Admins only
  const settings = [
    // Admin Dashboard - Only for Admins
    ...(user?.role === "Admin"
      ? [
          {
            icon: icons.people,
            title: t("admin.agentRequests"),
            onPress: () => router.push("/(root)/(admin)/agent-requests"),
            tintColor: "#EF4444",
          },
        ]
      : []),
    // My Properties - Only for Agents and Admins
    ...(user?.role === "Agent" || user?.role === "Admin"
      ? [
          {
            icon: icons.home,
            title: t("profile.myProperties"),
            onPress: () => router.push("/user-properties"),
          },
        ]
      : []),
    {
      icon: icons.heart,
      title: t("profile.likedProperties"),
      onPress: () => router.push("/liked-properties"),
      tintColor: "#FF0000",
    },
    {
      icon: icons.filter,
      title: t("preferences.yourPreferences"),
      onPress: () => router.push("/(root)/(tabs)/edit-preferences"),
      tintColor: "#8B5CF6",
    },
    {
      icon: icons.chart,
      title: t("profile.myReports"),
      onPress: () => router.push("/my-reports"),
      tintColor: "#0061FF",
    },
    // My Chats - Only show when there are conversations
    ...(conversations.length > 0
      ? [
          {
            icon: icons.chat,
            title:
              t("profile.myChats") +
              (totalUnreadCount > 0 ? ` (${totalUnreadCount})` : ""),
            onPress: () => router.push("/chats"),
            tintColor: "#10B981",
          },
        ]
      : []),
    {
      icon: icons.person,
      title: t("profile.title"),
      onPress: () => router.push("/edit-profile"),
    },
    {
      icon: icons.consult,
      title: t("profile.consult"),
      onPress: () => router.push("/financialconsulting"),
    },
    {
      icon: icons.calculator,
      title: t("profile.budgetcalculator"),
      onPress: () => router.push("/budget-calculator"),
    },
    {
      icon: icons.people,
      onPress: () => router.push("/community"),
      title: t("profile.Community"),
    },
    {
      icon: icons.star,
      onPress: () => router.push("/testimonials"),
      title: t("profile.testimonials") || "Testimonials",
      tintColor: "#F59E0B",
    },
    {
      icon: icons.blog,
      onPress: () => router.push("/blog"),
      title: "Blog",
    },
    {
      icon: icons.news,
      onPress: () => router.push("/news"),
      title: t("profile.news"),
    },
    {
      icon: icons.feedback,
      onPress: () => router.push("/feedback"),
      title: t("profile.FeedBack"),
    },
    {
      icon: icons.shield,
      title: t("profile.security"),
      onPress: () => router.push("/security"),
    },
    {
      icon: icons.language,
      title: t("profile.language"),
      onPress: () => setLanguageModalVisible(true),
    },
    {
      icon: icons.info,
      title: t("profile.helpCenter"),
      onPress: () => router.push("/help-center"),
    },
  ];

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0061FF" // Match your primary color
          />
        }
      >
        <View className="flex flex-row items-center justify-between mt-5">
          <Text className="text-xl font-rubik-bold">{t("profile.title")}</Text>
        </View>

        <View className="flex flex-row justify-center mt-5">
          <View className="flex flex-col items-center relative mt-5">
            <View className="relative">
              <Image
                source={{
                  uri:
                    user?.profilePictureUrl ||
                    "https://via.placeholder.com/150",
                }}
                className="size-44 relative rounded-full"
              />

              {uploading && (
                <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                  <ActivityIndicator size="large" color="#ffffff" />
                </View>
              )}

              <TouchableOpacity
                onPress={pickImage}
                disabled={uploading}
                className="absolute bottom-1 right-1 bg-primary-300 rounded-full p-3 shadow-lg"
              >
                <Image
                  source={icons.edit}
                  className="w-8 h-8"
                  tintColor="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <Text className="text-2xl font-rubik-bold mt-2">
              {user?.username}
            </Text>

            {/* Role Badge */}
            <View className="flex-row items-center justify-center mt-2">
              <View
                className={`px-4 py-1 rounded-full ${
                  user?.role === "Admin"
                    ? "bg-red-100"
                    : user?.role === "CityAdmin"
                      ? "bg-orange-100"
                      : user?.role === "Agent"
                        ? "bg-blue-100"
                        : "bg-gray-100"
                }`}
              >
                <Text
                  className={`font-rubik-semibold text-sm ${
                    user?.role === "Admin"
                      ? "text-red-700"
                      : user?.role === "CityAdmin"
                        ? "text-orange-700"
                        : user?.role === "Agent"
                          ? "text-blue-700"
                          : "text-gray-700"
                  }`}
                >
                  {user?.role === "Admin"
                    ? t("profile.roleAdmin") || "Administrator"
                    : user?.role === "CityAdmin"
                      ? `${user?.city || "City"} Admin`
                      : user?.role === "Agent"
                        ? t("profile.roleAgent") || "Agent"
                        : t("profile.roleUser") || "User"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Become an Agent Button - Only for Users (not Admin, CityAdmin, or Agent) */}
        {user?.role === "User" && (
          <View className="mt-6 px-2">
            <TouchableOpacity
              onPress={handleRequestAgentRole}
              disabled={requestingAgent}
              className="bg-blue-600 rounded-xl py-4 px-6 shadow-md"
              style={{
                shadowColor: "#2563EB",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {requestingAgent ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white font-rubik-semibold ml-2">
                    {t("common.loading") || "Loading..."}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-white/20 p-2 rounded-full mr-3">
                      <Image
                        source={icons.home}
                        className="w-6 h-6"
                        tintColor="#FFFFFF"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-rubik-bold text-base">
                        {t("profile.becomeAgent") || "Become an Agent"}
                      </Text>
                      <Text className="text-white/90 font-rubik text-xs mt-1">
                        {t("profile.becomeAgentDesc") ||
                          "List and manage properties"}
                      </Text>
                    </View>
                  </View>
                  <Image
                    source={icons.rightArrow}
                    className="w-5 h-5"
                    tintColor="#FFFFFF"
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
          {settings.map((item, index) => (
            <SettingsItem key={index} {...item} />
          ))}
        </View>

        <View className="flex flex-col border-t mt-5 pt-5 border-primary-200">
          <SettingsItem
            icon={icons.logout}
            title={t("auth.logout")}
            textStyle="text-danger"
            showArrow={false}
            onPress={logout}
          />
        </View>
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={languageModalVisible}
        currentLanguage={i18n.language}
        onClose={() => setLanguageModalVisible(false)}
        onSelectLanguage={handleLanguageSelect}
      />
    </SafeAreaView>
  );
}
