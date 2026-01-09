import CityPicker from "@/components/CityPicker";
import InputModal from "@/components/InputModal";
import { useAlert } from "@/contexts/AlertContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

const EditProperty = () => {
  const params = useLocalSearchParams();
  const propertyId = params.propertyId as string;
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const handleBack = useBackNavigation("/(root)/(tabs)/user-properties");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState<PropertyForm>({
    title: "",
    description: "",
    address: "",
    price: "",
    propertyType: t("properties.Apartment"),
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
  });

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
    { name: t("propertyTypes.land"), emoji: "🌳" },
  ];

  const furnishedOptions = ["Unfurnished", "Semi-Furnished", "Fully Furnished"];

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
      if (propertyId) {
        fetchPropertyData();
      } else {
        showAlert({
          type: "error",
          title: "Error",
          message: "Property ID is missing",
        });
        handleBack();
      }
    }, [propertyId])
  );

  const fetchPropertyData = async () => {
    try {
      setFetching(true);
      const response = await api.get(`/api/properties/${propertyId}/edit`);
      const property = response.data;

      setForm({
        title: property.title || "",
        description: property.description || "",
        address: property.address || "",
        price: property.price?.toString() || "",
        propertyType: property.propertyType || "Apartment",
        listingType: property.listingType || "Sale",
        city: property.city || "",
        neighborhood: property.neighborhood || "",
        zipCode: property.zipCode || "",
        bedrooms: property.bedrooms?.toString() || "0",
        bathrooms: property.bathrooms?.toString() || "0",
        area: property.area?.toString() || "0",
        lotSize: property.lotSize?.toString() || "",
        parkingSpaces: property.parkingSpaces?.toString() || "0",
        hasGarage: property.hasGarage || false,
        yearBuilt: property.yearBuilt?.toString() || "",
        isPetFriendly: property.isPetFriendly || false,
        hasInUnitLaundry: property.hasInUnitLaundry || false,
        hasPool: property.hasPool || false,
        hasGym: property.hasGym || false,
        hasAirConditioning: property.hasAirConditioning || false,
        monthlyRent: property.monthlyRent?.toString() || "",
        leaseTermMonths: property.leaseTermMonths?.toString() || "",
        securityDeposit: property.securityDeposit?.toString() || "",
        utilitiesIncluded: property.utilitiesIncluded || false,
        furnishedStatus: property.furnishedStatus || "Unfurnished",
        // Green Features
        hasSolarPanels: property.hasSolarPanels || false,
        hasEnergyEfficientAppliances:
          property.hasEnergyEfficientAppliances || false,
        hasLEDLighting: property.hasLEDLighting || false,
        hasSmartThermostats: property.hasSmartThermostats || false,
        hasDoubleGlazedWindows: property.hasDoubleGlazedWindows || false,
        hasRainwaterHarvesting: property.hasRainwaterHarvesting || false,
        hasGreenRoof: property.hasGreenRoof || false,
        hasEnergyStarCertification:
          property.hasEnergyStarCertification || false,
        hasLEEDCertification: property.hasLEEDCertification || false,
        leedLevel: property.leedLevel || "",
      });

      setImages(property.images || []);
    } catch (error: any) {
      showAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to load property",
      });
      handleBack();
    } finally {
      setFetching(false);
    }
  };

  const pickImages = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert({
          type: "error",
          title: "Error",
          message: "Please allow access to your photos",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - images.length,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newImages].slice(0, 10));
      }
    } catch (error) {
      showToast("Failed to pick images", "error");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.address) {
      showAlert({
        type: "error",
        title: "Error",
        message: "Please fill in all required fields",
      });
      return;
    }

    if (form.listingType === "Sale") {
      if (!form.price) {
        showAlert({
          type: "error",
          title: "Error",
          message: "Please enter a sale price",
        });
        return;
      }
    } else if (form.listingType === "Rent") {
      if (!form.monthlyRent) {
        showAlert({
          type: "error",
          title: "Error",
          message: "Please enter monthly rent",
        });
        return;
      }
      if (!form.leaseTermMonths) {
        showAlert({
          type: "error",
          title: "Error",
          message: "Please enter lease term",
        });
        return;
      }
    }

    if (images.length === 0) {
      showAlert({
        type: "error",
        title: "Error",
        message: "Please add at least one image",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("address", form.address);
      formData.append("price", form.price || "0");
      formData.append("propertyType", form.propertyType);
      formData.append("listingType", form.listingType);
      formData.append("city", form.city);
      formData.append("neighborhood", form.neighborhood);
      formData.append("zipCode", form.zipCode);
      formData.append("bedrooms", form.bedrooms || "0");
      formData.append("bathrooms", form.bathrooms || "0");
      formData.append("area", form.area || "0");
      formData.append("lotSize", form.lotSize || "");
      formData.append("parkingSpaces", form.parkingSpaces || "0");
      formData.append("hasGarage", form.hasGarage.toString());
      formData.append("yearBuilt", form.yearBuilt || "");
      formData.append("isPetFriendly", form.isPetFriendly.toString());
      formData.append("hasInUnitLaundry", form.hasInUnitLaundry.toString());
      formData.append("hasPool", form.hasPool.toString());
      formData.append("hasGym", form.hasGym.toString());
      formData.append("hasAirConditioning", form.hasAirConditioning.toString());

      // Rental fields
      formData.append("monthlyRent", form.monthlyRent || "");
      formData.append("leaseTermMonths", form.leaseTermMonths || "");
      formData.append("securityDeposit", form.securityDeposit || "");
      formData.append("utilitiesIncluded", form.utilitiesIncluded.toString());
      formData.append("furnishedStatus", form.furnishedStatus);

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

      const existingCloudinaryImages = images.filter(
        (img) => img.includes("cloudinary.com") || img.startsWith("http")
      );
      const newLocalImages = images.filter((img) => img.startsWith("file://"));

      formData.append("existingImages", existingCloudinaryImages.join(","));

      for (let i = 0; i < newLocalImages.length; i++) {
        const uri = newLocalImages[i];
        const filename = uri.split("/").pop() || `image${i}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("newImages", { uri, name: filename, type } as any);
      }

      const response = await api.put(
        `/api/properties/${propertyId}/with-images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      showAlert({
        type: "success",
        title: "Success",
        message: "Property updated successfully",
        buttons: [
          {
            text: "Done",
            onPress: () => router.replace("/(root)/(tabs)/user-properties"),
          },
        ],
      });
    } catch (error: any) {
      console.error("❌ Full error:", error);
      showAlert({
        type: "error",
        title: "Error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update property",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0061FF" />
        <Text className="text-gray-500 mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="bg-white h-full">
        <View className="px-6 py-4 flex-row items-center border-b border-gray-100">
          <TouchableOpacity onPress={handleBack}>
            <Text className="text-3xl text-primary-300">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold text-black-300 ml-4">
            {t("editProperty.editProperty")}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="px-6"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Images */}
          <View className="mb-6 mt-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-xl font-rubik-bold text-black-300">
                  📸 {t("properties.propertyPhotos")}
                </Text>
                <Text className="text-sm font-rubik text-gray-600 mt-1">
                  {t("properties.addUpTo10Images")}
                </Text>
              </View>
              <View className="bg-primary-100 px-3 py-1.5 rounded-full">
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
                  className="w-36 h-36 border-2 border-dashed border-primary-300 bg-white rounded-xl items-center justify-center"
                >
                  <Text className="text-5xl text-primary-300 mb-2">+</Text>
                  <Text className="text-primary-300 font-rubik-bold text-sm">
                    Add Photos
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Basic Info */}
          <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
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
              <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                {t("properties.propertyTitle")} *
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                <Text
                  className={`font-rubik text-base ${form.title ? "text-black" : "text-gray-400"}`}
                >
                  {form.title || t("placeholders.enterPropertyTitle")}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Listing Type Toggle */}
            <View className="mb-4">
              <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                Listing Type *
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setForm({ ...form, listingType: "Sale" })}
                  className={`flex-1 py-3 rounded-xl ${
                    form.listingType === "Sale"
                      ? "bg-primary-300"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-center font-rubik-bold ${form.listingType === "Sale" ? "text-white" : "text-gray-700"}`}
                  >
                    🏷️ For Sale
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setForm({ ...form, listingType: "Rent" })}
                  className={`flex-1 py-3 rounded-xl ${
                    form.listingType === "Rent"
                      ? "bg-primary-300"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-center font-rubik-bold ${form.listingType === "Rent" ? "text-white" : "text-gray-700"}`}
                  >
                    🔑 For Rent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                {t("properties.propertyType")} *
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {propertyTypes.map((type) => (
                  <TouchableOpacity
                    key={type.name}
                    onPress={() =>
                      setForm({ ...form, propertyType: type.name })
                    }
                    className={`px-4 py-2.5 rounded-xl ${
                      form.propertyType === type.name
                        ? "bg-primary-300"
                        : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`font-rubik-bold ${form.propertyType === type.name ? "text-white" : "text-gray-700"}`}
                    >
                      {type.emoji} {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Conditional Price or Rent Fields */}
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
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  {t("properties.price")} ($) *
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text className="text-2xl font-rubik-bold text-primary-300 mr-2">
                    $
                  </Text>
                  <Text
                    className={`font-rubik-bold text-base ${form.price ? "text-black" : "text-gray-400"}`}
                  >
                    {form.price || "250,000"}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() =>
                    openInputModal(
                      "monthlyRent",
                      "Monthly Rent",
                      "2000",
                      "numeric"
                    )
                  }
                  className="mb-4"
                >
                  <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                    Monthly Rent ($) *
                  </Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                    <Text className="text-2xl font-rubik-bold text-primary-300 mr-2">
                      $
                    </Text>
                    <Text
                      className={`font-rubik-bold text-base ${form.monthlyRent ? "text-black" : "text-gray-400"}`}
                    >
                      {form.monthlyRent || "2,000"}/mo
                    </Text>
                  </View>
                </TouchableOpacity>

                <View className="flex-row gap-3 mb-4">
                  <TouchableOpacity
                    onPress={() =>
                      openInputModal(
                        "leaseTermMonths",
                        "Lease Term (Months)",
                        "12",
                        "numeric"
                      )
                    }
                    className="flex-1"
                  >
                    <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                      Lease Term *
                    </Text>
                    <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                      <Text
                        className={`font-rubik text-base ${form.leaseTermMonths ? "text-black" : "text-gray-400"}`}
                      >
                        {form.leaseTermMonths || "12"} months
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      openInputModal(
                        "securityDeposit",
                        "Security Deposit",
                        "2000",
                        "numeric"
                      )
                    }
                    className="flex-1"
                  >
                    <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                      Security Deposit
                    </Text>
                    <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                      <Text
                        className={`font-rubik text-base ${form.securityDeposit ? "text-black" : "text-gray-400"}`}
                      >
                        ${form.securityDeposit || "2,000"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                    Furnished Status
                  </Text>
                  <View className="flex-row gap-2">
                    {furnishedOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() =>
                          setForm({ ...form, furnishedStatus: option })
                        }
                        className={`flex-1 py-2.5 rounded-xl ${
                          form.furnishedStatus === option
                            ? "bg-primary-300"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-center font-rubik-bold text-xs ${form.furnishedStatus === option ? "text-white" : "text-gray-700"}`}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="bg-gray-50 rounded-xl px-4 py-4 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">💡</Text>
                    <Text className="font-rubik-semibold text-black-300">
                      Utilities Included
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
              </>
            )}
          </View>

          {/* Location */}
          <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
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
              <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                {t("properties.fullAddress")} *
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                <Text
                  className={`font-rubik text-base ${form.address ? "text-black" : "text-gray-400"}`}
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
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  {t("properties.city")} *
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik text-base ${form.city ? "text-black" : "text-gray-400"}`}
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
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  {t("properties.zipCode")} *
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik text-base ${form.zipCode ? "text-black" : "text-gray-400"}`}
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
              <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                {t("properties.neighborhood")}
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                <Text
                  className={`font-rubik text-base ${form.neighborhood ? "text-black" : "text-gray-400"}`}
                >
                  {form.neighborhood || t("placeholders.enterNeighborhood")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Size & Rooms */}
          <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
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
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  🛏️ {t("properties.bedrooms")}
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik-bold text-base text-center ${form.bedrooms ? "text-black" : "text-gray-400"}`}
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
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  🚿 {t("properties.bathrooms")}
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik-bold text-base text-center ${form.bathrooms ? "text-black" : "text-gray-400"}`}
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
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  {t("properties.area")} {t("properties.squaremeter")}
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik text-base ${form.area ? "text-black" : "text-gray-400"}`}
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
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  {t("properties.lotSize")} {t("properties.squaremeter")}
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik text-base ${form.lotSize ? "text-black" : "text-gray-400"}`}
                  >
                    {form.lotSize || "200"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features */}
          <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
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
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  🚗 {t("properties.parkingSpaces")}
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik-bold text-base text-center ${form.parkingSpaces ? "text-black" : "text-gray-400"}`}
                  >
                    {form.parkingSpaces || "2"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  openInputModal(
                    "yearBuilt",
                    "🏗️ " + t("properties.yearBuilt"),
                    "2020",
                    "numeric"
                  )
                }
                className="flex-1"
              >
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  🏗️ {t("properties.yearBuilt")}
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Text
                    className={`font-rubik text-base text-center ${form.yearBuilt ? "text-black" : "text-gray-400"}`}
                  >
                    {form.yearBuilt || "2020"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="bg-gray-50 rounded-xl px-4 py-4 flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🚪</Text>
                <Text className="font-rubik-semibold text-black-300">
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
          <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
              🎯 {t("properties.amenities")}
            </Text>

            {[
              {
                key: "isPetFriendly",
                label: `🐾 ${t("properties.petFriendly")}`,
              },
              {
                key: "hasInUnitLaundry",
                label: `🧺 ${t("properties.inUnitLaundry")}`,
              },
              { key: "hasPool", label: `🏊 ${t("properties.pool")}` },
              { key: "hasGym", label: `💪 ${t("properties.gym")}` },
              {
                key: "hasAirConditioning",
                label: `❄️ ${t("properties.airConditioning")}`,
              },
            ].map(({ key, label }, index) => (
              <View
                key={key}
                className={`bg-gray-50 rounded-xl px-4 py-4 flex-row items-center justify-between ${
                  index < 4 ? "mb-3" : ""
                }`}
              >
                <Text className="font-rubik-semibold text-black-300">
                  {label}
                </Text>
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
          <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-green-200">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
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
                className={`bg-green-50 rounded-xl px-4 py-4 flex-row items-center justify-between ${
                  index < 8 ? "mb-3" : ""
                }`}
              >
                <Text className="font-rubik-semibold text-black-300">
                  {label}
                </Text>
                <Switch
                  value={form[key as keyof PropertyForm] as boolean}
                  onValueChange={(value) => setForm({ ...form, [key]: value })}
                  trackColor={{ false: "#d1d5db", true: "#10b981" }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}

            {/* LEED Level Selector - Only show if LEED Certified is true */}
            {form.hasLEEDCertification && (
              <View className="mt-4">
                <Text className="text-sm font-rubik-semibold text-gray-700 mb-2">
                  {t("greenHomes.leedLevel") || "LEED Certification Level"}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {leedLevels.map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      onPress={() =>
                        setForm({ ...form, leedLevel: level.value })
                      }
                      className={`px-4 py-2.5 rounded-xl ${
                        form.leedLevel === level.value
                          ? "bg-green-600"
                          : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`font-rubik-bold ${form.leedLevel === level.value ? "text-white" : "text-gray-700"}`}
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
          <View className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
              📝 {t("properties.description")}
            </Text>

            <TouchableOpacity
              onPress={() =>
                openInputModal(
                  "description",
                  t("properties.description"),
                  t("placeholders.description"),
                  "default",
                  true
                )
              }
            >
              <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 min-h-[120px]">
                <Text
                  className={`font-rubik text-base ${form.description ? "text-black" : "text-gray-400"}`}
                >
                  {form.description || t("placeholders.enterDescription")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

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
                {t("editProperty.updateProperty")}
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

export default EditProperty;
