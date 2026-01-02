import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import api from "@/lib/axios-config";
import icons from "@/constants/icons";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

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

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<TestimonialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "verified" | "top">("all");

  // Create testimonial modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Track liked testimonials
  const [likedTestimonials, setLikedTestimonials] = useState<Set<number>>(new Set());

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [filter])
  );

  const fetchData = async () => {
    try {
      setLoading(true);

      // Build the correct API call based on filter
      let testimonialsUrl = "/api/testimonials";
      if (filter === "top") {
        testimonialsUrl = "/api/testimonials/top-rated?count=20";
      } else if (filter === "verified") {
        testimonialsUrl = "/api/testimonials?verified=true";
      }
      // For "all" filter, don't pass verified parameter to get all testimonials

      // Fetch testimonials and stats
      const [testimonialsRes, statsRes] = await Promise.all([
        api.get(testimonialsUrl),
        api.get("/api/testimonials/stats"),
      ]);

      setTestimonials(testimonialsRes.data);
      setStats(statsRes.data);

      // Fetch user's likes if logged in
      if (user) {
        try {
          const likesRes = await api.get("/api/testimonials/user-likes");
          setLikedTestimonials(new Set(likesRes.data));
        } catch (err) {
          // User might not be authenticated, ignore
        }
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      showToast(t("testimonials.errorLoading"), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSubmitTestimonial = async () => {
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
      fetchData();
    } catch (error: any) {
      console.error("Error submitting testimonial:", error);
      showToast(error.response?.data?.message || t("testimonials.errorSubmitting"), "error");
    } finally {
      setSubmitting(false);
    }
  };

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
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        {item.userProfilePicture ? (
          <Image
            source={{ uri: item.userProfilePicture }}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
            <Text className="text-primary-300 font-rubik-bold text-lg">
              {item.username?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
        )}
        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-rubik-bold text-gray-900">
              {item.username}
            </Text>
            {item.isVerified && (
              <View className="ml-2 bg-green-100 px-2 py-0.5 rounded-full flex-row items-center">
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text className="text-xs text-green-700 font-rubik-medium ml-1">
                  {t("testimonials.verified")}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-gray-500 font-rubik">
            {formatDate(item.createdAt)}
          </Text>
        </View>
        {renderStars(item.rating)}
      </View>

      {/* Service Type Badge */}
      {item.serviceType && (
        <View className="mb-3">
          <View className="bg-purple-50 px-3 py-1 rounded-full self-start">
            <Text className="text-xs text-purple-700 font-rubik-medium">
              {item.serviceType}
            </Text>
          </View>
        </View>
      )}

      {/* Comment */}
      <Text className="text-gray-700 font-rubik leading-6 mb-4">
        "{item.comment}"
      </Text>

      {/* Property Link */}
      {item.propertyId && item.propertyTitle && (
        <TouchableOpacity
          onPress={() => router.push(`/(root)/(tabs)/properties/${item.propertyId}`)}
          className="flex-row items-center bg-gray-50 rounded-xl p-3 mb-4"
        >
          <Ionicons name="home-outline" size={18} color="#6B7280" />
          <Text className="text-sm text-gray-700 font-rubik ml-2 flex-1" numberOfLines={1}>
            {item.propertyTitle}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => handleToggleHelpful(item.id)}
          className="flex-row items-center"
        >
          <Ionicons
            name={likedTestimonials.has(item.id) ? "thumbs-up" : "thumbs-up-outline"}
            size={18}
            color={likedTestimonials.has(item.id) ? "#0061FF" : "#6B7280"}
          />
          <Text className={`text-sm font-rubik ml-2 ${likedTestimonials.has(item.id) ? "text-primary-300" : "text-gray-600"}`}>
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
      <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <View className="items-center flex-1">
            <Text className="text-4xl font-rubik-extrabold text-primary-300">
              {(stats.averageRating || 0).toFixed(1)}
            </Text>
            {renderStars(Math.round(stats.averageRating || 0), 20)}
            <Text className="text-sm text-gray-500 font-rubik mt-1">
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
                  <Text className="text-xs text-gray-600 font-rubik w-3">{star}</Text>
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <View className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
                    <View
                      className="h-2 bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </View>
                  <Text className="text-xs text-gray-500 font-rubik w-8">
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Verified Stats */}
        <View className="flex-row items-center justify-center pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text className="text-sm text-gray-600 font-rubik ml-1">
              {stats.verifiedCount || 0} {t("testimonials.verifiedReviews")}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && testimonials.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0061FF" />
          <Text className="text-gray-600 mt-4 font-rubik">
            {t("common.loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Image source={icons.backArrow} className="w-6 h-6" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-rubik-bold text-black-300">
              {t("testimonials.title")}
            </Text>
            <Text className="text-sm font-rubik text-gray-500 mt-1">
              {t("testimonials.subtitle")}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white border-b border-gray-100">
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
              className={`mr-3 px-4 py-2 rounded-xl flex-row items-center ${
                filter === tab.key ? "bg-primary-300" : "bg-gray-100"
              }`}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={filter === tab.key ? "white" : "#6B7280"}
              />
              <Text
                className={`ml-2 font-rubik-semibold ${
                  filter === tab.key ? "text-white" : "text-gray-700"
                }`}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderStats}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text className="text-lg font-rubik-bold text-gray-900 mt-4">
              {t("testimonials.noTestimonials")}
            </Text>
            <Text className="text-sm text-gray-500 font-rubik mt-2 text-center px-8">
              {t("testimonials.beFirst")}
            </Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      {user && (
        <TouchableOpacity
          onPress={() => setCreateModalVisible(true)}
          className="absolute bottom-24 right-6 bg-primary-300 w-14 h-14 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: "#0061ff",
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
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-rubik-bold text-gray-900">
                {t("testimonials.writeReview")}
              </Text>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Rating */}
              <View className="mb-6">
                <Text className="text-sm font-rubik-medium text-gray-700 mb-3">
                  {t("testimonials.yourRating")} *
                </Text>
                <View className="flex-row justify-center">
                  {renderStars(rating, 40, true)}
                </View>
                <Text className="text-center text-sm text-gray-500 font-rubik mt-2">
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
                <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
                  {t("testimonials.serviceType")}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {["Buying", "Selling", "Renting", "Consulting", "Other"].map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setServiceType(type)}
                        className={`px-4 py-2 rounded-full ${
                          serviceType === type
                            ? "bg-primary-300"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`font-rubik-medium ${
                            serviceType === type ? "text-white" : "text-gray-700"
                          }`}
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
                <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
                  {t("testimonials.yourReview")} *
                </Text>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder={t("testimonials.reviewPlaceholder")}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={5}
                  className="bg-gray-100 rounded-xl px-4 py-3 font-rubik text-base text-gray-900 min-h-[120px]"
                  textAlignVertical="top"
                />
                <Text className="text-xs text-gray-400 font-rubik mt-1 text-right">
                  {comment.length}/2000
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmitTestimonial}
                disabled={submitting || !comment.trim()}
                className={`py-4 rounded-xl flex-row items-center justify-center mb-4 ${
                  submitting || !comment.trim() ? "bg-gray-300" : "bg-primary-300"
                }`}
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
      </Modal>
    </SafeAreaView>
  );
};

export default TestimonialsScreen;
