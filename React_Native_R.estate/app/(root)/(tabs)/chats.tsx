import { useAuth } from "@/contexts/AuthContext";
import { useChat, ChatConversation } from "@/contexts/ChatContext";
import icons from "@/constants/icons";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    conversations,
    loading,
    totalUnreadCount,
    refreshConversations,
    deleteConversation,
  } = useChat();
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAgent = user?.role === "Agent" || user?.role === "Admin";

  useEffect(() => {
    refreshConversations().catch(console.log);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshConversations();
    } catch (error) {
      console.log("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleConversationPress = (conversationId: number) => {
    router.push(`/(root)/chat/${conversationId}`);
  };

  const handleLongPress = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setDeleteModalVisible(true);
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    setDeleting(true);
    try {
      await deleteConversation(selectedConversation.id);
      setDeleteModalVisible(false);
      setSelectedConversation(null);
    } catch (error) {
      console.error("Error deleting conversation:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ color: "#6B7280", marginTop: 16, fontSize: 16 }}>
            {t("common.loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View style={{
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 24,
        paddingVertical: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{
            backgroundColor: "white",
            borderRadius: 999,
            padding: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <Ionicons name="chatbubbles" size={28} color="#10B981" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827" }}>
              {t("chat.title")}
            </Text>
            <View style={{
              backgroundColor: "#A7F3D0",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 999,
              alignSelf: "flex-start",
              marginTop: 4,
            }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#065F46" }}>
                {conversations.length} {conversations.length === 1 ? t("chat.conversation") : t("chat.conversations")}
              </Text>
            </View>
          </View>
          {totalUnreadCount > 0 && (
            <View style={{
              backgroundColor: "#EF4444",
              borderRadius: 999,
              minWidth: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 8,
            }}>
              <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                {totalUnreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {conversations.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <View style={{
              backgroundColor: "#ECFDF5",
              borderRadius: 999,
              padding: 24,
              marginBottom: 16
            }}>
              <Ionicons name="chatbubbles-outline" size={64} color="#10B981" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 }}>
              {t("chat.noConversations")}
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center", paddingHorizontal: 32 }}>
              {isAgent ? t("chat.noConversationsAgentDesc") : t("chat.noConversationsUserDesc")}
            </Text>
            {!isAgent && (
              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/explore")}
                style={{
                  backgroundColor: "#0061FF",
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                  marginTop: 24,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  {t("chat.browseProperties")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          conversations.map((conversation) => {
            // Determine who the "other party" is based on THIS conversation, not global role
            // If current user is the conversation's userId, show the agent's info
            // If current user is the conversation's agentId, show the user's info
            const currentUserId = user?.id?.toString().toLowerCase();
            const isUserInConversation = conversation.userId?.toString().toLowerCase() === currentUserId;
            const otherPartyName = isUserInConversation ? conversation.agentName : conversation.userName;
            const otherPartyPicture = isUserInConversation ? conversation.agentProfilePicture : conversation.userProfilePicture;

            return (
              <TouchableOpacity
                key={conversation.id}
                onPress={() => handleConversationPress(conversation.id)}
                onLongPress={() => handleLongPress(conversation)}
                delayLongPress={500}
                style={{
                  backgroundColor: conversation.unreadCount > 0 ? "#F0FDF4" : "white",
                  borderRadius: 16,
                  marginBottom: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: conversation.unreadCount > 0 ? "#BBF7D0" : "#E5E7EB",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: "row" }}>
                  {/* Avatar */}
                  <View style={{ position: "relative" }}>
                    {otherPartyPicture ? (
                      <Image
                        source={{ uri: otherPartyPicture }}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                      />
                    ) : (
                      <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: "#E5E7EB",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Ionicons name="person" size={24} color="#9CA3AF" />
                      </View>
                    )}
                    {conversation.unreadCount > 0 && (
                      <View style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        backgroundColor: "#10B981",
                        borderRadius: 999,
                        minWidth: 20,
                        height: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 4,
                      }}>
                        <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>
                          {conversation.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }} numberOfLines={1}>
                        {otherPartyName}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
                        {getTimeAgo(conversation.lastMessageAt)}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 14,
                        color: conversation.unreadCount > 0 ? "#111827" : "#6B7280",
                        fontWeight: conversation.unreadCount > 0 ? "500" : "400",
                        marginBottom: 8,
                      }}
                      numberOfLines={1}
                    >
                      {conversation.lastMessage || t("chat.noMessages")}
                    </Text>

                    {/* Property Info */}
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#F3F4F6",
                      borderRadius: 8,
                      padding: 8,
                    }}>
                      {conversation.propertyImage && (
                        <Image
                          source={{ uri: conversation.propertyImage }}
                          style={{ width: 40, height: 40, borderRadius: 6, marginRight: 8 }}
                        />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "500", color: "#374151" }} numberOfLines={1}>
                          {conversation.propertyTitle}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#0061FF" }}>
                          {formatPrice(conversation.propertyPrice)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setDeleteModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 24,
              width: "85%",
              maxWidth: 340,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 10,
            }}
            onPress={() => {}}
          >
            {/* Modal Header */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View style={{
                backgroundColor: "#FEE2E2",
                borderRadius: 999,
                padding: 16,
                marginBottom: 12,
              }}>
                <Ionicons name="trash-outline" size={32} color="#DC2626" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 }}>
                {t("chat.deleteConversation")}
              </Text>
              <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}>
                {t("chat.deleteConfirmPermanent")}
              </Text>
            </View>

            {/* Selected Conversation Preview */}
            {selectedConversation && (
              <View style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 12,
                padding: 12,
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
              }}>
                {selectedConversation.propertyImage && (
                  <Image
                    source={{ uri: selectedConversation.propertyImage }}
                    style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12 }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }} numberOfLines={1}>
                    {selectedConversation.propertyTitle}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6B7280" }} numberOfLines={1}>
                    {formatPrice(selectedConversation.propertyPrice)}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                disabled={deleting}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteConversation}
                style={{
                  flex: 1,
                  backgroundColor: "#DC2626",
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  opacity: deleting ? 0.7 : 1,
                }}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                    {t("common.delete")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
