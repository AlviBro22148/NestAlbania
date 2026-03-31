import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  buttons?: AlertButton[];
  onClose: () => void;
}

const { width } = Dimensions.get("window");

export default function CustomAlert({
  visible,
  title,
  message,
  type,
  buttons = [{ text: "OK", style: "default" }],
  onClose,
}: CustomAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle" as const,
          color: "#10B981",
          gradient: ["#10B981", "#059669"],
        };
      case "error":
        return {
          icon: "close-circle" as const,
          color: "#EF4444",
          gradient: ["#EF4444", "#DC2626"],
        };
      case "warning":
        return {
          icon: "warning" as const,
          color: "#F59E0B",
          gradient: ["#F59E0B", "#D97706"],
        };
      case "info":
        return {
          icon: "information-circle" as const,
          color: "#3B82F6",
          gradient: ["#3B82F6", "#2563EB"],
        };
    }
  };

  const config = getTypeConfig();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.backdropBlur} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [
                { scale: scaleAnim },
                {
                  translateY: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Icon Header */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: config.color + "15" },
            ]}
          >
            <View
              style={[styles.iconCircle, { backgroundColor: config.color }]}
            >
              <Ionicons name={config.icon} size={40} color="white" />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isLast = index === buttons.length - 1;
              const isCancel = button.style === "cancel";
              const isDestructive = button.style === "destructive";

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleButtonPress(button)}
                  style={[
                    styles.button,
                    isLast && styles.buttonLast,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    !isCancel &&
                      !isDestructive && {
                        backgroundColor: config.color,
                      },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  alertContainer: {
    width: width * 0.85,
    backgroundColor: "white",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0061FF",
  },
  buttonLast: {
    borderLeftWidth: 1,
    borderLeftColor: "#F3F4F6",
  },
  buttonCancel: {
    backgroundColor: "#F3F4F6",
  },
  buttonDestructive: {
    backgroundColor: "#FEE2E2",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  buttonTextCancel: {
    color: "#6B7280",
  },
  buttonTextDestructive: {
    color: "#DC2626",
  },
});
