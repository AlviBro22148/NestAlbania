import ComparisonFloatingButton from "@/components/ComparisonFloatingButton";
import PropertyCard from "@/components/PropertyCard";
import FilterModal, { PropertyFilters } from "@/components/PropertyFilter";
import icons from "@/constants/icons";
import api from "@/lib/axios-config";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
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
  ownerName: string;
  createdAt: string;
  listingType: "Sale" | "Rent" | string;
  monthlyRent: number | null;
}

interface PaginatedResponse {
  properties: Property[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalProperties: number;
  hasNextPage: boolean;
}

export default function ExploreScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<PropertyFilters>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const { t } = useTranslation();
  const pageSize = 10;

  // Fetch properties with filters
  const fetchProperties = async (page: number, isRefresh = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const hasFilters = Object.keys(activeFilters).length > 0;

      let response;

      if (hasFilters) {
        response = await api.post<PaginatedResponse>("/api/properties/filter", {
          ...activeFilters,
          page: page,
          pageSize: pageSize,
        });
      } else {
        response = await api.get<PaginatedResponse>(
          `/api/properties/paginated?page=${page}&pageSize=${pageSize}`
        );
      }

      const { properties: newProperties, hasNextPage: hasNext } = response.data;

      if (isRefresh || page === 1) {
        setProperties(newProperties);
        setFilteredProperties(newProperties);
      } else {
        setProperties((prev) => [...prev, ...newProperties]);
        setFilteredProperties((prev) => [...prev, ...newProperties]);
      }

      setHasNextPage(hasNext);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useFocusEffect(
    useCallback(() => {
      fetchProperties(1, true);
    }, [activeFilters])
  );

  // Search filter
  React.useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(
        (property) =>
          property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.propertyType
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
  }, [searchQuery, properties]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchProperties(1, true);
  }, [activeFilters]);

  // Load more properties
  const loadMore = () => {
    if (!loadingMore && hasNextPage) {
      fetchProperties(currentPage + 1);
    }
  };

  // Handle filter apply
  const handleApplyFilters = (filters: PropertyFilters) => {
    setActiveFilters(filters);
    setHasActiveFilters(Object.keys(filters).length > 0);
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveFilters({});
    setHasActiveFilters(false);
    setCurrentPage(1);
  };

  // Render loading footer
  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View className="py-4">
        <ActivityIndicator size="large" color="#0061ff" />
      </View>
    );
  };

  // Handle property card press
  const handlePropertyPress = useCallback((propertyId: number) => {
    router.push(`/(root)/properties/${propertyId}`);
  }, []);

  // Memoized key extractor
  const keyExtractor = useCallback((item: Property) => item.id.toString(), []);

  // Memoized render item
  const renderPropertyCard = useCallback(({ item }: { item: Property }) => (
    <View className="px-6">
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
        listingType={item.listingType}
        monthlyRent={item.monthlyRent ?? undefined}
        onPress={() => handlePropertyPress(item.id)}
      />
    </View>
  ), [handlePropertyPress]);

  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-6xl mb-4">🏠</Text>
        <Text className="text-xl font-rubik-bold text-gray-700 mb-2">
          {t("properties.noPropertiesFound")}
        </Text>
        <Text className="text-gray-500 text-center px-8">
          {searchQuery || hasActiveFilters
            ? t("properties.tryDifferentSearch")
            : t("properties.beFirstToAdd")}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity
            onPress={handleClearFilters}
            className="mt-4 bg-primary-300 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-rubik-bold">
              {t("common.clearAll")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-3xl font-rubik-bold text-black-300 mb-5 mt-3">
          {t("properties.explore")}
        </Text>

        {/* Search Bar */}
        <View className="bg-gray-100 rounded-xl flex-row items-center px-4 py-1 mb-2">
          <Image source={icons.search} className="size-6 mr-1 mb-1" />
          <TextInput
            placeholder={t("placeholders.searchProperties")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 font-rubik text-base mt-1"
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
            <View className="relative">
              <Image source={icons.filter} className="size-6 mr-2 mb-1" />
              {hasActiveFilters && (
                <View className="absolute -top-1 -right-1 bg-primary-300 rounded-full w-3 h-3" />
              )}
            </View>
          </TouchableOpacity>
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text className="text-gray-400 text-lg ml-2">✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <View className="flex-row items-center mt-2">
            <Text className="text-sm font-rubik text-primary-300">
              {t("filters.filtersActive")}
            </Text>
            <TouchableOpacity
              onPress={handleClearFilters}
              className="ml-2 px-3 py-1 bg-primary-100 rounded-full"
            >
              <Text className="text-xs font-rubik-bold text-primary-300">
                {t("common.clearAll")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Count */}
        <Text className="text-sm font-rubik text-gray-500 mt-2">
          {filteredProperties.length} {t("properties.propertiesFound")}
        </Text>
      </View>

      {/* Properties List */}
      {loading && currentPage === 1 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0061ff" />
          <Text className="text-gray-500 mt-4">{t("common.loading")}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={keyExtractor}
          renderItem={renderPropertyCard}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0061ff"
              colors={["#0061ff"]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews={true}
          getItemLayout={(_, index) => ({
            length: 280,
            offset: 280 * index,
            index,
          })}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
      />

      {/* Comparison Floating Button */}
      <ComparisonFloatingButton />
    </SafeAreaView>
  );
}
