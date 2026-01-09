import { Image, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import React, { memo, useState, useCallback, useEffect } from "react";
import { Image as ExpoImage } from "expo-image";
import api from "@/lib/axios-config";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { useComparison } from "@/contexts/ComparisonContext";

// Blurhash placeholder for faster perceived loading
const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

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
  onPress?: () => void;
}

export const GreenHomeCard = memo(function GreenHomeCard({ property, onPress }: GreenHomeCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedLike, setHasCheckedLike] = useState(false);
  const { t } = useTranslation();

  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
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
    } catch (error) {
      setIsLiked(previousState);
    } finally {
      setIsLoading(false);
    }
  }, [property.id, isLiked, isLoading]);

  const handleComparisonToggle = useCallback((e: any) => {
    e.stopPropagation();
    if (inComparison) {
      removeFromComparison(property.id);
    } else {
      addToComparison(property.id);
    }
  }, [property.id, inComparison, addToComparison, removeFromComparison]);

  const getEcoScoreColor = useCallback((score: number) => {
    if (score >= 80) return "#10B981"; // Green
    if (score >= 60) return "#84CC16"; // Light green
    if (score >= 40) return "#EAB308"; // Yellow
    return "#F59E0B"; // Orange
  }, []);

  const getEcoScoreLabel = useCallback((score: number) => {
    if (score >= 80) return t("greenHomes.excellent");
    if (score >= 60) return t("greenHomes.good");
    if (score >= 40) return t("greenHomes.moderate");
    return t("greenHomes.basic");
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
      >
        <Text className="text-xs font-rubik-bold text-white">
          ⚡ {property.ecoScore}/100 - {getEcoScoreLabel(property.ecoScore)}
        </Text>
      </View>

      {/* Certifications Row */}
      <View className="absolute top-28 left-4 flex-row gap-2">
        {property.hasLEEDCertification && (
          <View className="bg-white/95 px-2 py-1 rounded-full">
            <Text className="text-xs font-rubik-bold text-green-700">
              LEED {property.leedLevel || ""}
            </Text>
          </View>
        )}
        {property.hasEnergyStarCertification && (
          <View className="bg-white/95 px-2 py-1 rounded-full">
            <Text className="text-xs font-rubik-bold text-blue-700">
              ⭐ Energy Star
            </Text>
          </View>
        )}
      </View>

      {/* Top Right Actions */}
      <View className="absolute top-4 right-4 flex-col gap-2">
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
            ${property.price.toLocaleString()}
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
