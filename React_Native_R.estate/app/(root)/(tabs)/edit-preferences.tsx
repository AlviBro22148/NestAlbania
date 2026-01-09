import icons from "@/constants/icons";
import { useAlert } from "@/contexts/AlertContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { ALBANIAN_CITIES } from "@/components/CityPicker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Property types with translation keys
const PROPERTY_TYPES = [
  { key: "apartment", icon: "🏢" },
  { key: "house", icon: "🏠" },
  { key: "villa", icon: "🏡" },
  { key: "studio", icon: "🎬" },
  { key: "office", icon: "☕" },
  { key: "condo", icon: "🏘️" },
  { key: "townhouse", icon: "🏘️" },
  { key: "land", icon: "🌳" },
];

// Bedroom/Bathroom options
const ROOM_OPTIONS = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5+", value: 5 },
];

// Listing type options with translation keys
const LISTING_TYPES = [
  { key: "sale", value: "Sale", icon: "🏷️" },
  { key: "rent", value: "Rent", icon: "🔑" },
  { key: "both", value: "Both", icon: "✨" },
];

// Amenity options with translation keys
const AMENITIES = [
  { key: "garage", icon: "🚗" },
  { key: "petFriendly", icon: "🐕" },
  { key: "pool", icon: "🏊" },
  { key: "gym", icon: "💪" },
  { key: "airConditioning", icon: "❄️" },
  { key: "greenHomes", icon: "🌿" },
];

