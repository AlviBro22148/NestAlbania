import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import {
  clearCache,
  fetchAllNearbyPlacesProgressive,
  getCachedPlaces,
  NearbyPlace,
  reverseGeocode,
  ServiceCategory,
} from "@/services/nearbyPlacesService";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  memo,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FilterCategory = "All" | ServiceCategory;

interface LocationState {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

interface LoadingState {
  Schools: boolean;
  Hospitals: boolean;
  Transportation: boolean;
  Shopping: boolean;
  Restaurants: boolean;
}

const LocalServicesScreen = () => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const { colors, isDark } = useTheme();

  // Location state
  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null,
  );
  const [location, setLocation] = useState<LocationState | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Services state
  const [services, setServices] = useState<NearbyPlace[]>([]);
  const [filteredServices, setFilteredServices] = useState<NearbyPlace[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRadius, setSearchRadius] = useState(3); // Start smaller for speed
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState<LoadingState>({
    Schools: true,
    Hospitals: true,
    Transportation: true,
    Shopping: true,
    Restaurants: true,
  });

  const isFetching = useRef(false);
  const selectedCategoryRef = useRef(selectedCategory);
  const searchQueryRef = useRef(searchQuery);

  // Keep refs in sync
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  const categories = useMemo<
    { key: FilterCategory; label: string; icon: string }[]
  >(
    () => [
      { key: "All", label: t("services.categories.all"), icon: "apps" },
      {
        key: "Restaurants",
        label: t("services.categories.food"),
        icon: "restaurant",
      },
      {
        key: "Shopping",
        label: t("services.categories.shopping"),
        icon: "cart",
      },
      {
        key: "Transportation",
        label: t("services.categories.transit"),
        icon: "bus",
      },
      {
        key: "Hospitals",
        label: t("services.categories.hospitals"),
        icon: "medical",
      },
      {
        key: "Schools",
        label: t("services.categories.schools"),
        icon: "school",
      },
    ],
    [t],
  );

  // Memoize to prevent re-renders
  const radiusOptions = useMemo(() => [1, 2, 3, 5, 8], []);

  // Memoized key extractor
  const keyExtractor = useCallback((item: NearbyPlace) => item.id, []);

  const isAnyLoading = Object.values(loadingCategories).some(Boolean);

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationPermission(false);
        setLoadingLocation(false);
        showAlert({
          type: "error",
          title: t("common.error"),
          message: t("services.locationPermissionDenied"),
        });
        return;
      }

      setLocationPermission(true);

      // Get location and geocode in parallel
      try {
        const [currentLocation, _] = await Promise.all([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 10000, // 10 second timeout
          }),
          new Promise((r) => setTimeout(r, 100)), // Small delay for UI
        ]);

        const { latitude, longitude } = currentLocation.coords;

        // Set location immediately, geocode async
        setLocation({ latitude, longitude, city: "", country: "" });
        setLoadingLocation(false);

        // Geocode in background
        reverseGeocode(latitude, longitude).then((result) => {
          if (result) {
            setLocation((prev) =>
              prev
                ? { ...prev, city: result.city, country: result.country }
                : null,
            );
          }
        });
      } catch (locationError: any) {
        console.error("Error getting location:", locationError);
        setLocationPermission(false);
        setLoadingLocation(false);

        // Show specific error message based on the error
        const errorMessage = locationError.message?.includes("unavailable")
          ? t("services.locationUnavailable")
          : t("services.locationError");

        showAlert({
          type: "error",
          title: t("services.locationRequired"),
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      setLocationPermission(false);
      setLoadingLocation(false);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("services.permissionError"),
      });
    }
  };

  // Fetch services progressively
  const fetchServices = useCallback(
    async (forceRefresh = false) => {
      if (!location || isFetching.current) return;

      isFetching.current = true;

      // Check cache first for instant display
      if (!forceRefresh) {
        const cached = getCachedPlaces(
          location.latitude,
          location.longitude,
          searchRadius,
        );
        if (cached && cached.length > 0) {
          setServices(cached);
          filterServices(selectedCategory, searchQuery, cached);
          setLoadingCategories({
            Schools: false,
            Hospitals: false,
            Transportation: false,
            Shopping: false,
            Restaurants: false,
          });
          isFetching.current = false;
          setRefreshing(false);
          return;
        }
      }

      // Reset loading states
      setLoadingCategories({
        Schools: true,
        Hospitals: true,
        Transportation: true,
        Shopping: true,
        Restaurants: true,
      });

      // Fetch progressively - all categories in parallel with retries
      await fetchAllNearbyPlacesProgressive(
        location.latitude,
        location.longitude,
        searchRadius,
        (category, places) => {
          // Update loading state for this category
          setLoadingCategories((prev) => ({ ...prev, [category]: false }));

          // Add places to the list
          setServices((prev) => {
            const newServices = [
              ...prev.filter((s) => s.category !== category),
              ...places,
            ];
            newServices.sort((a, b) => a.distance - b.distance);

            // Update filtered list immediately using refs for latest values
            let filtered = newServices;
            const currentCategory = selectedCategoryRef.current;
            const currentSearch = searchQueryRef.current;

            if (currentCategory !== "All") {
              filtered = filtered.filter((s) => s.category === currentCategory);
            }
            if (currentSearch.trim()) {
              const query = currentSearch.toLowerCase();
              filtered = filtered.filter(
                (s) =>
                  s.name.toLowerCase().includes(query) ||
                  s.description.toLowerCase().includes(query) ||
                  s.address.toLowerCase().includes(query),
              );
            }
            setFilteredServices(filtered);

            return newServices;
          });
        },
      );

      isFetching.current = false;
      setRefreshing(false);
    },
    [location, searchRadius, selectedCategory, searchQuery],
  );

  // Initial load - fetch immediately on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Fetch when location available
  useEffect(() => {
    if (location) {
      setServices([]);
      fetchServices();
    }
  }, [location, searchRadius]);

  const onRefresh = () => {
    setRefreshing(true);
    clearCache();
    setServices([]);
    fetchServices(true);
  };

  const filterServices = (
    category: FilterCategory,
    search: string,
    servicesList: NearbyPlace[] = services,
  ) => {
    let filtered = servicesList;

    if (category !== "All") {
      filtered = filtered.filter((s) => s.category === category);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query),
      );
    }

    setFilteredServices(filtered);
  };

  const handleCategoryChange = (category: FilterCategory) => {
    setSelectedCategory(category);
    filterServices(category, searchQuery);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    filterServices(selectedCategory, text);
  };

  const handleRadiusChange = (radius: number) => {
    if (radius !== searchRadius) {
      setSearchRadius(radius);
    }
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      showAlert({
        type: "info",
        title: t("services.noPhone"),
        message: t("services.noPhoneMessage"),
      });
    }
  };

  const handleOpenWebsite = (website: string) => {
    if (website) {
      Linking.openURL(website);
    } else {
      showAlert({
        type: "info",
        title: t("services.noWebsite"),
        message: t("services.noWebsiteMessage"),
      });
    }
  };

  const handleGetDirections = (latitude: number, longitude: number) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });
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

  const formatDistance = (distanceKm: number) => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  };

  // Memoized render function
  const renderServiceCard = useCallback(
    ({ item }: { item: NearbyPlace }) => (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface },
          cardShadow
        ]}
      >
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
                <Text
                  className="text-lg font-rubik-bold"
                  style={{ color: colors.text }}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <View className="flex-row items-center mt-1 flex-wrap">
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
                      {item.description}
                    </Text>
                  </View>
                  <View className="flex-row items-center ml-2">
                    <Ionicons
                      name="location"
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text
                      className="text-xs font-rubik ml-1"
                      style={{ color: colors.textSecondary }}
                    >
                      {formatDistance(item.distance)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {item.address !== "Address not available" && (
          <View className="flex-row items-start mb-3">
            <Ionicons
              name="location-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text
              className="text-sm font-rubik ml-2 flex-1"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {item.address}
              {item.city ? `, ${item.city}` : ""}
            </Text>
          </View>
        )}

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleCall(item.phone)}
            className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
            style={{
              backgroundColor: item.phone
                ? isDark
                  ? "#0061FF20"
                  : "#E0EDFF"
                : colors.surfaceElevated,
            }}
          >
            <Ionicons
              name="call"
              size={16}
              color={item.phone ? colors.primary : colors.textMuted}
            />
            <Text
              className="font-rubik-semibold ml-2"
              style={{ color: item.phone ? colors.primary : colors.textMuted }}
            >
              {t("services.call")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleGetDirections(item.latitude, item.longitude)}
            className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: isDark ? "#10B98120" : "#D1FAE5" }}
          >
            <Ionicons name="navigate" size={16} color="#10B981" />
            <Text
              className="font-rubik-semibold ml-2"
              style={{ color: "#10B981" }}
            >
              {t("services.directions")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOpenWebsite(item.website)}
            className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
            style={{
              backgroundColor: item.website
                ? isDark
                  ? "#8B5CF620"
                  : "#EDE9FE"
                : colors.surfaceElevated,
            }}
          >
            <Ionicons
              name="globe"
              size={16}
              color={item.website ? "#8B5CF6" : colors.textMuted}
            />
            <Text
              className="font-rubik-semibold ml-2"
              style={{ color: item.website ? "#8B5CF6" : colors.textMuted }}
            >
              {t("services.website")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [colors, isDark, t, handleCall, handleGetDirections, handleOpenWebsite],
  );

  // Loading location screen
  if (loadingLocation) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            className="mt-4 font-rubik text-center"
            style={{ color: colors.textSecondary }}
          >
            {t("services.gettingLocation")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied screen
  if (locationPermission === false) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: isDark ? "#EF444420" : "#FEE2E2" }}
          >
            <Ionicons name="location-outline" size={40} color="#EF4444" />
          </View>
          <Text
            className="text-xl font-rubik-bold text-center mb-2"
            style={{ color: colors.text }}
          >
            {t("services.locationRequired")}
          </Text>
          <Text
            className="font-rubik text-center mb-6"
            style={{ color: colors.textSecondary }}
          >
            {t("services.locationRequiredMessage")}
          </Text>
          <TouchableOpacity
            onPress={requestLocationPermission}
            className="px-8 py-4 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-rubik-bold">
              {t("services.enableLocation")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            className="mt-3 px-8 py-3"
          >
            <Text
              className="font-rubik-semibold"
              style={{ color: colors.primary }}
            >
              {t("services.openSettings")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.headerContent}>
          <View
            style={[styles.accentLine, { backgroundColor: colors.accent }]}
          />
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("services.title")}
            </Text>
            {location && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.accent} />
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                >
                  {location.city
                    ? `${location.city}, ${location.country}`
                    : t("services.yourLocation")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View
        className="px-6 py-3 border-b"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
        }}
      >
        <View
          className="flex-row items-center rounded-xl px-4 py-2.5"
          style={{ backgroundColor: colors.surfaceElevated }}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            placeholder={t("services.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            className="flex-1 ml-3 font-rubik"
            style={{ color: colors.text }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Radius Selector */}
      <View
        className="border-b px-6 py-2.5"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text
            className="text-sm font-rubik-semibold"
            style={{ color: colors.textSecondary }}
          >
            {t("services.searchRadius")}
          </Text>
          <View className="flex-row gap-1.5">
            {radiusOptions.map((radius) => (
              <TouchableOpacity
                key={radius}
                onPress={() => handleRadiusChange(radius)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor:
                    searchRadius === radius
                      ? colors.primary
                      : colors.surfaceElevated,
                }}
              >
                <Text
                  className="text-sm font-rubik-semibold"
                  style={{
                    color: searchRadius === radius ? "white" : colors.text,
                  }}
                >
                  {radius}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Category Filter */}
      <View
        className="border-b"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 10 }}
        >
          {categories.map((item) => {
            const isLoading =
              item.key !== "All" &&
              loadingCategories[item.key as ServiceCategory];
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => handleCategoryChange(item.key)}
                className="mr-2.5 px-3.5 py-2 rounded-xl flex-row items-center"
                style={{
                  backgroundColor:
                    selectedCategory === item.key
                      ? colors.primary
                      : colors.surfaceElevated,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator
                    size={14}
                    color={
                      selectedCategory === item.key ? "white" : colors.textMuted
                    }
                  />
                ) : (
                  <Ionicons
                    name={item.icon as any}
                    size={16}
                    color={
                      selectedCategory === item.key ? "white" : colors.textMuted
                    }
                  />
                )}
                <Text
                  className="ml-1.5 font-rubik-semibold text-sm"
                  style={{
                    color:
                      selectedCategory === item.key ? "white" : colors.text,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Services List */}
      <View className="flex-1">
        {services.length === 0 && isAnyLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              className="mt-4 font-rubik"
              style={{ color: colors.textSecondary }}
            >
              {t("services.findingPlaces")}
            </Text>
          </View>
        ) : filteredServices.length === 0 && !isAnyLoading ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons
              name="location-outline"
              size={64}
              color={colors.textMuted}
            />
            <Text
              className="text-lg font-rubik-bold mt-4 text-center"
              style={{ color: colors.text }}
            >
              {t("services.noServices")}
            </Text>
            <Text
              className="text-sm font-rubik mt-2 text-center"
              style={{ color: colors.textSecondary }}
            >
              {t("services.noServicesMessage")}
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
              className="mt-4 px-6 py-3 rounded-xl"
              style={{
                backgroundColor: isDark ? colors.primaryLight : "#E0EDFF",
              }}
            >
              <Text
                className="font-rubik-semibold"
                style={{ color: colors.primary }}
              >
                {t("services.tryAgain")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={filteredServices}
            keyExtractor={keyExtractor}
            renderItem={renderServiceCard}
            estimatedItemSize={180}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            ListHeaderComponent={
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="text-sm font-rubik"
                  style={{ color: colors.textSecondary }}
                >
                  {t("services.foundPlaces", {
                    count: filteredServices.length,
                  })}
                </Text>
                {isAnyLoading && (
                  <View className="flex-row items-center">
                    <ActivityIndicator size={12} color={colors.primary} />
                    <Text
                      className="text-xs font-rubik ml-1"
                      style={{ color: colors.primary }}
                    >
                      Loading more...
                    </Text>
                  </View>
                )}
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: layout.screenPaddingX,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  accentLine: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Rubik-Bold",
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Rubik-Regular",
    marginTop: 2,
  },
  card: {
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Rubik-Regular",
    marginLeft: 4,
  },
});

export default memo(LocalServicesScreen);
