import icons from "@/constants/icons";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { ALBANIAN_CITIES } from "@/components/CityPicker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { shadows, shadowsDark } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";

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
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");
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

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[styles.header, { backgroundColor: colors.surface }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
          >
            <Image source={icons.backArrow} style={styles.backIcon} tintColor={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("preferences.yourPreferences")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t("preferences.preferencesDescription")}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Description */}
        <View className="mx-5 mt-4 p-4 rounded-2xl" style={{ backgroundColor: isDark ? colors.primaryLight : "#E0EDFF" }}>
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">🎯</Text>
            <View className="flex-1">
              <Text className="font-rubik-bold text-base" style={{ color: colors.primary }}>
                {t("preferences.personalizedRecommendations")}
              </Text>
              <Text className="font-rubik text-sm mt-0.5" style={{ color: colors.primary, opacity: 0.7 }}>
                {t("preferences.preferencesDescription")}
              </Text>
            </View>
          </View>
        </View>

        {/* Listing Type */}
        <View className="mx-5 mt-6">
          <Text className="text-lg font-rubik-bold mb-3" style={{ color: colors.text }}>
            {t("preferences.iWantTo")}
          </Text>
          <View className="flex-row">
            {LISTING_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setListingType(type.value)}
                className="flex-1 mx-1 py-4 rounded-2xl border-2 items-center"
                style={{
                  backgroundColor: listingType === type.value ? colors.primary : colors.surface,
                  borderColor: listingType === type.value ? colors.primary : colors.border
                }}
              >
                <Text className="text-2xl mb-1">{type.icon}</Text>
                <Text
                  className="font-rubik-medium"
                  style={{ color: listingType === type.value ? "white" : colors.text }}
                >
                  {t(`preferences.${type.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Property Types */}
        <View className="mx-5 mt-6">
          <Text className="text-lg font-rubik-bold mb-3" style={{ color: colors.text }}>
            {t("preferences.propertyTypes")}
          </Text>
          <View className="flex-row flex-wrap">
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                onPress={() => togglePropertyType(type.key)}
                className="w-[23%] m-[1%] p-3 rounded-xl border items-center"
                style={{
                  backgroundColor: isPropertyTypeSelected(type.key) ? (isDark ? colors.primaryLight : "#E0EDFF") : colors.surface,
                  borderColor: isPropertyTypeSelected(type.key) ? colors.primary : colors.border
                }}
              >
                <Text className="text-2xl mb-1">{type.icon}</Text>
                <Text
                  className="font-rubik text-xs text-center"
                  style={{ color: isPropertyTypeSelected(type.key) ? colors.primary : colors.text }}
                >
                  {t(`preferences.${type.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bedrooms */}
        <View className="mx-5 mt-6 rounded-2xl p-4 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">🛏️</Text>
            <Text className="text-base font-rubik-bold" style={{ color: colors.text }}>
              {t("preferences.bedrooms")}
            </Text>
          </View>
          <Text className="text-xs font-rubik mb-2" style={{ color: colors.textSecondary }}>
            {t("preferences.min")}
          </Text>
          <View className="flex-row mb-3">
            {ROOM_OPTIONS.map((option) => (
              <TouchableOpacity
                key={`bed-min-${option.value}`}
                onPress={() => setMinBedrooms(minBedrooms === option.value ? null : option.value)}
                className="flex-1 mx-0.5 py-2 rounded-lg items-center"
                style={{ backgroundColor: minBedrooms === option.value ? colors.primary : colors.surfaceElevated }}
              >
                <Text className="font-rubik-bold" style={{ color: minBedrooms === option.value ? "white" : colors.text }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-xs font-rubik mb-2" style={{ color: colors.textSecondary }}>
            {t("preferences.max")}
          </Text>
          <View className="flex-row">
            {ROOM_OPTIONS.map((option) => (
              <TouchableOpacity
                key={`bed-max-${option.value}`}
                onPress={() => setMaxBedrooms(maxBedrooms === option.value ? null : option.value)}
                className="flex-1 mx-0.5 py-2 rounded-lg items-center"
                style={{ backgroundColor: maxBedrooms === option.value ? colors.primary : colors.surfaceElevated }}
              >
                <Text className="font-rubik-bold" style={{ color: maxBedrooms === option.value ? "white" : colors.text }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bathrooms */}
        <View className="mx-5 mt-4 rounded-2xl p-4 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">🚿</Text>
            <Text className="text-base font-rubik-bold" style={{ color: colors.text }}>
              {t("preferences.bathrooms")}
            </Text>
          </View>
          <Text className="text-xs font-rubik mb-2" style={{ color: colors.textSecondary }}>
            {t("preferences.min")}
          </Text>
          <View className="flex-row mb-3">
            {ROOM_OPTIONS.map((option) => (
              <TouchableOpacity
                key={`bath-min-${option.value}`}
                onPress={() => setMinBathrooms(minBathrooms === option.value ? null : option.value)}
                className="flex-1 mx-0.5 py-2 rounded-lg items-center"
                style={{ backgroundColor: minBathrooms === option.value ? colors.primary : colors.surfaceElevated }}
              >
                <Text className="font-rubik-bold" style={{ color: minBathrooms === option.value ? "white" : colors.text }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-xs font-rubik mb-2" style={{ color: colors.textSecondary }}>
            {t("preferences.max")}
          </Text>
          <View className="flex-row">
            {ROOM_OPTIONS.map((option) => (
              <TouchableOpacity
                key={`bath-max-${option.value}`}
                onPress={() => setMaxBathrooms(maxBathrooms === option.value ? null : option.value)}
                className="flex-1 mx-0.5 py-2 rounded-lg items-center"
                style={{ backgroundColor: maxBathrooms === option.value ? colors.primary : colors.surfaceElevated }}
              >
                <Text className="font-rubik-bold" style={{ color: maxBathrooms === option.value ? "white" : colors.text }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range */}
        <View className="mx-5 mt-4 rounded-2xl p-4 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">💰</Text>
            <Text className="text-base font-rubik-bold" style={{ color: colors.text }}>
              {t("preferences.priceRange")}
            </Text>
          </View>
          <View className="flex-row">
            <View className="flex-1 mr-2">
              <Text className="text-xs font-rubik mb-2" style={{ color: colors.textSecondary }}>
                {t("preferences.min")} (€)
              </Text>
              <TextInput
                className="border rounded-xl px-3 py-2 font-rubik"
                style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }}
                placeholder="0"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-xs font-rubik mb-2" style={{ color: colors.textSecondary }}>
                {t("preferences.max")} (€)
              </Text>
              <TextInput
                className="border rounded-xl px-3 py-2 font-rubik"
                style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }}
                placeholder={t("preferences.noLimit")}
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Preferred Cities */}
        <View className="mx-5 mt-4 rounded-2xl p-4 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">📍</Text>
            <Text className="text-base font-rubik-bold" style={{ color: colors.text }}>
              {t("preferences.preferredCities")}
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {ALBANIAN_CITIES.slice(0, 12).map((city) => (
              <TouchableOpacity
                key={city}
                onPress={() => toggleCity(city)}
                className="px-3 py-1.5 rounded-full mr-2 mb-2 border"
                style={{
                  backgroundColor: selectedCities.includes(city) ? colors.primary : colors.surfaceElevated,
                  borderColor: selectedCities.includes(city) ? colors.primary : colors.border
                }}
              >
                <Text
                  className="font-rubik text-sm"
                  style={{ color: selectedCities.includes(city) ? "white" : colors.text }}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedCities.length > 0 && (
            <Text className="text-xs font-rubik mt-2" style={{ color: colors.textSecondary }}>
              {t("preferences.selected")}: {selectedCities.join(", ")}
            </Text>
          )}
        </View>

        {/* Amenities */}
        <View className="mx-5 mt-4 rounded-2xl p-4 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">✨</Text>
            <Text className="text-base font-rubik-bold" style={{ color: colors.text }}>
              {t("preferences.mustHaveFeatures")}
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {AMENITIES.map((amenity) => (
              <TouchableOpacity
                key={amenity.key}
                onPress={() => toggleAmenity(amenity.key)}
                className="w-[31%] m-[1%] p-3 rounded-xl border items-center"
                style={{
                  backgroundColor: isAmenitySelected(amenity.key) ? (isDark ? colors.primaryLight : "#E0EDFF") : colors.surfaceElevated,
                  borderColor: isAmenitySelected(amenity.key) ? colors.primary : colors.border
                }}
              >
                <Text className="text-2xl mb-1">{amenity.icon}</Text>
                <Text
                  className="font-rubik text-xs text-center"
                  style={{ color: isAmenitySelected(amenity.key) ? colors.primary : colors.text }}
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
            className="py-4 rounded-2xl mb-3"
            style={{ backgroundColor: colors.primary }}
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
              className="py-4 rounded-2xl border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <Text className="text-center font-rubik-bold text-lg" style={{ color: colors.textSecondary }}>
                {t("preferences.clearPreferences")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Rubik-Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Rubik-Regular",
    marginTop: 2,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  accentLine: {
    height: 3,
    marginTop: spacing.sm,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});

