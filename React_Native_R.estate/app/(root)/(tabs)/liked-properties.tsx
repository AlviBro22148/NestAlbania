import ComparisonFloatingButton from "@/components/ComparisonFloatingButton";
import PropertyCard from "@/components/PropertyCard";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
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

const LikedProperties = () => {
  const [likedProperties, setLikedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const fetchLikedProperties = async () => {
    try {
      const response = await api.get("/api/likedproperties");
      setLikedProperties(response.data);
    } catch (error: any) {
      console.error("Error fetching liked properties:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLikedProperties();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLikedProperties();
  };

  const handleLikeChange = () => {
    fetchLikedProperties();
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-32">
      <View className="bg-gradient-to-br from-red-50 to-pink-50 rounded-full p-8 mb-6">
        <Ionicons name="heart-outline" size={80} color="#EF4444" />
      </View>
      <Text className="text-2xl font-rubik-extrabold text-gray-900 mb-2">
        {t("properties.noLikedProperties")}
      </Text>
      <Text className="text-base font-rubik text-gray-500 text-center px-12 leading-6">
        {t("properties.likedPropertiesDescription")}
      </Text>
      <View className="mt-8 bg-red-50 px-6 py-4 rounded-2xl border border-red-100">
        <View className="flex-row items-center">
          <Ionicons name="information-circle" size={24} color="#EF4444" />
          <Text className="text-sm font-rubik-medium text-gray-700 ml-3 flex-1">
            Tap the ❤️ icon on any property to add it here
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-b from-red-50 to-white">
        <View className="flex-1 items-center justify-center">
          <View className="bg-white rounded-full p-8 shadow-xl">
            <ActivityIndicator size="large" color="#EF4444" />
          </View>
          <Text className="text-gray-600 font-rubik-medium mt-6 text-lg">
            {t("common.loading")}
          </Text>
          <Text className="text-gray-400 font-rubik text-sm mt-2">
            Loading your favorites...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Gradient Header */}
      <View>
        <LinearGradient
          colors={["#FEE2E2", "#FECACA", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 py-8 rounded-b-[32px] shadow-lg"
        >
          <View className="flex-row items-center">
            {/* Animated Heart Container */}
            <View className="relative">
              <View className="absolute inset-0 bg-red-400 rounded-full opacity-20 animate-pulse" />
              <View className="bg-white rounded-full p-4 shadow-md">
                <Ionicons name="heart" size={32} color="#EF4444" />
              </View>
              {/* Floating Badge */}
              {likedProperties.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[24px] h-6 items-center justify-center px-2 border-2 border-white">
                  <Text className="text-white text-xs font-rubik-bold">
                    {likedProperties.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Header Text */}
            <View className="ml-5 flex-1">
              <Text className="text-3xl font-rubik-extrabold text-gray-900">
                {t("profile.likedProperties")}
              </Text>
              <View className="flex-row items-center mt-2">
                <View className="bg-red-100 px-3 py-1 rounded-full">
                  <Text className="text-sm font-rubik-bold text-red-600">
                    {likedProperties.length}
                    {"  "}
                    {likedProperties.length === 1
                      ? t("common.likedProperty")
                      : t("profile.property")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Decorative Elements */}
          <View className="absolute -right-8 -top-8 w-32 h-32 bg-red-200 rounded-full opacity-20" />
          <View className="absolute -left-4 -bottom-4 w-24 h-24 bg-pink-200 rounded-full opacity-20" />
        </LinearGradient>
      </View>

      {/* Properties List */}
      <FlatList
        data={likedProperties}
        renderItem={({ item }) => (
          <View className="px-4">
            <PropertyCard
              id={item.id}
              title={item.title}
              price={item.price}
              address={item.address}
              bedrooms={item.bedrooms}
              bathrooms={item.bathrooms}
              area={item.area}
              images={item.images}
              propertyType={item.propertyType}
              onLikeChange={handleLikeChange}
            />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 120,
        }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EF4444"
            colors={["#EF4444", "#F87171", "#FCA5A5"]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          likedProperties.length > 0 ? (
            <View className="mb-4 px-4">
              <View className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-2xl border border-red-100">
                <View className="flex-row items-center">
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color="#EF4444"
                  />
                  <Text className="text-sm font-rubik-medium text-gray-700 flex-1 ml-2">
                    Your collection of favorite properties
                  </Text>
                </View>
              </View>
            </View>
          ) : null
        }
      />

      {/* Comparison Floating Button */}
      <ComparisonFloatingButton />
    </SafeAreaView>
  );
};

export default LikedProperties;
