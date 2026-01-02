import InputModal from "@/components/InputModal";
import images from "@/constants/images";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { router } from "expo-router";
import { useState } from "react";
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

export default function SignUp() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // Input Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>(null);
  const [tempValue, setTempValue] = useState("");

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
    if (!username || !email || !password || !confirmPassword || !phoneNumber) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: "Please fill in all fields",
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
      await register(username, email, password, phoneNumber);

      showAlert({
        type: "success",
        title: t("common.success"),
        message: "Account created successfully!",
        buttons: [
          {
            text: "OK",
            onPress: () => router.replace("/(root)/(tabs)"),
          },
        ],
      });
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

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          resizeMode="contain"
          source={images.onboarding}
          style={{ height: 250 }}
          className="w-full mt-6"
        />

        <View className="px-10 mt-6">
          {/* Title Text */}
          <Text className="text-2xl mt-4 text-center font-rubik-bold mb-2">
            {t("auth.createAccount")}
          </Text>
          <Text className="text-center text-gray-600 font-rubik-regular mb-6">
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
            className="mb-4"
          >
            <Text className="text-sm font-rubik-medium mb-2">
              {t("auth.username")}
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3">
              <Text
                className={`font-rubik-regular ${username ? "text-black" : "text-gray-400"}`}
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
            className="mb-4"
          >
            <Text className="text-sm font-rubik-medium mb-2">
              {t("auth.email")}
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3">
              <Text
                className={`font-rubik-regular ${email ? "text-black" : "text-gray-400"}`}
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
            className="mb-4"
          >
            <Text className="text-sm font-rubik-medium mb-2">
              {t("auth.phoneNumber")}
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3">
              <Text
                className={`font-rubik-regular ${phoneNumber ? "text-black" : "text-gray-400"}`}
              >
                {phoneNumber || t("placeholders.enterPhone")}
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
            className="mb-4"
          >
            <Text className="text-sm font-rubik-medium mb-2">
              {t("auth.password")}
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3">
              <Text
                className={`font-rubik-regular ${password ? "text-black" : "text-gray-400"}`}
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
            className="mb-6"
          >
            <Text className="text-sm font-rubik-medium mb-2">
              {t("auth.confirmPassword")}
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3">
              <Text
                className={`font-rubik-regular ${confirmPassword ? "text-black" : "text-gray-400"}`}
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
            className="bg-blue-500 rounded-full py-4 px-6 items-center"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-rubik-bold text-lg">
                {t("auth.register")}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle to Sign In */}
          <View className="mt-6 flex-row justify-center mb-8">
            <Text className="text-gray-600 font-rubik-regular">
              {t("auth.alreadyHaveAccount")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/sign-in")}
              disabled={loading}
            >
              <Text className="text-blue-500 font-rubik-bold ml-1">
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
    </SafeAreaView>
  );
}
