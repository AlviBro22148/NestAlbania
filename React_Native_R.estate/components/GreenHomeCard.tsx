import { Text, TouchableOpacity, View, Alert } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useTranslation } from "react-i18next";
import React, { memo, useCallback, useMemo } from "react";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { useComparison } from "@/contexts/ComparisonContext";
import { useLikedProperties } from "@/contexts/LikedPropertiesContext";
import { AnimatedLikeButtonCard } from "./AnimatedLikeButton";

import { formatCurrency } from "@/lib/utils";
// Blurhash for instant placeholder (L1 cache visual)
const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

// Pure function - moved outside component to avoid recreation
const getEcoScoreColor = (score: number) => {
  if (score >= 80) return "#10B981"; // Green
  if (score >= 60) return "#84CC16"; // Light green
  if (score >= 40) return "#EAB308"; // Yellow
  return "#F59E0B"; // Orange
};

interface GreenHomeProperty {
  id: number;
  title: string;
  address: string;
  price: number;
  images: string[];
  propertyType: string;
  ecoScore: number;
  hasLEEDCertification: boolean;
  leedLevel?: string;
  hasEnergyStarCertification: boolean;
  hasSolarPanels: boolean;
}

interface GreenHomeCardProps {
  property: GreenHomeProperty;
  onPress?: (id: number) => void;
}

