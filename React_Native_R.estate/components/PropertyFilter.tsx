import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// FIXED: Match backend DTO property names (PascalCase)
export interface PropertyFilters {
  City?: string;
  Neighborhood?: string;
  ZipCode?: string;
  MinPrice?: number;
  MaxPrice?: number;
  PropertyTypes?: string[];
  MinBedrooms?: number;
  MinBathrooms?: number;
  MinArea?: number;
  MaxArea?: number;
  MinLotSize?: number;
  MaxLotSize?: number;
  ListingType?: string;
  Status?: string[];
  NewListingsDays?: number;
  MinParkingSpaces?: number;
  HasGarage?: boolean;
  IsPetFriendly?: boolean;
  HasInUnitLaundry?: boolean;
  HasPool?: boolean;
  HasGym?: boolean;
  HasAirConditioning?: boolean;
  HasSolarPanels?: boolean;
  HasEnergyEfficientAppliances?: boolean;
  HasLEDLighting?: boolean;
  HasSmartThermostats?: boolean;
  HasDoubleGlazedWindows?: boolean;
  HasRainwaterHarvesting?: boolean;
  HasGreenRoof?: boolean;
  HasEnergyStarCertification?: boolean;
  HasLEEDCertification?: boolean;
  MinEcoScore?: number;
  MinYearBuilt?: number;
  MaxYearBuilt?: number;
  MinMonthlyRent?: number;
  MaxMonthlyRent?: number;
  MinLeaseTermMonths?: number;
  MaxLeaseTermMonths?: number;
  MinSecurityDeposit?: number;
  MaxSecurityDeposit?: number;
  UtilitiesIncluded?: boolean;
  FurnishedStatus?: string;
  Page?: number;
  PageSize?: number;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: PropertyFilters) => void;
  initialFilters?: PropertyFilters;
}

