import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { ALBANIAN_CITIES } from "./CityPicker";

// FIXED: Match backend DTO property names (PascalCase)
export interface PropertyFilters {
  City?: string;
  Cities?: string[];
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
  const { colors } = useTheme();

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
        current.filter((t) => t !== type),
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
        current.filter((s) => s !== status),
      );
    } else {
      updateFilter("Status", [...current, status]);
    }
  };

  const toggleCity = (city: string) => {
    const current = filters.Cities || [];
    if (current.includes(city)) {
      updateFilter(
        "Cities",
        current.filter((c) => c !== city),
      );
    } else {
      updateFilter("Cities", [...current, city]);
    }
  };

  const handleReset = () => {
    setFilters({});
  };

  const handleApply = () => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => {
        if (typeof value !== "boolean") {
          return (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            (Array.isArray(value) ? value.length > 0 : true)
          );
        }
        return value === true;
      }),
    );

    onApply(cleanedFilters);
    onClose();
  };

  const isRental = filters.ListingType === "Rent";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t("filters.filters")}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Listing Type Toggle */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🏷️ {t("filters.listingType")}
            </Text>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => updateFilter("ListingType", "Sale")}
                style={[
                  styles.toggleButton,
                  filters.ListingType === "Sale"
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    filters.ListingType === "Sale"
                      ? styles.toggleButtonTextActive
                      : { color: colors.text },
                  ]}
                >
                  {t("filters.forSale")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateFilter("ListingType", "Rent")}
                style={[
                  styles.toggleButton,
                  filters.ListingType === "Rent"
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    filters.ListingType === "Rent"
                      ? styles.toggleButtonTextActive
                      : { color: colors.text },
                  ]}
                >
                  {t("filters.forRent")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateFilter("ListingType", undefined)}
                style={[
                  styles.toggleButton,
                  !filters.ListingType
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    !filters.ListingType
                      ? styles.toggleButtonTextActive
                      : { color: colors.text },
                  ]}
                >
                  {t("filters.all")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📍 {t("properties.location")}
            </Text>

            {/* Cities Multi-Select */}
            <Text style={[styles.subsectionTitle, { color: colors.textSecondary, marginBottom: 8 }]}>
              {t("filters.selectCities") || "Select Cities"}
            </Text>
            <ScrollView
              horizontal={false}
              style={{ maxHeight: 180, marginBottom: 16 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              <View style={styles.chips}>
                {ALBANIAN_CITIES.map((city) => (
                  <TouchableOpacity
                    key={city}
                    onPress={() => toggleCity(city)}
                    style={[
                      styles.chip,
                      filters.Cities?.includes(city)
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.surfaceElevated },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.Cities?.includes(city)
                          ? styles.chipTextActive
                          : { color: colors.text },
                      ]}
                    >
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {filters.Cities && filters.Cities.length > 0 && (
              <Text style={{ fontSize: 12, fontFamily: "Rubik-Regular", color: colors.primary, marginBottom: 12 }}>
                {filters.Cities.length} {filters.Cities.length === 1 ? t("filters.citySelected") || "city selected" : t("filters.citiesSelected") || "cities selected"}
              </Text>
            )}

            <TextInput
              placeholder={t("properties.neighborhood")}
              placeholderTextColor={colors.textMuted}
              value={filters.Neighborhood}
              onChangeText={(text) => updateFilter("Neighborhood", text)}
              style={[styles.textInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
            />
            <TextInput
              placeholder={t("properties.zipCode")}
              placeholderTextColor={colors.textMuted}
              value={filters.ZipCode}
              onChangeText={(text) => updateFilter("ZipCode", text)}
              style={[styles.textInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
            />
          </View>

          {/* Price/Rent Range */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              💰{" "}
              {isRental
                ? t("filters.monthlyRentRange")
                : t("filters.priceRange")}
            </Text>
            <View style={styles.row}>
              {isRental ? (
                <>
                  <TextInput
                    placeholder={t("filters.minRent")}
                    placeholderTextColor={colors.textMuted}
                    value={filters.MinMonthlyRent?.toString()}
                    onChangeText={(text) =>
                      updateFilter(
                        "MinMonthlyRent",
                        text ? parseFloat(text) : undefined,
                      )
                    }
                    keyboardType="numeric"
                    style={[styles.halfInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
                  />
                  <TextInput
                    placeholder={t("filters.maxRent")}
                    placeholderTextColor={colors.textMuted}
                    value={filters.MaxMonthlyRent?.toString()}
                    onChangeText={(text) =>
                      updateFilter(
                        "MaxMonthlyRent",
                        text ? parseFloat(text) : undefined,
                      )
                    }
                    keyboardType="numeric"
                    style={[styles.halfInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    placeholder={t("filters.minPrice")}
                    placeholderTextColor={colors.textMuted}
                    value={filters.MinPrice?.toString()}
                    onChangeText={(text) =>
                      updateFilter(
                        "MinPrice",
                        text ? parseFloat(text) : undefined,
                      )
                    }
                    keyboardType="numeric"
                    style={[styles.halfInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
                  />
                  <TextInput
                    placeholder={t("filters.maxPrice")}
                    placeholderTextColor={colors.textMuted}
                    value={filters.MaxPrice?.toString()}
                    onChangeText={(text) =>
                      updateFilter(
                        "MaxPrice",
                        text ? parseFloat(text) : undefined,
                      )
                    }
                    keyboardType="numeric"
                    style={[styles.halfInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
                  />
                </>
              )}
            </View>
          </View>

          {/* Rental-Specific Filters */}
          {isRental && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🔑 {t("filters.rentalOptions")}
              </Text>

              <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                {t("filters.leaseTermRange")}
              </Text>
              <View style={styles.row}>
                <TextInput
                  placeholder={t("filters.minMonths")}
                  placeholderTextColor={colors.textMuted}
                  value={filters.MinLeaseTermMonths?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MinLeaseTermMonths",
                      text ? parseInt(text) : undefined,
                    )
                  }
                  keyboardType="numeric"
                  style={[styles.halfInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
                />
                <TextInput
                  placeholder={t("filters.maxMonths")}
                  placeholderTextColor={colors.textMuted}
                  value={filters.MaxLeaseTermMonths?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MaxLeaseTermMonths",
                      text ? parseInt(text) : undefined,
                    )
                  }
                  keyboardType="numeric"
                  style={[styles.halfInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
                />
              </View>

              <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                {t("filters.securityDepositRange")}
              </Text>
              <View style={styles.row}>
                <TextInput
                  placeholder={t("filters.minDeposit")}
                  placeholderTextColor={colors.textMuted}
                  value={filters.MinSecurityDeposit?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MinSecurityDeposit",
                      text ? parseFloat(text) : undefined,
                    )
                  }
                  keyboardType="numeric"
                  style={[styles.halfInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
                />
                <TextInput
                  placeholder={t("filters.maxDeposit")}
                  placeholderTextColor={colors.textMuted}
                  value={filters.MaxSecurityDeposit?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MaxSecurityDeposit",
                      text ? parseFloat(text) : undefined,
                    )
                  }
                  keyboardType="numeric"
                  style={[styles.halfInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
                />
              </View>

              <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                {t("filters.furnishedStatus")}
              </Text>
              <View style={styles.chips}>
                {FURNISHED_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() =>
                      updateFilter(
                        "FurnishedStatus",
                        filters.FurnishedStatus === option ? undefined : option,
                      )
                    }
                    style={[
                      styles.chip,
                      filters.FurnishedStatus === option
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.surfaceElevated },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.FurnishedStatus === option
                          ? styles.chipTextActive
                          : { color: colors.text },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.switchRow, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  {t("filters.utilitiesIncluded")}
                </Text>
                <Switch
                  value={filters.UtilitiesIncluded || false}
                  onValueChange={(value) =>
                    updateFilter("UtilitiesIncluded", value || undefined)
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          )}

          {/* Property Type */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🏠 {t("properties.propertyType")}
            </Text>
            <View style={styles.chips}>
              {PROPERTY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.name}
                  onPress={() => togglePropertyType(type.name)}
                  style={[
                    styles.chip,
                    filters.PropertyTypes?.includes(type.name)
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.surfaceElevated },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filters.PropertyTypes?.includes(type.name)
                        ? styles.chipTextActive
                        : { color: colors.text },
                    ]}
                  >
                    {type.emoji} {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bedrooms & Bathrooms */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🛏️ {t("properties.bedrooms")} & 🛁 {t("properties.bathrooms")}
            </Text>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t("filters.minBedrooms")}
                </Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={filters.MinBedrooms?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MinBedrooms",
                      text ? parseInt(text) : undefined,
                    )
                  }
                  keyboardType="numeric"
                  style={[styles.textInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t("filters.minBathrooms")}
                </Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={filters.MinBathrooms?.toString()}
                  onChangeText={(text) =>
                    updateFilter(
                      "MinBathrooms",
                      text ? parseInt(text) : undefined,
                    )
                  }
                  keyboardType="numeric"
                  style={[styles.textInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
                />
              </View>
            </View>
          </View>

          {/* Square Footage */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📐 {t("properties.area")} {t("properties.squaremeter")}
            </Text>
            <View style={styles.row}>
              <TextInput
                placeholder={t("filters.minArea")}
                placeholderTextColor={colors.textMuted}
                value={filters.MinArea?.toString()}
                onChangeText={(text) =>
                  updateFilter("MinArea", text ? parseFloat(text) : undefined)
                }
                keyboardType="numeric"
                style={[styles.halfInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
              />
              <TextInput
                placeholder={t("filters.maxArea")}
                placeholderTextColor={colors.textMuted}
                value={filters.MaxArea?.toString()}
                onChangeText={(text) =>
                  updateFilter("MaxArea", text ? parseFloat(text) : undefined)
                }
                keyboardType="numeric"
                style={[styles.halfInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
              />
            </View>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
                style={[styles.switchRow, { backgroundColor: colors.surfaceElevated }]}
              >
                <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
                <Switch
                  value={
                    (filters[key as keyof PropertyFilters] as boolean) || false
                  }
                  onValueChange={(value) =>
                    updateFilter(key as any, value || undefined)
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}
          </View>

          {/* Green Features */}
          <View style={[styles.section, styles.lastSection]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
                style={[styles.switchRow, { backgroundColor: colors.surfaceElevated }]}
              >
                <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
                <Switch
                  value={
                    (filters[key as keyof PropertyFilters] as boolean) || false
                  }
                  onValueChange={(value) =>
                    updateFilter(key as any, value || undefined)
                  }
                  trackColor={{ false: colors.border, true: "#10B981" }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}

            <Text style={[styles.subsectionTitle, { color: colors.textSecondary, marginTop: 12 }]}>
              {t("greenHomes.minEcoScore")}
            </Text>
            <TextInput
              placeholder={t("filters.minEcoScorePlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={filters.MinEcoScore?.toString() || ""}
              onChangeText={(text) =>
                updateFilter("MinEcoScore", text ? parseInt(text) : undefined)
              }
              keyboardType="numeric"
              style={[styles.textInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
            />
          </View>
        </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={handleReset}
              style={[styles.footerButton, { backgroundColor: colors.surfaceElevated }]}
            >
              <Text style={[styles.footerButtonText, { color: colors.text }]}>
                {t("common.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              style={[styles.footerButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.footerButtonText, styles.footerButtonTextActive]}>
                {t("common.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Rubik-Bold",
  },
  closeButton: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 24,
  },
  lastSection: {
    marginBottom: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Rubik-Bold",
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontFamily: "Rubik-SemiBold",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: "Rubik-Regular",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleButtonText: {
    textAlign: "center",
    fontFamily: "Rubik-Bold",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
  },
  inputText: {
    fontFamily: "Rubik-Regular",
  },
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Rubik-Regular",
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Rubik-Regular",
  },
  flex1: {
    flex: 1,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontFamily: "Rubik-Regular",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchLabel: {
    fontFamily: "Rubik-Regular",
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
  },
  footerButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 16,
  },
  footerButtonText: {
    textAlign: "center",
    fontFamily: "Rubik-Bold",
  },
  footerButtonTextActive: {
    color: "#FFFFFF",
  },
});
