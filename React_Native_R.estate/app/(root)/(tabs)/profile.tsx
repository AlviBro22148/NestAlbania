import LanguageSelector from "@/components/LanguageSelector";
import ThemeSelector from "@/components/ThemeSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useState, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ImageSourcePropType,
  Pressable,
  RefreshControl,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "../../../constants/icons";

// PERFORMANCE: Removed AnimatedPressable and spring animations

// Memoized SettingsItem with animation
interface SettingsItemProps {
  icon: any;
  title: string;
  onPress?: () => void;
  isDanger?: boolean;
  showArrow?: boolean;
  tintColor?: string;
  isChat?: boolean;
  colors: { icon: string; text: string; danger: string; surfaceElevated: string; primary: string };
  isDark: boolean;
}

// ChatBadge component - Decoupled from Profile re-renders
const ChatBadge = memo(() => {
  const { totalUnreadCount } = useChat();
  if (totalUnreadCount === 0) return null;
  
  const { colors } = useTheme();
  
  return (
    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
      <Text style={styles.badgeText}>{totalUnreadCount}</Text>
    </View>
  );
});
ChatBadge.displayName = "ChatBadge";

// PERFORMANCE: Removed spring animations - using simple opacity feedback
const SettingsItem = memo(function SettingsItem({
  icon,
  title,
  onPress,
  isDanger = false,
  showArrow = true,
  tintColor,
  isChat = false,
  colors,
  isDark,
}: SettingsItemProps & { isChat?: boolean }) {
  const cardShadow = isDark ? shadowsDark.xs : shadows.xs;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsItem,
        { backgroundColor: colors.surfaceElevated },
        cardShadow,
        pressed && styles.settingsItemPressed,
      ]}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[
          styles.settingsIconCircle,
          { backgroundColor: isDanger ? '#FEE2E2' : (tintColor ? `${tintColor}15` : colors.surfaceElevated) }
        ]}>
          <ExpoImage
            source={icon}
            style={[
              styles.settingsIcon,
              { tintColor: isDanger ? colors.danger : (tintColor || colors.icon) }
            ]}
            contentFit="contain"
          />
        </View>
        <Text style={[
          styles.settingsItemText,
          { color: isDanger ? colors.danger : colors.text }
        ]}>
          {title}
        </Text>
        {isChat && <ChatBadge />}
      </View>

      <View>
        <ExpoImage
          source={icons.rightArrow}
          style={[styles.arrowIcon, { tintColor: colors.icon }]}
          contentFit="contain"
        />
      </View>
    </Pressable>
  );
});

