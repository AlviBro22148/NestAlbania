import CityPicker from "@/components/CityPicker";
import InputModal from "@/components/InputModal";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import api from "@/lib/axios-config";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Stack, router } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { shadows, shadowsDark } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import icons from "@/constants/icons";

interface PropertyForm {
  title: string;
  description: string;
  address: string;
  price: string;
  propertyType: string;
  listingType: string;
  city: string;
  neighborhood: string;
  zipCode: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  lotSize: string;
  parkingSpaces: string;
  hasGarage: boolean;
  yearBuilt: string;
  isPetFriendly: boolean;
  hasInUnitLaundry: boolean;
  hasPool: boolean;
  hasGym: boolean;
  hasAirConditioning: boolean;
  monthlyRent: string;
  leaseTermMonths: string;
  securityDeposit: string;
  utilitiesIncluded: boolean;
  furnishedStatus: string;
  // Green Features
  hasSolarPanels: boolean;
  hasEnergyEfficientAppliances: boolean;
  hasLEDLighting: boolean;
  hasSmartThermostats: boolean;
  hasDoubleGlazedWindows: boolean;
  hasRainwaterHarvesting: boolean;
  hasGreenRoof: boolean;
  hasEnergyStarCertification: boolean;
  hasLEEDCertification: boolean;
  leedLevel: string;
}

const defaultForm: PropertyForm = {
  title: "",
  description: "",
  address: "",
  price: "",
  propertyType: "Apartment",
  listingType: "Sale",
  city: "",
  neighborhood: "",
  zipCode: "",
  bedrooms: "",
  bathrooms: "",
  area: "",
  lotSize: "",
  parkingSpaces: "0",
  hasGarage: false,
  yearBuilt: "",
  isPetFriendly: false,
  hasInUnitLaundry: false,
  hasPool: false,
  hasGym: false,
  hasAirConditioning: false,
  monthlyRent: "",
  leaseTermMonths: "",
  securityDeposit: "",
  utilitiesIncluded: false,
  furnishedStatus: "Unfurnished",
  // Green Features
  hasSolarPanels: false,
  hasEnergyEfficientAppliances: false,
  hasLEDLighting: false,
  hasSmartThermostats: false,
  hasDoubleGlazedWindows: false,
  hasRainwaterHarvesting: false,
  hasGreenRoof: false,
  hasEnergyStarCertification: false,
  hasLEEDCertification: false,
  leedLevel: "",
};

