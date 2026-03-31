import { useChat } from "@/contexts/ChatContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { memo } from "react";
import { Text, Pressable, View, StyleSheet } from "react-native";

interface ChatFloatingButtonProps {
  bottomOffset?: number;
}

const ChatFloatingButton = memo(function ChatFloatingButton({
  bottomOffset = 24,
}: ChatFloatingButtonProps) {
  const { totalUnreadCount } = useChat();
  const { comparisonList } = useComparison();

  // Hide when property comparison is active
  if (comparisonList.length > 0) return null;

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <Pressable
        onPress={() => router.push("/(root)/chats" as any)}
        style={styles.button}
      >
        <Ionicons name="chatbubbles" size={26} color="#FFFFFF" />
        {totalUnreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 24,
    zIndex: 50,
  },
  button: {
    backgroundColor: "#10B981",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
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
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default ChatFloatingButton;
