import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useCallback } from "react";
import { Text, TouchableOpacity, View, Animated } from "react-native";

interface ChatFloatingButtonProps {
  bottomOffset?: number;
}

const ChatFloatingButton: React.FC<ChatFloatingButtonProps> = ({
  bottomOffset = 24,
}) => {
  const { user } = useAuth();
  const { conversations, totalUnreadCount, refreshConversations } = useChat();
  const { comparisonList } = useComparison();

  // Agents/Admins manage chats through the Chats tab, not the floating button

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // All hooks must be called before any conditional returns
  const handlePress = useCallback(() => {
    router.push("/(root)/(tabs)/chats");
  }, []);

  // Pulse animation when there are unread messages
  useEffect(() => {
    if (totalUnreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [totalUnreadCount]);

  // Refresh on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        await refreshConversations();
      } catch (error) {
        // Silently handle error - no chats is a valid state
        console.log("No conversations or error loading:", error);
      }
    };
    loadConversations();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 24,
        transform: [{ scale: pulseAnim }],
        zIndex: 50,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={{
          backgroundColor: "#10B981",
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#10B981",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="chatbubbles" size={26} color="#FFFFFF" />

        {/* Unread Badge */}
        {totalUnreadCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              backgroundColor: "#EF4444",
              borderRadius: 12,
              minWidth: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 6,
              borderWidth: 2,
              borderColor: "#FFFFFF",
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "bold" }}
            >
              {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ChatFloatingButton;
