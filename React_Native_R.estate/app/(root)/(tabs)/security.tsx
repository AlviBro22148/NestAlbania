import CustomButton from "@/components/CustomButton";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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
import icons from "../../../constants/icons";

export default function SecurityScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
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
      const token = await AsyncStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/TwoFactor/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIs2FAEnabled(data.isEnabled);
      }
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
      const token = await AsyncStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/TwoFactor/enable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setShowPasswordModal(false);
        setPassword("");
        setShowVerifyModal(true);
        showToast(t("security.codeSent"), "success");
      } else {
        showAlert({
          type: "error",
          title: t("common.error"),
          message: data.message,
        });
      }
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("security.failedEnable"),
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
      const token = await AsyncStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/TwoFactor/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: verificationCode }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setShowVerifyModal(false);
        setVerificationCode("");
        setIs2FAEnabled(true);
        showToast(t("security.enabled2FA"), "success");
      } else {
        showAlert({
          type: "error",
          title: t("common.error"),
          message: data.message,
        });
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("security.failedVerify"),
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
      const token = await AsyncStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/TwoFactor/disable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setShowPasswordModal(false);
        setPassword("");
        setIs2FAEnabled(false);
        showToast(t("security.disabled2FA"), "success");
      } else {
        showAlert({
          type: "error",
          title: t("common.error"),
          message: data.message,
        });
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("security.failedDisable"),
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setProcessing(true);
      const token = await AsyncStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/TwoFactor/resend-code`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast(t("security.codeResent"), "success");
      } else {
        showAlert({
          type: "error",
          title: t("common.error"),
          message: data.message,
        });
      }
    } catch (error) {
      console.error("Error resending code:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("security.failedResend"),
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="h-full bg-white flex items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
      >
        <View className="flex flex-row items-center justify-between mt-5">
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={icons.backArrow} className="w-6 h-6" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold">{t("security.title")}</Text>
          <View className="w-6" />
        </View>

        <View className="mt-8">
          <View className="bg-primary-100 rounded-xl p-6">
            <View className="flex flex-row items-center mb-4">
              <Image source={icons.shield} className="w-8 h-8 mr-3" />
              <Text className="text-xl font-rubik-bold">
                {t("security.twoFactorAuth")}
              </Text>
            </View>

            <Text className="text-black-200 font-rubik mb-4">
              {t("security.description")}
            </Text>

            <View className="flex flex-row items-center justify-between bg-white rounded-lg p-4 mb-4">
              <Text className="font-rubik-medium text-black-300">
                {t("security.status")}:
              </Text>
              <View
                className={`px-4 py-2 rounded-full ${
                  is2FAEnabled ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`font-rubik-semibold ${
                    is2FAEnabled ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {is2FAEnabled
                    ? t("security.enabled")
                    : t("security.disabled")}
                </Text>
              </View>
            </View>

            <View className="flex flex-row items-center bg-white rounded-lg p-4">
              <Image source={icons.email} className="w-5 h-5 mr-2" />
              <Text className="text-black-200 font-rubik flex-1">
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

          <View className="mt-6 bg-blue-50 rounded-xl p-4">
            <Text className="text-blue-800 font-rubik-medium mb-2">
              {t("security.howItWorks")}
            </Text>
            <Text className="text-blue-700 font-rubik text-sm">
              {t("security.howItWorksDetails")}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPassword("");
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-7">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-xl font-rubik-bold mb-4">
              {t("security.confirmPassword")}
            </Text>
            <Text className="text-black-200 font-rubik mb-4">
              {t("security.enterPasswordPrompt")}
            </Text>

            <TextInput
              className="border border-primary-200 rounded-lg px-4 py-3 font-rubik mb-4"
              placeholder={t("security.enterPassword")}
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
                className="bg-gray-200 flex-1"
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
      </Modal>

      <Modal
        visible={showVerifyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowVerifyModal(false);
          setVerificationCode("");
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-7">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-xl font-rubik-bold mb-4">
              {t("security.enterVerificationCode")}
            </Text>
            <Text className="text-black-200 font-rubik mb-4">
              {t("security.codeSentTo")} {user?.email}
            </Text>
            <TextInput
              className="border border-primary-200 rounded-lg px-4 py-3 font-rubik text-center text-2xl tracking-widest mb-4"
              placeholder="000000"
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
              <Text className="text-primary-300 font-rubik-medium text-center">
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
                className="bg-gray-200 flex-1"
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
      </Modal>
    </SafeAreaView>
  );
}
