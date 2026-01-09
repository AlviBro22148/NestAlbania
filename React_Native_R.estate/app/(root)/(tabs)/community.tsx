import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import icons from "@/constants/icons";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Post {
  id: number;
  username: string;
  userProfilePicture?: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  commentCount: number;
  createdAt: string;
}

const CommunityScreen = () => {
  const { user } = useAuth();
  const { showToast } = useAlert();
  const { t } = useTranslation();
  const handleBack = useBackNavigation("/(root)/(tabs)/profile");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryKeys = ["tips", "questions", "experiences"];
  const categories = categoryKeys.map((key) => t(`community.${key}`));

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [selectedCategory])
  );

  const fetchPosts = async () => {
    try {
      const timestamp = new Date().getTime();
      const url = selectedCategory
        ? `/api/community/posts?category=${selectedCategory}&t=${timestamp}`
        : `/api/community/posts?t=${timestamp}`;
      const response = await api.get(url);
      setPosts(response.data);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      showToast("Failed to load community posts", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleLike = async (postId: number) => {
    try {
      const response = await api.post(`/api/community/posts/${postId}/like`);

      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, likes: response.data.likes } : p
        )
      );
    } catch (error: any) {
      console.error("Error toggling like:", error);
      showToast(t("errors.failedToToggleLike"), "error");
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      onPress={() =>
        router.push(`/(root)/(tabs)/community/post/${item.id}` as any)
      }
      className="bg-white rounded-xl p-6 mb-7 shadow-sm"
    >
      {/* User Info */}
      <View className="flex-row items-center mb-3">
        <Image
          source={{
            uri: item.userProfilePicture || "https://via.placeholder.com/40",
          }}
          className="w-10 h-10 rounded-full"
        />
        <View className="ml-3 flex-1">
          <Text className="font-rubik-semibold text-black-300">
            {item.username}
          </Text>
          <Text className="text-xs text-gray-500 font-rubik">
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View className="bg-primary-100 px-3 py-1 rounded-full">
          <Text className="text-xs font-rubik-semibold text-primary-300">
            {item.category}
          </Text>
        </View>
      </View>

      {/* Post Content */}
      <Text className="text-lg font-rubik-bold text-black-300 mb-2">
        {item.title}
      </Text>
      <Text className="text-black-200 font-rubik" numberOfLines={3}>
        {item.content}
      </Text>

      {/* Actions */}
      <View className="flex-row items-center mt-4 border-t border-gray-100 pt-3">
        <TouchableOpacity
          onPress={() => handleLike(item.id)}
          className="flex-row items-center mr-6"
        >
          <Ionicons name="heart-outline" size={20} color="#0061FF" />
          <Text className="ml-2 text-primary-300 font-rubik-medium">
            {item.likes}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center">
          <Ionicons name="chatbubble-outline" size={20} color="#666876" />
          <Text className="ml-2 text-gray-600 font-rubik-medium">
            {item.commentCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0061FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 mb-12">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleBack}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-3"
            >
              <Image source={icons.backArrow} className="w-5 h-5" />
            </TouchableOpacity>
            <Text className="text-2xl font-rubik-bold text-black-300">
              {t("community.title")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push("/(root)/(tabs)/community/create" as any)
            }
            className="bg-primary-300 px-4 py-2 rounded-lg"
          >
            <View className="flex-row items-center">
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-rubik-semibold ml-1">
                {t("community.create")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter */}
      <View className="px-6 py-3 bg-white">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["All", ...categories]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item === "All" ? null : item)}
              className={`px-4 py-2 rounded-full mr-2 ${
                (item === "All" && !selectedCategory) ||
                item === selectedCategory
                  ? "bg-primary-300"
                  : "bg-gray-200"
              }`}
            >
              <Text
                className={`font-rubik-medium ${
                  (item === "All" && !selectedCategory) ||
                  item === selectedCategory
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="people-outline" size={80} color="#D1D5DB" />
            <Text className="text-xl font-rubik-semibold text-gray-700 mt-4">
              {t("community.noPosts")}
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              {t("community.beFirst")}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default CommunityScreen;
