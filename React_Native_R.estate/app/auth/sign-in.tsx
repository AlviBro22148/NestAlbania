import BannedScreen from "@/components/BannedScreen";
import CustomButton from "@/components/CustomButton";
import InputModal from "@/components/InputModal";
import images from "@/constants/images";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignIn() {
  const { login, loginWith2FA, isBanned } = useAuth();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Input Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>(null);
  const [tempValue, setTempValue] = useState("");

  // 2FA Modal states
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  // Animation values
  const buttonScale = useSharedValue(1);
  const cardShadow = isDark ? shadowsDark.lg : shadows.lg;

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const openInputModal = (
    field: string,
    title: string,
    placeholder: string,
    currentValue: string,
    setValue: (value: string) => void,
    keyboardType: any = "default",
    isSecure: boolean = false
  ) => {
    setModalConfig({
      field,
      title,
      placeholder,
      setValue,
      keyboardType,
      isSecure,
    });
    setTempValue(currentValue);
    setModalVisible(true);
  };

  const saveFromModal = () => {
    if (modalConfig) {
      modalConfig.setValue(tempValue);
    }
    setModalVisible(false);
    setTempValue("");
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: "Please fill in all fields",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await login(username, password);

      // Check if user is banned
      if (response.isBanned) {
        // The BannedScreen will be shown automatically via isBanned state
        return;
      }

      // Check if 2FA is required
      if (response.requires2FA) {
        setTempUsername(username);
        setShow2FAModal(true);
      }
      // If no 2FA, user is automatically logged in by the login function
    } catch (error: any) {
      showAlert({
        type: "error",
        title: "Login Failed",
        message: error.message || "Invalid credentials",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: "Please enter the 6-digit code",
      });
      return;
    }

    try {
      setVerifying(true);
      await loginWith2FA(tempUsername, verificationCode);

      // Success - user will be redirected by loginWith2FA
      setShow2FAModal(false);
      setVerificationCode("");
      setUsername("");
      setPassword("");
    } catch (error: any) {
      showAlert({
        type: "error",
        title: "Verification Failed",
        message: error.message || "Invalid code",
      });
    } finally {
      setVerifying(false);
    }
  };

  // Show banned screen if user is banned
  if (isBanned) {
    return <BannedScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <Image
            resizeMode="contain"
            source={images.onboarding}
            style={styles.heroImage}
          />
        </Animated.View>

        {/* Form Card */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(200)}
          style={[styles.formCard, { backgroundColor: colors.surface }, cardShadow]}
        >
          {/* Title Text */}
          <View style={styles.headerContainer}>
            <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
            <Text style={[styles.title, { color: colors.text }]}>
              {t("auth.welcomeBack")}
            </Text>
          </View>

          {/* Username Input */}
          <Pressable
            onPress={() =>
              openInputModal(
                "username",
                t("auth.username"),
                t("placeholders.enterUsername"),
                username,
                setUsername
              )
            }
            disabled={loading}
            style={styles.inputContainer}
          >
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {t("auth.username")}
            </Text>
            <View style={[styles.inputField, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[
                styles.inputText,
                { color: username ? colors.text : colors.textMuted }
              ]}>
                {username || t("placeholders.enterUsername")}
              </Text>
            </View>
          </Pressable>

          {/* Password Input */}
          <Pressable
            onPress={() =>
              openInputModal(
                "password",
                t("auth.password"),
                t("placeholders.enterPassword"),
                password,
                setPassword,
                "default",
                true
              )
            }
            disabled={loading}
            style={styles.inputContainer}
          >
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {t("auth.password")}
            </Text>
            <View style={[styles.inputField, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[
                styles.inputText,
                { color: password ? colors.text : colors.textMuted }
              ]}>
                {password ? "••••••••" : t("placeholders.enterPassword")}
              </Text>
            </View>
          </Pressable>

          {/* Submit Button */}
          <AnimatedPressable
            onPress={handleLogin}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            disabled={loading}
            style={[
              styles.submitButton,
              { backgroundColor: colors.accent },
              buttonAnimatedStyle,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {t("auth.signIn")}
              </Text>
            )}
          </AnimatedPressable>

          {/* Toggle to Register */}
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
              {t("auth.dontHaveAccount")}
            </Text>
            <Pressable
              onPress={() => router.push("/auth/sign-up")}
              disabled={loading}
            >
              <Text style={[styles.toggleLink, { color: colors.primary }]}>
                {t("auth.register")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.ScrollView>

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
          keyboardType={modalConfig.keyboardType || "default"}
          multiline={false}
          numberOfLines={1}
          secureTextEntry={modalConfig.isSecure}
        />
      )}

      {/* 2FA Verification Modal */}
      <Modal
        visible={show2FAModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setShow2FAModal(false);
          setVerificationCode("");
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={styles.modalContainer}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface }, cardShadow]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("security.twoFactorAuth")}
              </Text>
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                {t("security.description")}
              </Text>

              <TextInput
                style={[
                  styles.codeInput,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.primary, color: colors.text }
                ]}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => {
                    setShow2FAModal(false);
                    setVerificationCode("");
                  }}
                  style={[styles.modalButtonSecondary, { backgroundColor: colors.surfaceElevated }]}
                >
                  <Text style={[styles.modalButtonSecondaryText, { color: colors.text }]}>
                    {t("security.cancel")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleVerify2FA}
                  disabled={verifying}
                  style={[styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                >
                  {verifying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonPrimaryText}>
                      {t("security.verify")}
                    </Text>
                  )}
                </Pressable>
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
  scrollContent: {
    flexGrow: 1,
  },
  heroImage: {
    width: '100%',
    height: 260,
    marginTop: spacing.lg,
  },
  formCard: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: radius.cardLg,
    borderTopRightRadius: radius.cardLg,
    paddingHorizontal: layout.screenPaddingX + 10,
    paddingTop: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  accentLine: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    letterSpacing: -0.5,
  },
  inputContainer: {
    marginBottom: spacing.base,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    marginBottom: spacing.sm,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  inputText: {
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
  },
  submitButton: {
    paddingVertical: spacing.base,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
  },
  toggleLink: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: radius.cardLg,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  codeInput: {
    borderWidth: 2,
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontFamily: 'Rubik-Bold',
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: '#FFFFFF',
  },
});
