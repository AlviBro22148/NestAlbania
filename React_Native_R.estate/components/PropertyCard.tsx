import icons from "@/constants/icons";
import { useComparison } from "@/contexts/ComparisonContext";
import api from "@/lib/axios-config";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
  onPress?: () => void;
  onLikeChange?: () => void;
}

export default function PropertyCard({
  id,
  title,
  price,
  address,
  bedrooms,
  bathrooms,
  area,
  images,
  propertyType,
  // Destructure the new prop
  listingType,
  monthlyRent,
  onLikeChange,
}: PropertyCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  // Comparison context
  const { isInComparison, addToComparison, removeFromComparison } =
    useComparison();
  const inComparison = isInComparison(id);

  // Determine if it is a rental property
  const isRental = listingType === "Rent";

  useEffect(() => {
    checkIfLiked();
  }, [id]);

  const checkIfLiked = async () => {
    try {
      const response = await api.get(`/api/likedproperties/check/${id}`);
      setIsLiked(response.data.isLiked);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const toggleLike = async (e?: any) => {
    if (e) e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    const previousState = isLiked;

    // Optimistic update
    setIsLiked(!isLiked);

    try {
      if (isLiked) {
        // Unlike
        await api.delete(`/api/likedproperties/${id}`);
      } else {
        // Like
        await api.post(`/api/likedproperties/${id}`);
      }

      // Notify parent component that like status changed
      if (onLikeChange) {
        onLikeChange();
      }
    } catch (error: any) {
      // Revert on error
      setIsLiked(previousState);
      console.error("Error toggling like:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update like status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleComparisonToggle = (e?: any) => {
    if (e) e.stopPropagation();

    if (inComparison) {
      removeFromComparison(id);
    } else {
      addToComparison(id);
    }
  };

  const formatPrice = (salePrice: number, rentPrice: number | undefined) => {
    let displayPrice: number;
    let suffix: string = "";

    if (isRental && rentPrice && rentPrice > 0) {
      displayPrice = rentPrice;
      suffix = "/mo";
    } else {
      // Use salePrice for Sale properties or as a fallback
      displayPrice = salePrice;
    }

    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(displayPrice) + suffix
    );
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(root)/properties/${id}`)}
      className="bg-white rounded-2xl shadow-md mb-4 overflow-hidden"
      activeOpacity={0.8}
    >
      {/* Property Image */}
      <View className="relative">
        {images.length > 0 ? (
          <Image
            source={{ uri: images[0] }}
            className="w-full h-48"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-48 bg-gray-200 items-center justify-center">
            <Text className="text-gray-400 text-lg">No Image</Text>
          </View>
        )}

        {/* --- BADGE CONTAINER: Property Type and Listing Type --- */}
        <View className="absolute top-3 left-3 flex-row gap-2 z-10">
          {/* 1. Property Type Badge */}
          <View className="bg-primary-300 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-rubik-medium">
              {t(`propertyTypes.${propertyType.toLowerCase()}`)}
            </Text>
          </View>

          {/* 2. Listing Type Badge (NEWLY ADDED) */}
          <View
            className={`px-3 py-1 rounded-full ${isRental ? "bg-purple-100" : "bg-blue-100"}`}
          >
            <Text
              className={`text-xs font-rubik-medium ${isRental ? "text-purple-700" : "text-blue-700"}`}
            >
              {/* Conditional Emoji and Text */}
              {isRental ? "🔑 Rent" : "🏷️ Sale"}
            </Text>
          </View>
        </View>
        {/* -------------------------------------------------------- */}

        {/* Top Right Action Buttons */}
        <View className="absolute top-2 right-3 flex-col gap-2 z-50">
          {/* Like Button */}
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

          {/* Comparison Button */}
          <TouchableOpacity
            onPress={handleComparisonToggle}
            className={`p-2 rounded-full ${
              inComparison ? "bg-primary-300" : "bg-white/60"
            }`}
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
        <Text
          className="text-xl font-rubik-bold text-black-300 mb-1"
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text className="text-sm text-gray-500 mb-3" numberOfLines={1}>
          📍 {address}
        </Text>

        {/* Price */}
        <Text className="text-2xl font-rubik-bold text-primary-300 mb-3">
          {formatPrice(price, monthlyRent)}
        </Text>
        {/* Features */}
        <View className="flex-row items-center gap-4">
          {bedrooms > 0 && (
            <View className="flex-row items-center">
              <Text className="text-gray-600 text-sm">🛏️ {bedrooms}</Text>
            </View>
          )}
          {bathrooms > 0 && (
            <View className="flex-row items-center">
              <Text className="text-gray-600 text-sm">🚿 {bathrooms}</Text>
            </View>
          )}
          {area > 0 && (
            <View className="flex-row items-center">
              <Text className="text-gray-600 text-sm">📐 {area}m²</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