const CreateProperty = () => {
  const { user } = useAuth();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState<PropertyForm>(defaultForm);
  const { t } = useTranslation();

  const [modalVisible, setModalVisible] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    field: keyof PropertyForm;
    title: string;
    placeholder: string;
    keyboardType: "default" | "numeric";
    multiline: boolean;
  } | null>(null);
  const [tempValue, setTempValue] = useState("");

  const propertyTypes = [
    { name: t("properties.Apartment"), emoji: "🏢" },
    { name: t("properties.House"), emoji: "🏠" },
    { name: t("properties.Villa"), emoji: "🏡" },
    { name: t("properties.Studio"), emoji: "🎬" },
    { name: t("properties.Office"), emoji: "☕" },
    { name: t("properties.Condo"), emoji: "🏘️" },
    { name: t("properties.Townhouse"), emoji: "🏘️" },
    { name: t("properties.Land"), emoji: "🌳" },
  ];

  const furnishedOptions = [
    { value: "Unfurnished", label: t("properties.unfurnished"), emoji: "🏚️" },
    {
      value: "Semi-Furnished",
      label: t("properties.semiFurnished"),
      emoji: "🛋️",
    },
    {
      value: "Fully-Furnished",
      label: t("properties.fullyFurnished"),
      emoji: "🏡",
    },
  ];

  const leedLevels = [
    { value: "", label: "None" },
    { value: "Certified", label: "Certified" },
    { value: "Silver", label: "Silver" },
    { value: "Gold", label: "Gold" },
    { value: "Platinum", label: "Platinum" },
  ];

  const openInputModal = (
    field: keyof PropertyForm,
    title: string,
    placeholder: string,
    keyboardType: "default" | "numeric" = "default",
    multiline: boolean = false
  ) => {
    setTempValue(form[field] as string);
    setModalConfig({ field, title, placeholder, keyboardType, multiline });
    setModalVisible(true);
  };

  const saveFromModal = () => {
    if (modalConfig) {
      setForm({ ...form, [modalConfig.field]: tempValue });
    }
    setModalVisible(false);
    setModalConfig(null);
  };

  useFocusEffect(
    useCallback(() => {
      setForm(defaultForm);
      setImages([]);
      return () => {};
    }, [])
  );

  const pickImages = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert({
          type: "warning",
          title: t("validation.permissionRequired"),
          message: t("validation.photoAccessPermission"),
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newImages].slice(0, 10));
      }
    } catch (error) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.failedToPickImages"),
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.address) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.fillAllFields"),
      });
      return;
    }

    if (!form.city) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.selectCity") || "Please select a city",
      });
      return;
    }

    if (form.listingType === "Sale" && !form.price) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.enterSalePrice"),
      });
      return;
    }

    if (form.listingType === "Rent" && !form.monthlyRent) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.enterMonthlyRent"),
      });
      return;
    }

    if (images.length === 0) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.addAtLeastOneImage"),
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("address", form.address);
      formData.append(
        "price",
        form.listingType === "Sale" ? form.price : form.monthlyRent
      );
      formData.append("propertyType", form.propertyType);
      formData.append("listingType", form.listingType);
      formData.append("city", form.city);
      formData.append("neighborhood", form.neighborhood);
      formData.append("zipCode", form.zipCode);
      formData.append("bedrooms", form.bedrooms || "0");
      formData.append("bathrooms", form.bathrooms || "0");
      formData.append("area", form.area || "0");
      formData.append("lotSize", form.lotSize || "0");
      formData.append("parkingSpaces", form.parkingSpaces || "0");
      formData.append("hasGarage", form.hasGarage.toString());
      formData.append("yearBuilt", form.yearBuilt || "");
      formData.append("isPetFriendly", form.isPetFriendly.toString());
      formData.append("hasInUnitLaundry", form.hasInUnitLaundry.toString());
      formData.append("hasPool", form.hasPool.toString());
      formData.append("hasGym", form.hasGym.toString());
      formData.append("hasAirConditioning", form.hasAirConditioning.toString());

      // Rental-specific fields
      if (form.listingType === "Rent") {
        formData.append("monthlyRent", form.monthlyRent);
        formData.append("leaseTermMonths", form.leaseTermMonths || "");
        formData.append("securityDeposit", form.securityDeposit || "");
        formData.append("utilitiesIncluded", form.utilitiesIncluded.toString());
        formData.append("furnishedStatus", form.furnishedStatus);
      }

      // Green Features
      formData.append("hasSolarPanels", form.hasSolarPanels.toString());
      formData.append(
        "hasEnergyEfficientAppliances",
        form.hasEnergyEfficientAppliances.toString()
      );
      formData.append("hasLEDLighting", form.hasLEDLighting.toString());
      formData.append(
        "hasSmartThermostats",
        form.hasSmartThermostats.toString()
      );
      formData.append(
        "hasDoubleGlazedWindows",
        form.hasDoubleGlazedWindows.toString()
      );
      formData.append(
        "hasRainwaterHarvesting",
        form.hasRainwaterHarvesting.toString()
      );
      formData.append("hasGreenRoof", form.hasGreenRoof.toString());
      formData.append(
        "hasEnergyStarCertification",
        form.hasEnergyStarCertification.toString()
      );
      formData.append(
        "hasLEEDCertification",
        form.hasLEEDCertification.toString()
      );
      formData.append("leedLevel", form.leedLevel || "");

      for (let i = 0; i < images.length; i++) {
        const uri = images[i];
        const filename = uri.split("/").pop() || `image${i}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("images", { uri, name: filename, type } as any);
      }

      await api.post("/api/properties/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showAlert({
        type: "success",
        title: t("common.success"),
        message: t("properties.propertyCreated"),
        buttons: [
          {
            text: "OK",
            onPress: () => router.push("/user-properties"),
            style: "default"
          },
        ],
      });
    } catch (error: any) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || t("validation.failedToCreateProperty"),
      });
    } finally {
      setLoading(false);
    }
  };

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Premium Header */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={[styles.header, { backgroundColor: colors.surface }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
            >
              <Image source={icons.backArrow} style={styles.backIcon} tintColor={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t("properties.listYourProperty")}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {t("properties.fillDetailsToStart")}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Images */}
          <View style={[cardShadow, { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }]}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: colors.text, marginLeft: 4 }}>
                  📸 {t("properties.propertyPhotos")}
                </Text>
                <Text style={{ fontSize: 14, fontFamily: "Rubik-Regular", color: colors.textSecondary, marginTop: 4, marginLeft: 4 }}>
                  {t("properties.addUpTo10Images")}
                </Text>
              </View>
              <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}>
                <Text className="text-sm font-rubik-bold text-primary-300">
                  {images.length}/10
                </Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((uri, index) => (
                <View key={index} className="mr-3 relative">
                  <Image source={{ uri }} className="w-36 h-36 rounded-xl" />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-8 h-8 items-center justify-center"
                  >
                    <Text className="text-white font-rubik-bold text-lg">
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 10 && (
                <TouchableOpacity
                  onPress={pickImages}
                  style={{ width: 144, height: 144, borderWidth: 2, borderStyle: "dashed", borderColor: "#0061FF", backgroundColor: colors.surface, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
                >
                  <Text className="text-5xl text-primary-300 mb-2">+</Text>
                  <Text className="text-primary-300 font-rubik-bold text-sm">
                    {t("properties.addPhotos")}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Listing Type Section */}
          <View style={[cardShadow, { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: colors.text, marginBottom: 16 }}>
              💼 {t("properties.listingType")}
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setForm({ ...form, listingType: "Sale" })}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: form.listingType === "Sale" ? "#0061FF" : (isDark ? colors.surfaceElevated : "#F3F4F6")
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontFamily: "Rubik-Bold",
                    color: form.listingType === "Sale" ? "#FFFFFF" : colors.textSecondary
                  }}
                >
                  🏷️ {t("properties.forSale")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setForm({ ...form, listingType: "Rent" })}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: form.listingType === "Rent" ? "#0061FF" : (isDark ? colors.surfaceElevated : "#F3F4F6")
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontFamily: "Rubik-Bold",
                    color: form.listingType === "Rent" ? "#FFFFFF" : colors.textSecondary
                  }}
                >
                  🔑 {t("properties.forRent")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Basic Info */}
          <View style={[cardShadow, { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: colors.text, marginBottom: 16 }}>
              🏠 {t("properties.basicInformation")}
            </Text>

            <TouchableOpacity
              onPress={() =>
                openInputModal(
                  "title",
                  t("properties.propertyTitle"),
                  t("placeholders.enterPropertyTitle")
                )
              }
              className="mb-4"
            >
              <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                {t("properties.propertyTitle")} *
              </Text>
              <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text
                  style={{
                    fontFamily: "Rubik-Regular",
                    fontSize: 16,
                    color: form.title ? colors.text : colors.textMuted
                  }}
                >
                  {form.title || t("placeholders.enterPropertyTitle")}
                </Text>
              </View>
            </TouchableOpacity>

            <View className="mb-4">
              <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                {t("properties.propertyType")} *
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {propertyTypes.map((type) => (
                  <TouchableOpacity
                    key={type.name}
                    onPress={() =>
                      setForm({ ...form, propertyType: type.name })
                    }
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: form.propertyType === type.name ? "#0061FF" : (isDark ? colors.surfaceElevated : "#F3F4F6")
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Rubik-Bold",
                        color: form.propertyType === type.name ? "#FFFFFF" : colors.textSecondary
                      }}
                    >
                      {type.emoji} {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Conditional Price/Rent Input */}
          {form.listingType === "Sale" ? (
            <TouchableOpacity
              onPress={() =>
                openInputModal(
                  "price",
                  t("properties.price"),
                  "250000",
                  "numeric"
                )
              }
              className="mb-4"
            >
              <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                {t("properties.price")} ($) *
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text className="text-2xl font-rubik-bold text-primary-300 mr-2">
                  $
                </Text>
                <Text
                  style={{
                    fontFamily: "Rubik-Bold",
                    fontSize: 16,
                    color: form.price ? colors.text : colors.textMuted
                  }}
                >
                  {form.price || "250,000"}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() =>
                openInputModal(
                  "monthlyRent",
                  t("properties.monthlyRent"),
                  "1500",
                  "numeric"
                )
              }
              className="mb-4"
            >
              <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                {t("properties.monthlyRent")} ($) *
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text className="text-2xl font-rubik-bold text-primary-300 mr-2">
                  $
                </Text>
                <Text
                  style={{
                    fontFamily: "Rubik-Bold",
                    fontSize: 16,
                    color: form.monthlyRent ? colors.text : colors.textMuted
                  }}
                >
                  {form.monthlyRent || "1,500"} / {t("properties.month")}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Rental-Specific Section */}
          {form.listingType === "Rent" && (
            <View style={[cardShadow, { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: colors.text, marginBottom: 16 }}>
                🔑 {t("properties.rentalDetails")}
              </Text>

              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={() =>
                    openInputModal(
                      "leaseTermMonths",
                      t("properties.leaseTerm"),
                      "12",
                      "numeric"
                    )
                  }
                  className="flex-1"
                >
                  <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                    {t("properties.leaseTerm")} ({t("properties.months")})
                  </Text>
                  <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                    <Text
                      style={{
                        fontFamily: "Rubik-Regular",
                        fontSize: 16,
                        color: form.leaseTermMonths ? colors.text : colors.textMuted
                      }}
                    >
                      {form.leaseTermMonths || "12"} {t("properties.months")}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    openInputModal(
                      "securityDeposit",
                      t("properties.securityDeposit"),
                      "1500",
                      "numeric"
                    )
                  }
                  className="flex-1"
                >
                  <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                    {t("properties.securityDeposit")} ($)
                  </Text>
                  <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                    <Text
                      style={{
                        fontFamily: "Rubik-Regular",
                        fontSize: 16,
                        color: form.securityDeposit ? colors.text : colors.textMuted
                      }}
                    >
                      ${form.securityDeposit || "1,500"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                  {t("properties.furnishedStatus")}
                </Text>
                <View className="flex-row gap-2">
                  {furnishedOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        setForm({ ...form, furnishedStatus: option.value })
                      }
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: form.furnishedStatus === option.value ? "#0061FF" : (isDark ? colors.surfaceElevated : "#F3F4F6")
                      }}
                    >
                      <Text
                        style={{
                          textAlign: "center",
                          fontFamily: "Rubik-Bold",
                          fontSize: 12,
                          color: form.furnishedStatus === option.value ? "#FFFFFF" : colors.textSecondary
                        }}
                      >
                        {option.emoji} {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">⚡</Text>
                  <Text style={{ fontFamily: "Rubik-SemiBold", color: colors.text }}>
                    {t("properties.utilitiesIncluded")}
                  </Text>
                </View>
                <Switch
                  value={form.utilitiesIncluded}
                  onValueChange={(value) =>
                    setForm({ ...form, utilitiesIncluded: value })
                  }
                  trackColor={{ false: "#d1d5db", true: "#0061FF" }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          )}

          {/* Location */}
          <View style={[cardShadow, { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: colors.text, marginBottom: 16 }}>
              📍 {t("properties.locationDetails")}
            </Text>

            <TouchableOpacity
              onPress={() =>
                openInputModal(
                  "address",
                  t("properties.fullAddress"),
                  t("placeholders.enterAddress")
                )
              }
              className="mb-4"
            >
              <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                {t("properties.fullAddress")} *
              </Text>
              <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text
                  style={{
                    fontFamily: "Rubik-Regular",
                    fontSize: 16,
                    color: form.address ? colors.text : colors.textMuted
                  }}
                >
                  {form.address || t("placeholders.enterAddress")}
                </Text>
              </View>
            </TouchableOpacity>

            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={() => setCityPickerVisible(true)}
                className="flex-1"
              >
                <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                  {t("properties.city")} *
                </Text>
                <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text
                    style={{
                      fontFamily: "Rubik-Regular",
                      fontSize: 16,
                      color: form.city ? colors.text : colors.textMuted
                    }}
                  >
                    {form.city || t("cities.selectCity")}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "zipCode",
                    t("properties.zipCode"),
                    t("placeholders.enterZipCode"),
                    "numeric"
                  )
                }
                className="flex-1"
              >
                <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                  {t("properties.zipCode")}
                </Text>
                <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text
                    style={{
                      fontFamily: "Rubik-Regular",
                      fontSize: 16,
                      color: form.zipCode ? colors.text : colors.textMuted
                    }}
                  >
                    {form.zipCode || t("placeholders.enterZipCode")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() =>
                openInputModal(
                  "neighborhood",
                  t("properties.neighborhood"),
                  t("placeholders.enterNeighborhood")
                )
              }
            >
              <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                {t("properties.neighborhood")}
              </Text>
              <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text
                  style={{
                    fontFamily: "Rubik-Regular",
                    fontSize: 16,
                    color: form.neighborhood ? colors.text : colors.textMuted
                  }}
                >
                  {form.neighborhood || t("placeholders.enterNeighborhood")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Size & Rooms */}
          <View style={[cardShadow, { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: colors.text, marginBottom: 16 }}>
              📐 {t("properties.sizeAndRooms")}
            </Text>

            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "bedrooms",
                    "🛏️ " + t("properties.bedrooms"),
                    "3",
                    "numeric"
                  )
                }
                className="flex-1"
              >
                <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                  🛏️ {t("properties.bedrooms")}
                </Text>
                <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text
                    style={{
                      fontFamily: "Rubik-Bold",
                      fontSize: 16,
                      textAlign: "center",
                      color: form.bedrooms ? colors.text : colors.textMuted
                    }}
                  >
                    {form.bedrooms || "3"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "bathrooms",
                    "🚿 " + t("properties.bathrooms"),
                    "2",
                    "numeric"
                  )
                }
                className="flex-1"
              >
                <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                  🚿 {t("properties.bathrooms")}
                </Text>
                <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text
                    style={{
                      fontFamily: "Rubik-Bold",
                      fontSize: 16,
                      textAlign: "center",
                      color: form.bathrooms ? colors.text : colors.textMuted
                    }}
                  >
                    {form.bathrooms || "2"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "area",
                    t("properties.area") + " (sq m)",
                    "150",
                    "numeric"
                  )
                }
                className="flex-1"
              >
                <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                  {t("properties.area")} {t("properties.squaremeter")}
                </Text>
                <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text
                    style={{
                      fontFamily: "Rubik-Regular",
                      fontSize: 16,
                      color: form.area ? colors.text : colors.textMuted
                    }}
                  >
                    {form.area || "150"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "lotSize",
                    t("properties.lotSize") + " (sq m)",
                    "200",
                    "numeric"
                  )
                }
                className="flex-1"
              >
                <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                  {t("properties.lotSize")} {t("properties.squaremeter")}
                </Text>
                <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text
                    style={{
                      fontFamily: "Rubik-Regular",
                      fontSize: 16,
                      color: form.lotSize ? colors.text : colors.textMuted
                    }}
                  >
                    {form.lotSize || "200"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features */}
          <View style={[cardShadow, { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: colors.text, marginBottom: 16 }}>
              ✨ {t("properties.propertyFeatures")}
            </Text>

            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "parkingSpaces",
                    "🚗 " + t("properties.parkingSpaces"),
                    "2",
                    "numeric"
                  )
                }
                className="flex-1"
              >
                <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                  🚗 {t("properties.parkingSpaces")}
                </Text>
                <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text
                    style={{
                      fontFamily: "Rubik-Bold",
                      fontSize: 16,
                      textAlign: "center",
                      color: form.parkingSpaces ? colors.text : colors.textMuted
                    }}
                  >
                    {form.parkingSpaces || "0"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "yearBuilt",
                    "📅 " + t("properties.yearBuilt"),
                    "2020",
                    "numeric"
                  )
                }
                className="flex-1"
              >
                <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                  📅 {t("properties.yearBuilt")}
                </Text>
                <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text
                    style={{
                      fontFamily: "Rubik-Regular",
                      fontSize: 16,
                      textAlign: "center",
                      color: form.yearBuilt ? colors.text : colors.textMuted
                    }}
                  >
                    {form.yearBuilt || "2020"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🚙</Text>
                <Text style={{ fontFamily: "Rubik-SemiBold", color: colors.text }}>
                  {t("properties.hasGarage")}
                </Text>
              </View>
              <Switch
                value={form.hasGarage}
                onValueChange={(value) =>
                  setForm({ ...form, hasGarage: value })
                }
                trackColor={{ false: "#d1d5db", true: "#0061FF" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Amenities */}
          <View style={[cardShadow, { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: colors.text, marginBottom: 16 }}>
              🎯 {t("properties.amenities")}
            </Text>

            {[
              {
                key: "isPetFriendly",
                label: t("properties.petFriendly"),
                emoji: "🐾",
              },
              {
                key: "hasInUnitLaundry",
                label: t("properties.inUnitLaundry"),
                emoji: "🧺",
              },
              {
                key: "hasPool",
                label: t("properties.swimmingPool"),
                emoji: "🏊",
              },
              { key: "hasGym", label: t("properties.gymFitness"), emoji: "💪" },
              {
                key: "hasAirConditioning",
                label: t("properties.airConditioning"),
                emoji: "❄️",
              },
            ].map(({ key, label, emoji }, index) => (
              <View
                key={key}
                style={{
                  backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: index < 4 ? 12 : 0
                }}
              >
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{emoji}</Text>
                  <Text style={{ fontFamily: "Rubik-SemiBold", color: colors.text }}>
                    {label}
                  </Text>
                </View>
                <Switch
                  value={form[key as keyof PropertyForm] as boolean}
                  onValueChange={(value) => setForm({ ...form, [key]: value })}
                  trackColor={{ false: "#d1d5db", true: "#0061FF" }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}
          </View>

          {/* 🌿 GREEN FEATURES SECTION */}
          <View style={[cardShadow, { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: isDark ? colors.border : "#86EFAC" }]}>
            <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: colors.text, marginBottom: 16 }}>
              🌿 {t("greenHomes.greenFeatures") || "Green Features"}
            </Text>

            {[
              {
                key: "hasSolarPanels",
                label: `☀️ ${t("greenHomes.solarPanels") || "Solar Panels"}`,
              },
              {
                key: "hasEnergyEfficientAppliances",
                label: `⚡ ${t("greenHomes.energyEfficientAppliances") || "Energy Efficient Appliances"}`,
              },
              {
                key: "hasLEDLighting",
                label: `💡 ${t("greenHomes.ledLighting") || "LED Lighting"}`,
              },
              {
                key: "hasSmartThermostats",
                label: `🌡️ ${t("greenHomes.smartThermostats") || "Smart Thermostats"}`,
              },
              {
                key: "hasDoubleGlazedWindows",
                label: `🪟 ${t("greenHomes.doubleGlazedWindows") || "Double Glazed Windows"}`,
              },
              {
                key: "hasRainwaterHarvesting",
                label: `💧 ${t("greenHomes.rainwaterHarvesting") || "Rainwater Harvesting"}`,
              },
              {
                key: "hasGreenRoof",
                label: `🌱 ${t("greenHomes.greenRoof") || "Green Roof"}`,
              },
              {
                key: "hasEnergyStarCertification",
                label: `⭐ ${t("greenHomes.energyStar") || "Energy Star Certified"}`,
              },
              {
                key: "hasLEEDCertification",
                label: `🏆 ${t("greenHomes.leed") || "LEED Certified"}`,
              },
            ].map(({ key, label }, index) => (
              <View
                key={key}
                style={{
                  backgroundColor: isDark ? colors.surfaceElevated : "#ECFDF5",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: index < 8 ? 12 : 0
                }}
              >
                <Text style={{ fontFamily: "Rubik-SemiBold", color: colors.text }}>
                  {label}
                </Text>
                <Switch
                  value={form[key as keyof PropertyForm] as boolean}
                  onValueChange={(value) => setForm({ ...form, [key]: value })}
                  trackColor={{ false: "#d1d5db", true: "#10B981" }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}

            {/* LEED Level Dropdown */}
            {form.hasLEEDCertification && (
              <View className="mt-4">
                <Text style={{ fontSize: 14, fontFamily: "Rubik-SemiBold", color: colors.textSecondary, marginBottom: 8 }}>
                  LEED Level
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {leedLevels.map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      onPress={() =>
                        setForm({ ...form, leedLevel: level.value })
                      }
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: form.leedLevel === level.value ? "#059669" : (isDark ? colors.surfaceElevated : "#F3F4F6")
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Rubik-Bold",
                          color: form.leedLevel === level.value ? "#FFFFFF" : colors.textSecondary
                        }}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "description",
                "📝 " + t("properties.description"),
                t("properties.describeProperty"),
                "default",
                true
              )
            }
            className="mb-6"
          >
            <View style={[cardShadow, { backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: colors.text, marginBottom: 16 }}>
                📝 {t("properties.description")}
              </Text>
              <View style={{ backgroundColor: isDark ? colors.surfaceElevated : "#F9FAFB", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 128 }}>
                <Text
                  style={{
                    fontFamily: "Rubik-Regular",
                    fontSize: 16,
                    color: form.description ? colors.text : colors.textMuted
                  }}
                >
                  {form.description || t("properties.describeProperty")}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="bg-primary-300 rounded-2xl py-5 mb-10"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-center font-rubik-extrabold text-lg">
                {t("properties.createProperty")}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {modalConfig && (
        <InputModal
          visible={modalVisible}
          title={modalConfig.title}
          placeholder={modalConfig.placeholder}
          value={tempValue}
          onChangeText={setTempValue}
          onClose={() => setModalVisible(false)}
          onSave={saveFromModal}
          keyboardType={modalConfig.keyboardType}
          multiline={modalConfig.multiline}
          numberOfLines={modalConfig.multiline ? 6 : 1}
        />
      )}

      <CityPicker
        visible={cityPickerVisible}
        selectedCity={form.city}
        onClose={() => setCityPickerVisible(false)}
        onSelectCity={(city) => setForm({ ...form, city })}
      />
    </>
  );
};

export default CreateProperty;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
});
