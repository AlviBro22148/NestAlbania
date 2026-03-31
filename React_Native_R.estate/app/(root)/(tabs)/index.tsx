import { FeaturedCard, TodaysChoiceCard } from "@/components/Cards";
import { GreenHomeCard } from "@/components/GreenHomeCard";
import ComparisonFloatingButton from "@/components/ComparisonFloatingButton";
import ChatFloatingButton from "@/components/ChatFloatingButton";
import icons from "@/constants/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import api from "@/lib/axios-config";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image as ExpoImage } from "expo-image";

import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Time-based greeting
const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "home.goodMorning";
  if (hour < 18) return "home.goodAfternoon";
  return "home.goodEvening";
};

interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  status: string;
  images: string[];
  userId: string;
  ownerName?: string;
  createdAt: string;
}

export default function Index() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { unreadCount, refreshCount } = useNotificationCount();
  const { hasPreferences, fetchPreferences } = useUserPreferences();
  const greetingKey = useMemo(() => getGreetingKey(), []);

  // State for property sections
  const [todaysChoice, setTodaysChoice] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [greenHomes, setGreenHomes] = useState<Property[]>([]);
  const [yourChoice, setYourChoice] = useState<Property[]>([]);

  // Your Choice pagination state
  const [yourChoicePage, setYourChoicePage] = useState(1);
  const [yourChoiceTotalPages, setYourChoiceTotalPages] = useState(1);
  const [yourChoiceTotalCount, setYourChoiceTotalCount] = useState(0);
  const [loadingMoreYourChoice, setLoadingMoreYourChoice] = useState(false);

  // Loading states
  const [loadingTodaysChoice, setLoadingTodaysChoice] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingGreenHomes, setLoadingGreenHomes] = useState(true);
  const [loadingYourChoice, setLoadingYourChoice] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTodaysChoice();
    fetchFeaturedProperties();
    fetchGreenHomes();
  }, []);

  // Fetch Your Choice when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
      fetchYourChoice(1, true);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      refreshCount();
      // Refresh Your Choice when returning to this screen
      if (isAuthenticated) {
        fetchYourChoice(1, true);
      }
    }, [isAuthenticated]),
  );

  // Fetch Today's Choice properties
  const fetchTodaysChoice = async () => {
    try {
      const response = await api.get("/api/properties/todays-choice");
      setTodaysChoice(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log("Today's Choice endpoint not implemented yet");
        setTodaysChoice([]);
      } else {
        console.error("Error fetching today's choice:", error);
      }
    } finally {
      setLoadingTodaysChoice(false);
    }
  };

  // Fetch Featured properties
  const fetchFeaturedProperties = async () => {
    try {
      const response = await api.get("/api/properties/featured");
      setFeaturedProperties(response.data);
    } catch (error: any) {
      console.error("Error fetching featured properties:", error);
    } finally {
      setLoadingFeatured(false);
    }
  };

  // Fetch Green Homes
  const fetchGreenHomes = async () => {
    try {
      const response = await api.get("/api/properties/green-homes");
      setGreenHomes(response.data);
    } catch (error: any) {
      console.error("Error fetching green homes:", error);
    } finally {
      setLoadingGreenHomes(false);
    }
  };

  // Fetch Your Choice properties (personalized based on preferences)
  const fetchYourChoice = async (page: number = 1, reset: boolean = false) => {
    if (!isAuthenticated) return;

    if (reset) {
      setLoadingYourChoice(true);
    } else {
      setLoadingMoreYourChoice(true);
    }

    try {
      const response = await api.get("/api/properties/your-choice", {
        params: { page, pageSize: 10 },
      });

      const data = response.data;

      if (reset) {
        setYourChoice(data.properties || []);
      } else {
        setYourChoice((prev) => [...prev, ...(data.properties || [])]);
      }

      setYourChoicePage(data.pagination?.currentPage || 1);
      setYourChoiceTotalPages(data.pagination?.totalPages || 1);
      setYourChoiceTotalCount(data.pagination?.totalCount || 0);
    } catch (error: any) {
      console.error("Error fetching your choice properties:", error);
      if (reset) {
        setYourChoice([]);
      }
    } finally {
      setLoadingYourChoice(false);
      setLoadingMoreYourChoice(false);
    }
  };

  // Load more Your Choice properties
  const loadMoreYourChoice = () => {
    if (!loadingMoreYourChoice && yourChoicePage < yourChoiceTotalPages) {
      fetchYourChoice(yourChoicePage + 1, false);
    }
  };

  const notifications = () => {
    router.push("/notifications");
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTodaysChoice(),
        fetchFeaturedProperties(),
        fetchGreenHomes(),
        isAuthenticated ? fetchYourChoice(1, true) : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  const handlePropertyPress = useCallback((propertyId: number) => {
    router.push(`/(root)/properties/${propertyId}`);
  }, []);

  // Memoized render functions for FlatLists
  const renderTodaysChoice = useCallback(
    ({ item }: { item: Property }) => (
      <TodaysChoiceCard
        property={item}
        onPress={() => handlePropertyPress(item.id)}
      />
    ),
    [handlePropertyPress],
  );

  const renderFeatured = useCallback(
    ({ item }: { item: Property }) => (
      <FeaturedCard
        property={item}
        onPress={() => handlePropertyPress(item.id)}
      />
    ),
    [handlePropertyPress],
  );

  const renderGreenHome = useCallback(
    ({ item }: { item: any }) => (
      <GreenHomeCard
        property={item}
        onPress={() => handlePropertyPress(item.id)}
      />
    ),
    [handlePropertyPress],
  );

  const keyExtractor = useCallback((item: Property) => item.id.toString(), []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.content}>
          {/* User Greeting + Notifications */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View
                style={[styles.avatarContainer, { borderColor: colors.accent }]}
              >
                <ExpoImage
                  source={{ uri: user?.profilePictureUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </View>
              <View style={styles.greetingContainer}>
                <Text
                  style={[styles.greetingText, { color: colors.textMuted }]}
                >
                  {t(greetingKey)},
                </Text>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {user?.username}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={notifications}
              style={[
                styles.notificationBtn,
                { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <ExpoImage
                source={icons.bell}
                style={[styles.bellIcon, { tintColor: colors.text }]}
                contentFit="contain"
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* TODAY'S CHOICE SECTION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View
                  style={[
                    styles.sectionAccent,
                    { backgroundColor: colors.accent },
                  ]}
                />
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t("properties.todaysChoice")}
                  </Text>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: colors.textMuted },
                    ]}
                  >
                    {t("properties.todaysChoiceDescription")}
                  </Text>
                </View>
              </View>
            </View>

            {loadingTodaysChoice ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.badgeGold} />
              </View>
            ) : todaysChoice.length > 0 ? (
              <FlatList
                data={todaysChoice}
                renderItem={renderTodaysChoice}
                keyExtractor={keyExtractor}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
              />
            ) : (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {t("properties.noPropertiesFound")}
                </Text>
              </View>
            )}
          </View>

          {/* YOUR CHOICE SECTION - Personalized based on preferences */}
          {isAuthenticated && (
            <View style={styles.section}>
              <View style={styles.yourChoiceHeader}>
                <View style={styles.yourChoiceTitleRow}>
                  <View
                    style={[
                      styles.sectionAccent,
                      { backgroundColor: "#8B5CF6" },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {t("preferences.yourChoice")}
                    </Text>
                    <Text
                      style={[
                        styles.sectionSubtitle,
                        { color: colors.textMuted },
                      ]}
                    >
                      {hasPreferences
                        ? t("preferences.personalizedForYou")
                        : t("preferences.setPreferencesToPersonalize")}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push("/(root)/(screens)/edit-preferences")
                  }
                  style={[
                    styles.editButton,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text
                    style={[styles.editButtonText, { color: colors.primary }]}
                  >
                    {hasPreferences ? "Edit" : "Set Up"}
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingYourChoice ? (
                <View
                  style={[
                    styles.yourChoiceLoading,
                    { backgroundColor: colors.surfaceElevated },
                  ]}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={[styles.loadingText, { color: colors.textMuted }]}
                  >
                    Loading your recommendations...
                  </Text>
                </View>
              ) : yourChoice.length > 0 ? (
                <View>
                  <FlatList
                    data={yourChoice}
                    renderItem={renderFeatured}
                    keyExtractor={keyExtractor}
                    horizontal
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalListGap}
                    onEndReached={loadMoreYourChoice}
                    onEndReachedThreshold={0.5}
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                    removeClippedSubviews={true}
                    ListFooterComponent={
                      loadingMoreYourChoice ? (
                        <View style={styles.footerLoader}>
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        </View>
                      ) : null
                    }
                  />
                  {yourChoiceTotalCount > 10 && (
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: colors.surfaceElevated },
                      ]}
                    >
                      <Text
                        style={[styles.countText, { color: colors.textMuted }]}
                      >
                        {yourChoice.length} of {yourChoiceTotalCount} properties
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View
                  style={[
                    styles.yourChoiceEmpty,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={styles.emptyIcon}>🏠</Text>
                  <Text
                    style={[styles.emptyTitle, { color: colors.textSecondary }]}
                  >
                    {hasPreferences
                      ? t("preferences.noMatchingProperties")
                      : "Personalize your experience"}
                  </Text>
                  <Text
                    style={[styles.emptySubtitle, { color: colors.textMuted }]}
                  >
                    {hasPreferences
                      ? "Try adjusting your preferences"
                      : "Set your preferences to see properties tailored just for you"}
                  </Text>
                  {!hasPreferences && (
                    <TouchableOpacity
                      onPress={() =>
                        router.push("/(root)/(screens)/edit-preferences")
                      }
                      style={[
                        styles.setupButton,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={styles.setupButtonText}>
                        {t("preferences.setNow")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* GREEN HOMES SECTION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View
                  style={[
                    styles.sectionAccent,
                    { backgroundColor: colors.success },
                  ]}
                />
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t("greenHomes.title")}
                  </Text>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: colors.textMuted },
                    ]}
                  >
                    {t("greenHomes.description")}
                  </Text>
                </View>
              </View>
            </View>

            {loadingGreenHomes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.success} />
              </View>
            ) : greenHomes.length > 0 ? (
              <FlatList
                data={greenHomes}
                renderItem={renderGreenHome}
                keyExtractor={keyExtractor}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
              />
            ) : (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {t("greenHomes.noGreenHomes")}
                </Text>
              </View>
            )}
          </View>

          {/* FEATURED PROPERTIES SECTION */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithAction}>
              <View style={styles.sectionTitleContainer}>
                <View
                  style={[
                    styles.sectionAccent,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("properties.featured")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/explore")}
                style={styles.seeAllButton}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  {t("properties.seeAll")}
                </Text>
              </TouchableOpacity>
            </View>

            {loadingFeatured ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : featuredProperties.length > 0 ? (
              <FlatList
                data={featuredProperties}
                renderItem={renderFeatured}
                keyExtractor={keyExtractor}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalListGap}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
              />
            ) : (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {t("properties.noPropertiesFound")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Comparison Floating Button */}
      <ComparisonFloatingButton />

      {/* Chat Floating Button - For Agents with messages */}
      <ChatFloatingButton bottomOffset={100} />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    borderRadius: 28,
    borderWidth: 2,
    padding: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  greetingContainer: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 13,
    fontFamily: "Rubik-Regular",
  },
  userName: {
    fontSize: 18,
    fontFamily: "Rubik-SemiBold",
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  bellIcon: {
    width: 22,
    height: 22,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: "Rubik-Bold",
  },

  // Section
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionHeaderWithAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionAccent: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Rubik-Bold",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Rubik-Regular",
    marginTop: 2,
  },
  seeAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 15,
    fontFamily: "Rubik-SemiBold",
  },

  // Loading
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },

  // Empty state
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
    borderRadius: 16,
  },
  emptyText: {
    fontFamily: "Rubik-Regular",
    fontSize: 14,
  },

  // Horizontal lists
  horizontalList: {
    paddingVertical: 8,
  },
  horizontalListGap: {
    paddingVertical: 4,
    gap: 16,
  },

  // Your Choice specific
  yourChoiceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  yourChoiceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  sparkleIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 13,
    fontFamily: "Rubik-SemiBold",
  },
  yourChoiceLoading: {
    paddingVertical: 40,
    alignItems: "center",
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Rubik-Regular",
    marginTop: 12,
  },
  footerLoader: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    width: 64,
  },
  countBadge: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 40,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Rubik-Medium",
  },
  yourChoiceEmpty: {
    paddingVertical: 40,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: "Rubik-Medium",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: "Rubik-Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  setupButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  setupButtonText: {
    color: "#FFF",
    fontFamily: "Rubik-Bold",
    fontSize: 15,
  },
});
