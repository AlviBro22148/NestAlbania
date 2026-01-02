import React, { useEffect, useRef } from "react";
import {
  Animated,
  Text,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastNotificationProps {
  message: string;
  type: ToastType;
  onHide?: () => void;
}

const { width } = Dimensions.get("window");

export default function ToastNotification({
  message,
  type,
  onHide,
}: ToastNotificationProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      // Slide out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };
  }, []);

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle" as const,
          color: "#10B981",
          backgroundColor: "#D1FAE5",
          borderColor: "#10B981",
        };
      case "error":
        return {
          icon: "close-circle" as const,
          color: "#EF4444",
          backgroundColor: "#FEE2E2",
          borderColor: "#EF4444",
        };
      case "warning":
        return {
          icon: "warning" as const,
          color: "#F59E0B",
          backgroundColor: "#FEF3C7",
          borderColor: "#F59E0B",
        };
      case "info":
        return {
          icon: "information-circle" as const,
          color: "#3B82F6",
          backgroundColor: "#DBEAFE",
          borderColor: "#3B82F6",
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY }],
          opacity,
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={20} color="white" />
        </View>
        <Text style={[styles.message, { color: config.color }]} numberOfLines={2}>
          {message}
        </Text>
      </View>

      {onHide && (
        <TouchableOpacity onPress={onHide} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={config.color} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
