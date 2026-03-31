import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, TouchableOpacity, View } from "react-native";
interface LanguageSelectorProps {
  visible: boolean;
  currentLanguage: string;
  onClose: () => void;
  onSelectLanguage: (lang: string) => void;
}

export default function LanguageSelector({
  visible,
  currentLanguage,
  onClose,
  onSelectLanguage,
}: LanguageSelectorProps) {
  const { t } = useTranslation();

  const languages = [
    { code: "en", name: t("languages.english"), flag: "🇺🇸", nativeName: "English" },
    { code: "sq", name: t("languages.albanian"), flag: "🇦🇱", nativeName: "Shqip" },
  ];
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 max-h-96">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-rubik-bold text-black-300">
              🌍 {t("common.ChooseLanguage")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-400 text-3xl">×</Text>
            </TouchableOpacity>
          </View>

          {/* Language Options */}
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              onPress={() => {
                onSelectLanguage(language.code);
                onClose();
              }}
              className={`flex-row items-center justify-between p-4 rounded-xl mb-3 ${
                currentLanguage === language.code
                  ? "bg-primary-300"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <View className="flex-row items-center">
                <Text className="text-4xl mr-4">{language.flag}</Text>
                <View>
                  <Text
                    className={`text-lg font-rubik-bold ${
                      currentLanguage === language.code
                        ? "text-white"
                        : "text-black-300"
                    }`}
                  >
                    {language.name}
                  </Text>
                  <Text
                    className={`text-sm font-rubik ${
                      currentLanguage === language.code
                        ? "text-white/80"
                        : "text-gray-500"
                    }`}
                  >
                    {language.nativeName}
                  </Text>
                </View>
              </View>

              {currentLanguage === language.code && (
                <View className="bg-white rounded-full p-1">
                  <Text className="text-primary-300 text-lg">✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-200 py-4 rounded-xl mt-2"
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
