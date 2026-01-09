import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "@/lib/axios-config";
import { ALBANIAN_CITIES } from "@/components/CityPicker";

interface PreferencesModalProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

// Property types available (matching app's property types)
const PROPERTY_TYPES = [
  { label: "Apartment", icon: "🏢" },
  { label: "House", icon: "🏠" },
  { label: "Villa", icon: "🏡" },
  { label: "Studio", icon: "🎬" },
  { label: "Office", icon: "☕" },
  { label: "Condo", icon: "🏘️" },
  { label: "Townhouse", icon: "🏘️" },
  { label: "Land", icon: "🌳" },
];

// Listing type options
const LISTING_TYPES = [
  { label: "Buy", value: "Sale", icon: "🏷️" },
  { label: "Rent", value: "Rent", icon: "🔑" },
  { label: "Both", value: "Both", icon: "✨" },
];

// Room options
const ROOM_OPTIONS = [
  { label: "1+", value: 1 },
  { label: "2+", value: 2 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
];

// Amenities
const AMENITIES = [
  { key: "garage", label: "Garage", icon: "🚗" },
  { key: "petFriendly", label: "Pet Friendly", icon: "🐕" },
  { key: "pool", label: "Pool", icon: "🏊" },
  { key: "gym", label: "Gym", icon: "💪" },
  { key: "airConditioning", label: "A/C", icon: "❄️" },
  { key: "greenHomes", label: "Eco-Friendly", icon: "🌿" },
];

const TOTAL_STEPS = 7;

export default function PreferencesModal({
  visible,
  onComplete,
  onSkip,
}: PreferencesModalProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [listingType, setListingType] = useState<string>("Both");
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [minBedrooms, setMinBedrooms] = useState<number | null>(null);
  const [minBathrooms, setMinBathrooms] = useState<number | null>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [minPriceSale, setMinPriceSale] = useState<string>("");
  const [maxPriceSale, setMaxPriceSale] = useState<string>("");
  const [minPriceRent, setMinPriceRent] = useState<string>("");
  const [maxPriceRent, setMaxPriceRent] = useState<string>("");
  const [selectedAmenities, setSelectedAmenities] = useState<{
    garage: boolean;
    petFriendly: boolean;
    pool: boolean;
    gym: boolean;
    airConditioning: boolean;
    greenHomes: boolean;
  }>({
    garage: false,
    petFriendly: false,
    pool: false,
    gym: false,
    airConditioning: false,
    greenHomes: false,
  });

  const togglePropertyType = (type: string) => {
    setSelectedPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Determine price based on listing type
      let minPrice = null;
      let maxPrice = null;

      if (listingType === "Sale") {
        minPrice = minPriceSale ? parseFloat(minPriceSale) : null;
        maxPrice = maxPriceSale ? parseFloat(maxPriceSale) : null;
      } else if (listingType === "Rent") {
        minPrice = minPriceRent ? parseFloat(minPriceRent) : null;
        maxPrice = maxPriceRent ? parseFloat(maxPriceRent) : null;
      } else {
        // For "Both", use the larger range or sale prices as default
        minPrice = minPriceSale ? parseFloat(minPriceSale) : null;
        maxPrice = maxPriceSale ? parseFloat(maxPriceSale) : null;
      }

      await api.post("/api/auth/preferences", {
        preferredPropertyTypes: selectedPropertyTypes,
        minBedrooms,
        minBathrooms,
        preferredCities: selectedCities,
        listingType,
        minPrice,
        maxPrice,
        wantsGarage: selectedAmenities.garage,
        wantsPetFriendly: selectedAmenities.petFriendly,
        wantsPool: selectedAmenities.pool,
        wantsGym: selectedAmenities.gym,
        wantsAirConditioning: selectedAmenities.airConditioning,
        prefersGreenHomes: selectedAmenities.greenHomes,
      });
      onComplete();
    } catch (error) {
      console.error("Error saving preferences:", error);
      // Still complete even if save fails - user can set preferences later
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSave();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-center mb-4">
      {Array.from({ length: TOTAL_STEPS }).map((_, step) => (
        <View
          key={step}
          className={`h-1.5 rounded-full mx-0.5 ${
            step === currentStep ? "bg-primary-300 w-6" : step < currentStep ? "bg-primary-200 w-3" : "bg-gray-200 w-3"
          }`}
        />
      ))}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      // Step 0: Listing Type
      case 0:
        return (
          <View>
            <Text className="text-xl font-rubik-bold text-black-300 text-center mb-2">
              What are you looking for?
            </Text>
            <Text className="text-sm font-rubik text-gray-500 text-center mb-6">
              Tell us if you want to buy or rent
            </Text>
            <View className="flex-row justify-center">
              {LISTING_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setListingType(type.value)}
                  className={`flex-1 mx-2 py-5 rounded-2xl border-2 items-center ${
                    listingType === type.value
                      ? "bg-primary-300 border-primary-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text className="text-3xl mb-2">{type.icon}</Text>
                  <Text
                    className={`font-rubik-bold ${
                      listingType === type.value ? "text-white" : "text-black-300"
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // Step 1: Property Types
      case 1:
        return (
          <View>
            <Text className="text-xl font-rubik-bold text-black-300 text-center mb-2">
              Property Type
            </Text>
            <Text className="text-sm font-rubik text-gray-500 text-center mb-6">
              Select the types you're interested in
            </Text>
            <View className="flex-row flex-wrap justify-center">
              {PROPERTY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.label}
                  onPress={() => togglePropertyType(type.label)}
                  className={`w-[28%] m-[2%] p-4 rounded-2xl border-2 items-center ${
                    selectedPropertyTypes.includes(type.label)
                      ? "bg-primary-100 border-primary-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text className="text-3xl mb-2">{type.icon}</Text>
                  <Text
                    className={`font-rubik text-xs text-center ${
                      selectedPropertyTypes.includes(type.label)
                        ? "text-primary-300 font-rubik-bold"
                        : "text-black-300"
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // Step 2: Bedrooms & Bathrooms
      case 2:
        return (
          <View>
            <Text className="text-xl font-rubik-bold text-black-300 text-center mb-2">
              Rooms
            </Text>
            <Text className="text-sm font-rubik text-gray-500 text-center mb-6">
              How many bedrooms and bathrooms?
            </Text>

            {/* Bedrooms */}
            <View className="mb-6">
              <View className="flex-row items-center justify-center mb-3">
                <Text className="text-2xl mr-2">🛏️</Text>
                <Text className="text-base font-rubik-bold text-black-300">Bedrooms</Text>
              </View>
              <View className="flex-row justify-center">
                {ROOM_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={`bed-${option.value}`}
                    onPress={() =>
                      setMinBedrooms(minBedrooms === option.value ? null : option.value)
                    }
                    className={`w-14 h-14 mx-2 rounded-2xl border-2 items-center justify-center ${
                      minBedrooms === option.value
                        ? "bg-primary-300 border-primary-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-rubik-bold text-lg ${
                        minBedrooms === option.value ? "text-white" : "text-black-300"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bathrooms */}
            <View>
              <View className="flex-row items-center justify-center mb-3">
                <Text className="text-2xl mr-2">🚿</Text>
                <Text className="text-base font-rubik-bold text-black-300">Bathrooms</Text>
              </View>
              <View className="flex-row justify-center">
                {ROOM_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={`bath-${option.value}`}
                    onPress={() =>
                      setMinBathrooms(minBathrooms === option.value ? null : option.value)
                    }
                    className={`w-14 h-14 mx-2 rounded-2xl border-2 items-center justify-center ${
                      minBathrooms === option.value
                        ? "bg-primary-300 border-primary-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-rubik-bold text-lg ${
                        minBathrooms === option.value ? "text-white" : "text-black-300"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text className="text-xs font-rubik text-gray-400 text-center mt-4">
              Tap again to deselect
            </Text>
          </View>
        );

      // Step 3: Price Range
      case 3:
        return (
          <View>
            <Text className="text-xl font-rubik-bold text-black-300 text-center mb-2">
              Price Range
            </Text>
            <Text className="text-sm font-rubik text-gray-500 text-center mb-6">
              Set your budget {listingType === "Rent" ? "(monthly)" : ""}
            </Text>

            {/* Sale Prices */}
            {(listingType === "Sale" || listingType === "Both") && (
              <View className="mb-4">
                {listingType === "Both" && (
                  <Text className="text-sm font-rubik-bold text-black-300 mb-2 text-center">
                    🏷️ For Buying
                  </Text>
                )}
                <View className="flex-row">
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-rubik text-gray-500 mb-1">Min (€)</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 font-rubik text-black-300 text-center"
                      placeholder="0"
                      value={minPriceSale}
                      onChangeText={setMinPriceSale}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-xs font-rubik text-gray-500 mb-1">Max (€)</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 font-rubik text-black-300 text-center"
                      placeholder="No limit"
                      value={maxPriceSale}
                      onChangeText={setMaxPriceSale}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Rent Prices */}
            {(listingType === "Rent" || listingType === "Both") && (
              <View>
                {listingType === "Both" && (
                  <Text className="text-sm font-rubik-bold text-black-300 mb-2 text-center mt-2">
                    🔑 For Renting (monthly)
                  </Text>
                )}
                <View className="flex-row">
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-rubik text-gray-500 mb-1">Min (€/mo)</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 font-rubik text-black-300 text-center"
                      placeholder="0"
                      value={minPriceRent}
                      onChangeText={setMinPriceRent}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-xs font-rubik text-gray-500 mb-1">Max (€/mo)</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 font-rubik text-black-300 text-center"
                      placeholder="No limit"
                      value={maxPriceRent}
                      onChangeText={setMaxPriceRent}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        );

      // Step 4: Preferred Cities
      case 4:
        return (
          <View>
            <Text className="text-xl font-rubik-bold text-black-300 text-center mb-2">
              Preferred Cities
            </Text>
            <Text className="text-sm font-rubik text-gray-500 text-center mb-4">
              Where are you looking to live?
            </Text>
            <ScrollView
              style={{ maxHeight: 280 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <View className="flex-row flex-wrap justify-center">
                {ALBANIAN_CITIES.map((city) => (
                  <TouchableOpacity
                    key={city}
                    onPress={() => toggleCity(city)}
                    className={`px-3 py-2 rounded-full m-1 border-2 ${
                      selectedCities.includes(city)
                        ? "bg-primary-300 border-primary-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-rubik-medium text-sm ${
                        selectedCities.includes(city) ? "text-white" : "text-black-300"
                      }`}
                    >
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {selectedCities.length > 0 && (
              <Text className="text-xs font-rubik text-primary-300 text-center mt-2">
                {selectedCities.length} {selectedCities.length === 1 ? "city" : "cities"} selected
              </Text>
            )}
          </View>
        );

      // Step 5: Amenities
      case 5:
        return (
          <View>
            <Text className="text-xl font-rubik-bold text-black-300 text-center mb-2">
              Must-have Features
            </Text>
            <Text className="text-sm font-rubik text-gray-500 text-center mb-6">
              Select amenities that are important to you
            </Text>
            <View className="flex-row flex-wrap justify-center">
              {AMENITIES.map((amenity) => (
                <TouchableOpacity
                  key={amenity.key}
                  onPress={() => toggleAmenity(amenity.key)}
                  className={`w-[28%] m-[2%] p-4 rounded-2xl border-2 items-center ${
                    selectedAmenities[amenity.key as keyof typeof selectedAmenities]
                      ? "bg-primary-100 border-primary-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text className="text-3xl mb-2">{amenity.icon}</Text>
                  <Text
                    className={`font-rubik text-xs text-center ${
                      selectedAmenities[amenity.key as keyof typeof selectedAmenities]
                        ? "text-primary-300 font-rubik-bold"
                        : "text-black-300"
                    }`}
                  >
                    {amenity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // Step 6: Summary
      case 6:
        return (
          <View>
            <Text className="text-xl font-rubik-bold text-black-300 text-center mb-2">
              All Set!
            </Text>
            <Text className="text-sm font-rubik text-gray-500 text-center mb-6">
              Here's a summary of your preferences
            </Text>

            <View className="bg-gray-50 rounded-2xl p-4">
              {/* Listing Type */}
              <View className="flex-row items-center mb-3">
                <Text className="text-lg mr-2">
                  {listingType === "Sale" ? "🏷️" : listingType === "Rent" ? "🔑" : "✨"}
                </Text>
                <Text className="font-rubik-medium text-black-300">
                  Looking to {listingType === "Sale" ? "Buy" : listingType === "Rent" ? "Rent" : "Buy or Rent"}
                </Text>
              </View>

              {/* Property Types */}
              {selectedPropertyTypes.length > 0 && (
                <View className="flex-row items-center mb-3">
                  <Text className="text-lg mr-2">🏠</Text>
                  <Text className="font-rubik text-black-300 flex-1">
                    {selectedPropertyTypes.join(", ")}
                  </Text>
                </View>
              )}

              {/* Rooms */}
              {(minBedrooms || minBathrooms) && (
                <View className="flex-row items-center mb-3">
                  <Text className="text-lg mr-2">🛏️</Text>
                  <Text className="font-rubik text-black-300">
                    {minBedrooms ? `${minBedrooms}+ beds` : ""}
                    {minBedrooms && minBathrooms ? ", " : ""}
                    {minBathrooms ? `${minBathrooms}+ baths` : ""}
                  </Text>
                </View>
              )}

              {/* Price */}
              {(minPriceSale || maxPriceSale || minPriceRent || maxPriceRent) && (
                <View className="flex-row items-center mb-3">
                  <Text className="text-lg mr-2">💰</Text>
                  <Text className="font-rubik text-black-300">
                    {listingType === "Sale" || listingType === "Both"
                      ? `€${minPriceSale || "0"} - €${maxPriceSale || "∞"}`
                      : `€${minPriceRent || "0"} - €${maxPriceRent || "∞"}/mo`}
                  </Text>
                </View>
              )}

              {/* Cities */}
              {selectedCities.length > 0 && (
                <View className="flex-row items-center mb-3">
                  <Text className="text-lg mr-2">📍</Text>
                  <Text className="font-rubik text-black-300 flex-1">
                    {selectedCities.length <= 3
                      ? selectedCities.join(", ")
                      : `${selectedCities.slice(0, 3).join(", ")} +${selectedCities.length - 3} more`}
                  </Text>
                </View>
              )}

              {/* Amenities */}
              {Object.values(selectedAmenities).some(Boolean) && (
                <View className="flex-row items-center">
                  <Text className="text-lg mr-2">✨</Text>
                  <Text className="font-rubik text-black-300 flex-1">
                    {AMENITIES.filter(
                      (a) => selectedAmenities[a.key as keyof typeof selectedAmenities]
                    )
                      .map((a) => a.label)
                      .join(", ")}
                  </Text>
                </View>
              )}

              {/* No preferences set */}
              {selectedPropertyTypes.length === 0 &&
                !minBedrooms &&
                !minBathrooms &&
                !minPriceSale &&
                !maxPriceSale &&
                !minPriceRent &&
                !maxPriceRent &&
                selectedCities.length === 0 &&
                !Object.values(selectedAmenities).some(Boolean) && (
                  <Text className="font-rubik text-gray-400 text-center">
                    No specific preferences set - we'll show you everything!
                  </Text>
                )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onSkip}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: "90%" }}>
          {/* Header */}
          <View className="px-6 pt-6 pb-2">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">🎯</Text>
                <Text className="text-lg font-rubik-bold text-black-300">
                  Personalize Your Feed
                </Text>
              </View>
              <TouchableOpacity onPress={onSkip}>
                <Text className="text-gray-400 font-rubik-medium">Skip</Text>
              </TouchableOpacity>
            </View>
            {renderStepIndicator()}
          </View>

          {/* Content */}
          <ScrollView
            className="px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {renderStep()}
          </ScrollView>

          {/* Footer Buttons */}
          <View className="px-6 pb-8 pt-4 border-t border-gray-100">
            <View className="flex-row">
              {currentStep > 0 && (
                <TouchableOpacity
                  onPress={prevStep}
                  className="flex-1 mr-2 py-4 rounded-2xl bg-gray-100"
                >
                  <Text className="text-center font-rubik-bold text-gray-600">
                    Back
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={nextStep}
                disabled={saving}
                className={`flex-1 ${currentStep > 0 ? "ml-2" : ""} py-4 rounded-2xl bg-primary-300`}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center font-rubik-bold text-white">
                    {currentStep === TOTAL_STEPS - 1 ? "Finish" : "Next"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
