import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemePreference } from "@/lib/storage";

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function ThemeSelector({ visible, onClose }: ThemeSelectorProps) {
  const { t } = useTranslation();
  const { themePreference, setThemePreference, colors } = useTheme();

  const themes: { key: ThemePreference; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: "light", icon: "sunny", label: t("theme.light") || "Light" },
    { key: "dark", icon: "moon", label: t("theme.dark") || "Dark" },
    { key: "system", icon: "phone-portrait", label: t("theme.system") || "System" },
  ];

  const handleSelect = (theme: ThemePreference) => {
    setThemePreference(theme);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View
          className="rounded-t-3xl p-6 max-h-96"
          style={{ backgroundColor: colors.surface }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text
              className="text-2xl font-rubik-bold"
              style={{ color: colors.text }}
            >
              {t("theme.selectTheme") || "Select Theme"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.textMuted }} className="text-3xl">
                ×
              </Text>
            </TouchableOpacity>
          </View>

          {/* Theme Options */}
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.key}
              onPress={() => handleSelect(theme.key)}
              className="flex-row items-center justify-between p-4 rounded-xl mb-3"
              style={{
                backgroundColor:
                  themePreference === theme.key
                    ? colors.primary
                    : colors.surfaceElevated,
                borderWidth: themePreference === theme.key ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{
                    backgroundColor:
                      themePreference === theme.key
                        ? "rgba(255,255,255,0.2)"
                        : colors.primaryLight,
                  }}
                >
                  <Ionicons
                    name={theme.icon}
                    size={24}
                    color={
                      themePreference === theme.key
                        ? "#FFFFFF"
                        : colors.primary
                    }
                  />
                </View>
                <Text
                  className="text-lg font-rubik-bold"
                  style={{
                    color:
                      themePreference === theme.key
                        ? "#FFFFFF"
                        : colors.text,
                  }}
                >
                  {theme.label}
                </Text>
              </View>

              {themePreference === theme.key && (
                <View className="bg-white rounded-full p-1">
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={onClose}
            className="py-4 rounded-xl mt-2"
            style={{ backgroundColor: colors.surfaceElevated }}
          >
            <Text
              className="text-center font-rubik-bold"
              style={{ color: colors.text }}
            >
              {t("common.cancel") || "Cancel"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
