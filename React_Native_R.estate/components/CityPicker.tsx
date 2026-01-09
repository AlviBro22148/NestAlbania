import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CityPickerProps {
  visible: boolean;
  selectedCity: string;
  onClose: () => void;
  onSelectCity: (city: string) => void;
}

// Albanian cities list
const ALBANIAN_CITIES = [
  "Tirana",
  "Durrës",
  "Vlorë",
  "Elbasan",
  "Shkodër",
  "Fier",
  "Korçë",
  "Berat",
  "Lezhë",
  "Gjirokastër",
  "Kukës",
  "Peshkopi",
  "Sarandë",
  "Lushnjë",
  "Pogradec",
  "Kavajë",
  "Krujë",
  "Laç",
  "Kuçovë",
  "Burrel",
  "Patos",
  "Librazhd",
  "Shijak",
  "Kamëz",
  "Tepelenë",
];

export { ALBANIAN_CITIES };

export default function CityPicker({
  visible,
  selectedCity,
  onClose,
  onSelectCity,
}: CityPickerProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCities = ALBANIAN_CITIES.filter((city) =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCity = (city: string) => {
    onSelectCity(city);
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: "70%" }}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-rubik-bold text-black-300">
              {t("cities.selectCity")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-400 text-3xl">×</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="mb-4">
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 font-rubik-regular"
              placeholder={t("cities.searchCity")}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
            />
          </View>

          {/* City List */}
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: city }) => (
              <TouchableOpacity
                onPress={() => handleSelectCity(city)}
                className={`flex-row items-center justify-between p-4 rounded-xl mb-2 ${
                  selectedCity === city
                    ? "bg-primary-300"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <Text
                  className={`text-lg font-rubik-medium ${
                    selectedCity === city ? "text-white" : "text-black-300"
                  }`}
                >
                  {city}
                </Text>

                {selectedCity === city && (
                  <View className="bg-white rounded-full p-1">
                    <Text className="text-primary-300 text-lg">✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text className="text-center text-gray-500 font-rubik-regular py-4">
                {t("cities.noResults")}
              </Text>
            }
          />

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-200 py-4 rounded-xl mt-4"
          >
            <Text className="text-center font-rubik-bold text-black-300">
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
