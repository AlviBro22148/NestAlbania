// app/(root)/(tabs)/blog.tsx
import icons from "@/constants/icons";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BlogArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  imageUrl: string;
  tags: string[];
  viewCount: number;
  readTimeMinutes: number;
  isFeatured: boolean;
  authorName: string;
  createdAt: string;
}

export default function BlogScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory, currentPage]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCategories(),
        loadFeaturedArticles(),
        loadArticles(),
      ]);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Blog/categories`
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(["All", ...data]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadFeaturedArticles = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Blog/featured`
      );
      if (response.ok) {
        const data = await response.json();
        setFeaturedArticles(data);
      }
    } catch (error) {
      console.error("Error loading featured articles:", error);
    }
  };

  const loadArticles = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "10",
        ...(selectedCategory !== "All" && { category: selectedCategory }),
        ...(searchQuery && { searchTerm: searchQuery }),
      });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Blog?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error loading articles:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadArticles();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderFeaturedArticle = ({ item }: { item: BlogArticle }) => (
    <TouchableOpacity
      className="mr-4 w-80"
      onPress={() => router.push(`/(root)/blog/${item.id}`)}
    >
      <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <Image
          source={{ uri: item.imageUrl }}
          className="w-full h-48"
          resizeMode="cover"
        />
        <View className="p-4">
          <View className="flex flex-row items-center mb-2">
            <View className="bg-primary-100 px-3 py-1 rounded-full mr-2">
              <Text className="text-primary-300 text-xs font-rubik-medium">
                {item.category}
              </Text>
            </View>
            <Text className="text-black-200 text-xs font-rubik">
              {item.readTimeMinutes} min read
            </Text>
          </View>
          <Text
            className="text-lg font-rubik-bold text-black-300 mb-2"
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text className="text-black-200 text-sm font-rubik" numberOfLines={2}>
            {item.summary}
          </Text>
          <View className="flex flex-row items-center justify-between mt-3">
            <Text className="text-black-200 text-xs font-rubik">
              {formatDate(item.createdAt)}
            </Text>
            <Text className="text-black-200 text-xs font-rubik">
              {item.viewCount} views
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderArticle = ({ item }: { item: BlogArticle }) => (
    <TouchableOpacity
      className="mb-4"
      onPress={() => router.push(`/(root)/blog/${item.id}`)}
    >
      <View className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-row">
        <Image
          source={{ uri: item.imageUrl }}
          className="w-32 h-32"
          resizeMode="cover"
        />
        <View className="flex-1 p-4">
          <View className="flex flex-row items-center mb-2">
            <View className="bg-primary-100 px-2 py-1 rounded-full mr-2">
              <Text className="text-primary-300 text-xs font-rubik-medium">
                {item.category}
              </Text>
            </View>
          </View>
          <Text
            className="text-base font-rubik-bold text-black-300 mb-1"
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            className="text-black-200 text-xs font-rubik mb-2"
            numberOfLines={2}
          >
            {item.summary}
          </Text>
          <View className="flex flex-row items-center justify-between">
            <Text className="text-black-200 text-xs font-rubik">
              {formatDate(item.createdAt)}
            </Text>
            <Text className="text-black-200 text-xs font-rubik">
              {item.readTimeMinutes} min
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="h-full bg-white flex items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white">
      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <View className="px-5 pt-5">
              <View className="flex flex-row items-center justify-between mb-2">
                <Text className="text-2xl font-rubik-bold text-black-300">
                  {t("blog.title")}
                </Text>

                {user?.role === "Admin" && (
                  <TouchableOpacity
                    onPress={() => router.push("/(root)/(admin)/blog-manager")}
                    className="bg-primary-300 px-4 py-2 rounded-full flex flex-row items-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-rubik-medium mr-1">
                      {t("common.new")}
                    </Text>
                    <Text className="text-white text-lg">＋</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text className="text-black-200 font-rubik mb-5">
                {t("blog.subtitle")}
              </Text>

              {/* Search Bar */}
              <View className="flex flex-row items-center mb-4">
                <View className="flex-1 flex flex-row items-center bg-accent-100 rounded-lg px-4 mr-2">
                  <Image source={icons.search} className="w-5 h-5" />
                  <TextInput
                    className="flex-1 px-4 py-3 font-rubik"
                    placeholder={t("common.search") + "..."}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSearch}
                  className="bg-primary-300 p-3 rounded-lg"
                >
                  <Image
                    source={icons.search}
                    className="w-6 h-6"
                    tintColor="white"
                  />
                </TouchableOpacity>
              </View>

              {/* Categories */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-5"
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => handleCategoryChange(category)}
                    className={`mr-3 px-4 py-2 rounded-full ${
                      selectedCategory === category
                        ? "bg-primary-300"
                        : "bg-accent-100"
                    }`}
                  >
                    <Text
                      className={`font-rubik-medium ${
                        selectedCategory === category
                          ? "text-white"
                          : "text-black-300"
                      }`}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Featured Articles */}
              {featuredArticles.length > 0 && (
                <>
                  <Text className="text-xl font-rubik-bold text-black-300 mb-3">
                    {t("properties.featured")}
                  </Text>
                  <FlatList
                    data={featuredArticles}
                    renderItem={renderFeaturedArticle}
                    keyExtractor={(item) => `featured-${item.id}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-5"
                  />
                </>
              )}

              <Text className="text-xl font-rubik-bold text-black-300 mb-3">
                {t("blog.latestArticles")}
              </Text>
            </View>
          </>
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View className="px-5 mt-4 flex flex-row justify-center items-center">
              <TouchableOpacity
                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg mr-2 ${
                  currentPage === 1 ? "bg-gray-200" : "bg-primary-300"
                }`}
              >
                <Text
                  className={`font-rubik-medium ${
                    currentPage === 1 ? "text-gray-400" : "text-white"
                  }`}
                >
                  {t("common.previous")}
                </Text>
              </TouchableOpacity>
              <Text className="text-black-300 font-rubik mx-4">
                {currentPage} / {totalPages}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ml-2 ${
                  currentPage === totalPages ? "bg-gray-200" : "bg-primary-300"
                }`}
              >
                <Text
                  className={`font-rubik-medium ${
                    currentPage === totalPages ? "text-gray-400" : "text-white"
                  }`}
                >
                  {t("common.next")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="px-5 py-10 items-center">
            <Text className="text-black-200 font-rubik text-center">
              {t("blog.noArticles")}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
