import icons from "@/constants/icons";
import { useComparison } from "@/contexts/ComparisonContext";
import api from "@/lib/axios-config";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";

interface PropertyCardProps {
  id: number;
  title: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  propertyType: string;
  listingType: string;
  monthlyRent?: number;
  initialLiked?: boolean;
  onPress?: () => void;
  onLikeChange?: () => void;
}

// Blurhash placeholder for faster perceived loading
const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

const PropertyCard = memo(function PropertyCard({
  id,
  title,
  price,
  address,
  bedrooms,
  bathrooms,
  area,
  images,
  propertyType,
  listingType,
  monthlyRent,
  initialLiked,
  onLikeChange,
}: PropertyCardProps) {
  const [isLiked, setIsLiked] = useState(initialLiked ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedLike, setHasCheckedLike] = useState(initialLiked !== undefined);
  const { t } = useTranslation();

  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
  const inComparison = isInComparison(id);
  const isRental = listingType === "Rent";

  // Only check like status if not provided initially
  useEffect(() => {
    if (!hasCheckedLike) {
      let isMounted = true;
      api.get(`/api/likedproperties/check/${id}`)
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
  }, [id, hasCheckedLike]);

  const toggleLike = useCallback(async (e?: any) => {
    if (e) e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    const previousState = isLiked;
    setIsLiked(!isLiked);

    try {
      if (isLiked) {
        await api.delete(`/api/likedproperties/${id}`);
      } else {
        await api.post(`/api/likedproperties/${id}`);
      }
      onLikeChange?.();
    } catch (error: any) {
      setIsLiked(previousState);
      Alert.alert("Error", error.response?.data?.message || "Failed to update like status");
    } finally {
      setIsLoading(false);
    }
  }, [id, isLiked, isLoading, onLikeChange]);

  const handleComparisonToggle = useCallback((e?: any) => {
    if (e) e.stopPropagation();
    if (inComparison) {
      removeFromComparison(id);
    } else {
      addToComparison(id);
    }
  }, [id, inComparison, addToComparison, removeFromComparison]);

  const handlePress = useCallback(() => {
    router.push(`/(root)/properties/${id}`);
  }, [id]);

  const formattedPrice = React.useMemo(() => {
    let displayPrice: number;
    let suffix: string = "";

    if (isRental && monthlyRent && monthlyRent > 0) {
      displayPrice = monthlyRent;
      suffix = "/mo";
    } else {
      displayPrice = price;
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(displayPrice) + suffix;
  }, [price, monthlyRent, isRental]);

  const propertyTypeLabel = t(`propertyTypes.${propertyType.toLowerCase()}`);

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white rounded-2xl shadow-md mb-4 overflow-hidden"
      activeOpacity={0.8}
    >
      {/* Property Image - Using expo-image for better caching */}
      <View className="relative">
        {images.length > 0 ? (
          <ExpoImage
            source={{ uri: images[0] }}
            style={{ width: "100%", height: 192 }}
            contentFit="cover"
            placeholder={BLURHASH}
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="w-full h-48 bg-gray-200 items-center justify-center">
            <Text className="text-gray-400 text-lg">No Image</Text>
          </View>
        )}

        {/* Badge Container */}
        <View className="absolute top-3 left-3 flex-row gap-2 z-10">
          <View className="bg-primary-300 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-rubik-medium">
              {propertyTypeLabel}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${isRental ? "bg-purple-100" : "bg-blue-100"}`}>
            <Text className={`text-xs font-rubik-medium ${isRental ? "text-purple-700" : "text-blue-700"}`}>
              {isRental ? "🔑 Rent" : "🏷️ Sale"}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="absolute top-2 right-3 flex-col gap-2 z-50">
          <TouchableOpacity
            onPress={toggleLike}
            disabled={isLoading}
            className="p-2 rounded-full bg-white/60"
            activeOpacity={0.7}
          >
            <Image
              source={icons.heart}
              className="size-7"
              tintColor={isLiked ? "#FF0000" : "#191D31"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleComparisonToggle}
            className={`p-2 rounded-full ${inComparison ? "bg-primary-300" : "bg-white/60"}`}
            activeOpacity={0.7}
          >
            <Image
              source={icons.chart}
              className="size-6"
              tintColor={inComparison ? "#FFFFFF" : "#191D31"}
            />
          </TouchableOpacity>
        </View>

        {/* Image Count Badge */}
        {images.length > 1 && (
          <View className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 rounded-full">
            <Text className="text-white text-xs">📷 {images.length}</Text>
          </View>
        )}
      </View>

      {/* Property Details */}
      <View className="p-4">
        <Text className="text-xl font-rubik-bold text-black-300 mb-1" numberOfLines={1}>
          {title}
        </Text>

        <Text className="text-sm text-gray-500 mb-3" numberOfLines={1}>
          📍 {address}
        </Text>

        <Text className="text-2xl font-rubik-bold text-primary-300 mb-3">
          {formattedPrice}
        </Text>

        {/* Features */}
        <View className="flex-row items-center gap-4">
          {bedrooms > 0 && (
            <Text className="text-gray-600 text-sm">🛏️ {bedrooms}</Text>
          )}
          {bathrooms > 0 && (
            <Text className="text-gray-600 text-sm">🚿 {bathrooms}</Text>
          )}
          {area > 0 && (
            <Text className="text-gray-600 text-sm">📐 {area}m²</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default PropertyCard;
