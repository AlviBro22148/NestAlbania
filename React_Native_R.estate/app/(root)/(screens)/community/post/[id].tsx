// app/(root)/community/post/[id].tsx
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { shadows, shadowsDark } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import icons from "@/constants/icons";

interface Comment {
  id: number;
  userId: string;
  username: string;
  userProfilePicture?: string;
  comment: string;
  createdAt: string;
}

interface PostDetail {
  id: number;
  username: string;
  userProfilePicture?: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  createdAt: string;
  comments: Comment[];
}

const PostDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/community");
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const postId = typeof id === "string" ? parseInt(id, 10) : 0;

  // Use React Query for cached post data - INSTANT from cache
  const {
    data: post,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["community-post", postId],
    queryFn: async () => {
      const response = await api.get(`/api/community/posts/${postId}`);
      return response.data as PostDetail;
    },
    enabled: !!postId,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Use React Query for like status
  const { data: likeData, isLoading: checkingLike } = useQuery({
    queryKey: ["community-post-like", postId],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/api/community/posts/${postId}/is-liked`,
        );
        return response.data.isLiked as boolean;
      } catch {
        return false;
      }
    },
    enabled: !!postId,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const isLiked = likeData ?? false;

  const handleLike = useCallback(async () => {
    if (!post) return;
    try {
      const response = await api.post(`/api/community/posts/${post.id}/like`);
      // Update cache
      queryClient.setQueryData(
        ["community-post", postId],
        (old: PostDetail | undefined) => {
          if (!old) return old;
          return { ...old, likes: response.data.likes };
        },
      );
      queryClient.setQueryData(
        ["community-post-like", postId],
        response.data.isLiked,
      );
      // Also update community list cache
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    } catch (error: any) {
      console.error("Error toggling like:", error);
      showToast("Failed to toggle like", "error");
    }
  }, [post, postId, queryClient, showToast]);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: "Comment cannot be empty",
      });
      return;
    }

    setSubmittingComment(true);
    try {
      await api.post("/api/community/comments", {
        postId: postId,
        comment: commentText.trim(),
      });
      setCommentText("");
      setShowCommentModal(false);
      // Refetch post to get new comment
      refetch();
      showToast("Comment added!", "success");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      showToast("Failed to add comment", "error");
    } finally {
      setSubmittingComment(false);
    }
  }, [commentText, postId, refetch, showAlert, showToast, t]);

  const handleDeleteComment = useCallback(
    (commentId: number) => {
      showAlert({
        type: "warning",
        title: t("validation.deleteComment"),
        message: t("validation.deleteCommentConfirm"),
        buttons: [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await api.delete(`/api/community/comments/${commentId}`);
                showToast(t("validation.commentDeleted"), "success");
                refetch();
              } catch (error: any) {
                console.error("Error deleting comment:", error);
                showToast(t("validation.failedToDeleteComment"), "error");
              }
            },
          },
        ],
      });
    },
    [refetch, showAlert, showToast, t],
  );

  const canDeleteComment = (comment: Comment) => {
    return comment.userId === user?.id || user?.role === "Admin";
  };

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  if (loading || !post) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Premium Header */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[styles.header, { backgroundColor: colors.surface }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.backButton,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Image
              source={icons.backArrow}
              style={styles.backIcon}
              tintColor={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("community.postDetails")}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {post.category}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Info */}
        <View className="flex-row items-center mb-4">
          <Image
            source={{
              uri: post.userProfilePicture || "https://via.placeholder.com/50",
            }}
            className="w-12 h-12 rounded-full"
          />
          <View className="ml-3 flex-1">
            <Text className="font-rubik-bold" style={{ color: colors.text }}>
              {post.username}
            </Text>
            <Text
              className="text-xs font-rubik"
              style={{ color: colors.textSecondary }}
            >
              {new Date(post.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Text
              className="text-xs font-rubik-semibold"
              style={{ color: colors.primary }}
            >
              {post.category}
            </Text>
          </View>
        </View>

        {/* Post Content */}
        <Text
          className="text-2xl font-rubik-bold mb-3"
          style={{ color: colors.text }}
        >
          {post.title}
        </Text>
        <Text
          className="font-rubik leading-6 mb-6"
          style={{ color: colors.textSecondary }}
        >
          {post.content}
        </Text>

        {/* Like Button */}
        <TouchableOpacity
          onPress={handleLike}
          disabled={checkingLike}
          className="flex-row items-center mb-6 pb-6"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={colors.primary}
          />
          <Text
            className="ml-2 font-rubik-semibold"
            style={{ color: colors.primary }}
          >
            {post.likes} {post.likes === 1 ? "Like" : "Likes"}
          </Text>
        </TouchableOpacity>

        {/* Comments Section */}
        <Text
          className="text-lg font-rubik-bold mb-4"
          style={{ color: colors.text }}
        >
          Comments ({post.comments.length})
        </Text>

        {post.comments.map((comment) => (
          <View
            key={comment.id}
            className="mb-4 pb-4"
            style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <View className="flex-row items-start">
              <Image
                source={{
                  uri:
                    comment.userProfilePicture ||
                    "https://via.placeholder.com/40",
                }}
                className="w-10 h-10 rounded-full"
              />
              <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text
                      className="font-rubik-semibold"
                      style={{ color: colors.text }}
                    >
                      {comment.username}
                    </Text>
                    <Text
                      className="text-xs font-rubik mb-2"
                      style={{ color: colors.textSecondary }}
                    >
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {canDeleteComment(comment) && (
                    <TouchableOpacity
                      onPress={() => handleDeleteComment(comment.id)}
                      className="p-2"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <Text
                  className="font-rubik"
                  style={{ color: colors.textSecondary }}
                >
                  {comment.comment}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {post.comments.length === 0 && (
          <Text
            className="text-center font-rubik py-8"
            style={{ color: colors.textSecondary }}
          >
            No comments yet. Be the first to comment!
          </Text>
        )}
      </ScrollView>

      {/* Fixed Add Comment Button */}
      <View
        className="px-6 py-4 mb-12 pb-12"
        style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => setShowCommentModal(true)}
          className="py-4 rounded-full flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-outline" size={20} color="white" />
          <Text className="text-white font-rubik-bold ml-2">Add Comment</Text>
        </TouchableOpacity>
      </View>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setShowCommentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          className="flex-1"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowCommentModal(false)}
            className="flex-1 justify-end bg-black/50"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View
                className="rounded-t-3xl p-6"
                style={{ backgroundColor: colors.surface }}
              >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text
                    className="text-xl font-rubik-bold"
                    style={{ color: colors.text }}
                  >
                    Add Comment
                  </Text>
                  <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                    <Ionicons
                      name="close"
                      size={28}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* User Info */}
                <View
                  className="flex-row items-center mb-4 pb-4"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Image
                    source={{
                      uri:
                        user?.profilePictureUrl ||
                        "https://via.placeholder.com/40",
                    }}
                    className="w-10 h-10 rounded-full"
                  />
                  <Text
                    className="ml-3 font-rubik-semibold"
                    style={{ color: colors.text }}
                  >
                    {user?.username}
                  </Text>
                </View>

                {/* Input */}
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Write your comment..."
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  autoFocus
                  maxLength={500}
                  className="rounded-xl px-4 py-3 font-rubik text-base mb-2 min-h-32"
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                  placeholderTextColor={colors.textMuted}
                />

                {/* Character Count */}
                <Text
                  className="text-xs font-rubik mb-4 text-right"
                  style={{ color: colors.textSecondary }}
                >
                  {commentText.length}/500
                </Text>

                {/* Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setCommentText("");
                      setShowCommentModal(false);
                    }}
                    className="flex-1 py-4 rounded-xl"
                    style={{ backgroundColor: colors.surfaceElevated }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="text-center font-rubik-bold"
                      style={{ color: colors.text }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="flex-1 py-4 rounded-xl"
                    style={{
                      backgroundColor:
                        commentText.trim() && !submittingComment
                          ? colors.primary
                          : colors.textMuted,
                    }}
                    activeOpacity={0.7}
                  >
                    {submittingComment ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-center font-rubik-bold text-white">
                        Post Comment
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default PostDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Rubik-Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Rubik-Regular",
    marginTop: 2,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  accentLine: {
    height: 3,
    marginTop: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
});

