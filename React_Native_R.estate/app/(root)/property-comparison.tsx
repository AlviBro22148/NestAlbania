import icons from "@/constants/icons";
import api from "@/lib/axios-config";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Property {
  id: number;
  title: string;
  price: number;
  address: string;
  city: string;
  neighborhood: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  lotSize?: number;
  yearBuilt?: number;
  parkingSpaces: number;
  hasGarage: boolean;
  isPetFriendly: boolean;
  hasInUnitLaundry: boolean;
  hasPool: boolean;
  hasGym: boolean;
  hasAirConditioning: boolean;
  images: string[];
  status: string;
  ecoScore: number; // Added
  hasSolarPanels: boolean;
  hasEnergyEfficientAppliances: boolean;
  hasLEDLighting: boolean;
  hasSmartThermostats: boolean;
  hasDoubleGlazedWindows: boolean;
  hasRainwaterHarvesting: boolean;
  hasGreenRoof: boolean;
  hasEnergyStarCertification: boolean;
  hasLEEDCertification: boolean;
  leedLevel?: string;
}

export default function PropertyComparisonScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const propertyIds = (params.ids as string)?.split(",").map(Number) || [];

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const promises = propertyIds.map((id) =>
        api.get(`/api/properties/${id}`)
      );
      const responses = await Promise.all(promises);
      setProperties(responses.map((res) => res.data));
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const getBestValue = (key: keyof Property) => {
    if (properties.length === 0) return null;

    const numericKeys = [
      "price",
      "area",
      "bedrooms",
      "bathrooms",
      "parkingSpaces",
      "lotSize",
      "ecoScore",
    ];

    if (numericKeys.includes(key as string)) {
      if (key === "price") {
        // For price, lowest is best
        return Math.min(...properties.map((p) => Number(p[key]) || 0));
      } else {
        // For others, highest is best
        return Math.max(...properties.map((p) => Number(p[key]) || 0));
      }
    }
    return null;
  };

  const isBestValue = (property: Property, key: keyof Property) => {
    const bestValue = getBestValue(key);
    if (bestValue === null) return false;
    return Number(property[key]) === bestValue;
  };

  const ComparisonRow = ({
    label,
    values,
    highlight = false,
    compareKey,
  }: {
    label: string;
    values: (string | number | boolean)[];
    highlight?: boolean;
    compareKey?: keyof Property;
  }) => (
    <View
      className={`flex flex-row border-b border-gray-200 ${highlight ? "bg-primary-50" : ""}`}
    >
      <View className="w-32 p-4 border-r border-gray-200 bg-gray-50">
        <Text className="font-rubik-semibold text-sm text-black-300">
          {label}
        </Text>
      </View>
      {values.map((value, index) => {
        const isBoolean = typeof value === "boolean";
        const isBest = compareKey
          ? isBestValue(properties[index], compareKey)
          : false;

        return (
          <View
            key={index}
            className={`flex-1 p-4 border-r border-gray-200 ${isBest ? "bg-green-50" : ""}`}
          >
            {isBoolean ? (
              value ? (
                <View className="flex items-center">
                  <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs">✓</Text>
                  </View>
                </View>
              ) : (
                <View className="flex items-center">
                  <View className="w-6 h-6 bg-gray-300 rounded-full items-center justify-center">
                    <Text className="text-white text-xs">✕</Text>
                  </View>
                </View>
              )
            ) : (
              <Text
                className={`font-rubik text-sm text-center ${isBest ? "text-green-600 font-rubik-bold" : "text-black-200"}`}
              >
                {value}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="h-full bg-white flex items-center justify-center">
        <ActivityIndicator size="large" color="#0061FF" />
      </SafeAreaView>
    );
  }

  if (properties.length === 0) {
    return (
      <SafeAreaView className="h-full bg-white">
        <View className="flex-1 items-center justify-center px-7">
          <Text className="text-xl font-rubik-bold text-black-300 mb-2">
            {t("comparison.noProperties")}
          </Text>
          <Text className="text-base text-black-200 font-rubik text-center mb-6">
            {t("comparison.selectProperties")}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary-300 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-rubik-semibold">
              {t("comparison.goBack")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white">
      {/* Header */}
      <View className="flex flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={icons.backArrow} className="w-6 h-6" />
        </TouchableOpacity>
        <Text className="text-xl font-rubik-bold">
          {t("comparison.title")} ({properties.length})
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Property Images & Titles */}
          <View className="flex flex-row">
            <View className="w-32 border-r border-gray-200 bg-gray-50" />
            {properties.map((property, index) => (
              <View key={index} className="w-64 border-r border-gray-200 p-4">
                <Image
                  source={{ uri: property.images[0] }}
                  className="w-full h-40 rounded-lg mb-3"
                  resizeMode="cover"
                />
                <Text
                  className="font-rubik-bold text-base text-black-300 mb-1"
                  numberOfLines={2}
                >
                  {property.title}
                </Text>
                <Text
                  className="font-rubik text-sm text-black-200"
                  numberOfLines={1}
                >
                  {property.address}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/(root)/(tabs)/properties/${property.id}`)
                  }
                  className="mt-3 bg-primary-100 py-2 rounded-lg"
                >
                  <Text className="text-primary-300 font-rubik-semibold text-center text-sm">
                    {t("comparison.viewDetails")}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Price Comparison */}
          <View className="mt-4">
            <View className="bg-primary-300 py-3 px-4">
              <Text className="font-rubik-bold text-white text-base">
                {t("comparison.priceInfo")}
              </Text>
            </View>

            <ComparisonRow
              label={t("comparison.price")}
              values={properties.map((p) => formatPrice(p.price))}
              compareKey="price"
              highlight
            />
            <ComparisonRow
              label={t("comparison.pricePerSqFt")}
              values={properties.map(
                (p) => `$${Math.round(p.price / p.area)}/sq ft`
              )}
            />
            <ComparisonRow
              label={t("comparison.status")}
              values={properties.map((p) => p.status)}
            />
          </View>

          {/* Location */}
          <View className="mt-4">
            <View className="bg-primary-300 py-3 px-4">
              <Text className="font-rubik-bold text-white text-base">
                {t("comparison.location")}
              </Text>
            </View>

            <ComparisonRow
              label={t("comparison.city")}
              values={properties.map((p) => p.city)}
            />
            <ComparisonRow
              label={t("comparison.neighborhood")}
              values={properties.map((p) => p.neighborhood)}
            />
            <ComparisonRow
              label={t("comparison.address")}
              values={properties.map((p) => p.address)}
            />
          </View>

          {/* Property Details */}
          <View className="mt-4">
            <View className="bg-primary-300 py-3 px-4">
              <Text className="font-rubik-bold text-white text-base">
                {t("comparison.propertyDetails")}
              </Text>
            </View>

            <ComparisonRow
              label={t("comparison.type")}
              values={properties.map((p) => p.propertyType)}
            />
            <ComparisonRow
              label={t("comparison.bedrooms")}
              values={properties.map((p) => p.bedrooms)}
              compareKey="bedrooms"
              highlight
            />
            <ComparisonRow
              label={t("comparison.bathrooms")}
              values={properties.map((p) => p.bathrooms)}
              compareKey="bathrooms"
              highlight
            />
            <ComparisonRow
              label={t("comparison.area")}
              values={properties.map((p) => `${p.area} sq ft`)}
              compareKey="area"
              highlight
            />
            <ComparisonRow
              label={t("comparison.lotSize")}
              values={properties.map((p) =>
                p.lotSize ? `${p.lotSize} sq ft` : "N/A"
              )}
            />
            <ComparisonRow
              label={t("comparison.yearBuilt")}
              values={properties.map((p) => p.yearBuilt || "N/A")}
            />
            <ComparisonRow
              label={t("comparison.parking")}
              values={properties.map((p) => p.parkingSpaces)}
              compareKey="parkingSpaces"
            />
          </View>

          {/* Amenities */}
          <View className="mt-4 mb-8">
            <View className="bg-primary-300 py-3 px-4">
              <Text className="font-rubik-bold text-white text-base">
                {t("comparison.amenities")}
              </Text>
            </View>

            <ComparisonRow
              label={t("comparison.garage")}
              values={properties.map((p) => p.hasGarage)}
            />
            <ComparisonRow
              label={t("comparison.petFriendly")}
              values={properties.map((p) => p.isPetFriendly)}
            />
            <ComparisonRow
              label={t("comparison.laundry")}
              values={properties.map((p) => p.hasInUnitLaundry)}
            />
            <ComparisonRow
              label={t("comparison.pool")}
              values={properties.map((p) => p.hasPool)}
            />
            <ComparisonRow
              label={t("comparison.gym")}
              values={properties.map((p) => p.hasGym)}
            />
            <ComparisonRow
              label={t("comparison.ac")}
              values={properties.map((p) => p.hasAirConditioning)}
            />

            {/* 🌿 Eco-Friendly & Green Features */}
            <View className="mt-4 mb-8">
              <View className="bg-green-600 py-3 px-4">
                <Text className="font-rubik-bold text-white text-base">
                  {t("comparison.ecoFeatures")}
                </Text>
              </View>

              {/* Eco Score Highlighting */}
              <ComparisonRow
                label={t("comparison.ecoScore")}
                values={properties.map((p) => `${p.ecoScore}/100`)}
                compareKey="ecoScore"
                highlight
              />

              {/* Certifications */}
              <ComparisonRow
                label={t("comparison.energyStar")}
                values={properties.map((p) => p.hasEnergyStarCertification)}
              />
              <ComparisonRow
                label={t("comparison.leedCert")}
                values={properties.map((p) =>
                  p.hasLEEDCertification
                    ? `Yes (${p.leedLevel || "Certified"})`
                    : false
                )}
              />

              {/* Sustainable Features */}
              <ComparisonRow
                label={t("comparison.solarPanels")}
                values={properties.map((p) => p.hasSolarPanels)}
              />
              <ComparisonRow
                label={t("comparison.energyEfficient")}
                values={properties.map((p) => p.hasEnergyEfficientAppliances)}
              />
              <ComparisonRow
                label={t("comparison.smartThermostat")}
                values={properties.map((p) => p.hasSmartThermostats)}
              />
              <ComparisonRow
                label={t("comparison.ledLighting")}
                values={properties.map((p) => p.hasLEDLighting)}
              />
              <ComparisonRow
                label={t("comparison.doubleGlazing")}
                values={properties.map((p) => p.hasDoubleGlazedWindows)}
              />
              <ComparisonRow
                label={t("comparison.rainwater")}
                values={properties.map((p) => p.hasRainwaterHarvesting)}
              />
              <ComparisonRow
                label={t("comparison.greenRoof")}
                values={properties.map((p) => p.hasGreenRoof)}
              />
            </View>
          </View>
        </ScrollView>
      </ScrollView>

      {/* Legend */}
      <View className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <View className="flex flex-row items-center justify-center gap-4">
          <View className="flex flex-row items-center">
            <View className="w-4 h-4 bg-green-50 border border-green-200 mr-2" />
            <Text className="text-xs font-rubik text-gray-600">
              {t("comparison.bestValue")}
            </Text>
          </View>
          <View className="flex flex-row items-center">
            <View className="w-4 h-4 bg-primary-50 mr-2" />
            <Text className="text-xs font-rubik text-gray-600">
              {t("comparison.keyMetric")}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
