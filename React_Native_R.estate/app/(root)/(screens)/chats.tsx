import { useAuth } from "@/contexts/AuthContext";
import { useChat, ChatConversation } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import icons from "@/constants/icons";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/explore");
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAgent = user?.role === "Agent" || user?.role === "Admin";
  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  useEffect(() => {
    refreshConversations().catch(() => {});
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshConversations();
    } catch (error) {
      // Silent fail
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }, cardShadow]}>
        <View style={styles.headerContent}>
          <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="chatbubbles" size={24} color={colors.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("chat.title")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {conversations.length} {conversations.length === 1 ? t("chat.conversation") : t("chat.conversations")}
            </Text>
          </View>
          {totalUnreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {totalUnreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {conversations.length === 0 ? (
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.emptyContainer}
          >
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="chatbubbles-outline" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("chat.noConversations")}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {isAgent ? t("chat.noConversationsAgentDesc") : t("chat.noConversationsUserDesc")}
            </Text>
            {!isAgent && (
              <TouchableOpacity
                onPress={() => router.push("/(root)/explore")}
                style={[styles.browseButton, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.browseButtonText}>
                  {t("chat.browseProperties")}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          conversations.map((conversation, index) => {
            // Determine who the "other party" is based on THIS conversation, not global role
            // If current user is the conversation's userId, show the agent's info
            // If current user is the conversation's agentId, show the user's info
            const currentUserId = user?.id?.toString().toLowerCase();
            const isUserInConversation = conversation.userId?.toString().toLowerCase() === currentUserId;
            const otherPartyName = isUserInConversation ? conversation.agentName : conversation.userName;
            const otherPartyPicture = isUserInConversation ? conversation.agentProfilePicture : conversation.userProfilePicture;
            const hasUnread = conversation.unreadCount > 0;

            return (
              <Animated.View
                key={conversation.id}
                entering={FadeInDown.duration(300).delay(index * 50)}
              >
                <TouchableOpacity
                  onPress={() => handleConversationPress(conversation.id)}
                  onLongPress={() => handleLongPress(conversation)}
                  delayLongPress={500}
                  style={[
                    styles.conversationCard,
                    { backgroundColor: hasUnread ? colors.primaryLight : colors.surface },
                    hasUnread && { borderColor: colors.primary },
                    cardShadow,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.conversationRow}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                      {otherPartyPicture ? (
                        <ExpoImage
                          source={{ uri: otherPartyPicture }}
                          style={styles.avatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
                          <Ionicons name="person" size={24} color={colors.textMuted} />
                        </View>
                      )}
                      {hasUnread && (
                        <View style={[styles.messageBadge, { backgroundColor: colors.accent }]}>
                          <Text style={styles.messageBadgeText}>
                            {conversation.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Content */}
                    <View style={styles.conversationContent}>
                      <View style={styles.conversationHeader}>
                        <Text style={[styles.partyName, { color: colors.text }]} numberOfLines={1}>
                          {otherPartyName}
                        </Text>
                        <Text style={[styles.timeText, { color: colors.textMuted }]}>
                          {getTimeAgo(conversation.lastMessageAt)}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.lastMessage,
                          { color: hasUnread ? colors.text : colors.textSecondary },
                          hasUnread && styles.lastMessageUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.lastMessage || t("chat.noMessages")}
                      </Text>

                      {/* Property Info */}
                      <View style={[styles.propertyInfo, { backgroundColor: colors.surfaceElevated }]}>
                        {conversation.propertyImage && (
                          <ExpoImage
                            source={{ uri: conversation.propertyImage }}
                            style={styles.propertyImage}
                            contentFit="cover"
                          />
                        )}
                        <View style={styles.propertyDetails}>
                          <Text style={[styles.propertyTitle, { color: colors.text }]} numberOfLines={1}>
                            {conversation.propertyTitle}
                          </Text>
                          <Text style={[styles.propertyPrice, { color: colors.accent }]}>
                            {formatPrice(conversation.propertyPrice)}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDeleteModalVisible(false)}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface }, isDark ? shadowsDark.lg : shadows.lg]}
            onPress={() => {}}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.deleteIconContainer, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={28} color="#DC2626" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("chat.deleteConversation")}
              </Text>
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                {t("chat.deleteConfirmPermanent")}
              </Text>
            </View>

            {/* Selected Conversation Preview */}
            {selectedConversation && (
              <View style={[styles.selectedPreview, { backgroundColor: colors.surfaceElevated }]}>
                {selectedConversation.propertyImage && (
                  <ExpoImage
                    source={{ uri: selectedConversation.propertyImage }}
                    style={styles.previewImage}
                    contentFit="cover"
                  />
                )}
                <View style={styles.previewDetails}>
                  <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
                    {selectedConversation.propertyTitle}
                  </Text>
                  <Text style={[styles.previewPrice, { color: colors.textSecondary }]} numberOfLines={1}>
                    {formatPrice(selectedConversation.propertyPrice)}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.cancelButton, { backgroundColor: colors.surfaceElevated }]}
                disabled={deleting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteConversation}
                style={[styles.deleteButton, { opacity: deleting ? 0.7 : 1 }]}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.deleteButtonText}>
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

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: radius.cardLg,
    borderBottomRightRadius: radius.cardLg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentLine: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconContainer: {
    borderRadius: radius.full,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#DC2626',
    borderRadius: radius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIconContainer: {
    borderRadius: radius.full,
    padding: spacing.xl,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },
  browseButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    marginTop: spacing.xl,
  },
  browseButtonText: {
    color: 'white',
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
  },
  conversationCard: {
    borderRadius: radius.card,
    marginBottom: spacing.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  conversationRow: {
    flexDirection: 'row',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  messageBadgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  partyName: {
    fontSize: 16,
    fontFamily: 'Rubik-SemiBold',
    flex: 1,
    marginRight: spacing.sm,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    marginBottom: spacing.sm,
  },
  lastMessageUnread: {
    fontFamily: 'Rubik-Medium',
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  propertyImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  propertyDetails: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
  },
  propertyPrice: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    borderRadius: radius.cardLg,
    padding: spacing.xl,
    width: '85%',
    maxWidth: 340,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  deleteIconContainer: {
    borderRadius: radius.full,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedPreview: {
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    marginRight: spacing.md,
  },
  previewDetails: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
  },
  previewPrice: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: 'white',
  },
});

