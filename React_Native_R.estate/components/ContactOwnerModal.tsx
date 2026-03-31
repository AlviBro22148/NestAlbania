// components/ContactOwnerModal.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

interface ContactOwnerModalProps {
  visible: boolean;
  ownerName: string;
  ownerPhone: string | null;
  ownerEmail: string | null;
  onClose: () => void;
}

export default function ContactOwnerModal({
  visible,
  ownerName,
  ownerPhone,
  ownerEmail,
  onClose,
}: ContactOwnerModalProps) {
  const { t } = useTranslation();

  const handlePhonePress = async () => {
    if (!ownerPhone) {
      Alert.alert(t("common.error"), t("properties.noPhoneAvailable"));
      return;
    }

    try {
      const phoneUrl = `tel:${ownerPhone}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (canOpen) {
        await Linking.openURL(phoneUrl);
        onClose();
      } else {
        Alert.alert(t("common.error"), t("properties.cannotOpenPhone"));
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("properties.cannotOpenPhone"));
    }
  };

  const handleEmailPress = async () => {
    if (!ownerEmail) {
      Alert.alert(t("common.error"), t("properties.noEmailAvailable"));
      return;
    }

    try {
      const emailUrl = `mailto:${ownerEmail}`;
      const canOpen = await Linking.canOpenURL(emailUrl);

      if (canOpen) {
        await Linking.openURL(emailUrl);
        onClose();
      } else {
        Alert.alert(t("common.error"), t("properties.cannotOpenEmail"));
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("properties.cannotOpenEmail"));
    }
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
        <View className="bg-white rounded-t-3xl p-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-rubik-bold text-black-300">
                📞 {t("properties.contactOwner")}
              </Text>
              <Text className="text-sm font-rubik text-gray-500 mt-1">
                {ownerName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-400 text-3xl">×</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Options */}
          {ownerPhone && (
            <TouchableOpacity
              onPress={handlePhonePress}
              className="flex-row items-center justify-between p-4 rounded-xl mb-3 bg-green-50 border border-green-200"
            >
              <View className="flex-row items-center">
                <View className="bg-green-500 rounded-full w-12 h-12 items-center justify-center mr-4">
                  <Text className="text-2xl">📱</Text>
                </View>
                <View>
                  <Text className="text-lg font-rubik-bold text-black-300">
                    {t("properties.callOwner")}
                  </Text>
                  <Text className="text-sm font-rubik text-gray-600">
                    {ownerPhone}
                  </Text>
                </View>
              </View>
              <Text className="text-green-500 text-xl">→</Text>
            </TouchableOpacity>
          )}

          {ownerEmail && (
            <TouchableOpacity
              onPress={handleEmailPress}
              className="flex-row items-center justify-between p-4 rounded-xl mb-3 bg-blue-50 border border-blue-200"
            >
              <View className="flex-row items-center">
                <View className="bg-blue-500 rounded-full w-12 h-12 items-center justify-center mr-4">
                  <Text className="text-2xl">✉️</Text>
                </View>
                <View>
                  <Text className="text-lg font-rubik-bold text-black-300">
                    {t("properties.emailOwner")}
                  </Text>
                  <Text className="text-sm font-rubik text-gray-600">
                    {ownerEmail}
                  </Text>
                </View>
              </View>
              <Text className="text-blue-500 text-xl">→</Text>
            </TouchableOpacity>
          )}

          {/* If no contact info available */}
          {!ownerPhone && !ownerEmail && (
            <View className="bg-gray-100 p-4 rounded-xl mb-3">
              <Text className="text-center text-gray-600 font-rubik">
                {t("properties.noContactInfo")}
              </Text>
            </View>
          )}

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
