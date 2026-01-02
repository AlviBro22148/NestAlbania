// ============================================
// FIXED: news.tsx - Replace fetch() with api (axios)
// ============================================

import icons from "@/constants/icons";
import { useAlert } from "@/contexts/AlertContext";
import api from "@/lib/axios-config"; // ✅ ADDED: Import axios
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface NewsArticle {
  title: string;
  summary: string;
  link: string;
  source: string;
  publishedDate: string;
  imageUrl: string;
}

export default function NewsScreen() {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  // ✅ FIXED: Use axios instead of fetch
  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/news/latest", {
        params: { count: 30 },
      });

      setNews(response.data);
    } catch (error: any) {
      console.error("Error loading news:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("market.errorLoading"),
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use axios instead of fetch
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadNews();
      return;
    }

    try {
      setIsSearching(true);
      const response = await api.get("/api/news/search", {
        params: {
          query: searchQuery,
          count: 20,
        },
      });

      setNews(response.data);
    } catch (error: any) {
      console.error("Error searching news:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("market.errorLoading"),
      });
    } finally {
      setIsSearching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleArticlePress = async (link: string) => {
    try {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      }
    } catch (error) {
      console.error("Error opening link:", error);
    }
  };

  const renderNewsItem = ({ item }: { item: NewsArticle }) => (
    <TouchableOpacity
      className="mb-4 bg-white rounded-2xl overflow-hidden shadow-sm"
      onPress={() => handleArticlePress(item.link)}
      activeOpacity={0.7}
    >
      <View className="flex flex-row">
        <Image
          source={{ uri: item.imageUrl }}
          className="w-32 h-32"
          resizeMode="cover"
        />
        <View className="flex-1 p-4">
          <View className="flex flex-row items-center mb-2">
            <View className="bg-red-100 px-2 py-1 rounded-full mr-2">
              <Text className="text-red-600 text-xs font-rubik-medium">
                LIVE NEWS
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
              {item.source}
            </Text>
            <Text className="text-black-200 text-xs font-rubik">
              {formatDate(item.publishedDate)}
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
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item, index) => `${item.link}-${index}`}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="px-5 pt-5 mb-4">
            <View className="flex flex-row items-center justify-between mb-2">
              <Text className="text-2xl font-rubik-bold text-black-300">
                {t("news.title")}
              </Text>
              <View className="bg-red-100 px-3 py-1 rounded-full">
                <Text className="text-red-600 text-xs font-rubik-bold">
                  • LIVE
                </Text>
              </View>
            </View>
            <Text className="text-black-200 font-rubik mb-5">
              {t("news.subtitle")}
            </Text>

            {/* Search Bar */}
            <View className="flex flex-row items-center mb-2">
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
                disabled={isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Image
                    source={icons.search}
                    className="w-6 h-6"
                    tintColor="white"
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Info Banner */}
            <View className="bg-blue-50 p-4 rounded-xl mt-3">
              <Text className="text-blue-800 font-rubik-medium mb-1">
                📰 {t("news.title")}
              </Text>
              <Text className="text-blue-700 font-rubik text-sm">
                {t("news.subtitle")}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="px-5 py-10 items-center">
            <Text className="text-black-200 font-rubik text-center mb-2">
              {t("news.noNews")}
            </Text>
            <TouchableOpacity
              onPress={loadNews}
              className="bg-primary-300 px-6 py-3 rounded-lg mt-4"
            >
              <Text className="text-white font-rubik-medium">{t("news.refresh")}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}