export default function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}: FilterModalProps) {
  const { t } = useTranslation();

  const STATUS_OPTIONS = [
    t("filters.statusAvailable"),
    t("filters.statusPending"),
  ];
  const FURNISHED_OPTIONS = [
    t("filters.unfurnished"),
    t("filters.semiFurnished"),
    t("filters.fullyFurnished"),
  ];

  const PROPERTY_TYPES = [
    { name: t("properties.Apartment"), emoji: "🏢" },
    { name: t("properties.House"), emoji: "🏠" },
    { name: t("properties.Villa"), emoji: "🏡" },
    { name: t("properties.Studio"), emoji: "🎬" },
    { name: t("properties.Office"), emoji: "☕" },
    { name: t("properties.Condo"), emoji: "🏘️" },
    { name: t("properties.Townhouse"), emoji: "🏘️" },
    { name: t("propertyTypes.land"), emoji: "🌳" },
  ];

  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);

  const updateFilter = (key: keyof PropertyFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const togglePropertyType = (type: string) => {
    const current = filters.PropertyTypes || [];
    if (current.includes(type)) {
      updateFilter(
        "PropertyTypes",
        current.filter((t) => t !== type)
      );
    } else {
      updateFilter("PropertyTypes", [...current, type]);
    }
  };

  const toggleStatus = (status: string) => {
    const current = filters.Status || [];
    if (current.includes(status)) {
      updateFilter(
        "Status",
        current.filter((s) => s !== status)
      );
    } else {
      updateFilter("Status", [...current, status]);
    }
  };

  const handleReset = () => {
    setFilters({});
  };

  const handleApply = () => {
    // CRITICAL FIX: Only include boolean filters that are explicitly TRUE
    // Remove false values as they would over-filter
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => {
        // Keep non-boolean values if they're not empty
        if (typeof value !== "boolean") {
          return (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            (Array.isArray(value) ? value.length > 0 : true)
          );
        }
        // For boolean values, ONLY keep if true
        return value === true;
      })
    );

    console.log("Sending filters:", cleanedFilters); // Debug log
    onApply(cleanedFilters);
    onClose();
  };

  const isRental = filters.ListingType === "Rent";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-6 pt-12 pb-4 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-rubik-bold">
              {t("filters.filters")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-primary-300 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Listing Type Toggle */}
          <View className="mt-6">
            <Text className="text-lg font-rubik-bold text-black-300 mb-3">
              🏷️ {t("filters.listingType")}
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => updateFilter("ListingType", "Sale")}
                className={`flex-1 py-3 rounded-xl ${
                  filters.ListingType === "Sale"
                    ? "bg-primary-300"
                    : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-center font-rubik-bold ${
                    filters.ListingType === "Sale"
                      ? "text-white"
                      : "text-black-300"
                  }`}
                >
                  {t("filters.forSale")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateFilter("ListingType", "Rent")}
                className={`flex-1 py-3 rounded-xl ${
                  filters.ListingType === "Rent"
                    ? "bg-primary-300"
                    : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-center font-rubik-bold ${
                    filters.ListingType === "Rent"
                      ? "text-white"
                      : "text-black-300"
                  }`}
                >
                  {t("filters.forRent")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateFilter("ListingType", undefined)}
                className={`flex-1 py-3 rounded-xl ${
                  !filters.ListingType ? "bg-primary-300" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-center font-rubik-bold ${
                    !filters.ListingType ? "text-white" : "text-black-300"
                  }`}
                >
                  {t("filters.all")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Section */}
          <View className="mt-6">
            <Text className="text-lg font-rubik-bold text-black-300 mb-3">
              📍 {t("properties.location")}
            </Text>
            <TextInput
              placeholder={t("properties.city")}
              value={filters.City}
              onChangeText={(text) => updateFilter("City", text)}
              className="bg-gray-100 rounded-lg px-4 py-3 mb-3 font-rubik"
            />
            <TextInput
              placeholder={t("properties.neighborhood")}
              value={filters.Neighborhood}
              onChangeText={(text) => updateFilter("Neighborhood", text)}
              className="bg-gray-100 rounded-lg px-4 py-3 mb-3 font-rubik"
            />
            <TextInput
              placeholder={t("properties.zipCode")}
              value={filters.ZipCode}
              onChangeText={(text) => updateFilter("ZipCode", text)}
              className="bg-gray-100 rounded-lg px-4 py-3 font-rubik"
            />
          </View>

          {/* Price/Rent Range - Conditional */}
          <View className="mt-6">
            <Text className="text-lg font-rubik-bold text-black-300 mb-3">
              💰 {isRental ? t("filters.monthlyRentRange") : t("filters.priceRange")}
            </Text>
            <View className="flex-row gap-3">
              {isRental ? (
                <>
                  <TextInput
                    placeholder={t("filters.minRent")}
                    value={filters.MinMonthlyRent?.toString()}
                    onChangeText={(text) =>
                      updateFilter(
                        "MinMonthlyRent",
                        text ? parseFloat(text) : undefined
                      )
                    }
                    keyboardType="numeric"
                    className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-rubik"
                  />
                  <TextInput
                    placeholder={t("filters.maxRent")}
                    value={filters.MaxMonthlyRent?.toString()}
                    onChangeText={(text) =>
                      updateFilter(
                        "MaxMonthlyRent",
                        text ? parseFloat(text) : undefined
                      )
                    }
                    keyboardType="numeric"
                    className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-rubik"
                  />
                </>
              ) : (
                <>
                  <TextInput
                    placeholder={t("filters.minPrice")}
                    value={filters.MinPrice?.toString()}
                    onChangeText={(text) =>
                      updateFilter(
                        "MinPrice",
                        text ? parseFloat(text) : undefined
                      )
                    }
                    keyboardType="numeric"
                    className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-rubik"
                  />
                  <TextInput
                    placeholder={t("filters.maxPrice")}
                    value={filters.MaxPrice?.toString()}
                    onChangeText={(text) =>
                      updateFilter(
                        "MaxPrice",
                        text ? parseFloat(text) : undefined
                      )
                    }
                    keyboardType="numeric"
                    className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-rubik"
                  />
                </>
              )}
            </View>
          </View>

          {/* Rental-Specific Filters */}
          {isRental && (
            <View className="mt-6">
              <Text className="text-lg font-rubik-bold text-black-300 mb-3">
                🔑 {t("filters.rentalOptions")}
              </Text>

              <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                {t("filters.leaseTermRange")}
              </Text>
              <View className="flex-row gap-3 mb-3">
                <TextInput
                  placeholder={t("filters.minMonths")}
                  value={filters.MinLeaseTermMonths?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MinLeaseTermMonths",
                      text ? parseInt(text) : undefined
                    )
                  }
                  keyboardType="numeric"
                  className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-rubik"
                />
                <TextInput
                  placeholder={t("filters.maxMonths")}
                  value={filters.MaxLeaseTermMonths?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MaxLeaseTermMonths",
                      text ? parseInt(text) : undefined
                    )
                  }
                  keyboardType="numeric"
                  className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-rubik"
                />
              </View>

              <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                {t("filters.securityDepositRange")}
              </Text>
              <View className="flex-row gap-3 mb-3">
                <TextInput
                  placeholder={t("filters.minDeposit")}
                  value={filters.MinSecurityDeposit?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MinSecurityDeposit",
                      text ? parseFloat(text) : undefined
                    )
                  }
                  keyboardType="numeric"
                  className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-rubik"
                />
                <TextInput
                  placeholder={t("filters.maxDeposit")}
                  value={filters.MaxSecurityDeposit?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MaxSecurityDeposit",
                      text ? parseFloat(text) : undefined
                    )
                  }
                  keyboardType="numeric"
                  className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-rubik"
                />
              </View>

              <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                {t("filters.furnishedStatus")}
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {FURNISHED_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() =>
                      updateFilter(
                        "FurnishedStatus",
                        filters.FurnishedStatus === option ? undefined : option
                      )
                    }
                    className={`px-4 py-2 rounded-full ${
                      filters.FurnishedStatus === option
                        ? "bg-primary-300"
                        : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`font-rubik ${
                        filters.FurnishedStatus === option
                          ? "text-white"
                          : "text-black-300"
                      }`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row justify-between items-center bg-gray-100 rounded-lg px-4 py-3">
                <Text className="font-rubik text-black-300">
                  {t("filters.utilitiesIncluded")}
                </Text>
                <Switch
                  value={filters.UtilitiesIncluded || false}
                  onValueChange={(value) =>
                    updateFilter("UtilitiesIncluded", value || undefined)
                  }
                  trackColor={{ false: "#d1d5db", true: "#0061FF" }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          )}

          {/* Property Type */}
          <View className="mt-6">
            <Text className="text-lg font-rubik-bold text-black-300 mb-3">
              🏠 {t("properties.propertyType")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.name}
                  onPress={() => togglePropertyType(type.name)}
                  className={`px-4 py-2 rounded-full ${
                    filters.PropertyTypes?.includes(type.name)
                      ? "bg-primary-300"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`font-rubik ${
                      filters.PropertyTypes?.includes(type.name)
                        ? "text-white"
                        : "text-black-300"
                    }`}
                  >
                    {type.emoji} {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bedrooms & Bathrooms */}
          <View className="mt-6">
            <Text className="text-lg font-rubik-bold text-black-300 mb-3">
              🛏️ {t("properties.bedrooms")} & 🛁 {t("properties.bathrooms")}
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-rubik text-gray-600 mb-2">
                  {t("filters.minBedrooms")}
                </Text>
                <TextInput
                  placeholder="0"
                  value={filters.MinBedrooms?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MinBedrooms",
                      text ? parseInt(text) : undefined
                    )
                  }
                  keyboardType="numeric"
                  className="bg-gray-100 rounded-lg px-4 py-3 font-rubik"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-rubik text-gray-600 mb-2">
                  {t("filters.minBathrooms")}
                </Text>
                <TextInput
                  placeholder="0"
                  value={filters.MinBathrooms?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MinBathrooms",
                      text ? parseInt(text) : undefined
                    )
                  }
                  keyboardType="numeric"
                  className="bg-gray-100 rounded-lg px-4 py-3 font-rubik"
                />
              </View>
            </View>
          </View>

          {/* Square Footage */}
          <View className="mt-6">
            <Text className="text-lg font-rubik-bold text-black-300 mb-3">
              📐 {t("properties.area")} {t("properties.squaremeter")}
            </Text>
            <View className="flex-row gap-3">
              <TextInput
                placeholder={t("filters.minArea")}
                value={filters.MinArea?.toString()}
                onChangeText={(text) =>
                  updateFilter("MinArea", text ? parseFloat(text) : undefined)
                }
                keyboardType="numeric"
                className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-rubik"
              />
              <TextInput
                placeholder={t("filters.maxArea")}
                value={filters.MaxArea?.toString()}
                onChangeText={(text) =>
                  updateFilter("MaxArea", text ? parseFloat(text) : undefined)
                }
                keyboardType="numeric"
                className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-rubik"
              />
            </View>
          </View>

          {/* Amenities */}
          <View className="mt-6 mb-6">
            <Text className="text-lg font-rubik-bold text-black-300 mb-3">
              ✨ {t("properties.amenities")}
            </Text>
            {[
              {
                key: "IsPetFriendly",
                label: `🐾 ${t("properties.petFriendly")}`,
              },
              {
                key: "HasInUnitLaundry",
                label: `🧺 ${t("properties.inUnitLaundry")}`,
              },
              { key: "HasPool", label: `🏊 ${t("properties.swimmingPool")}` },
              { key: "HasGym", label: `💪 ${t("properties.gymFitness")}` },
              {
                key: "HasAirConditioning",
                label: `❄️ ${t("properties.airConditioning")}`,
              },
            ].map(({ key, label }) => (
              <View
                key={key}
                className="flex-row justify-between items-center bg-gray-100 rounded-lg px-4 py-3 mb-2"
              >
                <Text className="font-rubik text-black-300">{label}</Text>
                <Switch
                  value={
                    (filters[key as keyof PropertyFilters] as boolean) || false
                  }
                  onValueChange={(value) =>
                    updateFilter(key as any, value || undefined)
                  }
                  trackColor={{ false: "#d1d5db", true: "#0061FF" }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}
          </View>

          {/* Green Features */}
          <View className="mt-6 mb-32">
            <Text className="text-lg font-rubik-bold text-black-300 mb-3">
              🌿 {t("greenHomes.greenFeatures")}
            </Text>
            {[
              {
                key: "HasSolarPanels",
                label: `☀️ ${t("greenHomes.solarPanels")}`,
              },
              {
                key: "HasEnergyEfficientAppliances",
                label: `⚡ ${t("greenHomes.energyEfficientAppliances")}`,
              },
              {
                key: "HasLEDLighting",
                label: `💡 ${t("greenHomes.ledLighting")}`,
              },
              {
                key: "HasSmartThermostats",
                label: `🌡️ ${t("greenHomes.smartThermostats")}`,
              },
              {
                key: "HasDoubleGlazedWindows",
                label: `🪟 ${t("greenHomes.doubleGlazedWindows")}`,
              },
              {
                key: "HasRainwaterHarvesting",
                label: `💧 ${t("greenHomes.rainwaterHarvesting")}`,
              },
              { key: "HasGreenRoof", label: `🌱 ${t("greenHomes.greenRoof")}` },
              {
                key: "HasEnergyStarCertification",
                label: `⭐ ${t("greenHomes.energyStar")}`,
              },
              {
                key: "HasLEEDCertification",
                label: `🏆 ${t("greenHomes.leed")}`,
              },
            ].map(({ key, label }) => (
              <View
                key={key}
                className="flex-row justify-between items-center bg-green-50 rounded-lg px-4 py-3 mb-2"
              >
                <Text className="font-rubik text-black-300">{label}</Text>
                <Switch
                  value={
                    (filters[key as keyof PropertyFilters] as boolean) || false
                  }
                  onValueChange={(value) =>
                    updateFilter(key as any, value || undefined)
                  }
                  trackColor={{ false: "#d1d5db", true: "#10B981" }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}

            <Text className="text-sm font-rubik-semibold text-gray-700 mb-2 mt-3">
              {t("greenHomes.minEcoScore")}
            </Text>
            <TextInput
              placeholder={t("filters.minEcoScorePlaceholder")}
              value={filters.MinEcoScore?.toString() || ""}
              onChangeText={(text) =>
                updateFilter("MinEcoScore", text ? parseInt(text) : undefined)
              }
              keyboardType="numeric"
              className="bg-gray-100 rounded-lg px-4 py-3 font-rubik"
            />
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View className="px-6 py-4 border-t border-gray-200 flex-row gap-3">
          <TouchableOpacity
            onPress={handleReset}
            className="flex-1 bg-gray-200 rounded-lg py-4"
          >
            <Text className="text-center font-rubik-bold text-black-300">
              {t("common.reset")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleApply}
            className="flex-1 bg-primary-300 rounded-lg py-4"
          >
            <Text className="text-center font-rubik-bold text-white">
              {t("common.apply")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
