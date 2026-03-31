// app/(root)/blog.tsx
import icons from "@/constants/icons";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState, memo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
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

function BlogScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  // Memoize formatDate outside renders
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Memoized key extractors
  const keyExtractor = useCallback(
    (item: BlogArticle) => item.id.toString(),
    [],
  );
  const featuredKeyExtractor = useCallback(
    (item: BlogArticle) => `featured-${item.id}`,
    [],
  );

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
      const response = await api.get("/api/Blog/categories");
      setCategories(["All", ...response.data]);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadFeaturedArticles = async () => {
    try {
      const response = await api.get("/api/Blog/featured");
      setFeaturedArticles(response.data);
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

      const response = await api.get(`/api/Blog?${params}`);
      setArticles(response.data.articles);
      setTotalPages(response.data.totalPages);
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

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  // Memoized render functions to prevent re-renders
  const renderFeaturedArticle = useCallback(
    ({ item, index }: { item: BlogArticle; index: number }) => (
      <Animated.View entering={FadeInRight.duration(300).delay(index * 100)}>
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => router.push(`/(root)/blog/${item.id}`)}
          activeOpacity={0.8}
        >
          <View style={[styles.featuredCardInner, { backgroundColor: colors.surface }, cardShadow]}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.featuredContent}>
              <View style={styles.featuredMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.categoryText, { color: colors.primary }]}>
                    {item.category}
                  </Text>
                </View>
                <View style={styles.readTimeBadge}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.readTimeText, { color: colors.textSecondary }]}>
                    {item.readTimeMinutes} min
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.featuredTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.featuredSummary, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.summary}
              </Text>
              <View style={styles.featuredFooter}>
                <Text style={[styles.dateText, { color: colors.textMuted }]}>
                  {formatDate(item.createdAt)}
                </Text>
                <View style={styles.viewsContainer}>
                  <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
                  <Text style={[styles.viewsText, { color: colors.textMuted }]}>
                    {item.viewCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    ),
    [colors, formatDate, cardShadow],
  );

  const renderArticle = useCallback(
    ({ item, index }: { item: BlogArticle; index: number }) => (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
        <TouchableOpacity
          style={styles.articleCard}
          onPress={() => router.push(`/(root)/blog/${item.id}`)}
          activeOpacity={0.8}
        >
          <View style={[styles.articleCardInner, { backgroundColor: colors.surface }, cardShadow]}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.articleImage}
              resizeMode="cover"
            />
            <View style={styles.articleContent}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.categoryText, { color: colors.primary }]}>
                  {item.category}
                </Text>
              </View>
              <Text
                style={[styles.articleTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.articleSummary, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.summary}
              </Text>
              <View style={styles.articleFooter}>
                <Text style={[styles.dateText, { color: colors.textMuted }]}>
                  {formatDate(item.createdAt)}
                </Text>
                <View style={styles.readTimeBadge}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
                    {item.readTimeMinutes} min
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    ),
    [colors, formatDate, cardShadow],
  );

  if (loading) {
    return (
      <SafeAreaView
        className="h-full flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="h-full"
      style={{ backgroundColor: colors.background }}
    >
      <FlashList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={keyExtractor}
        estimatedItemSize={140}
        contentContainerStyle={{ paddingBottom: 92 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Premium Header */}
            <View style={[styles.header, { backgroundColor: colors.surface }, cardShadow]}>
              <View style={styles.headerRow}>
                <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
                <TouchableOpacity
                  onPress={handleBack}
                  style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {t("blog.title")}
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {t("blog.subtitle")}
                  </Text>
                </View>
                {user?.role === "Admin" && (
                  <TouchableOpacity
                    onPress={() => router.push("/(root)/(admin)/blog-manager")}
                    style={[styles.newButton, { backgroundColor: colors.accent }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={18} color="white" />
                    <Text style={styles.newButtonText}>{t("common.new")}</Text>
                  </TouchableOpacity>
                )}
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
                >
                  <Ionicons name="search" size={20} color="white" />
                </TouchableOpacity>
              </View>

              {/* Categories */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
                contentContainerStyle={styles.categoriesContent}
              >
                {categories.map((category, index) => (
                  <Animated.View
                    key={category}
                    entering={FadeInRight.duration(200).delay(index * 50)}
                  >
                    <TouchableOpacity
                      onPress={() => handleCategoryChange(category)}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor:
                            selectedCategory === category
                              ? colors.primary
                              : colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color:
                              selectedCategory === category
                                ? "#FFFFFF"
                                : colors.text,
                          },
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>

              {/* Featured Articles */}
              {featuredArticles.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionAccent, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {t("properties.featured")}
                    </Text>
                  </View>
                  <View style={styles.featuredContainer}>
                    <FlashList
                      data={featuredArticles}
                      renderItem={renderFeaturedArticle}
                      keyExtractor={featuredKeyExtractor}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      estimatedItemSize={320}
                    />
                  </View>
                </>
              )}

              <View style={styles.sectionHeader}>
                <View style={[styles.sectionAccent, { backgroundColor: colors.accent }]} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("blog.latestArticles")}
                </Text>
              </View>
            </View>
          </>
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={[
                  styles.paginationButton,
                  {
                    backgroundColor:
                      currentPage === 1 ? colors.surfaceElevated : colors.primary,
                  },
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={currentPage === 1 ? colors.textMuted : "#FFFFFF"}
                />
                <Text
                  style={[
                    styles.paginationText,
                    { color: currentPage === 1 ? colors.textMuted : "#FFFFFF" },
                  ]}
                >
                  {t("common.previous")}
                </Text>
              </TouchableOpacity>
              <View style={[styles.pageIndicator, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.pageIndicatorText, { color: colors.text }]}>
                  {currentPage} / {totalPages}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                style={[
                  styles.paginationButton,
                  {
                    backgroundColor:
                      currentPage === totalPages
                        ? colors.surfaceElevated
                        : colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.paginationText,
                    {
                      color:
                        currentPage === totalPages ? colors.textMuted : "#FFFFFF",
                    },
                  ]}
                >
                  {t("common.next")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={currentPage === totalPages ? colors.textMuted : "#FFFFFF"}
                />
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="document-text-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("blog.noArticles")}
            </Text>
          </View>
        }
      />
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
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: 4,
  },
  newButtonText: {
    color: 'white',
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
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
  categoriesScroll: {
    marginBottom: spacing.lg,
  },
  categoriesContent: {
    gap: spacing.sm,
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  categoryChipText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    letterSpacing: -0.2,
  },
  featuredContainer: {
    height: 360,
    marginBottom: spacing.md,
  },
  featuredCard: {
    marginRight: spacing.base,
    width: 300,
  },
  featuredCardInner: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 180,
  },
  featuredContent: {
    padding: spacing.base,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
  },
  featuredTitle: {
    fontSize: 17,
    fontFamily: 'Rubik-Bold',
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  featuredSummary: {
    fontSize: 13,
    fontFamily: 'Rubik-Regular',
    lineHeight: 18,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
  },
  articleCard: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
  },
  articleCardInner: {
    borderRadius: radius.card,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  articleImage: {
    width: 120,
    height: 120,
  },
  articleContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  articleTitle: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  articleSummary: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    lineHeight: 16,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    gap: 4,
  },
  paginationText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
  },
  pageIndicator: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
  },
  pageIndicatorText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    padding: spacing.lg,
    borderRadius: radius.full,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
  },
});

export default memo(BlogScreen);

