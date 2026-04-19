import InputModal from "@/components/InputModal";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { shadows, shadowsDark } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import icons from "@/constants/icons";

const CreatePostScreen = () => {
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const handleBack = useBackNavigation("/(root)/community");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Tips");
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    field: "title" | "content";
    title: string;
    placeholder: string;
    value: string;
    setValue: (val: string) => void;
    multiline?: boolean;
  } | null>(null);
  const [tempValue, setTempValue] = useState("");

  const categories = ["Tips", "Questions", "Experiences"];

  const openInputModal = (
    field: "title" | "content",
    modalTitle: string,
    placeholder: string,
    value: string,
    setValue: (val: string) => void,
    multiline = false,
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

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: "Please fill in all fields",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/community/posts", {
        title: title.trim(),
        content: content.trim(),
        category,
      });

      // Invalidate community posts cache so new post shows immediately
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });

      showToast("Post created successfully!", "success");
      handleBack();
    } catch (error: any) {
      console.error("Error creating post:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || "Failed to create post",
      });
    } finally {
      setLoading(false);
    }
  };

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Premium Header */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[styles.header, { backgroundColor: colors.surface }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.backButton,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Image
              source={icons.backArrow}
              style={styles.backIcon}
              tintColor={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("community.createPost")}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {t("community.shareWithCommunity")}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Selection */}
        <View className="mb-6">
          <Text className="text-sm font-rubik-semibold text-gray-700 mb-3">
            Category
          </Text>
          <View className="flex-row gap-3">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                className={`flex-1 py-3 rounded-xl ${
                  category === cat ? "bg-primary-300" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-center font-rubik-semibold ${
                    category === cat ? "text-white" : "text-gray-700"
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title Input */}
        <TouchableOpacity
          onPress={() =>
            openInputModal(
              "title",
              "Post Title",
              "Enter a catchy title",
              title,
              setTitle,
            )
          }
          className="mb-6"
        >
          <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
            Title
          </Text>
          <View className="border border-gray-300 rounded-xl px-4 py-3 min-h-[50px]">
            <Text
              className={`font-rubik ${title ? "text-black" : "text-gray-400"}`}
            >
              {title || "Enter a catchy title"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Content Input */}
        <TouchableOpacity
          onPress={() =>
            openInputModal(
              "content",
              "Post Content",
              "Share your thoughts...",
              content,
              setContent,
              true,
            )
          }
          className="mb-6"
        >
          <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
            Content
          </Text>
          <View className="border border-gray-300 rounded-xl px-4 py-3 min-h-[150px]">
            <Text
              className={`font-rubik ${content ? "text-black" : "text-gray-400"}`}
              numberOfLines={6}
            >
              {content || "Share your thoughts..."}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleCreatePost}
          disabled={loading}
          className="bg-primary-300 py-4 rounded-xl"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-rubik-bold text-base">
              Publish Post
            </Text>
          )}
        </TouchableOpacity>
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

export default CreatePostScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 20,
    height: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
});

