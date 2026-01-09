import { FeaturedCard, TodaysChoiceCard } from "@/components/Cards";
import { GreenHomeCard } from "@/components/GreenHomeCard";
import ComparisonFloatingButton from "@/components/ComparisonFloatingButton";
import ChatFloatingButton from "@/components/ChatFloatingButton";
import icons from "@/constants/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import api from "@/lib/axios-config";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const { unreadCount, refreshCount } = useNotificationCount();
  const { hasPreferences, fetchPreferences } = useUserPreferences();

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
    }, [isAuthenticated])
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
  const renderTodaysChoice = useCallback(({ item }: { item: Property }) => (
    <TodaysChoiceCard
      property={item}
      onPress={() => handlePropertyPress(item.id)}
    />
  ), [handlePropertyPress]);

  const renderFeatured = useCallback(({ item }: { item: Property }) => (
    <FeaturedCard
      property={item}
      onPress={() => handlePropertyPress(item.id)}
    />
  ), [handlePropertyPress]);

  const renderGreenHome = useCallback(({ item }: { item: any }) => (
    <GreenHomeCard
      property={item}
      onPress={() => handlePropertyPress(item.id)}
    />
  ), [handlePropertyPress]);

  const keyExtractor = useCallback((item: Property) => item.id.toString(), []);

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0061FF"
            colors={["#0061FF"]}
          />
        }
      >
        <View className="px-4 pb-32">
          {/* User Greeting + Notifications */}
          <View className="flex flex-row items-center justify-between mt-5 mb-2">
            <View className="flex flex-row items-center">
              <Image
                source={{
                  uri: user?.profilePictureUrl,
                }}
                className="size-12 rounded-full"
              />
              <View className="flex flex-col items-start ml-2 justify-center">
                <Text className="text-xs font-rubik text-black-100">
                  {t("common.goodMorning")}
                </Text>
                <Text className="text-base font-rubik-medium text-black-300">
                  {user?.username}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={notifications} className="relative">
              <Image source={icons.bell} className="size-6" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-[#EF4444] rounded-full flex items-center justify-center min-w-[16px] h-4 px-1">
                  <Text className="text-white text-[10px] font-bold">
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* TODAY'S CHOICE SECTION */}
          <View className="my-5 mt-8">
            <View className="flex flex-row items-center justify-between mb-3">
              <View className="flex flex-row items-center">
                <View>
                  <Text className="text-2xl font-rubik-extrabold text-black-300">
                    {t("properties.todaysChoice")}
                  </Text>
                  <Text className="text-xs font-rubik text-gray-500 mt-0.5">
                    {t("properties.todaysChoiceDescription")}
                  </Text>
                </View>
              </View>
            </View>

            {loadingTodaysChoice ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#F59E0B" />
              </View>
            ) : todaysChoice.length > 0 ? (
              <FlatList
                data={todaysChoice}
                renderItem={renderTodaysChoice}
                keyExtractor={keyExtractor}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="py-2"
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
              />
            ) : (
              <View className="py-8 items-center">
                <Text className="text-gray-500 font-rubik">
                  {t("properties.noPropertiesFound")}
                </Text>
              </View>
            )}
          </View>

          {/* YOUR CHOICE SECTION - Personalized based on preferences */}
          {isAuthenticated && (
            <View className="mt-8 mb-5">
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-2xl mr-2">✨</Text>
                    <Text className="text-xl font-rubik-bold text-black-300">
                      {t("preferences.yourChoice")}
                    </Text>
                  </View>
                  <Text className="text-xs font-rubik text-gray-500">
                    {hasPreferences
                      ? t("preferences.personalizedForYou")
                      : t("preferences.setPreferencesToPersonalize")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/(root)/(tabs)/edit-preferences")}
                  className="bg-primary-100 px-3 py-1.5 rounded-full"
                >
                  <Text className="text-sm font-rubik-medium text-primary-300">
                    {hasPreferences ? "Edit" : "Set Up"}
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingYourChoice ? (
                <View className="py-10 items-center bg-gray-50 rounded-2xl">
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text className="text-gray-400 font-rubik text-sm mt-3">
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
                    contentContainerClassName="flex gap-4 py-1"
                    onEndReached={loadMoreYourChoice}
                    onEndReachedThreshold={0.5}
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                    removeClippedSubviews={true}
                    ListFooterComponent={
                      loadingMoreYourChoice ? (
                        <View className="justify-center items-center px-4 w-16">
                          <ActivityIndicator size="small" color="#8B5CF6" />
                        </View>
                      ) : null
                    }
                  />
                  {yourChoiceTotalCount > 10 && (
                    <View className="flex-row justify-center items-center mt-4 bg-gray-50 py-2 rounded-full mx-10">
                      <Text className="text-xs font-rubik-medium text-gray-500">
                        {yourChoice.length} of {yourChoiceTotalCount} properties
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="py-10 items-center bg-gray-50 rounded-2xl border border-gray-100">
                  <Text className="text-4xl mb-3">🏠</Text>
                  <Text className="text-gray-600 font-rubik-medium text-center px-6 mb-1">
                    {hasPreferences
                      ? t("preferences.noMatchingProperties")
                      : "Personalize your experience"}
                  </Text>
                  <Text className="text-gray-400 font-rubik text-sm text-center px-8 mb-4">
                    {hasPreferences
                      ? "Try adjusting your preferences"
                      : "Set your preferences to see properties tailored just for you"}
                  </Text>
                  {!hasPreferences && (
                    <TouchableOpacity
                      onPress={() => router.push("/(root)/(tabs)/edit-preferences")}
                      className="bg-primary-300 px-6 py-3 rounded-full shadow-sm"
                    >
                      <Text className="text-white font-rubik-bold">
                        {t("preferences.setNow")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* GREEN HOMES SECTION */}
          <View className="my-5 mt-8">
            <View className="flex flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-2xl font-rubik-extrabold text-black-300">
                  {t("greenHomes.title")}
                </Text>
                <Text className="text-xs font-rubik text-gray-500 mt-0.5">
                  {t("greenHomes.description")}
                </Text>
              </View>
            </View>

            {loadingGreenHomes ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            ) : greenHomes.length > 0 ? (
              <FlatList
                data={greenHomes}
                renderItem={renderGreenHome}
                keyExtractor={keyExtractor}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="py-2"
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
              />
            ) : (
              <View className="py-8 items-center">
                <Text className="text-gray-500 font-rubik">
                  {t("greenHomes.noGreenHomes")}
                </Text>
              </View>
            )}
          </View>

          {/* FEATURED PROPERTIES SECTION */}
          <View className="my-5 mt-8">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-rubik-extrabold text-black-300">
                {t("properties.featured")}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/explore")}
              >
                <Text className="text-base font-rubik-bold text-primary-300 px-1">
                  {t("properties.seeAll")}
                </Text>
              </TouchableOpacity>
            </View>

            {loadingFeatured ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#0061FF" />
              </View>
            ) : featuredProperties.length > 0 ? (
              <FlatList
                data={featuredProperties}
                renderItem={renderFeatured}
                keyExtractor={keyExtractor}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="flex gap-5"
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
              />
            ) : (
              <View className="py-8 items-center">
                <Text className="text-gray-500 font-rubik">
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
