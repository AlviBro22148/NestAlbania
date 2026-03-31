// ============================================
// FIXED: news.tsx - Replace fetch() with api (axios)
// ============================================

import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
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
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
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
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

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

  const renderNewsItem = ({ item, index }: { item: NewsArticle; index: number }) => (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <TouchableOpacity
        style={[styles.newsCard, { backgroundColor: colors.surface }, cardShadow]}
        onPress={() => handleArticlePress(item.link)}
        activeOpacity={0.8}
      >
        <View style={styles.newsRow}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.newsImage}
            resizeMode="cover"
          />
          <View style={styles.newsContent}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text
              style={[styles.newsTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <Text
              style={[styles.newsSummary, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.summary}
            </Text>
            <View style={styles.newsFooter}>
              <Text style={[styles.sourceText, { color: colors.textMuted }]}>
                {item.source}
              </Text>
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {formatDate(item.publishedDate)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView className="h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item, index) => `${item.link}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <>
            {/* Premium Header */}
            <View style={[styles.header, { backgroundColor: colors.surface }, cardShadow]}>
              <View style={styles.headerRow}>
                <View style={[styles.accentLine, { backgroundColor: '#DC2626' }]} />
                <TouchableOpacity
                  onPress={handleBack}
                  style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {t("news.title")}
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {t("news.subtitle")}
                  </Text>
                </View>
                <View style={styles.liveHeaderBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveHeaderText}>LIVE</Text>
                </View>
              </View>
            </View>

            <View style={styles.contentPadding}>
              {/* Search Bar */}
              <View style={styles.searchRow}>
                <View style={[styles.searchContainer, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={t("common.search") + "..."}
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSearch}
                  style={[styles.searchButton, { backgroundColor: colors.primary }]}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="search" size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Info Banner */}
              <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight }]}>
                <View style={[styles.infoIconContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="newspaper-outline" size={20} color="white" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoTitle, { color: colors.primary }]}>
                    {t("news.title")}
                  </Text>
                  <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                    {t("news.subtitle")}
                  </Text>
                </View>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="newspaper-outline" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("news.noNews")}
            </Text>
            <TouchableOpacity
              onPress={loadNews}
              style={[styles.refreshButton, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.refreshButtonText}>{t("news.refresh")}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: radius.cardLg,
    borderBottomRightRadius: radius.cardLg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentLine: {
    width: 4,
    height: 44,
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
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Rubik-Regular',
    marginTop: 2,
  },
  liveHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: 6,
  },
  liveHeaderText: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    color: '#DC2626',
  },
  contentPadding: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: 'Rubik-Regular',
    fontSize: 15,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
  },
  infoDescription: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  newsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  newsRow: {
    flexDirection: 'row',
  },
  newsImage: {
    width: 120,
    height: 120,
  },
  newsContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 4,
    marginBottom: spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  liveText: {
    fontSize: 9,
    fontFamily: 'Rubik-Bold',
    color: '#DC2626',
  },
  newsTitle: {
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
    lineHeight: 18,
  },
  newsSummary: {
    fontFamily: 'Rubik-Regular',
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sourceText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 10,
  },
  dateText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    padding: spacing.xl,
    borderRadius: radius.full,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  refreshButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
  },
  refreshButtonText: {
    color: 'white',
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
  },
});

