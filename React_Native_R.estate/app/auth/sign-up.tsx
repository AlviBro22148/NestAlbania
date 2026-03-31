import CityPicker from "@/components/CityPicker";
import InputModal from "@/components/InputModal";
import PreferencesModal from "@/components/PreferencesModal";
import images from "@/constants/images";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUp() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  // Input Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>(null);
  const [tempValue, setTempValue] = useState("");

  // Preferences modal state
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

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

  const handleRegister = async () => {
    // Validation
    if (!username || !email || !password || !confirmPassword || !phoneNumber || !city) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("auth.fillAllFields"),
      });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: "Passwords do not match",
      });
      return;
    }

    if (password.length < 6) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: "Password must be at least 6 characters",
      });
      return;
    }

    if (!email.includes("@")) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: "Please enter a valid email",
      });
      return;
    }

    if (!phoneNumber.startsWith("+")) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: "Phone number must include country code (e.g., +355)",
      });
      return;
    }

    try {
      setLoading(true);
      await register(username, email, password, phoneNumber, city);

      // Show preferences modal after successful registration
      setShowPreferencesModal(true);
    } catch (error: any) {
      showAlert({
        type: "error",
        title: "Registration Failed",
        message: error.message || "Could not create account",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle preferences completion or skip
  const handlePreferencesComplete = () => {
    setShowPreferencesModal(false);
    showToast(t("auth.registrationSuccess"), "success");
    router.replace("/(root)/(tabs)");
  };

  const handlePreferencesSkip = () => {
    setShowPreferencesModal(false);
    showToast(t("auth.registrationSuccess"), "success");
    router.replace("/(root)/(tabs)");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          resizeMode="contain"
          source={images.onboarding}
          style={styles.headerImage}
        />

        <View style={styles.formContainer}>
          {/* Title Text */}
          <Text style={[styles.title, { color: colors.text }]}>
            {t("auth.createAccount")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("auth.joinNestAlbania")}
          </Text>

          {/* Username Input */}
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
            disabled={loading}
            style={styles.inputGroup}
          >
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {t("auth.username")}
            </Text>
            <View style={[styles.inputField, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text
                style={[styles.inputText, { color: username ? colors.text : colors.textMuted }]}
              >
                {username || t("placeholders.enterUsername")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Email Input */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "email",
                t("auth.email"),
                t("placeholders.enterEmail"),
                email,
                setEmail,
                "email-address"
              )
            }
            disabled={loading}
            style={styles.inputGroup}
          >
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {t("auth.email")}
            </Text>
            <View style={[styles.inputField, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text
                style={[styles.inputText, { color: email ? colors.text : colors.textMuted }]}
              >
                {email || t("placeholders.enterEmail")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Phone Number Input */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "phoneNumber",
                t("auth.phoneNumber"),
                t("placeholders.enterPhone"),
                phoneNumber,
                setPhoneNumber,
                "phone-pad"
              )
            }
            disabled={loading}
            style={styles.inputGroup}
          >
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {t("auth.phoneNumber")}
            </Text>
            <View style={[styles.inputField, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text
                style={[styles.inputText, { color: phoneNumber ? colors.text : colors.textMuted }]}
              >
                {phoneNumber || t("placeholders.enterPhone")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* City Selection */}
          <TouchableOpacity
            onPress={() => setCityPickerVisible(true)}
            disabled={loading}
            style={styles.inputGroup}
          >
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {t("cities.city")}
            </Text>
            <View style={[styles.inputField, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text
                style={[styles.inputText, { color: city ? colors.text : colors.textMuted }]}
              >
                {city || t("cities.selectCity")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Password Input */}
          <TouchableOpacity
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
            style={styles.inputGroup}
          >
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {t("auth.password")}
            </Text>
            <View style={[styles.inputField, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text
                style={[styles.inputText, { color: password ? colors.text : colors.textMuted }]}
              >
                {password ? "••••••••" : t("placeholders.enterPassword")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Confirm Password Input */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "confirmPassword",
                t("auth.confirmPassword"),
                t("placeholders.confirmPassword"),
                confirmPassword,
                setConfirmPassword,
                "default",
                true
              )
            }
            disabled={loading}
            style={styles.inputGroupLast}
          >
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {t("auth.confirmPassword")}
            </Text>
            <View style={[styles.inputField, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text
                style={[styles.inputText, { color: confirmPassword ? colors.text : colors.textMuted }]}
              >
                {confirmPassword
                  ? "••••••••"
                  : t("placeholders.confirmPassword")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleRegister}
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {t("auth.register")}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle to Sign In */}
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
              {t("auth.alreadyHaveAccount")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/sign-in")}
              disabled={loading}
            >
              <Text style={[styles.toggleLink, { color: colors.primary }]}>
                {t("auth.signIn")}
              </Text>
            </TouchableOpacity>
          </View>
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
          keyboardType={modalConfig.keyboardType || "default"}
          multiline={false}
          numberOfLines={1}
          secureTextEntry={modalConfig.isSecure}
        />
      )}

      {/* City Picker Modal */}
      <CityPicker
        visible={cityPickerVisible}
        selectedCity={city}
        onClose={() => setCityPickerVisible(false)}
        onSelectCity={setCity}
      />

      {/* Preferences Modal - shown after registration */}
      <PreferencesModal
        visible={showPreferencesModal}
        onComplete={handlePreferencesComplete}
        onSkip={handlePreferencesSkip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImage: {
    width: "100%",
    height: 250,
    marginTop: 24,
  },
  formContainer: {
    paddingHorizontal: 40,
    marginTop: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: "Rubik-Bold",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    fontFamily: "Rubik-Regular",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupLast: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Rubik-Medium",
    marginBottom: 8,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputText: {
    fontFamily: "Rubik-Regular",
  },
  submitButton: {
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontFamily: "Rubik-Bold",
    fontSize: 18,
  },
  toggleContainer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  toggleText: {
    fontFamily: "Rubik-Regular",
  },
  toggleLink: {
    fontFamily: "Rubik-Bold",
    marginLeft: 4,
  },
});
