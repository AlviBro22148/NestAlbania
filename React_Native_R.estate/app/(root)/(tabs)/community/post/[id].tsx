// app/(root)/(tabs)/community/post/[id].tsx
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [checkingLike, setCheckingLike] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  // Use useFocusEffect to refresh data when screen comes into focus
  // This ensures like changes from the community list are reflected
  useFocusEffect(
    useCallback(() => {
      fetchPost();
      checkLikeStatus();
    }, [id])
  );

  const fetchPost = async () => {
    try {
      const response = await api.get(`/api/community/posts/${id}`);
      setPost(response.data);
    } catch (error: any) {
      console.error("Error fetching post:", error);
      showToast("Failed to load post", "error");
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    try {
      setCheckingLike(true);
      const response = await api.get(`/api/community/posts/${id}/is-liked`);
      setIsLiked(response.data.isLiked);
    } catch (error: any) {
      console.error("Error checking like status:", error);
      if (error.response?.status === 404) {
        setIsLiked(false);
      }
    } finally {
      setCheckingLike(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const response = await api.post(`/api/community/posts/${post.id}/like`);
      setPost({ ...post, likes: response.data.likes });
      setIsLiked(response.data.isLiked);
    } catch (error: any) {
      console.error("Error toggling like:", error);
      showToast("Failed to toggle like", "error");
    }
  };

  const handleAddComment = async () => {
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
        postId: Number(id),
        comment: commentText.trim(),
      });
      setCommentText("");
      setShowCommentModal(false);
      await fetchPost();
      showToast("Comment added!", "success");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      showToast("Failed to add comment", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
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
              await fetchPost();
            } catch (error: any) {
              console.error("Error deleting comment:", error);
              showToast(t("validation.failedToDeleteComment"), "error");
            }
          },
        },
      ],
    });
  };

  const canDeleteComment = (comment: Comment) => {
    return comment.userId === user?.id || user?.role === "Admin";
  };

  if (loading || !post) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0061FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#191D31" />
        </TouchableOpacity>
        <Text className="text-xl font-rubik-bold text-black-300 ml-4">
          Post Details
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="p-6">
          {/* User Info */}
          <View className="flex-row items-center mb-4">
            <Image
              source={{
                uri:
                  post.userProfilePicture || "https://via.placeholder.com/50",
              }}
              className="w-12 h-12 rounded-full"
            />
            <View className="ml-3 flex-1">
              <Text className="font-rubik-bold text-black-300">
                {post.username}
              </Text>
              <Text className="text-xs text-gray-500 font-rubik">
                {new Date(post.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View className="bg-primary-100 px-3 py-1 rounded-full">
              <Text className="text-xs font-rubik-semibold text-primary-300">
                {post.category}
              </Text>
            </View>
          </View>

          {/* Post Content */}
          <Text className="text-2xl font-rubik-bold text-black-300 mb-3">
            {post.title}
          </Text>
          <Text className="text-black-200 font-rubik leading-6 mb-6">
            {post.content}
          </Text>

          {/* Like Button */}
          <TouchableOpacity
            onPress={handleLike}
            disabled={checkingLike}
            className="flex-row items-center mb-6 pb-6 border-b border-gray-100"
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color="#0061FF"
            />
            <Text className="ml-2 text-primary-300 font-rubik-semibold">
              {post.likes} {post.likes === 1 ? "Like" : "Likes"}
            </Text>
          </TouchableOpacity>

          {/* Comments Section */}
          <Text className="text-lg font-rubik-bold text-black-300 mb-4">
            Comments ({post.comments.length})
          </Text>

          {post.comments.map((comment) => (
            <View
              key={comment.id}
              className="mb-4 pb-4 border-b border-gray-100"
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
                      <Text className="font-rubik-semibold text-black-300">
                        {comment.username}
                      </Text>
                      <Text className="text-xs text-gray-500 font-rubik mb-2">
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
                  <Text className="text-black-200 font-rubik">
                    {comment.comment}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {post.comments.length === 0 && (
            <Text className="text-center text-gray-500 font-rubik py-8">
              No comments yet. Be the first to comment!
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Fixed Add Comment Button */}
      <View className="px-6 py-4 border-t border-gray-200 bg-white mb-12 pb-7">
        <TouchableOpacity
          onPress={() => setShowCommentModal(true)}
          className="bg-primary-300 py-4 rounded-full flex-row items-center justify-center"
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
        onRequestClose={() => setShowCommentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              <View className="bg-white rounded-t-3xl p-6">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-rubik-bold text-black-300">
                    Add Comment
                  </Text>
                  <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                    <Ionicons name="close" size={28} color="#666876" />
                  </TouchableOpacity>
                </View>

                {/* User Info */}
                <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
                  <Image
                    source={{
                      uri:
                        user?.profilePictureUrl ||
                        "https://via.placeholder.com/40",
                    }}
                    className="w-10 h-10 rounded-full"
                  />
                  <Text className="ml-3 font-rubik-semibold text-black-300">
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
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-rubik text-base mb-2 min-h-32"
                  placeholderTextColor="#9CA3AF"
                />

                {/* Character Count */}
                <Text className="text-xs text-gray-500 font-rubik mb-4 text-right">
                  {commentText.length}/500
                </Text>

                {/* Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setCommentText("");
                      setShowCommentModal(false);
                    }}
                    className="flex-1 bg-gray-200 py-4 rounded-xl"
                    activeOpacity={0.7}
                  >
                    <Text className="text-center font-rubik-bold text-black-300">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddComment}
                    disabled={submittingComment || !commentText.trim()}
                    className={`flex-1 py-4 rounded-xl ${
                      commentText.trim() && !submittingComment
                        ? "bg-primary-300"
                        : "bg-gray-300"
                    }`}
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
