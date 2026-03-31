import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import React, { useCallback, useState, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
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

const CommunityScreen = memo(function CommunityScreen() {
  const { user } = useAuth();
  const { showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const handleBack = useBackNavigation("/(root)/profile");
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryKeys = ["tips", "questions", "experiences"];
  const categories = useMemo(() => categoryKeys.map((key) => t(`community.${key}`)), [t]);

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  // Memoized key extractor
  const keyExtractor = useCallback((item: Post) => item.id.toString(), []);

  // Use React Query for cached posts - INSTANT from cache
  const { data: posts = [], isLoading: loading, isFetching, refetch } = useQuery({
    queryKey: ["community-posts", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory
        ? `/api/community/posts?category=${selectedCategory}`
        : `/api/community/posts`;
      const response = await api.get(url);
      return response.data as Post[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - community posts change more frequently
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLike = useCallback(async (postId: number) => {
    try {
      const response = await api.post(`/api/community/posts/${postId}/like`);
      // Update cache optimistically
      queryClient.setQueryData(["community-posts", selectedCategory], (old: Post[] | undefined) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === postId ? { ...p, likes: response.data.likes } : p
        );
      });
    } catch (error: any) {
      console.error("Error toggling like:", error);
      showToast(t("errors.failedToToggleLike"), "error");
    }
  }, [queryClient, selectedCategory, showToast, t]);

  // Memoized render function
  const renderPost = useCallback(({ item, index }: { item: Post; index: number }) => (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <TouchableOpacity
        onPress={() =>
          router.push(`/(root)/community/post/${item.id}` as any)
        }
        style={[styles.postCard, { backgroundColor: colors.surface }, cardShadow]}
        activeOpacity={0.8}
      >
        {/* User Info */}
        <View style={styles.userRow}>
          <Image
            source={{
              uri: item.userProfilePicture || "https://via.placeholder.com/40",
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {item.username}
            </Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {item.category}
            </Text>
          </View>
        </View>

        {/* Post Content */}
        <Text style={[styles.postTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={3}>
          {item.content}
        </Text>

        {/* Actions */}
        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => handleLike(item.id)}
            style={styles.actionButton}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="heart-outline" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.actionText, { color: colors.accent }]}>
              {item.likes}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButton}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {item.commentCount}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  ), [handleLike, colors, cardShadow]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
              {t("community.title")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push("/(root)/community/create" as any)
            }
            style={[styles.createButton, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text style={styles.createButtonText}>
              {t("community.create")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {["All", ...categories].map((item, index) => {
            const isSelected = (item === "All" && !selectedCategory) || item === selectedCategory;
            return (
              <Animated.View
                key={item}
                entering={FadeInRight.duration(200).delay(index * 50)}
              >
                <TouchableOpacity
                  onPress={() => setSelectedCategory(item === "All" ? null : item)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: isSelected ? colors.primary : colors.surfaceElevated },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isSelected ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      {/* Posts List */}
      <FlashList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        estimatedItemSize={200}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="people-outline" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("community.noPosts")}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {t("community.beFirst")}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 48,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomLeftRadius: radius.cardLg,
    borderBottomRightRadius: radius.cardLg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentLine: {
    width: 4,
    height: 40,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    gap: 4,
  },
  createButtonText: {
    color: 'white',
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
  },
  filterContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  filterContent: {
    gap: spacing.sm,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  filterChipText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: 100,
  },
  postCard: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  username: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
  },
  dateText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  categoryText: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 11,
  },
  postTitle: {
    fontFamily: 'Rubik-Bold',
    fontSize: 17,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  postContent: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIconContainer: {
    padding: spacing.xl,
    borderRadius: radius.full,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CommunityScreen;

