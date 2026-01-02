import { FeaturedCard, TodaysChoiceCard } from "@/components/Cards";
import { GreenHomeCard } from "@/components/GreenHomeCard";
import ComparisonFloatingButton from "@/components/ComparisonFloatingButton";
import ChatFloatingButton from "@/components/ChatFloatingButton";
import icons from "@/constants/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import api from "@/lib/axios-config";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
  const { user } = useAuth();
  const { t } = useTranslation();
  const { unreadCount, refreshCount } = useNotificationCount();

  // State for three sections
  const [todaysChoice, setTodaysChoice] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [greenHomes, setGreenHomes] = useState<Property[]>([]);

  // Loading states
  const [loadingTodaysChoice, setLoadingTodaysChoice] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingGreenHomes, setLoadingGreenHomes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTodaysChoice();
    fetchFeaturedProperties();
    fetchGreenHomes();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshCount();
    }, [])
  );

  // Fetch Today's Choice properties
  const fetchTodaysChoice = async () => {
    try {
      const response = await api.get("/api/properties/todays-choice");
      setTodaysChoice(response.data);
    } catch (error: any) {
      // If endpoint doesn't exist yet (404), use featured properties as fallback
      if (error.response?.status === 404) {
        console.log(
          "Today's Choice endpoint not implemented yet, using featured as fallback"
        );
        setTodaysChoice([]); // Will show empty state
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
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);
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

  const notifications = () => {
    router.push("/notifications");
  };

  // Pull-to-refresh handler - refreshes all sections
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchTodaysChoice(), fetchFeaturedProperties(), fetchGreenHomes()]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handlePropertyPress = (propertyId: number) => {
    router.push(`/(root)/properties/${propertyId}`);
  };

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

              {/* Logic: Only show View if unreadCount > 0 */}
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
                {/* <Text className="text-2xl mr-2">⭐</Text> */}
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
                renderItem={({ item }) => (
                  <TodaysChoiceCard
                    property={item}
                    onPress={() => handlePropertyPress(item.id)}
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="py-2"
              />
            ) : (
              <View className="py-8 items-center">
                <Text className="text-gray-500 font-rubik">
                  {t("properties.noPropertiesFound")}
                </Text>
              </View>
            )}
          </View>

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
                renderItem={({ item }) => (
                  <GreenHomeCard
                    property={item}
                    onPress={() => handlePropertyPress(item.id)}
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="py-2"
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
                renderItem={({ item }) => (
                  <FeaturedCard
                    property={item}
                    onPress={() => handlePropertyPress(item.id)}
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="flex gap-5"
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