const ProfileScreen = memo(function ProfileScreen() {
  const { user, logout, refreshUser, requestAgentRole } = useAuth();
  const { t, i18n } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [requestingAgent, setRequestingAgent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const cardShadow = isDark ? shadowsDark.lg : shadows.lg;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  // Memoize colors object for SettingsItem
  const settingsColors = useMemo(() => ({
    icon: colors.icon,
    text: colors.text,
    danger: colors.danger,
    surfaceElevated: colors.surfaceElevated,
    primary: colors.primary,
  }), [colors.icon, colors.text, colors.danger, colors.surfaceElevated, colors.primary]);

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

  // Memoize settings array to prevent rebuilding on every render
  const settings = useMemo(() => [
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
      onPress: () => router.push("/(root)/edit-preferences"),
      tintColor: "#8B5CF6",
    },
    {
      icon: icons.chart,
      title: t("profile.myReports"),
      onPress: () => router.push("/my-reports"),
      tintColor: "#0061FF",
    },
    {
      icon: icons.chat,
      title: t("profile.myChats"),
      onPress: () => router.push("/chats"),
      tintColor: "#10B981",
      isChat: true,
    },
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
      icon: icons.eye,
      title: t("profile.appearance") || "Appearance",
      onPress: () => setThemeModalVisible(true),
      tintColor: "#8B5CF6",
    },
    {
      icon: icons.info,
      title: t("profile.helpCenter"),
      onPress: () => router.push("/help-center"),
    },
  ], [user?.role, t]);

  const renderHeader = useCallback(() => (
    <View style={styles.scrollHeader}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("profile.title")}
        </Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface }, cardShadow]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrapper, cardShadow]}>
            <ExpoImage
              source={{
                uri: user?.profilePictureUrl || "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
              contentFit="cover"
            />
            {uploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            )}
          </View>

          <Pressable
            onPress={pickImage}
            disabled={uploading}
            style={[styles.editButton, { backgroundColor: colors.accent }]}
          >
            <ExpoImage
              source={icons.edit}
              style={styles.editIcon}
              tintColor="#FFFFFF"
              contentFit="contain"
            />
          </Pressable>
        </View>

        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.username}
        </Text>

        {/* Role Badge */}
        <View style={[
          styles.roleBadge,
          {
            backgroundColor:
              user?.role === "Admin" ? '#FEE2E2' :
              user?.role === "CityAdmin" ? '#FFEDD5' :
              user?.role === "Agent" ? '#DBEAFE' : colors.surfaceElevated
          }
        ]}>
          <Text style={[
            styles.roleBadgeText,
            {
              color:
                user?.role === "Admin" ? '#DC2626' :
                user?.role === "CityAdmin" ? '#EA580C' :
                user?.role === "Agent" ? '#2563EB' : colors.textSecondary
            }
          ]}>
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

      {/* Become an Agent Button - Only for Users */}
      {user?.role === "User" && (
        <Pressable
          onPress={handleRequestAgentRole}
          disabled={requestingAgent}
          style={[styles.agentButton, isDark ? shadowsDark.md : shadows.md]}
        >
          {requestingAgent ? (
            <View style={styles.agentButtonLoading}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.agentButtonLoadingText}>
                {t("common.loading") || "Loading..."}
              </Text>
            </View>
          ) : (
            <View style={styles.agentButtonContent}>
              <View style={styles.agentButtonLeft}>
                <View style={styles.agentButtonIconCircle}>
                  <ExpoImage
                    source={icons.home}
                    style={styles.agentButtonIcon}
                    tintColor="#FFFFFF"
                    contentFit="contain"
                  />
                </View>
                <View style={styles.agentButtonTextContainer}>
                  <Text style={styles.agentButtonTitle}>
                    {t("profile.becomeAgent") || "Become an Agent"}
                  </Text>
                  <Text style={styles.agentButtonSubtitle}>
                    {t("profile.becomeAgentDesc") || "List and manage properties"}
                  </Text>
                </View>
              </View>
              <ExpoImage
                source={icons.rightArrow}
                style={styles.agentButtonArrow}
                tintColor="#FFFFFF"
                contentFit="contain"
              />
            </View>
          )}
        </Pressable>
      )}

      {/* Settings Section Title */}
      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t("profile.settings") || "Settings"}
        </Text>
      </View>
    </View>
  ), [user, colors, cardShadow, uploading, pickImage, isDark, requestingAgent, t, handleRequestAgentRole]);

  const renderFooter = useCallback(() => (
    <View style={styles.logoutSection}>
      <SettingsItem
        icon={icons.logout}
        title={t("auth.logout")}
        isDanger={true}
        showArrow={false}
        onPress={logout}
        colors={settingsColors}
        isDark={isDark}
      />
    </View>
  ), [t, logout, settingsColors, isDark]);

  const renderSettingsItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.settingsItemWrapper}>
      <SettingsItem
        {...item}
        colors={settingsColors}
        isDark={isDark}
      />
    </View>
  ), [settingsColors, isDark]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Animated.FlatList
        data={settings}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderSettingsItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={languageModalVisible}
        currentLanguage={i18n.language}
        onClose={() => setLanguageModalVisible(false)}
        onSelectLanguage={handleLanguageSelect}
      />

      {/* Theme Selector Modal */}
      <ThemeSelector
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  accentLine: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    letterSpacing: -0.5,
  },
  profileCard: {
    marginHorizontal: layout.screenPaddingX,
    borderRadius: radius.cardLg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.base,
  },
  avatarWrapper: {
    borderRadius: 80,
    overflow: 'hidden',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    width: 22,
    height: 22,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    marginBottom: spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  roleBadgeText: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
  },
  agentButton: {
    marginHorizontal: layout.screenPaddingX,
    backgroundColor: '#2563EB',
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  agentButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  agentButtonLoadingText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-SemiBold',
    marginLeft: spacing.sm,
  },
  agentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agentButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agentButtonIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  agentButtonIcon: {
    width: 22,
    height: 22,
  },
  agentButtonTextContainer: {
    flex: 1,
  },
  agentButtonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
  },
  agentButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    marginTop: 2,
  },
  agentButtonArrow: {
    width: 20,
    height: 20,
  },
  settingsSection: {
    paddingHorizontal: layout.screenPaddingX,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Rubik-SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  settingsItemWrapper: {
    paddingHorizontal: layout.screenPaddingX,
    marginBottom: spacing.sm,
  },
  scrollHeader: {
    paddingBottom: spacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
  },
  settingsItemPressed: {
    opacity: 0.8,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingsIcon: {
    width: 22,
    height: 22,
  },
  settingsItemText: {
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
  },
  arrowIcon: {
    width: 18,
    height: 18,
    opacity: 0,
  },
  logoutSection: {
    paddingHorizontal: layout.screenPaddingX,
    marginBottom: spacing.xl,
  },
});

export default ProfileScreen;

