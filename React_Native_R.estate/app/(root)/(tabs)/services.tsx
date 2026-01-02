import { useAlert } from "@/contexts/AlertContext";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Service {
  id: number;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website: string;
  description: string;
  latitude: number;
  longitude: number;
  rating: number;
  distance: number;
}

type ServiceCategory =
  | "All"
  | "Schools"
  | "Hospitals"
  | "Transportation"
  | "Shopping"
  | "Restaurants";

const LocalServicesScreen = () => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories: { key: ServiceCategory; label: string; icon: string }[] = [
    { key: "All", label: "All", icon: "apps" },
    { key: "Schools", label: "Schools", icon: "school" },
    { key: "Hospitals", label: "Hospitals", icon: "medical" },
    { key: "Transportation", label: "Transit", icon: "bus" },
    { key: "Shopping", label: "Shopping", icon: "cart" },
    { key: "Restaurants", label: "Food", icon: "restaurant" },
  ];

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [])
  );

  const fetchServices = async () => {
    try {
      const response = await api.get("/api/LocalServices");
      setServices(response.data);
      setFilteredServices(response.data);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to load local services",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const filterServices = (category: ServiceCategory, search: string) => {
    let filtered = services;

    // Filter by category
    if (category !== "All") {
      filtered = filtered.filter((s) => s.category === category);
    }

    // Filter by search query
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query) ||
          s.city.toLowerCase().includes(query)
      );
    }

    setFilteredServices(filtered);
  };

  const handleCategoryChange = (category: ServiceCategory) => {
    setSelectedCategory(category);
    filterServices(category, searchQuery);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    filterServices(selectedCategory, text);
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleOpenWebsite = (website: string) => {
    if (website) {
      Linking.openURL(website);
    }
  };

  const handleGetDirections = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Schools":
        return "#3B82F6";
      case "Hospitals":
        return "#EF4444";
      case "Transportation":
        return "#10B981";
      case "Shopping":
        return "#F59E0B";
      case "Restaurants":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Schools":
        return "school";
      case "Hospitals":
        return "medical";
      case "Transportation":
        return "bus";
      case "Shopping":
        return "cart";
      case "Restaurants":
        return "restaurant";
      default:
        return "business";
    }
  };

  const renderServiceCard = ({ item }: { item: Service }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View
              style={{ backgroundColor: getCategoryColor(item.category) }}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Ionicons
                name={getCategoryIcon(item.category) as any}
                size={20}
                color="white"
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-lg font-rubik-bold text-black-300">
                {item.name}
              </Text>
              <View className="flex-row items-center mt-1">
                <View
                  style={{
                    backgroundColor: getCategoryColor(item.category) + "20",
                  }}
                  className="px-2 py-1 rounded-full"
                >
                  <Text
                    style={{ color: getCategoryColor(item.category) }}
                    className="text-xs font-rubik-bold"
                  >
                    {item.category}
                  </Text>
                </View>
                {item.distance > 0 && (
                  <View className="flex-row items-center ml-2">
                    <Ionicons name="location" size={12} color="#6B7280" />
                    <Text className="text-xs text-gray-600 font-rubik ml-1">
                      {item.distance.toFixed(1)} mi
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        {item.rating > 0 && (
          <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-full">
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text className="text-sm font-rubik-bold text-yellow-600 ml-1">
              {item.rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      {item.description && (
        <Text className="text-sm text-gray-700 font-rubik mb-3">
          {item.description}
        </Text>
      )}

      {/* Address */}
      <View className="flex-row items-start mb-3">
        <Ionicons name="location-outline" size={16} color="#6B7280" />
        <Text className="text-sm text-gray-600 font-rubik ml-2 flex-1">
          {item.address}, {item.city}, {item.state} {item.zipCode}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        {item.phone && (
          <TouchableOpacity
            onPress={() => handleCall(item.phone)}
            className="flex-1 bg-primary-100 py-3 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="call" size={16} color="#0061FF" />
            <Text className="text-primary-300 font-rubik-semibold ml-2">
              Call
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => handleGetDirections(item.latitude, item.longitude)}
          className="flex-1 bg-green-100 py-3 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="navigate" size={16} color="#10B981" />
          <Text className="text-green-600 font-rubik-semibold ml-2">
            Directions
          </Text>
        </TouchableOpacity>
        {item.website && (
          <TouchableOpacity
            onPress={() => handleOpenWebsite(item.website)}
            className="flex-1 bg-purple-100 py-3 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="globe" size={16} color="#8B5CF6" />
            <Text className="text-purple-600 font-rubik-semibold ml-2">
              Website
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0061FF" />
          <Text className="text-gray-600 mt-4 font-rubik">
            Loading local services...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-rubik-bold text-black-300">
          🏙️ Local Services
        </Text>
        <Text className="text-sm font-rubik text-gray-500 mt-1">
          Discover services near you
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search services, locations..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
            className="flex-1 ml-3 font-rubik text-black-300"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View className="bg-white border-b border-gray-100">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleCategoryChange(item.key)}
              className={`mr-3 px-4 py-2 rounded-xl flex-row items-center ${
                selectedCategory === item.key ? "bg-primary-300" : "bg-gray-100"
              }`}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={selectedCategory === item.key ? "white" : "#6B7280"}
              />
              <Text
                className={`ml-2 font-rubik-semibold ${
                  selectedCategory === item.key ? "text-white" : "text-gray-700"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Services List */}
      <View className="flex-1">
        {filteredServices.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="location-outline" size={64} color="#D1D5DB" />
            <Text className="text-lg font-rubik-bold text-gray-900 mt-4 text-center">
              No Services Found
            </Text>
            <Text className="text-sm text-gray-600 font-rubik mt-2 text-center">
              Try adjusting your filters or search query
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderServiceCard}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={
              <View className="mb-3">
                <Text className="text-sm font-rubik text-gray-600">
                  Found {filteredServices.length} service
                  {filteredServices.length !== 1 ? "s" : ""}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default LocalServicesScreen;
