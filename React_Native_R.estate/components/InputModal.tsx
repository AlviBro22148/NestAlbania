import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { colors, isDark } = useTheme();

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
                {title}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.closeButton, { color: colors.textMuted }]}>×</Text>
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
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.background : "#F9FAFB",
                  borderColor: colors.border,
                  color: colors.text,
                },
                multiline && styles.inputMultiline,
              ]}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={secureTextEntry}
            />

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.button, { backgroundColor: isDark ? colors.border : "#E5E7EB" }]}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSave}
                style={[styles.button, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
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
    maxHeight: 384,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Rubik-Bold",
  },
  closeButton: {
    fontSize: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Rubik-Regular",
    fontSize: 16,
    marginBottom: 16,
  },
  inputMultiline: {
    paddingVertical: 12,
    minHeight: 128,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    textAlign: "center",
    fontFamily: "Rubik-Bold",
  },
});
