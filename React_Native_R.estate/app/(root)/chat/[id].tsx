import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useChat, ChatMessage, ChatConversation } from "@/contexts/ChatContext";
import icons from "@/constants/icons";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useAlert();
  const { fetchConversation, getMessages, sendMessage, markAsRead } = useChat();

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const handleBack = useBackNavigation("/(root)/(tabs)/chats");

  // Load conversation and messages
  const loadData = useCallback(async () => {
    if (!id) return;
    const conversationId = parseInt(id, 10);

    try {
      setLoading(true);
      // Fetch conversation directly from API
      const conv = await fetchConversation(conversationId);
      setConversation(conv);

      if (conv) {
        const msgs = await getMessages(conversationId);
        const sortedMsgs = [...msgs].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMsgs);
        await markAsRead(conversationId);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Poll for new messages every 10 seconds
  useEffect(() => {
    if (!id) return;
    const conversationId = parseInt(id, 10);

    const interval = setInterval(async () => {
      const msgs = await getMessages(conversationId);
      const sortedMsgs = [...msgs].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMsgs);
      await markAsRead(conversationId);
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  // Handle send message
  const handleSend = async () => {
    if (!messageText.trim() || sending || !id) return;
    const conversationId = parseInt(id, 10);

    const text = messageText.trim();
    setMessageText("");

    try {
      setSending(true);

      // Optimistic update
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversationId: conversationId,
        senderId: user?.id || "",
        senderName: user?.username || "",
        content: text,
        isRead: true,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Send to API
      await sendMessage(conversationId, text);

      // Refresh messages
      const msgs = await getMessages(conversationId);
      const sortedMsgs = [...msgs].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMsgs);
    } catch (error) {
      showToast(t("chat.sendError"), "error");
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !(typeof m.id === 'string' && m.id.startsWith("temp-"))));
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t("chat.today");
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t("chat.yesterday");
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { date: string; messages: ChatMessage[] }[], message) => {
    const date = new Date(message.createdAt).toDateString();
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ date, messages: [message] });
    }

    return groups;
  }, []);

  const renderMessage = ({ item: message }: { item: ChatMessage }) => {
    const isOwnMessage = message.senderId === user?.id;

    return (
      <View
        className={`flex-row mb-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
      >
        <View
          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
            isOwnMessage
              ? "bg-primary-300 rounded-br-md"
              : "bg-white border border-gray-200 rounded-bl-md"
          }`}
        >
          <Text
            className={`text-base font-rubik ${
              isOwnMessage ? "text-white" : "text-gray-900"
            }`}
          >
            {message.content}
          </Text>
          <View className="flex-row items-center justify-end mt-1">
            <Text
              className={`text-xs ${
                isOwnMessage ? "text-white/70" : "text-gray-400"
              }`}
            >
              {formatTime(message.createdAt)}
            </Text>
            {isOwnMessage && (
              <Ionicons
                name={message.isRead ? "checkmark-done" : "checkmark"}
                size={14}
                color={message.isRead ? "#A7F3D0" : "rgba(255,255,255,0.7)"}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderDateSeparator = (date: string) => (
    <View className="flex-row items-center justify-center my-4">
      <View className="flex-1 h-px bg-gray-200" />
      <View className="bg-gray-100 px-4 py-1 rounded-full mx-4">
        <Text className="text-xs font-rubik-medium text-gray-500">
          {formatDate(date)}
        </Text>
      </View>
      <View className="flex-1 h-px bg-gray-200" />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-rubik-bold text-gray-900 mt-4">
          {t("chat.conversationNotFound")}
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          className="mt-6 bg-primary-300 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-rubik-bold">{t("common.back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Determine who the "other party" is based on THIS conversation, not global role
  // If current user is the conversation's userId, show the agent's info
  // If current user is the conversation's agentId, show the user's info
  const currentUserId = user?.id?.toString().toLowerCase();
  const isUserInConversation = conversation.userId?.toString().toLowerCase() === currentUserId;
  const otherPartyName = isUserInConversation ? conversation.agentName : conversation.userName;
  const otherPartyPicture = isUserInConversation
    ? conversation.agentProfilePicture
    : conversation.userProfilePicture;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200 shadow-sm">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleBack} className="mr-3">
              <Image source={icons.backArrow} className="w-6 h-6" />
            </TouchableOpacity>

            {/* Other Party Info */}
            <TouchableOpacity className="flex-row items-center flex-1">
              {otherPartyPicture ? (
                <Image
                  source={{ uri: otherPartyPicture }}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                  <Ionicons name="person" size={20} color="#9CA3AF" />
                </View>
              )}
              <View className="ml-3 flex-1">
                <Text className="text-base font-rubik-bold text-gray-900">
                  {otherPartyName}
                </Text>
                <Text className="text-xs text-gray-500 font-rubik">
                  {isUserInConversation ? t("chat.agent") : t("chat.user")}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Property Quick View */}
            <TouchableOpacity
              onPress={() => router.push(`/(root)/properties/${conversation.propertyId}`)}
              className="bg-gray-100 p-2 rounded-full"
            >
              <Ionicons name="home-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Property Banner */}
          <TouchableOpacity
            onPress={() => router.push(`/(root)/properties/${conversation.propertyId}`)}
            className="flex-row items-center bg-gray-50 rounded-xl p-3 mt-3"
          >
            {conversation.propertyImage && (
              <Image
                source={{ uri: conversation.propertyImage }}
                className="w-12 h-12 rounded-lg mr-3"
              />
            )}
            <View className="flex-1">
              <Text className="text-sm font-rubik-medium text-gray-900" numberOfLines={1}>
                {conversation.propertyTitle}
              </Text>
              <Text className="text-sm font-rubik-bold text-primary-300">
                {formatPrice(conversation.propertyPrice)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={groupedMessages.flatMap(group => [
            { type: "date", date: group.date, id: `date-${group.date}` },
            ...group.messages.map(m => ({ type: "message", ...m })),
          ])}
          renderItem={({ item }) => {
            if (item.type === "date") {
              return renderDateSeparator((item as any).date);
            }
            return renderMessage({ item: item as ChatMessage });
          }}
          keyExtractor={(item) => (item as any).id.toString()}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 font-rubik mt-4 text-center">
                {t("chat.startConversation")}
              </Text>
            </View>
          }
        />

        {/* Message Input */}
        <View className="bg-white border-t border-gray-200 px-4 py-3 pb-6">
          <View className="flex-row items-end">
            <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 mr-3 min-h-[48px] max-h-32">
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder={t("chat.typeMessage")}
                placeholderTextColor="#9CA3AF"
                className="text-base font-rubik text-gray-900 max-h-24"
                multiline
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!messageText.trim() || sending}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                messageText.trim() && !sending ? "bg-primary-300" : "bg-gray-200"
              }`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={messageText.trim() ? "#FFFFFF" : "#9CA3AF"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
