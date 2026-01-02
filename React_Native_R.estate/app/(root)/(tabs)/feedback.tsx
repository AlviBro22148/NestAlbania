import InputModal from "@/components/InputModal";
import { useAlert } from "@/contexts/AlertContext";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FeedbackScreen = () => {
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const [feedbackType, setFeedbackType] = useState("General");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    field: "subject" | "message";
    title: string;
    placeholder: string;
    value: string;
    setValue: (val: string) => void;
    multiline?: boolean;
  } | null>(null);
  const [tempValue, setTempValue] = useState("");

  const feedbackTypes = [
    { value: "Bug", labelKey: "feedback.bug", icon: "bug-outline", color: "bg-red-100 text-red-600" },
    {
      value: "Feature Request",
      labelKey: "feedback.featureRequest",
      icon: "bulb-outline",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      value: "General",
      labelKey: "feedback.general",
      icon: "chatbubble-outline",
      color: "bg-blue-100 text-blue-600",
    },
  ];

  const openInputModal = (
    field: "subject" | "message",
    modalTitle: string,
    placeholder: string,
    value: string,
    setValue: (val: string) => void,
    multiline = false
  ) => {
    setTempValue(value);
    setModalConfig({
      field,
      title: modalTitle,
      placeholder,
      value,
      setValue,
      multiline,
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

  const handleSubmitFeedback = async () => {
    if (!subject.trim() || !message.trim()) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("feedback.fillAllFields"),
      });
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/feedback", {
        feedbackType,
        subject: subject.trim(),
        message: message.trim(),
      });

      showAlert({
        type: "success",
        title: t("common.success"),
        message: t("feedback.successMessage"),
      });

      // Reset form
      setSubject("");
      setMessage("");
      setFeedbackType("General");
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || t("feedback.errorMessage"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#191D31" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold text-black-300">
            {t("feedback.title")}
          </Text>
          <View className="w-6" />
        </View>

        <View className="p-6">
          {/* Info Banner */}
          <View className="bg-blue-50 p-4 rounded-xl mb-6">
            <Text className="text-blue-800 font-rubik-medium">
              💡 {t("feedback.infoTitle")}
            </Text>
            <Text className="text-blue-700 font-rubik text-sm mt-1">
              {t("feedback.infoSubtitle")}
            </Text>
          </View>

          {/* Feedback Type Selection */}
          <View className="mb-6">
            <Text className="text-sm font-rubik-semibold text-gray-700 mb-3">
              {t("feedback.feedbackType")}
            </Text>
            <View className="gap-3">
              {feedbackTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setFeedbackType(type.value)}
                  className={`flex-row items-center p-4 rounded-xl border-2 ${
                    feedbackType === type.value
                      ? "border-primary-300 bg-primary-100"
                      : "border-gray-200"
                  }`}
                >
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${type.color.split(" ")[0]}`}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={
                        type.color.includes("red")
                          ? "#DC2626"
                          : type.color.includes("yellow")
                            ? "#D97706"
                            : "#2563EB"
                      }
                    />
                  </View>
                  <Text className="ml-4 font-rubik-semibold text-black-300 flex-1">
                    {t(type.labelKey)}
                  </Text>
                  {feedbackType === type.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#0061FF"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subject Input */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "subject",
                t("feedback.subject"),
                t("feedback.subjectPlaceholder"),
                subject,
                setSubject
              )
            }
            className="mb-6"
          >
            <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
              {t("feedback.subject")}
            </Text>
            <View className="border border-gray-300 rounded-xl px-4 py-3 min-h-[50px]">
              <Text
                className={`font-rubik ${subject ? "text-black" : "text-gray-400"}`}
              >
                {subject || t("feedback.subjectPlaceholder")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Message Input */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "message",
                t("feedback.message"),
                t("feedback.messagePlaceholder"),
                message,
                setMessage,
                true
              )
            }
            className="mb-6"
          >
            <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
              {t("feedback.message")}
            </Text>
            <View className="border border-gray-300 rounded-xl px-4 py-3 min-h-[150px]">
              <Text
                className={`font-rubik ${message ? "text-black" : "text-gray-400"}`}
                numberOfLines={6}
              >
                {message || t("feedback.messagePlaceholder")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitFeedback}
            disabled={loading}
            className="bg-primary-300 py-4 rounded-xl mb-12"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-rubik-bold text-base">
                {t("feedback.submit")}
              </Text>
            )}
          </TouchableOpacity>

          {/* View My Feedback History */}
          <TouchableOpacity
            onPress={() =>
              router.push("/(root)/(tabs)/feedback/history" as any)
            }
            className="mt-4"
          >
            <Text className="text-center text-primary-300 font-rubik-semibold">
              {t("feedback.viewHistory")}
            </Text>
          </TouchableOpacity>
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
          multiline={modalConfig.multiline}
          numberOfLines={modalConfig.multiline ? 6 : 1}
        />
      )}
    </SafeAreaView>
  );
};

export default FeedbackScreen;
