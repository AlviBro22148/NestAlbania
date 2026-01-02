import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface InputModalProps {
  visible: boolean;
  title: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
}

export default function InputModal({
  visible,
  title,
  placeholder,
  value,
  onChangeText,
  onClose,
  onSave,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
}: InputModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-96">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-rubik-bold text-black-300">
                {title}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-gray-400 text-2xl">×</Text>
              </TouchableOpacity>
            </View>

            {/* Input */}
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              keyboardType={keyboardType}
              multiline={multiline}
              numberOfLines={numberOfLines}
              textAlignVertical={multiline ? "top" : "center"}
              autoFocus
              className={`bg-gray-50 border border-gray-200 rounded-xl px-4 font-rubik text-base mb-4 ${
                multiline ? "py-3 min-h-32" : "py-3.5"
              }`}
              placeholderTextColor="#9CA3AF"
              secureTextEntry={secureTextEntry}
            />

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 bg-gray-200 py-4 rounded-xl"
              >
                <Text className="text-center font-rubik-bold text-black-300">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSave}
                className="flex-1 bg-primary-300 py-4 rounded-xl"
              >
                <Text className="text-center font-rubik-bold text-white">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
