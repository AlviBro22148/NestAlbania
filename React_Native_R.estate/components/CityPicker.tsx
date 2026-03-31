import React, { useState, useCallback, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

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

const CityPicker = memo(function CityPicker({
  visible,
  selectedCity,
  onClose,
  onSelectCity,
}: CityPickerProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  // Memoize filtered cities
  const filteredCities = useMemo(() =>
    ALBANIAN_CITIES.filter((city) =>
      city.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery]
  );

  // Memoized handler
  const handleSelectCity = useCallback((city: string) => {
    onSelectCity(city);
    setSearchQuery("");
    onClose();
  }, [onSelectCity, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        style={styles.keyboardView}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t("cities.selectCity")}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.closeButton, { color: colors.textMuted }]}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.background : "#FFFFFF",
                    color: colors.text,
                  },
                ]}
                placeholder={t("cities.searchCity")}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="words"
              />
            </View>

            {/* City List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollView}
              keyboardShouldPersistTaps="handled"
            >
              {filteredCities.length === 0 ? (
                <Text style={[styles.noResults, { color: colors.textMuted }]}>
                  {t("cities.noResults")}
                </Text>
              ) : (
                filteredCities.map((city) => {
                  const isSelected = selectedCity === city;
                  return (
                    <TouchableOpacity
                      key={city}
                      onPress={() => handleSelectCity(city)}
                      style={[
                        styles.cityItem,
                        isSelected
                          ? { backgroundColor: colors.primary }
                          : {
                              backgroundColor: isDark ? colors.background : "#F9FAFB",
                              borderWidth: 1,
                              borderColor: colors.border,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cityText,
                          { color: isSelected ? "#FFFFFF" : colors.text },
                        ]}
                      >
                        {city}
                      </Text>

                      {isSelected && (
                        <View style={styles.checkContainer}>
                          <Text style={[styles.checkText, { color: colors.primary }]}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.cancelButton,
                { backgroundColor: isDark ? colors.border : "#E5E7EB" },
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: "Rubik-Bold",
  },
  closeButton: {
    fontSize: 30,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Rubik-Regular",
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  noResults: {
    textAlign: "center",
    fontFamily: "Rubik-Regular",
    paddingVertical: 16,
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  cityText: {
    fontSize: 18,
    fontFamily: "Rubik-Medium",
  },
  checkContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    padding: 4,
  },
  checkText: {
    fontSize: 18,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  cancelText: {
    textAlign: "center",
    fontFamily: "Rubik-Bold",
  },
});

export default CityPicker;
