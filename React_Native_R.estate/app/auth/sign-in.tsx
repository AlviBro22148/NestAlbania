import BannedScreen from "@/components/BannedScreen";
import CustomButton from "@/components/CustomButton";
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
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignIn() {
  const { login, loginWith2FA, isBanned } = useAuth();
  const { showAlert, showToast } = useAlert();
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
    <SafeAreaView className="bg-white h-full">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          resizeMode="contain"
          source={images.onboarding}
          style={{ height: 280 }}
          className="w-full mt-6"
        />

        <View className="px-10 mt-9">
          {/* Title Text */}
          <Text className="text-2xl mt-6 text-center font-rubik-bold mb-2">
            {t("auth.welcomeBack")}
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
            className="mb-6"
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

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleLogin}
            className="bg-blue-500 rounded-full py-4 px-6 items-center"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-rubik-bold text-lg">
                {t("auth.signIn")}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle to Register */}
          <View className="mt-6 flex-row justify-center mb-8">
            <Text className="text-gray-600 font-rubik-regular">
              {t("auth.dontHaveAccount")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/sign-up")}
              disabled={loading}
            >
              <Text className="text-blue-500 font-rubik-bold ml-1">
                {t("auth.register")}
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

      {/* 2FA Verification Modal */}
      <Modal
        visible={show2FAModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShow2FAModal(false);
          setVerificationCode("");
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-7">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-xl font-rubik-bold mb-4">
              {t("security.twoFactorAuth")}
            </Text>
            <Text className="text-black-200 font-rubik mb-4">
              {t("security.description")}
            </Text>

            <TextInput
              className="border border-primary-200 rounded-lg px-4 py-3 font-rubik text-center text-2xl tracking-widest mb-4"
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={verificationCode}
              onChangeText={setVerificationCode}
            />

            <View className="flex flex-row gap-3">
              <CustomButton
                title={t("security.cancel")}
                onPress={() => {
                  setShow2FAModal(false);
                  setVerificationCode("");
                }}
                className="bg-gray-200 flex-1"
                textVariant="primary"
              />
              <CustomButton
                title={
                  verifying ? t("security.verifying") : t("security.verify")
                }
                onPress={handleVerify2FA}
                className="bg-primary-300 flex-1"
                disabled={verifying}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
