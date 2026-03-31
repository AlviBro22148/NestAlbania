import icons from "@/constants/icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { shadows, shadowsDark } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";

interface BlogArticle {
  id: number;
  title: string;
  content: string;
  summary: string;
  category: string;
  imageUrl: string;
  tags: string[];
  viewCount: number;
  readTimeMinutes: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const handleBack = useBackNavigation("/(root)/blog");

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/Blog/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error("Error loading article:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      await Share.share({
        message: `${article.title}\n\n${article.summary}`,
        title: article.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
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

  if (!article) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ fontFamily: "Rubik-Regular", color: colors.textSecondary }}>Article not found</Text>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.goBackButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {article.category}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {article.readTimeMinutes} min read
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.shareButton, { backgroundColor: colors.surfaceElevated }]}
          >
            <Image source={icons.send} style={styles.shareIcon} tintColor={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >

        {/* Featured Image */}
        <Image
          source={{ uri: article.imageUrl }}
          className="w-full h-64"
          resizeMode="cover"
        />

        <View className="px-5 py-5">
          {/* Category Badge */}
          <View className="flex flex-row items-center mb-3">
            <View className="px-3 py-1 rounded-full mr-3" style={{ backgroundColor: colors.primaryLight }}>
              <Text className="text-sm font-rubik-medium" style={{ color: colors.primary }}>
                {article.category}
              </Text>
            </View>
            <Text className="text-sm font-rubik" style={{ color: colors.textSecondary }}>
              {article.readTimeMinutes} min read
            </Text>
          </View>

          {/* Title */}
          <Text className="text-2xl font-rubik-bold mb-3" style={{ color: colors.text }}>
            {article.title}
          </Text>

          {/* Author and Date */}
          <View className="flex flex-row items-center justify-between mb-4 pb-4 border-b" style={{ borderBottomColor: colors.border }}>
            <View className="flex flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primaryLight }}>
                <Text className="font-rubik-bold text-lg" style={{ color: colors.primary }}>
                  {article.authorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text className="font-rubik-medium" style={{ color: colors.text }}>
                  {article.authorName}
                </Text>
                <Text className="text-xs font-rubik" style={{ color: colors.textSecondary }}>
                  {formatDate(article.createdAt)}
                </Text>
              </View>
            </View>
            <View className="flex flex-row items-center">
              <Image source={icons.eye} className="w-4 h-4 mr-1" style={{ tintColor: colors.textMuted }} />
              <Text className="text-sm font-rubik" style={{ color: colors.textSecondary }}>
                {article.viewCount}
              </Text>
            </View>
          </View>

          {/* Summary */}
          <View className="p-4 rounded-xl mb-5" style={{ backgroundColor: isDark ? colors.surface : "#EFF6FF" }}>
            <Text className="font-rubik-medium mb-2" style={{ color: isDark ? colors.primary : "#1E40AF" }}>
              Summary
            </Text>
            <Text className="font-rubik text-sm leading-6" style={{ color: isDark ? colors.textSecondary : "#1D4ED8" }}>
              {article.summary}
            </Text>
          </View>

          {/* Content */}
          <View className="mb-5">
            <Text className="font-rubik text-base leading-7" style={{ color: colors.text }}>
              {article.content}
            </Text>
          </View>

          {/* Tags */}
          {article.tags.length > 0 && (
            <View className="mb-5">
              <Text className="font-rubik-bold mb-3" style={{ color: colors.text }}>Tags</Text>
              <View className="flex flex-row flex-wrap">
                {article.tags.map((tag, index) => (
                  <View
                    key={index}
                    className="px-3 py-2 rounded-full mr-2 mb-2"
                    style={{ backgroundColor: colors.surfaceElevated }}
                  >
                    <Text className="text-sm font-rubik" style={{ color: colors.text }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Call to Action */}
          <View className="p-5 rounded-2xl mt-5 mb-10" style={{ backgroundColor: colors.primaryLight }}>
            <Text className="font-rubik-bold text-lg mb-2" style={{ color: colors.primary }}>
              Looking for Properties?
            </Text>
            <Text className="font-rubik mb-4" style={{ color: colors.primary }}>
              Explore our latest listings and find your dream home today.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(root)/explore")}
              className="py-3 rounded-lg items-center mb-4"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-rubik-bold">
                Browse Properties
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  goBackButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  goBackButtonText: {
    color: "white",
    fontFamily: "Rubik-Medium",
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
    fontSize: 16,
    fontFamily: "Rubik-Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Rubik-Regular",
    marginTop: 2,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  shareIcon: {
    width: 20,
    height: 20,
  },
  accentLine: {
    height: 3,
    marginTop: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
});

