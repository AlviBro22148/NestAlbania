import ComparisonFloatingButton from "@/components/ComparisonFloatingButton";
import PropertyCard from "@/components/PropertyCard";
import icons from "@/constants/icons";
import { useLikedProperties } from "@/contexts/LikedPropertiesContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useComparison } from "@/contexts/ComparisonContext";
import { SafeAreaView } from "react-native-safe-area-context";

interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  status: string;
  images: string[];
  userId: string;
  ownerName?: string;
  createdAt: string;
}

const LikedProperties = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");
  const { likedIds, isLiked, toggleLike } = useLikedProperties();
  const { isInComparison, addToComparison, removeFromComparison } = useComparison();

  // Use React Query for cached liked properties - INSTANT from cache
  const { data: allProperties = [], isLoading: loading, isFetching, refetch } = useQuery({
    queryKey: ["liked-properties"],
    queryFn: async () => {
      const response = await api.get("/api/likedproperties");
      return response.data as Property[];
    },
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Filter properties based on current likedIds - removes immediately when unliked
  const likedProperties = useMemo(() => {
    return allProperties.filter(property => likedIds.has(property.id));
  }, [allProperties, likedIds]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-32">
      <View className="rounded-full p-8 mb-6" style={{ backgroundColor: isDark ? colors.surfaceElevated : "#FEE2E2" }}>
        <Ionicons name="heart-outline" size={80} color="#EF4444" />
      </View>
      <Text className="text-2xl font-rubik-extrabold mb-2" style={{ color: colors.text }}>
        {t("properties.noLikedProperties")}
      </Text>
      <Text className="text-base font-rubik text-center px-12 leading-6" style={{ color: colors.textSecondary }}>
        {t("properties.likedPropertiesDescription")}
      </Text>
      <View className="mt-8 px-6 py-4 rounded-2xl border" style={{ backgroundColor: isDark ? colors.surface : "#FEF2F2", borderColor: isDark ? colors.border : "#FECACA" }}>
        <View className="flex-row items-center">
          <Ionicons name="information-circle" size={24} color="#EF4444" />
          <Text className="text-sm font-rubik-medium ml-3 flex-1" style={{ color: colors.text }}>
            Tap the ❤️ icon on any property to add it here
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <View>
        <LinearGradient
          colors={isDark ? [colors.surface, colors.surfaceElevated, colors.background] : ["#FEE2E2", "#FECACA", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 py-8 rounded-b-[32px] shadow-lg"
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full mb-4"
            style={{ backgroundColor: isDark ? colors.surfaceElevated : "rgba(255,255,255,0.8)" }}
          >
            <Image source={icons.backArrow} className="w-5 h-5" style={{ tintColor: colors.text }} />
          </TouchableOpacity>

          <View className="flex-row items-center">
            {/* Animated Heart Container */}
            <View className="relative">
              <View className="absolute inset-0 bg-red-400 rounded-full opacity-20 animate-pulse" />
              <View className="rounded-full p-4 shadow-md" style={{ backgroundColor: colors.surface }}>
                <Ionicons name="heart" size={32} color="#EF4444" />
              </View>
              {/* Floating Badge */}
              {likedProperties.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[24px] h-6 items-center justify-center px-2 border-2 border-white">
                  <Text className="text-white text-xs font-rubik-bold">
                    {likedProperties.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Header Text */}
            <View className="ml-5 flex-1">
              <Text className="text-3xl font-rubik-extrabold" style={{ color: colors.text }}>
                {t("profile.likedProperties")}
              </Text>
              <View className="flex-row items-center mt-2">
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2" }}>
                  <Text className="text-sm font-rubik-bold text-red-500">
                    {likedProperties.length}
                    {"  "}
                    {likedProperties.length === 1
                      ? t("common.likedProperty")
                      : t("profile.property")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Decorative Elements */}
          <View className="absolute -right-8 -top-8 w-32 h-32 bg-red-200 rounded-full opacity-20" />
          <View className="absolute -left-4 -bottom-4 w-24 h-24 bg-pink-200 rounded-full opacity-20" />
        </LinearGradient>
      </View>

      {/* Properties List */}
      <FlashList
        data={likedProperties}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <PropertyCard
              id={item.id}
              title={item.title}
              price={item.price}
              address={item.address}
              bedrooms={item.bedrooms}
              bathrooms={item.bathrooms}
              area={item.area}
              images={item.images}
              propertyType={item.propertyType}
              listingType="Sale"
              isLiked={isLiked(item.id)}
              isInComparison={isInComparison(item.id)}
              onToggleLike={() => toggleLike(item.id)}
              onToggleComparison={() => {
                if (isInComparison(item.id)) {
                  removeFromComparison(item.id);
                } else {
                  addToComparison(item.id);
                }
              }}
              propertyTypeLabel={t(`propertyTypes.${item.propertyType.toLowerCase()}`)}
            />
          </View>
        )}
        keyExtractor={(item) => `liked-${item.id}`}
        estimatedItemSize={320}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 120,
        }}
        ListEmptyComponent={renderEmptyState}
        drawDistance={500}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            tintColor="#EF4444"
            colors={["#EF4444", "#F87171", "#FCA5A5"]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          likedProperties.length > 0 ? (
            <View className="mb-4 px-4">
              <View className="p-4 rounded-2xl border" style={{ backgroundColor: isDark ? colors.surface : "#FEF2F2", borderColor: isDark ? colors.border : "#FECACA" }}>
                <View className="flex-row items-center">
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color="#EF4444"
                  />
                  <Text className="text-sm font-rubik-medium flex-1 ml-2" style={{ color: colors.text }}>
                    Your collection of favorite properties
                  </Text>
                </View>
              </View>
            </View>
          ) : null
        }
      />

      {/* Comparison Floating Button */}
      <ComparisonFloatingButton />
    </SafeAreaView>
  );
};

export default LikedProperties;

