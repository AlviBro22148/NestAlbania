import icons from "@/constants/icons";
import images from "@/constants/images";
import { useComparison } from "@/contexts/ComparisonContext";
import api from "@/lib/axios-config";
import { useFocusEffect } from "@react-navigation/native";
import { Image as ExpoImage } from "expo-image";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";

// Blurhash placeholder for faster perceived loading
const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

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

interface FeaturedCardProps {
  property: Property;
  onPress?: () => void;
}

interface CardProps {
  property?: Property;
  onPress?: () => void;
}

interface TodaysChoiceCardProps {
  property: Property;
  onPress?: () => void;
}

// ============================================
// TODAY'S CHOICE CARD - Premium Selection
// ============================================
export const TodaysChoiceCard = memo(function TodaysChoiceCard({
  property,
  onPress,
}: TodaysChoiceCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedLike, setHasCheckedLike] = useState(false);
  const { t } = useTranslation();

  const { isInComparison, addToComparison, removeFromComparison } =
    useComparison();
  const inComparison = isInComparison(property.id);

  // Only check like status once on mount, not on every focus
  useEffect(() => {
    if (!hasCheckedLike && property) {
      let isMounted = true;
      api.get(`/api/likedproperties/check/${property.id}`)
        .then(response => {
          if (isMounted) {
            setIsLiked(response.data.isLiked);
            setHasCheckedLike(true);
          }
        })
        .catch(() => {
          // Silently fail - not critical
        });
      return () => { isMounted = false; };
    }
  }, [property?.id, hasCheckedLike]);

  const toggleLike = useCallback(async (e: any) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    const previousState = isLiked;
    setIsLiked(!isLiked);

    try {
      if (isLiked) {
        await api.delete(`/api/likedproperties/${property.id}`);
      } else {
        await api.post(`/api/likedproperties/${property.id}`);
      }
    } catch (error: any) {
      setIsLiked(previousState);
      if (error.response?.status !== 404) {
        Alert.alert(
          t("common.error"),
          error.response?.data?.message || t("errors.updateFailed")
        );
      } else {
        setIsLiked(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [property.id, isLiked, isLoading, t]);

  const handleComparisonToggle = useCallback((e: any) => {
    e.stopPropagation();
    if (inComparison) {
      removeFromComparison(property.id);
    } else {
      addToComparison(property.id);
    }
  }, [property.id, inComparison, addToComparison, removeFromComparison]);

  const calculateProperty = useCallback((type: string) => {
    if (type === "House") return `🏠 ${t("propertyTypes.house")}`;
    if (type === "Apartment") return `🏢 ${t("propertyTypes.apartment")}`;
    if (type === "Office") return `☕ ${t("propertyTypes.office")}`;
    if (type === "Villa") return `🏡 ${t("propertyTypes.villa")}`;
    if (type === "Studio") return `🎬 ${t("propertyTypes.studio")}`;
    return type;
  }, [t]);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-col items-start w-72 h-96 relative mr-4"
      activeOpacity={0.8}
    >
      {/* Main Image - Using expo-image for better caching */}
      <ExpoImage
        source={{ uri: property.images[0] }}
        style={{ width: "100%", height: "100%", borderRadius: 24 }}
        contentFit="cover"
        placeholder={BLURHASH}
        transition={200}
        cachePolicy="memory-disk"
      />

      {/* Gradient Overlay */}
      <Image
        source={images.cardGradient}
        className="size-full rounded-3xl absolute bottom-0"
      />

      {/* Today's Choice Badge */}
      <View
        className="absolute top-4 left-4 px-3 py-2 rounded-full flex-row items-center shadow-lg"
        style={{
          backgroundColor: "#F59E0B",
          shadowColor: "#F59E0B",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text className="text-lg mr-1">⭐</Text>
        <Text className="text-sm font-rubik-extrabold text-white">
          {t("properties.todaysChoice").toUpperCase()}
        </Text>
      </View>

      {/* Property Type Badge */}
      <View className="absolute top-16 left-4 bg-white/95 px-3 py-2 rounded-full">
        <Text className="text-xs font-rubik-bold text-primary-300">
          {calculateProperty(property.propertyType)}
        </Text>
      </View>

      {/* Top Right Actions */}
      <View className="absolute top-4 right-4 flex-col gap-2">
        {/* Like Button */}
        <TouchableOpacity
          onPress={toggleLike}
          disabled={isLoading}
          className="p-2.5 rounded-full bg-white/60 shadow-md"
          activeOpacity={0.7}
        >
          <Image
            source={icons.heart}
            className="size-7"
            tintColor={isLiked ? "#FF0000" : "#FFFFFF"}
          />
        </TouchableOpacity>

        {/* Comparison Button */}
        <TouchableOpacity
          onPress={handleComparisonToggle}
          className={`p-2.5 rounded-full shadow-md ${
            inComparison ? "bg-primary-300" : "bg-white/60"
          }`}
          activeOpacity={0.7}
        >
          <Image
            source={icons.comparison}
            className="size-6"
            tintColor={inComparison ? "#FFFFFF" : "#191D31"}
          />
        </TouchableOpacity>
      </View>

      {/* Property Details - Bottom Section */}
      <View className="flex flex-col items-start absolute bottom-5 inset-x-5">
        <Text
          className="text-xl font-rubik-extrabold text-white shadow-lg"
          numberOfLines={1}
        >
          {property.title}
        </Text>

        <Text
          className="text-sm font-rubik text-white/90 mt-1 shadow-sm"
          numberOfLines={1}
        >
          📍 {property.address}
        </Text>

        <View className="flex flex-row items-center justify-between w-full mt-3">
          <Text className="text-2xl font-rubik-extrabold text-white shadow-lg">
            ${property.price.toLocaleString()}
          </Text>

          {(property.bedrooms > 0 || property.bathrooms > 0) && (
            <View
              className="flex flex-row items-center px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            >
              {property.bedrooms > 0 && (
                <Text className="text-white text-xs font-rubik-bold mr-2">
                  🛏️ {property.bedrooms}
                </Text>
              )}
              {property.bathrooms > 0 && (
                <Text className="text-white text-xs font-rubik-bold">
                  🚿 {property.bathrooms}
                </Text>
              )}
            </View>
          )}
        </View>

        <View
          className="flex flex-row items-center mt-2 px-3 py-1 rounded-full"
          style={{ backgroundColor: "#10B981" }}
        >
          <Text className="text-white text-xs font-rubik-bold">
            ✨ {t("properties.premiumPick")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ============================================
// FEATURED CARD - Horizontal Scroll
// ============================================
export const FeaturedCard = memo(function FeaturedCard({ property, onPress }: FeaturedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedLike, setHasCheckedLike] = useState(false);
  const { t } = useTranslation();

  const { isInComparison, addToComparison, removeFromComparison } =
    useComparison();
  const inComparison = isInComparison(property.id);

  // Only check like status once on mount
  useEffect(() => {
    if (!hasCheckedLike && property) {
      let isMounted = true;
      api.get(`/api/likedproperties/check/${property.id}`)
        .then(response => {
          if (isMounted) {
            setIsLiked(response.data.isLiked);
            setHasCheckedLike(true);
          }
        })
        .catch(() => {
          // Silently fail - not critical
        });
      return () => { isMounted = false; };
    }
  }, [property?.id, hasCheckedLike]);

  const toggleLike = useCallback(async (e: any) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    const previousState = isLiked;
    setIsLiked(!isLiked);

    try {
      if (isLiked) {
        await api.delete(`/api/likedproperties/${property.id}`);
      } else {
        await api.post(`/api/likedproperties/${property.id}`);
      }
    } catch (error: any) {
      setIsLiked(previousState);
      if (error.response?.status !== 404) {
        Alert.alert(
          t("common.error"),
          error.response?.data?.message || t("errors.updateFailed")
        );
      } else {
        setIsLiked(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [property.id, isLiked, isLoading, t]);

  const handleComparisonToggle = useCallback((e: any) => {
    e.stopPropagation();
    if (inComparison) {
      removeFromComparison(property.id);
    } else {
      addToComparison(property.id);
    }
  }, [property.id, inComparison, addToComparison, removeFromComparison]);

  const calculateProperty = useCallback((type: string) => {
    if (type === "House") return `🏠 ${t("propertyTypes.house")}`;
    if (type === "Apartment") return `🏢 ${t("propertyTypes.apartment")}`;
    if (type === "Office") return `☕ ${t("propertyTypes.office")}`;
    if (type === "Villa") return `🏡 ${t("propertyTypes.villa")}`;
    if (type === "Studio") return `🎬 ${t("propertyTypes.studio")}`;
    return type;
  }, [t]);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-col items-start w-60 h-80 relative"
      activeOpacity={0.8}
    >
      {/* Main Image - Using expo-image for better caching */}
      <ExpoImage
        source={{ uri: property.images[0] }}
        style={{ width: "100%", height: "100%", borderRadius: 16 }}
        contentFit="cover"
        placeholder={BLURHASH}
        transition={200}
        cachePolicy="memory-disk"
      />
      <Image
        source={images.cardGradient}
        className="size-full rounded-2xl absolute bottom-0"
      />

      {/* Top Left Actions */}
      <View className="absolute top-3 left-3 flex-row gap-2">
        {/* Like Button */}
        <TouchableOpacity
          onPress={toggleLike}
          disabled={isLoading}
          className="p-2 rounded-full bg-white/50 z-50"
          activeOpacity={0.7}
        >
          <Image
            source={icons.heart}
            className="size-7"
            tintColor={isLiked ? "#FF0000" : "#FFFFFF"}
          />
        </TouchableOpacity>

        {/* Comparison Button */}
        <TouchableOpacity
          onPress={handleComparisonToggle}
          className={`p-2 rounded-full z-50 ${
            inComparison ? "bg-primary-300" : "bg-white/50"
          }`}
          activeOpacity={0.7}
        >
          <Image
            source={icons.comparison}
            className="size-6"
            tintColor={inComparison ? "#FFFFFF" : "#191D31"}
          />
        </TouchableOpacity>
      </View>

      {/* Property Type Badge */}
      <View className="flex flex-row items-center bg-white/90 px-3 py-1.5 rounded-full absolute top-4 right-2">
        <Text className="text-xs font-rubik-bold text-primary-300">
          {calculateProperty(property.propertyType)}
        </Text>
      </View>

      {/* Property Details */}
      <View className="flex flex-col items-start absolute bottom-5 inset-x-5">
        <Text
          className="text-xl font-rubik-extrabold text-white"
          numberOfLines={1}
        >
          {property.title}
        </Text>
        <Text className="text-base font-rubik text-white" numberOfLines={1}>
          {property.address}
        </Text>
        <View className="flex flex-row items-center justify-between w-full">
          <Text className="text-xl font-rubik-extrabold text-white">
            ${property.price.toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ============================================
// CARDS - Grid View (Recommendations)
// ============================================
export const Cards = memo(function Cards({ property, onPress }: CardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedLike, setHasCheckedLike] = useState(false);
  const { t } = useTranslation();

  const { isInComparison, addToComparison, removeFromComparison } =
    useComparison();

  // Only check like status once on mount
  useEffect(() => {
    if (!hasCheckedLike && property) {
      let isMounted = true;
      api.get(`/api/likedproperties/check/${property.id}`)
        .then(response => {
          if (isMounted) {
            setIsLiked(response.data.isLiked);
            setHasCheckedLike(true);
          }
        })
        .catch(() => {
          // Silently fail - not critical
        });
      return () => { isMounted = false; };
    }
  }, [property?.id, hasCheckedLike]);

  const toggleLike = useCallback(async (e: any) => {
    e.stopPropagation();
    if (!property || isLoading) return;

    setIsLoading(true);
    const previousState = isLiked;
    setIsLiked(!isLiked);

    try {
      if (isLiked) {
        await api.delete(`/api/likedproperties/${property.id}`);
      } else {
        await api.post(`/api/likedproperties/${property.id}`);
      }
    } catch (error: any) {
      setIsLiked(previousState);
      if (error.response?.status !== 404) {
        Alert.alert(
          t("common.error"),
          error.response?.data?.message || t("errors.updateFailed")
        );
      } else {
        setIsLiked(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [property?.id, isLiked, isLoading, t]);

  const handleComparisonToggle = useCallback((e: any) => {
    e.stopPropagation();
    if (!property) return;

    const inComparison = isInComparison(property.id);
    if (inComparison) {
      removeFromComparison(property.id);
    } else {
      addToComparison(property.id);
    }
  }, [property?.id, isInComparison, addToComparison, removeFromComparison]);

  const calculateRating = useCallback((price: number) => {
    if (price > 500000) return "5.0";
    if (price > 300000) return "4.8";
    if (price > 150000) return "4.5";
    return "4.2";
  }, []);

  if (!property) {
    return null;
  }

  const inComparison = isInComparison(property.id);

  return (
    <View className="flex-1">
      <TouchableOpacity
        className="w-full mt-4 px-3 py-3 rounded-lg bg-white shadow-lg shadow-black-100/70 relative"
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Rating Badge */}
        <View className="flex flex-row items-center absolute px-2 top-5 right-5 bg-white/90 p-1 rounded-full z-50">
          <Image source={icons.star} className="size-3.5" />
          <Text className="text-xs font-rubik-bold text-primary-300 ml-0.5">
            {calculateRating(property.price)}
          </Text>
        </View>

        {/* Left Side Actions */}
        <View className="absolute top-5 left-5 flex-col gap-2 z-50">
          {/* Like Button */}
          <TouchableOpacity
            onPress={toggleLike}
            disabled={isLoading}
            className="p-2 rounded-full bg-white/80"
            activeOpacity={0.7}
          >
            <Image
              source={icons.heart}
              className="w-5 h-5"
              tintColor={isLiked ? "#FF0000" : "#191D31"}
            />
          </TouchableOpacity>

          {/* Comparison Button */}
          <TouchableOpacity
            onPress={handleComparisonToggle}
            className={`p-2 rounded-full ${
              inComparison ? "bg-primary-300" : "bg-white/80"
            }`}
            activeOpacity={0.7}
          >
            <Image
              source={icons.chart}
              className="w-5 h-5"
              tintColor={inComparison ? "#FFFFFF" : "#191D31"}
            />
          </TouchableOpacity>
        </View>

        {/* Property Image - Using expo-image for better caching */}
        <ExpoImage
          source={{ uri: property.images[0] }}
          style={{ width: "100%", height: 160, borderRadius: 8 }}
          contentFit="cover"
          placeholder={BLURHASH}
          transition={200}
          cachePolicy="memory-disk"
        />

        {/* Property Details */}
        <View className="flex flex-col mt-2">
          <Text
            className="text-base font-rubik-bold text-black-300"
            numberOfLines={1}
          >
            {property.title}
          </Text>
          <Text className="text-xs font-rubik text-black-100" numberOfLines={1}>
            {property.address}
          </Text>
          <View className="flex flex-row items-center justify-between mt-2">
            <Text className="text-base font-rubik-bold text-primary-300">
              ${property.price.toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});