export default function EditPreferencesScreen() {
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const handleBack = useBackNavigation("/(root)/(tabs)/profile");
  const {
    preferences,
    loading,
    saving,
    hasPreferences,
    fetchPreferences,
    savePreferences,
    clearPreferences,
  } = useUserPreferences();

  // Form state - store the actual values (capitalized) for API
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [minBedrooms, setMinBedrooms] = useState<number | null>(null);
  const [maxBedrooms, setMaxBedrooms] = useState<number | null>(null);
  const [minBathrooms, setMinBathrooms] = useState<number | null>(null);
  const [maxBathrooms, setMaxBathrooms] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [listingType, setListingType] = useState<string>("Both");
  const [wantsGarage, setWantsGarage] = useState<boolean>(false);
  const [wantsPetFriendly, setWantsPetFriendly] = useState<boolean>(false);
  const [wantsPool, setWantsPool] = useState<boolean>(false);
  const [wantsGym, setWantsGym] = useState<boolean>(false);
  const [wantsAirConditioning, setWantsAirConditioning] = useState<boolean>(false);
  const [prefersGreenHomes, setPrefersGreenHomes] = useState<boolean>(false);

  // Load preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setSelectedPropertyTypes(preferences.preferredPropertyTypes || []);
      setMinBedrooms(preferences.minBedrooms ?? null);
      setMaxBedrooms(preferences.maxBedrooms ?? null);
      setMinBathrooms(preferences.minBathrooms ?? null);
      setMaxBathrooms(preferences.maxBathrooms ?? null);
      setMinPrice(preferences.minPrice?.toString() || "");
      setMaxPrice(preferences.maxPrice?.toString() || "");
      setSelectedCities(preferences.preferredCities || []);
      setListingType(preferences.listingType || "Both");
      setWantsGarage(preferences.wantsGarage || false);
      setWantsPetFriendly(preferences.wantsPetFriendly || false);
      setWantsPool(preferences.wantsPool || false);
      setWantsGym(preferences.wantsGym || false);
      setWantsAirConditioning(preferences.wantsAirConditioning || false);
      setPrefersGreenHomes(preferences.prefersGreenHomes || false);
    }
  }, [preferences]);

  // Helper to get capitalized property type for API
  const getPropertyTypeValue = (key: string) => {
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  const togglePropertyType = (key: string) => {
    const value = getPropertyTypeValue(key);
    setSelectedPropertyTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const isPropertyTypeSelected = (key: string) => {
    const value = getPropertyTypeValue(key);
    return selectedPropertyTypes.includes(value);
  };

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleAmenity = (key: string) => {
    switch (key) {
      case "garage":
        setWantsGarage(!wantsGarage);
        break;
      case "petFriendly":
        setWantsPetFriendly(!wantsPetFriendly);
        break;
      case "pool":
        setWantsPool(!wantsPool);
        break;
      case "gym":
        setWantsGym(!wantsGym);
        break;
      case "airConditioning":
        setWantsAirConditioning(!wantsAirConditioning);
        break;
      case "greenHomes":
        setPrefersGreenHomes(!prefersGreenHomes);
        break;
    }
  };

  const isAmenitySelected = (key: string) => {
    switch (key) {
      case "garage":
        return wantsGarage;
      case "petFriendly":
        return wantsPetFriendly;
      case "pool":
        return wantsPool;
      case "gym":
        return wantsGym;
      case "airConditioning":
        return wantsAirConditioning;
      case "greenHomes":
        return prefersGreenHomes;
      default:
        return false;
    }
  };

  const handleSave = async () => {
    try {
      await savePreferences({
        preferredPropertyTypes: selectedPropertyTypes,
        minBedrooms,
        maxBedrooms,
        minBathrooms,
        maxBathrooms,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        preferredCities: selectedCities,
        listingType,
        wantsGarage,
        wantsPetFriendly,
        wantsPool,
        wantsGym,
        wantsAirConditioning,
        prefersGreenHomes,
      });
      showToast(t("preferences.preferencesSaved"), "success");
      handleBack();
    } catch (error) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("errors.saveFailed"),
      });
    }
  };

  const handleClear = () => {
    showAlert({
      type: "warning",
      title: t("preferences.clearPreferencesTitle"),
      message: t("preferences.clearPreferencesMessage"),
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("preferences.clear"),
          style: "destructive",
          onPress: async () => {
            try {
              await clearPreferences();
              showToast(t("preferences.preferencesCleared"), "success");
              handleBack();
            } catch (error) {
              showToast(t("errors.clearFailed"), "error");
            }
          },
        },
      ],
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0061FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-2 bg-white">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-3"
          >
            <Image source={icons.backArrow} className="w-5 h-5" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold text-black-300">
            {t("preferences.yourPreferences")}
          </Text>
        </View>

        {/* Description */}
        <View className="mx-5 mt-4 bg-primary-100 p-4 rounded-2xl">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">🎯</Text>
            <View className="flex-1">
              <Text className="text-primary-300 font-rubik-bold text-base">
                {t("preferences.personalizedRecommendations")}
              </Text>
              <Text className="text-primary-300/70 font-rubik text-sm mt-0.5">
                {t("preferences.preferencesDescription")}
              </Text>
            </View>
          </View>
        </View>

        {/* Listing Type */}
        <View className="mx-5 mt-6">
          <Text className="text-lg font-rubik-bold text-black-300 mb-3">
            {t("preferences.iWantTo")}
          </Text>
          <View className="flex-row">
            {LISTING_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setListingType(type.value)}
                className={`flex-1 mx-1 py-4 rounded-2xl border-2 items-center ${
                  listingType === type.value
                    ? "bg-primary-300 border-primary-300"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text className="text-2xl mb-1">{type.icon}</Text>
                <Text
                  className={`font-rubik-medium ${
                    listingType === type.value ? "text-white" : "text-black-300"
                  }`}
                >
                  {t(`preferences.${type.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Property Types */}
        <View className="mx-5 mt-6">
          <Text className="text-lg font-rubik-bold text-black-300 mb-3">
            {t("preferences.propertyTypes")}
          </Text>
          <View className="flex-row flex-wrap">
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                onPress={() => togglePropertyType(type.key)}
                className={`w-[23%] m-[1%] p-3 rounded-xl border items-center ${
                  isPropertyTypeSelected(type.key)
                    ? "bg-primary-100 border-primary-300"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text className="text-2xl mb-1">{type.icon}</Text>
                <Text
                  className={`font-rubik text-xs text-center ${
                    isPropertyTypeSelected(type.key)
                      ? "text-primary-300"
                      : "text-black-300"
                  }`}
                >
                  {t(`preferences.${type.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bedrooms */}
        <View className="mx-5 mt-6 bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">🛏️</Text>
            <Text className="text-base font-rubik-bold text-black-300">
              {t("preferences.bedrooms")}
            </Text>
          </View>
          <Text className="text-xs font-rubik text-gray-500 mb-2">
            {t("preferences.min")}
          </Text>
          <View className="flex-row mb-3">
            {ROOM_OPTIONS.map((option) => (
              <TouchableOpacity
                key={`bed-min-${option.value}`}
                onPress={() => setMinBedrooms(minBedrooms === option.value ? null : option.value)}
                className={`flex-1 mx-0.5 py-2 rounded-lg items-center ${
                  minBedrooms === option.value ? "bg-primary-300" : "bg-gray-100"
                }`}
              >
                <Text className={`font-rubik-bold ${minBedrooms === option.value ? "text-white" : "text-black-300"}`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-xs font-rubik text-gray-500 mb-2">
            {t("preferences.max")}
          </Text>
          <View className="flex-row">
            {ROOM_OPTIONS.map((option) => (
              <TouchableOpacity
                key={`bed-max-${option.value}`}
                onPress={() => setMaxBedrooms(maxBedrooms === option.value ? null : option.value)}
                className={`flex-1 mx-0.5 py-2 rounded-lg items-center ${
                  maxBedrooms === option.value ? "bg-primary-300" : "bg-gray-100"
                }`}
              >
                <Text className={`font-rubik-bold ${maxBedrooms === option.value ? "text-white" : "text-black-300"}`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bathrooms */}
        <View className="mx-5 mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">🚿</Text>
            <Text className="text-base font-rubik-bold text-black-300">
              {t("preferences.bathrooms")}
            </Text>
          </View>
          <Text className="text-xs font-rubik text-gray-500 mb-2">
            {t("preferences.min")}
          </Text>
          <View className="flex-row mb-3">
            {ROOM_OPTIONS.map((option) => (
              <TouchableOpacity
                key={`bath-min-${option.value}`}
                onPress={() => setMinBathrooms(minBathrooms === option.value ? null : option.value)}
                className={`flex-1 mx-0.5 py-2 rounded-lg items-center ${
                  minBathrooms === option.value ? "bg-primary-300" : "bg-gray-100"
                }`}
              >
                <Text className={`font-rubik-bold ${minBathrooms === option.value ? "text-white" : "text-black-300"}`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-xs font-rubik text-gray-500 mb-2">
            {t("preferences.max")}
          </Text>
          <View className="flex-row">
            {ROOM_OPTIONS.map((option) => (
              <TouchableOpacity
                key={`bath-max-${option.value}`}
                onPress={() => setMaxBathrooms(maxBathrooms === option.value ? null : option.value)}
                className={`flex-1 mx-0.5 py-2 rounded-lg items-center ${
                  maxBathrooms === option.value ? "bg-primary-300" : "bg-gray-100"
                }`}
              >
                <Text className={`font-rubik-bold ${maxBathrooms === option.value ? "text-white" : "text-black-300"}`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range */}
        <View className="mx-5 mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">💰</Text>
            <Text className="text-base font-rubik-bold text-black-300">
              {t("preferences.priceRange")}
            </Text>
          </View>
          <View className="flex-row">
            <View className="flex-1 mr-2">
              <Text className="text-xs font-rubik text-gray-500 mb-2">
                {t("preferences.min")} (€)
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-rubik text-black-300"
                placeholder="0"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-xs font-rubik text-gray-500 mb-2">
                {t("preferences.max")} (€)
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-rubik text-black-300"
                placeholder={t("preferences.noLimit")}
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* Preferred Cities */}
        <View className="mx-5 mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">📍</Text>
            <Text className="text-base font-rubik-bold text-black-300">
              {t("preferences.preferredCities")}
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {ALBANIAN_CITIES.slice(0, 12).map((city) => (
              <TouchableOpacity
                key={city}
                onPress={() => toggleCity(city)}
                className={`px-3 py-1.5 rounded-full mr-2 mb-2 border ${
                  selectedCities.includes(city)
                    ? "bg-primary-300 border-primary-300"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <Text
                  className={`font-rubik text-sm ${
                    selectedCities.includes(city) ? "text-white" : "text-black-300"
                  }`}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedCities.length > 0 && (
            <Text className="text-xs font-rubik text-gray-500 mt-2">
              {t("preferences.selected")}: {selectedCities.join(", ")}
            </Text>
          )}
        </View>

        {/* Amenities */}
        <View className="mx-5 mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">✨</Text>
            <Text className="text-base font-rubik-bold text-black-300">
              {t("preferences.mustHaveFeatures")}
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {AMENITIES.map((amenity) => (
              <TouchableOpacity
                key={amenity.key}
                onPress={() => toggleAmenity(amenity.key)}
                className={`w-[31%] m-[1%] p-3 rounded-xl border items-center ${
                  isAmenitySelected(amenity.key)
                    ? "bg-primary-100 border-primary-300"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <Text className="text-2xl mb-1">{amenity.icon}</Text>
                <Text
                  className={`font-rubik text-xs text-center ${
                    isAmenitySelected(amenity.key) ? "text-primary-300" : "text-black-300"
                  }`}
                >
                  {t(`preferences.${amenity.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-5 mt-6">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-primary-300 py-4 rounded-2xl mb-3"
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center font-rubik-bold text-white text-lg">
                {t("preferences.savePreferences")}
              </Text>
            )}
          </TouchableOpacity>

          {hasPreferences && (
            <TouchableOpacity
              onPress={handleClear}
              disabled={saving}
              className="bg-white py-4 rounded-2xl border border-gray-200"
            >
              <Text className="text-center font-rubik-bold text-gray-500 text-lg">
                {t("preferences.clearPreferences")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
