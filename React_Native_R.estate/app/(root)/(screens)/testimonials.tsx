import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import icons from "@/constants/icons";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { shadows, shadowsDark } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";

interface Testimonial {
  id: number;
  userId: string;
  username: string;
  userProfilePicture?: string;
  propertyId?: number;
  propertyTitle?: string;
  rating: number;
  comment: string;
  serviceType?: string;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
}

interface TestimonialStats {
  totalTestimonials: number;
  averageRating: number;
  verifiedCount: number;
  unverifiedCount: number;
  starDistribution: { [key: number]: number };
}

const TestimonialsScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<"all" | "verified" | "top">("all");

  // Create testimonial modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Track liked testimonials
  const [likedTestimonials, setLikedTestimonials] = useState<Set<number>>(new Set());

  // Use React Query for cached testimonials - INSTANT from cache
  const { data, isLoading: loading, isFetching, refetch } = useQuery({
    queryKey: ["testimonials", filter],
    queryFn: async () => {
      // Build the correct API call based on filter
      let testimonialsUrl = "/api/testimonials";
      if (filter === "top") {
        testimonialsUrl = "/api/testimonials/top-rated?count=20";
      } else if (filter === "verified") {
        testimonialsUrl = "/api/testimonials?verified=true";
      }

      // Fetch testimonials and stats in parallel
      const [testimonialsRes, statsRes] = await Promise.all([
        api.get(testimonialsUrl),
        api.get("/api/testimonials/stats"),
      ]);

      return {
        testimonials: testimonialsRes.data as Testimonial[],
        stats: statsRes.data as TestimonialStats,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const testimonials = data?.testimonials ?? [];
  const stats = data?.stats ?? null;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSubmitTestimonial = useCallback(async () => {
    if (!comment.trim()) {
      showToast(t("testimonials.enterComment"), "error");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/testimonials", {
        rating,
        comment: comment.trim(),
        serviceType: serviceType.trim() || undefined,
      });
      setCreateModalVisible(false);
      setComment("");
      setRating(5);
      setServiceType("");
      showToast(t("testimonials.submitted"), "success");
      refetch();
    } catch (error: any) {
      console.error("Error submitting testimonial:", error);
      showToast(error.response?.data?.message || t("testimonials.errorSubmitting"), "error");
    } finally {
      setSubmitting(false);
    }
  }, [comment, rating, serviceType, refetch, showToast, t]);

  const handleToggleHelpful = async (testimonialId: number) => {
    if (!user) {
      showToast(t("testimonials.loginRequired") || "Please login to like reviews", "error");
      return;
    }

    try {
      const response = await api.post(`/api/testimonials/${testimonialId}/helpful`);
      const { helpfulCount, isLiked } = response.data;

      // Update liked testimonials set
      const newLikedSet = new Set(likedTestimonials);
      if (isLiked) {
        newLikedSet.add(testimonialId);
      } else {
        newLikedSet.delete(testimonialId);
      }
      setLikedTestimonials(newLikedSet);

      // Update local state
      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === testimonialId ? { ...t, helpfulCount } : t
        )
      );
    } catch (error) {
      console.error("Error toggling helpful:", error);
      showToast(t("testimonials.errorLiking") || "Error updating like", "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating: number, size: number = 16, interactive: boolean = false) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && setRating(star)}
            disabled={!interactive}
            className="mr-1"
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={size}
              color={star <= rating ? "#F59E0B" : "#D1D5DB"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTestimonialCard = ({ item }: { item: Testimonial }) => (
    <View className="rounded-2xl p-5 mb-4 shadow-sm border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      {/* Header */}
      <View className="flex-row items-center mb-4">
        {item.userProfilePicture ? (
          <Image
            source={{ uri: item.userProfilePicture }}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: isDark ? colors.primaryLight : "#E0EDFF" }}>
            <Text className="font-rubik-bold text-lg" style={{ color: colors.primary }}>
              {item.username?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
        )}
        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-rubik-bold" style={{ color: colors.text }}>
              {item.username}
            </Text>
            {item.isVerified && (
              <View className="ml-2 px-2 py-0.5 rounded-full flex-row items-center" style={{ backgroundColor: isDark ? "#10B98120" : "#D1FAE5" }}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text className="text-xs font-rubik-medium ml-1" style={{ color: "#10B981" }}>
                  {t("testimonials.verified")}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs font-rubik" style={{ color: colors.textSecondary }}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        {renderStars(item.rating)}
      </View>

      {/* Service Type Badge */}
      {item.serviceType && (
        <View className="mb-3">
          <View className="px-3 py-1 rounded-full self-start" style={{ backgroundColor: isDark ? "#8B5CF620" : "#F3E8FF" }}>
            <Text className="text-xs font-rubik-medium" style={{ color: "#8B5CF6" }}>
              {item.serviceType}
            </Text>
          </View>
        </View>
      )}

      {/* Comment */}
      <Text className="font-rubik leading-6 mb-4" style={{ color: colors.textSecondary }}>
        "{item.comment}"
      </Text>

      {/* Property Link */}
      {item.propertyId && item.propertyTitle && (
        <TouchableOpacity
          onPress={() => router.push(`/(root)/properties/${item.propertyId}`)}
          className="flex-row items-center rounded-xl p-3 mb-4"
          style={{ backgroundColor: colors.surfaceElevated }}
        >
          <Ionicons name="home-outline" size={18} color={colors.textMuted} />
          <Text className="text-sm font-rubik ml-2 flex-1" style={{ color: colors.text }} numberOfLines={1}>
            {item.propertyTitle}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-3 border-t" style={{ borderColor: colors.border }}>
        <TouchableOpacity
          onPress={() => handleToggleHelpful(item.id)}
          className="flex-row items-center"
        >
          <Ionicons
            name={likedTestimonials.has(item.id) ? "thumbs-up" : "thumbs-up-outline"}
            size={18}
            color={likedTestimonials.has(item.id) ? colors.primary : colors.textMuted}
          />
          <Text className="text-sm font-rubik ml-2" style={{ color: likedTestimonials.has(item.id) ? colors.primary : colors.textSecondary }}>
            {t("testimonials.helpful")} ({item.helpfulCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStats = () => {
    if (!stats) return null;

    const starDistribution = stats.starDistribution || {};

    return (
      <View className="rounded-2xl p-5 mb-4 shadow-sm border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="items-center flex-1">
            <Text className="text-4xl font-rubik-extrabold" style={{ color: colors.primary }}>
              {(stats.averageRating || 0).toFixed(1)}
            </Text>
            {renderStars(Math.round(stats.averageRating || 0), 20)}
            <Text className="text-sm font-rubik mt-1" style={{ color: colors.textSecondary }}>
              {stats.totalTestimonials || 0} {t("testimonials.reviews")}
            </Text>
          </View>

          {/* Star Distribution */}
          <View className="flex-1 ml-6">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = starDistribution[star] || 0;
              const total = stats.totalTestimonials || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <View key={star} className="flex-row items-center mb-1">
                  <Text className="text-xs font-rubik w-3" style={{ color: colors.textSecondary }}>{star}</Text>
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <View className="flex-1 h-2 rounded-full mx-2" style={{ backgroundColor: colors.surfaceElevated }}>
                    <View
                      className="h-2 bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </View>
                  <Text className="text-xs font-rubik w-8" style={{ color: colors.textSecondary }}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Verified Stats */}
        <View className="flex-row items-center justify-center pt-3 border-t" style={{ borderColor: colors.border }}>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text className="text-sm font-rubik ml-1" style={{ color: colors.textSecondary }}>
              {stats.verifiedCount || 0} {t("testimonials.verifiedReviews")}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  if (loading && testimonials.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t("common.loading")}
          </Text>
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
          <TouchableOpacity onPress={handleBack} style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}>
            <Image source={icons.backArrow} style={styles.backIcon} tintColor={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("testimonials.title")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t("testimonials.subtitle")}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
      </Animated.View>

      {/* Filter Tabs */}
      <View className="border-b" style={{ backgroundColor: colors.surface, borderColor: colors.borderLight }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {[
            { key: "all", label: t("testimonials.all"), icon: "list" },
            { key: "verified", label: t("testimonials.verified"), icon: "checkmark-circle" },
            { key: "top", label: t("testimonials.topRated"), icon: "star" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key as any)}
              className="mr-3 px-4 py-2 rounded-xl flex-row items-center"
              style={{ backgroundColor: filter === tab.key ? colors.primary : colors.surfaceElevated }}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={filter === tab.key ? "white" : colors.textMuted}
              />
              <Text
                className="ml-2 font-rubik-semibold"
                style={{ color: filter === tab.key ? "white" : colors.text }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <FlatList
        data={testimonials}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTestimonialCard}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={renderStats}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text className="text-lg font-rubik-bold mt-4" style={{ color: colors.text }}>
              {t("testimonials.noTestimonials")}
            </Text>
            <Text className="text-sm font-rubik mt-2 text-center px-8" style={{ color: colors.textSecondary }}>
              {t("testimonials.beFirst")}
            </Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      {user && (
        <TouchableOpacity
          onPress={() => setCreateModalVisible(true)}
          className="absolute bottom-24 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
          style={{
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Create Testimonial Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-3xl p-6 max-h-[85%]" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-rubik-bold" style={{ color: colors.text }}>
                {t("testimonials.writeReview")}
              </Text>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Rating */}
              <View className="mb-6">
                <Text className="text-sm font-rubik-medium mb-3" style={{ color: colors.text }}>
                  {t("testimonials.yourRating")} *
                </Text>
                <View className="flex-row justify-center">
                  {renderStars(rating, 40, true)}
                </View>
                <Text className="text-center text-sm font-rubik mt-2" style={{ color: colors.textSecondary }}>
                  {rating === 5
                    ? t("testimonials.excellent")
                    : rating === 4
                    ? t("testimonials.veryGood")
                    : rating === 3
                    ? t("testimonials.good")
                    : rating === 2
                    ? t("testimonials.fair")
                    : t("testimonials.poor")}
                </Text>
              </View>

              {/* Service Type */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
                  {t("testimonials.serviceType")}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {["Buying", "Selling", "Renting", "Consulting", "Other"].map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setServiceType(type)}
                        className="px-4 py-2 rounded-full"
                        style={{ backgroundColor: serviceType === type ? colors.primary : colors.surfaceElevated }}
                      >
                        <Text
                          className="font-rubik-medium"
                          style={{ color: serviceType === type ? "white" : colors.text }}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              {/* Comment */}
              <View className="mb-6">
                <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
                  {t("testimonials.yourReview")} *
                </Text>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder={t("testimonials.reviewPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={5}
                  className="rounded-xl px-4 py-3 font-rubik text-base min-h-[120px]"
                  style={{ backgroundColor: colors.surfaceElevated, color: colors.text }}
                  textAlignVertical="top"
                />
                <Text className="text-xs font-rubik mt-1 text-right" style={{ color: colors.textMuted }}>
                  {comment.length}/2000
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmitTestimonial}
                disabled={submitting || !comment.trim()}
                className="py-4 rounded-xl flex-row items-center justify-center mb-4"
                style={{ backgroundColor: submitting || !comment.trim() ? colors.textMuted : colors.primary }}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="white" />
                    <Text className="text-white font-rubik-bold text-lg ml-2">
                      {t("testimonials.submit")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default TestimonialsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontFamily: "Rubik-Regular",
  },
  header: {
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Rubik-Bold",
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Rubik-Regular",
    marginTop: 4,
  },
  headerSpacer: {
    width: 0,
  },
  accentLine: {
    height: 3,
    marginTop: spacing.sm,
  },
});