export const GreenHomeCard = memo(function GreenHomeCard({ property, onPress }: GreenHomeCardProps) {
  const handlePress = useCallback((_event?: any) => {
    onPress?.(property.id);
  }, [onPress, property.id]);
  const { t } = useTranslation();
  const { isLiked, toggleLike } = useLikedProperties();
  const { isInComparison, addToComparison, removeFromComparison } = useComparison();

  const liked = isLiked(property.id);
  const inComparison = isInComparison(property.id);

  const handleToggleLike = useCallback(async () => {
    try {
      await toggleLike(property.id);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        Alert.alert(
          t("common.error"),
          error.response?.data?.message || t("errors.updateFailed")
        );
      }
    }
  }, [property.id, toggleLike, t]);

  const handleComparisonToggle = useCallback((e: any) => {
    e.stopPropagation();
    if (inComparison) {
      removeFromComparison(property.id);
    } else {
      addToComparison(property.id);
    }
  }, [property.id, inComparison, addToComparison, removeFromComparison]);

  const getEcoScoreLabel = useCallback((score: number) => {
    if (score >= 80) return t("greenHomes.excellent");
    if (score >= 60) return t("greenHomes.good");
    if (score >= 40) return t("greenHomes.moderate");
    return t("greenHomes.basic");
  }, [t]);

  const imageUri = property.images?.[0] || "";

  // Memoize certifications string to avoid recalculating on every render
  const certifications = useMemo(() => [
    property.hasLEEDCertification && `LEED ${property.leedLevel || ""}`,
    property.hasEnergyStarCertification && "Energy Star",
    property.hasSolarPanels && "Solar Panels",
  ].filter(Boolean).join(", "), [
    property.hasLEEDCertification,
    property.leedLevel,
    property.hasEnergyStarCertification,
    property.hasSolarPanels,
  ]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex flex-col items-start w-72 h-96 relative mr-4"
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, Green home, Eco score ${property.ecoScore} out of 100, ${getEcoScoreLabel(property.ecoScore)}, ${formatCurrency(property.price)}${certifications ? `, ${certifications}` : ""}`}
      accessibilityHint="Double tap to view green home details"
    >
      {/* Main Image - expo-image with L1+L2 caching */}
      <ExpoImage
        source={{ uri: imageUri }}
        className="w-full h-full rounded-3xl absolute"
        contentFit="cover"
        placeholder={{ blurhash: BLURHASH }}
        placeholderContentFit="cover"
        transition={0}
        cachePolicy="memory-disk"
        recyclingKey={imageUri}
        accessibilityIgnoresInvertColors
      />

      {/* Gradient Overlay */}
      <ExpoImage
        source={images.cardGradient}
        style={{ width: "100%", height: "100%", borderRadius: 24, position: "absolute", bottom: 0 }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />

      {/* Green Home Badge */}
      <View
        className="absolute top-4 left-4 px-3 py-2 rounded-full flex-row items-center shadow-lg"
        style={{
          backgroundColor: "#10B981",
          shadowColor: "#10B981",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
        accessibilityLabel="Green home eco-friendly property"
      >
        <Text className="text-lg mr-1">🌿</Text>
        <Text className="text-sm font-rubik-extrabold text-white">
          {t("greenHomes.greenHome").toUpperCase()}
        </Text>
      </View>

      {/* Eco Score Badge */}
      <View
        className="absolute top-16 left-4 px-3 py-2 rounded-full"
        style={{ backgroundColor: getEcoScoreColor(property.ecoScore) }}
        accessibilityLabel={`Eco score ${property.ecoScore} out of 100, ${getEcoScoreLabel(property.ecoScore)}`}
      >
        <Text className="text-xs font-rubik-bold text-white">
          ⚡ {property.ecoScore}/100 - {getEcoScoreLabel(property.ecoScore)}
        </Text>
      </View>

      {/* Certifications Row */}
      <View className="absolute top-28 left-4 flex-row gap-2">
        {property.hasLEEDCertification && (
          <View className="bg-white/95 px-2 py-1 rounded-full" accessibilityLabel={`LEED ${property.leedLevel || ""} certified`}>
            <Text className="text-xs font-rubik-bold text-green-700">
              LEED {property.leedLevel || ""}
            </Text>
          </View>
        )}
        {property.hasEnergyStarCertification && (
          <View className="bg-white/95 px-2 py-1 rounded-full" accessibilityLabel="Energy Star certified">
            <Text className="text-xs font-rubik-bold text-blue-700">
              ⭐ Energy Star
            </Text>
          </View>
        )}
      </View>

      {/* Top Right Actions */}
      <View className="absolute top-4 right-4 flex-col gap-2">
        {/* Animated Like Button */}
        <AnimatedLikeButtonCard
          isLiked={liked}
          onPress={handleToggleLike}
          size="medium"
          accessibilityLabel={liked ? "Remove from favorites" : "Add to favorites"}
        />

        <TouchableOpacity
          onPress={handleComparisonToggle}
          className={`w-10 h-10 rounded-full shadow-md items-center justify-center ${
            inComparison ? "bg-primary-300" : "bg-white/60"
          }`}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={inComparison ? "Remove from comparison" : "Add to comparison"}
          accessibilityHint="Compare this property with others"
        >
          <ExpoImage
            source={icons.comparison}
            style={{ width: 24, height: 24 }}
            tintColor={inComparison ? "#FFFFFF" : "#191D31"}
            contentFit="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Property Details */}
      <View className="flex flex-col items-start absolute bottom-5 inset-x-5">
        <Text className="text-xl font-rubik-extrabold text-white shadow-lg" numberOfLines={1}>
          {property.title}
        </Text>

        <Text className="text-sm font-rubik text-white/90 mt-1 shadow-sm" numberOfLines={1}>
          📍 {property.address}
        </Text>

        <View className="flex flex-row items-center justify-between w-full mt-3">
          <Text className="text-2xl font-rubik-extrabold text-white shadow-lg">
            {formatCurrency(property.price)}
          </Text>

          {property.hasSolarPanels && (
            <View className="flex flex-row items-center px-3 py-1.5 rounded-full bg-yellow-400/80">
              <Text className="text-white text-xs font-rubik-bold">
                ☀️ Solar
              </Text>
            </View>
          )}
        </View>

        <View className="flex flex-row items-center mt-2 px-3 py-1 rounded-full" style={{ backgroundColor: "#10B981" }}>
          <Text className="text-white text-xs font-rubik-bold">
            🌱 {t("greenHomes.ecoCertified")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});
