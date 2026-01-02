import icons from "@/constants/icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BlogArticle {
  id: number;
  title: string;
  content: string;
  summary: string;
  category: string;
  imageUrl: string;
  tags: string[];
  viewCount: number;
  readTimeMinutes: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogDetailScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<BlogArticle | null>(null);

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Blog/${id}`
      );

      if (response.ok) {
        const data = await response.json();
        setArticle(data);
      }
    } catch (error) {
      console.error("Error loading article:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      await Share.share({
        message: `${article.title}\n\n${article.summary}`,
        title: article.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="h-full bg-white flex items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView className="h-full bg-white flex items-center justify-center">
        <Text className="text-black-200 font-rubik">Article not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-primary-300 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-rubik-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View className="px-5 py-4 flex flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={icons.backArrow} className="w-6 h-6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Image source={icons.send} className="w-6 h-6" />
          </TouchableOpacity>
        </View>

        {/* Featured Image */}
        <Image
          source={{ uri: article.imageUrl }}
          className="w-full h-64"
          resizeMode="cover"
        />

        <View className="px-5 py-5">
          {/* Category Badge */}
          <View className="flex flex-row items-center mb-3">
            <View className="bg-primary-100 px-3 py-1 rounded-full mr-3">
              <Text className="text-primary-300 text-sm font-rubik-medium">
                {article.category}
              </Text>
            </View>
            <Text className="text-black-200 text-sm font-rubik">
              {article.readTimeMinutes} min read
            </Text>
          </View>

          {/* Title */}
          <Text className="text-2xl font-rubik-bold text-black-300 mb-3">
            {article.title}
          </Text>

          {/* Author and Date */}
          <View className="flex flex-row items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <View className="flex flex-row items-center">
              <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                <Text className="text-primary-300 font-rubik-bold text-lg">
                  {article.authorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text className="text-black-300 font-rubik-medium">
                  {article.authorName}
                </Text>
                <Text className="text-black-200 text-xs font-rubik">
                  {formatDate(article.createdAt)}
                </Text>
              </View>
            </View>
            <View className="flex flex-row items-center">
              <Image source={icons.eye} className="w-4 h-4 mr-1" />
              <Text className="text-black-200 text-sm font-rubik">
                {article.viewCount}
              </Text>
            </View>
          </View>

          {/* Summary */}
          <View className="bg-blue-50 p-4 rounded-xl mb-5">
            <Text className="text-blue-800 font-rubik-medium mb-2">
              Summary
            </Text>
            <Text className="text-blue-700 font-rubik text-sm leading-6">
              {article.summary}
            </Text>
          </View>

          {/* Content */}
          <View className="mb-5">
            <Text className="text-black-300 font-rubik text-base leading-7">
              {article.content}
            </Text>
          </View>

          {/* Tags */}
          {article.tags.length > 0 && (
            <View className="mb-5">
              <Text className="text-black-300 font-rubik-bold mb-3">Tags</Text>
              <View className="flex flex-row flex-wrap">
                {article.tags.map((tag, index) => (
                  <View
                    key={index}
                    className="bg-accent-100 px-3 py-2 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-black-300 text-sm font-rubik">
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Call to Action */}
          <View className="bg-primary-100 p-5 rounded-2xl mt-5 mb-10">
            <Text className="text-primary-300 font-rubik-bold text-lg mb-2">
              Looking for Properties?
            </Text>
            <Text className="text-primary-300 font-rubik mb-4">
              Explore our latest listings and find your dream home today.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(root)/(tabs)/explore")}
              className="bg-primary-300 py-3 rounded-lg items-center mb-4"
            >
              <Text className="text-white font-rubik-bold">
                Browse Properties
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
