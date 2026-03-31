import CustomButton from "@/components/CustomButton";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import icons from "../../../constants/icons";
import { shadows, shadowsDark } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";

export default function SecurityScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");
  const [loading, setLoading] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [actionType, setActionType] = useState<"enable" | "disable">("enable");

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/TwoFactor/status");
      setIs2FAEnabled(response.data.isEnabled);
    } catch (error) {
      console.error("Error checking 2FA status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!password) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("security.enterPassword"),
      });
      return;
    }

    try {
      setProcessing(true);
      await api.post("/api/TwoFactor/enable", { password });
      setShowPasswordModal(false);
      setPassword("");
      setShowVerifyModal(true);
      showToast(t("security.codeSent"), "success");
    } catch (error: any) {
      console.error("Error enabling 2FA:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || t("security.failedEnable"),
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("security.enterCode"),
      });
      return;
    }

    try {
      setProcessing(true);
      await api.post("/api/TwoFactor/verify", { code: verificationCode });
      setShowVerifyModal(false);
      setVerificationCode("");
      setIs2FAEnabled(true);
      showToast(t("security.enabled2FA"), "success");
    } catch (error: any) {
      console.error("Error verifying code:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || t("security.failedVerify"),
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable2FA = async () => {
    showAlert({
      type: "warning",
      title: t("security.disableConfirm"),
      message: t("security.disableMessage"),
      buttons: [
        { text: t("security.cancel"), style: "cancel" },
        {
          text: t("security.disable"),
          style: "destructive",
          onPress: () => {
            setActionType("disable");
            setShowPasswordModal(true);
          },
        },
      ],
    });
  };

  const handleDisableConfirm = async () => {
    if (!password) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("security.enterPassword"),
      });
      return;
    }

    try {
      setProcessing(true);
      await api.post("/api/TwoFactor/disable", { password });
      setShowPasswordModal(false);
      setPassword("");
      setIs2FAEnabled(false);
      showToast(t("security.disabled2FA"), "success");
    } catch (error: any) {
      console.error("Error disabling 2FA:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || t("security.failedDisable"),
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setProcessing(true);
      await api.post("/api/TwoFactor/resend-code");
      showToast(t("security.codeResent"), "success");
    } catch (error: any) {
      console.error("Error resending code:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || t("security.failedResend"),
      });
    } finally {
      setProcessing(false);
    }
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t("security.title")}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t("security.description")}
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

        <View className="mt-8">
          <View className="rounded-xl p-6" style={{ backgroundColor: isDark ? colors.surface : "#E0EDFF" }}>
            <View className="flex flex-row items-center mb-4">
              <Image source={icons.shield} className="w-8 h-8 mr-3" style={{ tintColor: colors.primary }} />
              <Text className="text-xl font-rubik-bold" style={{ color: colors.text }}>
                {t("security.twoFactorAuth")}
              </Text>
            </View>

            <Text className="font-rubik mb-4" style={{ color: colors.textSecondary }}>
              {t("security.description")}
            </Text>

            <View className="flex flex-row items-center justify-between rounded-lg p-4 mb-4" style={{ backgroundColor: colors.surface }}>
              <Text className="font-rubik-medium" style={{ color: colors.text }}>
                {t("security.status")}:
              </Text>
              <View
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: is2FAEnabled ? (isDark ? "#10B98120" : "#D1FAE5") : colors.surfaceElevated }}
              >
                <Text
                  className="font-rubik-semibold"
                  style={{ color: is2FAEnabled ? "#10B981" : colors.textSecondary }}
                >
                  {is2FAEnabled
                    ? t("security.enabled")
                    : t("security.disabled")}
                </Text>
              </View>
            </View>

            <View className="flex flex-row items-center rounded-lg p-4" style={{ backgroundColor: colors.surface }}>
              <Image source={icons.email} className="w-5 h-5 mr-2" style={{ tintColor: colors.textSecondary }} />
              <Text className="font-rubik flex-1" style={{ color: colors.textSecondary }}>
                {user?.email}
              </Text>
            </View>
          </View>

          <View className="mt-6">
            {!is2FAEnabled ? (
              <CustomButton
                title={t("security.enable")}
                onPress={() => {
                  setActionType("enable");
                  setShowPasswordModal(true);
                }}
                className="bg-primary-300"
              />
            ) : (
              <CustomButton
                title={t("security.disable")}
                onPress={handleDisable2FA}
                className="bg-red-500"
              />
            )}
          </View>

          <View className="mt-6 rounded-xl p-4" style={{ backgroundColor: isDark ? colors.surface : "#EFF6FF" }}>
            <Text className="font-rubik-medium mb-2" style={{ color: isDark ? colors.primary : "#1E40AF" }}>
              {t("security.howItWorks")}
            </Text>
            <Text className="font-rubik text-sm" style={{ color: isDark ? colors.textSecondary : "#1D4ED8" }}>
              {t("security.howItWorksDetails")}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPassword("");
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-7">
            <View className="rounded-2xl p-6 w-full" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xl font-rubik-bold mb-4" style={{ color: colors.text }}>
                {t("security.confirmPassword")}
              </Text>
              <Text className="font-rubik mb-4" style={{ color: colors.textSecondary }}>
                {t("security.enterPasswordPrompt")}
              </Text>

              <TextInput
                className="border rounded-lg px-4 py-3 font-rubik mb-4"
                style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceElevated }}
                placeholder={t("security.enterPassword")}
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <View className="flex flex-row gap-3">
                <CustomButton
                  title={t("security.cancel")}
                  onPress={() => {
                    setShowPasswordModal(false);
                    setPassword("");
                  }}
                  className="flex-1"
                  style={{ backgroundColor: colors.surfaceElevated }}
                  textVariant="primary"
                />
                <CustomButton
                  title={
                    processing ? t("security.processing") : t("security.confirm")
                  }
                  onPress={
                    actionType === "enable"
                      ? handleEnable2FA
                      : handleDisableConfirm
                  }
                  className="bg-primary-300 flex-1"
                  disabled={processing}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showVerifyModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setShowVerifyModal(false);
          setVerificationCode("");
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-7">
            <View className="rounded-2xl p-6 w-full" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xl font-rubik-bold mb-4" style={{ color: colors.text }}>
                {t("security.enterVerificationCode")}
              </Text>
              <Text className="font-rubik mb-4" style={{ color: colors.textSecondary }}>
                {t("security.codeSentTo")} {user?.email}
              </Text>
              <TextInput
                className="border rounded-lg px-4 py-3 font-rubik text-center text-2xl tracking-widest mb-4"
                style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceElevated }}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
              />

              <TouchableOpacity
                onPress={handleResendCode}
                className="mb-4"
                disabled={processing}
              >
                <Text className="font-rubik-medium text-center" style={{ color: colors.primary }}>
                  {t("security.resendCode")}
                </Text>
              </TouchableOpacity>

              <View className="flex flex-row gap-3">
                <CustomButton
                  title={t("security.cancel")}
                  onPress={() => {
                    setShowVerifyModal(false);
                    setVerificationCode("");
                  }}
                  className="flex-1"
                  style={{ backgroundColor: colors.surfaceElevated }}
                  textVariant="primary"
                />
                <CustomButton
                  title={
                    processing ? t("security.verifying") : t("security.verify")
                  }
                  onPress={handleVerifyCode}
                  className="bg-primary-300 flex-1"
                  disabled={processing}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

