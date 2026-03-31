import InputModal from "@/components/InputModal";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
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
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const FeedbackScreen = () => {
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");
  const [feedbackType, setFeedbackType] = useState("General");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }, cardShadow]}>
          <View style={styles.headerRow}>
            <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t("feedback.title")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contentPadding}>
          {/* Info Banner */}
          <Animated.View entering={FadeInDown.duration(300).delay(100)}>
            <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight }]}>
              <View style={[styles.infoIconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="bulb-outline" size={20} color="white" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.primary }]}>
                  {t("feedback.infoTitle")}
                </Text>
                <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                  {t("feedback.infoSubtitle")}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Feedback Type Selection */}
          <Animated.View entering={FadeInDown.duration(300).delay(200)}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: colors.accent }]} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("feedback.feedbackType")}
              </Text>
            </View>
            <View style={styles.typeContainer}>
              {feedbackTypes.map((type, index) => (
                <Animated.View key={type.value} entering={FadeInDown.duration(200).delay(250 + index * 50)}>
                  <TouchableOpacity
                    onPress={() => setFeedbackType(type.value)}
                    style={[
                      styles.typeCard,
                      {
                        borderColor: feedbackType === type.value ? colors.primary : colors.border,
                        backgroundColor: feedbackType === type.value ? colors.primaryLight : colors.surface,
                      },
                      cardShadow,
                    ]}
                  >
                    <View
                      style={[
                        styles.typeIconContainer,
                        {
                          backgroundColor: type.color.includes("red")
                            ? (isDark ? '#7F1D1D' : '#FEE2E2')
                            : type.color.includes("yellow")
                              ? (isDark ? '#78350F' : '#FEF3C7')
                              : (isDark ? '#1E3A5F' : '#DBEAFE'),
                        },
                      ]}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={22}
                        color={
                          type.color.includes("red")
                            ? "#DC2626"
                            : type.color.includes("yellow")
                              ? "#D97706"
                              : "#2563EB"
                        }
                      />
                    </View>
                    <Text style={[styles.typeLabel, { color: colors.text }]}>
                      {t(type.labelKey)}
                    </Text>
                    {feedbackType === type.value && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Subject Input */}
          <Animated.View entering={FadeInDown.duration(300).delay(400)}>
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
              style={styles.inputSection}
            >
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t("feedback.subject")}
              </Text>
              <View style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.inputText, { color: subject ? colors.text : colors.textMuted }]}>
                  {subject || t("feedback.subjectPlaceholder")}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Message Input */}
          <Animated.View entering={FadeInDown.duration(300).delay(500)}>
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
              style={styles.inputSection}
            >
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t("feedback.message")}
              </Text>
              <View style={[styles.messageField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text
                  style={[styles.inputText, { color: message ? colors.text : colors.textMuted }]}
                  numberOfLines={6}
                >
                  {message || t("feedback.messagePlaceholder")}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInDown.duration(300).delay(600)}>
            <TouchableOpacity
              onPress={handleSubmitFeedback}
              disabled={loading}
              style={[styles.submitButton, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("feedback.submit")}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* View My Feedback History */}
          <TouchableOpacity
            onPress={() => router.push("/(root)/feedback/history" as any)}
            style={styles.historyLink}
          >
            <Text style={[styles.historyLinkText, { color: colors.primary }]}>
              {t("feedback.viewHistory")}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomLeftRadius: radius.cardLg,
    borderBottomRightRadius: radius.cardLg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentLine: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    letterSpacing: -0.3,
  },
  contentPadding: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
  },
  infoDescription: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
  },
  typeContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radius.card,
    borderWidth: 2,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    flex: 1,
    marginLeft: spacing.base,
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  inputField: {
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  messageField: {
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderWidth: 1,
    minHeight: 150,
  },
  inputText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 15,
  },
  submitButton: {
    paddingVertical: spacing.base,
    borderRadius: radius.button,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  submitButtonText: {
    color: 'white',
    fontFamily: 'Rubik-Bold',
    fontSize: 16,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  historyLinkText: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
  },
});

export default FeedbackScreen;

