import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const BannedScreen = () => {
  const { t } = useTranslation();
  const { banReason, clearBanStatus } = useAuth();

  const handleGoToLogin = () => {
    clearBanStatus();
    router.replace("/auth/sign-in");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Ban Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="ban" size={80} color="#EF4444" />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {t("banned.title", "Llogaria e Bllokuar")}
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          {t(
            "banned.message",
            "Llogaria juaj eshte bllokuar dhe nuk mund te aksesoni aplikacionin."
          )}
        </Text>

        {/* Ban Reason */}
        {banReason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>
              {t("banned.reason", "Arsyeja:")}
            </Text>
            <Text style={styles.reasonText}>{banReason}</Text>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.contactContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#6B7280"
            style={styles.contactIcon}
          />
          <Text style={styles.contactText}>
            {t(
              "banned.contact",
              "Nese mendoni qe eshte gabim, kontaktoni support@restate.al"
            )}
          </Text>
        </View>

        {/* Back to Login Button */}
        <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
          <Ionicons
            name="arrow-back"
            size={20}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>
            {t("banned.backToLogin", "Kthehu ne Login")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEF2F2",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#DC2626",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  reasonContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 32,
  },
  contactIcon: {
    marginRight: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default BannedScreen;
