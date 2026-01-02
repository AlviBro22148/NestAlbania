import { useAlert } from "@/contexts/AlertContext";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface MarketOverview {
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  averagePrice: number;
  medianPrice: number;
  lowestPrice: number;
  highestPrice: number;
}

interface PropertyTypeData {
  propertyType: string;
  averagePrice: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}

interface TrendData {
  trends: { month: string; averagePrice: number; count: number }[];
  trendPercentage: number | null;
  trendDirection: string;
}

interface ForecastData {
  forecast?: string | { month: string; projectedPrice: number }[];
  message?: string;
  currentAveragePrice: number;
  growthRate: number;
  recommendation: string;
}

const MarketScreen = () => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [pricesByType, setPricesByType] = useState<PropertyTypeData[]>([]);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "trends" | "forecast"
  >("overview");
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchMarketData();
    }, [])
  );

  const fetchMarketData = async () => {
    try {
      setError(null);
      console.log("Starting to fetch market data...");

      // Test the connection first
      try {
        const testResponse = await api.get("/api/MarketAnalysis/test");
        console.log("Test endpoint response:", testResponse.data);
      } catch (testError: any) {
        console.error(
          "Test endpoint failed:",
          testError.response?.status,
          testError.message
        );
      }

      // Fetch all endpoints with individual error handling
      const results = await Promise.allSettled([
        api.get("/api/MarketAnalysis/overview"),
        api.get("/api/MarketAnalysis/by-property-type"),
        api.get("/api/MarketAnalysis/trends"),
        api.get("/api/MarketAnalysis/forecast"),
      ]);

      console.log(
        "All requests completed:",
        results.map((r, i) => ({
          endpoint: i,
          status: r.status,
          ...(r.status === "rejected" && { reason: r.reason?.message }),
        }))
      );

      // Process overview
      if (results[0].status === "fulfilled") {
        setOverview(results[0].value.data);
        console.log("Overview loaded:", results[0].value.data);
      } else {
        console.error("Overview failed:", results[0].reason);
        throw new Error(
          `Overview: ${results[0].reason?.message || "Unknown error"}`
        );
      }

      // Process property types
      if (results[1].status === "fulfilled") {
        setPricesByType(results[1].value.data);
        console.log("Property types loaded:", results[1].value.data.length);
      } else {
        console.error("Property types failed:", results[1].reason);
        setPricesByType([]);
      }

      // Process trends
      if (results[2].status === "fulfilled") {
        setTrends(results[2].value.data);
        console.log("Trends loaded:", results[2].value.data);
      } else {
        console.error("Trends failed:", results[2].reason);
        setTrends({
          trends: [],
          trendPercentage: null,
          trendDirection: "stable",
        });
      }

      // Process forecast
      if (results[3].status === "fulfilled") {
        setForecast(results[3].value.data);
        console.log("Forecast loaded:", results[3].value.data);
      } else {
        console.error("Forecast failed:", results[3].reason);
        setForecast({
          forecast: "insufficient_data",
          message: "Unable to load forecast",
          currentAveragePrice: 0,
          growthRate: 0,
          recommendation: "Data unavailable",
        });
      }
    } catch (error: any) {
      console.error("Critical error fetching market data:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load market data";

      setError(errorMessage);

      showAlert({
        type: "error",
        title: "Error Loading Data",
        message: `${errorMessage}\n\nStatus: ${error.response?.status || "Unknown"}\nURL: ${error.config?.url || "Unknown"}`,
        buttons: [
          { text: "Retry", onPress: () => fetchMarketData() },
          { text: "Cancel", style: "cancel" },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMarketData();
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0061FF" />
          <Text className="text-gray-600 mt-4 font-rubik">
            {t("market.loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !overview) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="warning" size={64} color="#EF4444" />
          <Text className="text-xl font-rubik-bold text-black-300 mt-4 text-center">
            {t("market.errorLoading")}
          </Text>
          <Text className="text-sm text-gray-600 font-rubik mt-2 text-center">
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchMarketData}
            className="bg-primary-300 px-6 py-3 rounded-xl mt-6"
          >
            <Text className="text-white font-rubik-bold">{t("common.reset")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-rubik-bold text-black-300">
          📊 {t("market.title")}
        </Text>
        <Text className="text-sm font-rubik text-gray-500 mt-1">
          {t("market.subtitle")}
        </Text>
      </View>

      {/* Tab Selector */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {[
            { key: "overview", labelKey: "market.overview", icon: "stats-chart" },
            { key: "trends", labelKey: "market.marketTrends", icon: "trending-up" },
            { key: "forecast", labelKey: "market.priceChange", icon: "telescope" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-full flex-row items-center ${
                selectedTab === tab.key
                  ? "bg-primary-300"
                  : "bg-gray-100 border border-gray-200"
              }`}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={selectedTab === tab.key ? "white" : "#666876"}
              />
              <Text
                className={`ml-2 text-sm font-rubik-medium ${
                  selectedTab === tab.key ? "text-white" : "text-gray-700"
                }`}
                numberOfLines={1}
              >
                {t(tab.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Tab */}
        {selectedTab === "overview" && overview && (
          <>
            {/* Key Stats Grid */}
            <View className="flex-row flex-wrap gap-3 mb-6">
              <View className="bg-white p-4 rounded-2xl flex-1 min-w-[48%] shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="home" size={24} color="#0061FF" />
                  <View className="bg-primary-100 px-2 py-1 rounded-full">
                    <Text className="text-xs font-rubik-bold text-primary-300">
                      Total
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-rubik-bold text-black-300">
                  {overview.totalProperties}
                </Text>
                <Text className="text-xs text-gray-600 font-rubik">
                  Properties
                </Text>
              </View>

              <View className="bg-white p-4 rounded-2xl flex-1 min-w-[48%] shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-xs font-rubik-bold text-green-600">
                      Available
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-rubik-bold text-black-300">
                  {overview.availableProperties}
                </Text>
                <Text className="text-xs text-gray-600 font-rubik">
                  For Sale
                </Text>
              </View>

              <View className="bg-white p-4 rounded-2xl flex-1 min-w-[48%] shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="cash" size={24} color="#F59E0B" />
                  <View className="bg-yellow-100 px-2 py-1 rounded-full">
                    <Text className="text-xs font-rubik-bold text-yellow-600">
                      Avg
                    </Text>
                  </View>
                </View>
                <Text className="text-xl font-rubik-bold text-black-300">
                  {formatPrice(overview.averagePrice)}
                </Text>
                <Text className="text-xs text-gray-600 font-rubik">
                  {t("market.avgPrice")}
                </Text>
              </View>

              <View className="bg-white p-4 rounded-2xl flex-1 min-w-[48%] shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="trending-up" size={24} color="#8B5CF6" />
                  <View className="bg-purple-100 px-2 py-1 rounded-full">
                    <Text className="text-xs font-rubik-bold text-purple-600">
                      Median
                    </Text>
                  </View>
                </View>
                <Text className="text-xl font-rubik-bold text-black-300">
                  {formatPrice(overview.medianPrice)}
                </Text>
                <Text className="text-xs text-gray-600 font-rubik">
                  Median Price
                </Text>
              </View>
            </View>

            {/* Price Range */}
            <View className="bg-white p-5 rounded-2xl shadow-sm mb-6">
              <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                💰 Price Range
              </Text>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-xs text-gray-600 font-rubik mb-1">
                    Lowest
                  </Text>
                  <Text className="text-xl font-rubik-bold text-green-600">
                    {formatPrice(overview.lowestPrice)}
                  </Text>
                </View>
                <View className="h-16 w-px bg-gray-200" />
                <View>
                  <Text className="text-xs text-gray-600 font-rubik mb-1">
                    Highest
                  </Text>
                  <Text className="text-xl font-rubik-bold text-red-600">
                    {formatPrice(overview.highestPrice)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Property Type Chart */}
            {pricesByType.length > 0 && (
              <View className="bg-white p-5 rounded-2xl shadow-sm mb-6">
                <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                  🏘️ Average Prices by Type
                </Text>
                <BarChart
                  data={{
                    labels: pricesByType.map((item) =>
                      item.propertyType.substring(0, 6)
                    ),
                    datasets: [
                      {
                        data: pricesByType.map((item) => item.averagePrice),
                      },
                    ],
                  }}
                  width={width - 72}
                  height={220}
                  yAxisLabel="$"
                  yAxisSuffix="k"
                  chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 97, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForLabels: { fontSize: 10 },
                  }}
                  style={{ borderRadius: 16 }}
                  showValuesOnTopOfBars
                  fromZero
                />
              </View>
            )}

            {/* Property Type List */}
            {pricesByType.length > 0 && (
              <View className="bg-white p-5 rounded-2xl shadow-sm">
                <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                  📊 Detailed Breakdown
                </Text>
                {pricesByType.map((item, index) => (
                  <View
                    key={index}
                    className={`py-3 ${index !== pricesByType.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="font-rubik-bold text-black-300">
                        {item.propertyType}
                      </Text>
                      <Text className="font-rubik-bold text-primary-300">
                        {formatPrice(item.averagePrice)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs text-gray-600 font-rubik">
                        {item.count} properties
                      </Text>
                      <Text className="text-xs text-gray-600 font-rubik">
                        {formatPrice(item.minPrice)} -{" "}
                        {formatPrice(item.maxPrice)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {pricesByType.length === 0 && (
              <View className="bg-white p-5 rounded-2xl shadow-sm">
                <View className="items-center py-8">
                  <Ionicons name="home-outline" size={64} color="#D1D5DB" />
                  <Text className="text-lg font-rubik-bold text-black-300 mt-4 text-center">
                    No Property Data
                  </Text>
                  <Text className="text-sm text-gray-600 font-rubik mt-2 text-center">
                    Add some properties to see market analysis
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Trends Tab */}
        {selectedTab === "trends" && trends && (
          <>
            {trends.trends.length > 0 ? (
              <>
                {/* Trend Indicator */}
                <View className="bg-white p-5 rounded-2xl shadow-sm mb-6">
                  <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                    📈 Market Trend (Last 6 Months)
                  </Text>
                  {trends.trendPercentage !== null && (
                    <View className="flex-row items-center justify-center mb-4">
                      <Ionicons
                        name={
                          trends.trendDirection === "up"
                            ? "trending-up"
                            : trends.trendDirection === "down"
                              ? "trending-down"
                              : "remove"
                        }
                        size={32}
                        color={
                          trends.trendDirection === "up"
                            ? "#10B981"
                            : trends.trendDirection === "down"
                              ? "#EF4444"
                              : "#F59E0B"
                        }
                      />
                      <Text
                        className={`text-3xl font-rubik-bold ml-2 ${
                          trends.trendDirection === "up"
                            ? "text-green-600"
                            : trends.trendDirection === "down"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {trends.trendPercentage > 0 ? "+" : ""}
                        {trends.trendPercentage}%
                      </Text>
                    </View>
                  )}

                  {/* Line Chart */}
                  <LineChart
                    data={{
                      labels: trends.trends.map((t) => t.month.substring(5, 7)),
                      datasets: [
                        {
                          data: trends.trends.map((t) => t.averagePrice),
                        },
                      ],
                    }}
                    width={width - 72}
                    height={220}
                    yAxisLabel="$"
                    yAxisSuffix="k"
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(0, 97, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: { borderRadius: 16 },
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#0061FF",
                      },
                    }}
                    bezier
                    style={{ borderRadius: 16, marginTop: 10 }}
                  />
                </View>

                {/* Monthly Breakdown */}
                <View className="bg-white p-5 rounded-2xl shadow-sm">
                  <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                    📅 Monthly Breakdown
                  </Text>
                  {trends.trends.map((item, index) => (
                    <View
                      key={index}
                      className={`py-3 flex-row justify-between items-center ${index !== trends.trends.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <View>
                        <Text className="font-rubik-bold text-black-300">
                          {new Date(item.month + "-01").toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </Text>
                        <Text className="text-xs text-gray-600 font-rubik mt-1">
                          {item.count} listings
                        </Text>
                      </View>
                      <Text className="font-rubik-bold text-primary-300 text-lg">
                        {formatPrice(item.averagePrice)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View className="bg-white p-5 rounded-2xl shadow-sm">
                <View className="items-center py-8">
                  <Ionicons
                    name="analytics-outline"
                    size={64}
                    color="#D1D5DB"
                  />
                  <Text className="text-lg font-rubik-bold text-black-300 mt-4 text-center">
                    No Trend Data
                  </Text>
                  <Text className="text-sm text-gray-600 font-rubik mt-2 text-center">
                    Not enough recent data to show trends
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Forecast Tab */}
        {selectedTab === "forecast" && forecast && (
          <>
            {forecast.forecast === "insufficient_data" ? (
              <View className="bg-white p-5 rounded-2xl shadow-sm">
                <View className="items-center py-8">
                  <Ionicons
                    name="analytics-outline"
                    size={64}
                    color="#D1D5DB"
                  />
                  <Text className="text-lg font-rubik-bold text-black-300 mt-4 text-center">
                    Insufficient Data
                  </Text>
                  <Text className="text-sm text-gray-600 font-rubik mt-2 text-center">
                    {forecast.message || "Not enough data for forecast"}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                {/* Current Market Status */}
                <View className="bg-white p-5 rounded-2xl shadow-sm mb-6">
                  <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                    🎯 Current Market Status
                  </Text>
                  <View className="items-center py-4">
                    <Text className="text-sm text-gray-600 font-rubik mb-2">
                      Average Price
                    </Text>
                    <Text className="text-3xl font-rubik-bold text-primary-300">
                      {formatPrice(forecast.currentAveragePrice)}
                    </Text>
                    <View className="flex-row items-center mt-3">
                      <Ionicons
                        name={
                          forecast.growthRate >= 0
                            ? "trending-up"
                            : "trending-down"
                        }
                        size={20}
                        color={forecast.growthRate >= 0 ? "#10B981" : "#EF4444"}
                      />
                      <Text
                        className={`text-lg font-rubik-bold ml-2 ${
                          forecast.growthRate >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {forecast.growthRate > 0 ? "+" : ""}
                        {forecast.growthRate}%
                      </Text>
                      <Text className="text-sm text-gray-600 font-rubik ml-2">
                        growth rate
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Recommendation Card */}
                <View
                  className={`p-5 rounded-2xl shadow-sm mb-6 ${
                    forecast.recommendation === "Strong buyer's market"
                      ? "bg-green-50 border-2 border-green-200"
                      : forecast.recommendation === "Good time to buy"
                        ? "bg-blue-50 border-2 border-blue-200"
                        : "bg-yellow-50 border-2 border-yellow-200"
                  }`}
                >
                  <View className="flex-row items-center mb-2">
                    <Ionicons
                      name={
                        forecast.recommendation === "Strong buyer's market"
                          ? "trending-up"
                          : forecast.recommendation === "Good time to buy"
                            ? "cart"
                            : "pause-circle"
                      }
                      size={24}
                      color={
                        forecast.recommendation === "Strong buyer's market"
                          ? "#10B981"
                          : forecast.recommendation === "Good time to buy"
                            ? "#0061FF"
                            : "#F59E0B"
                      }
                    />
                    <Text
                      className={`text-lg font-rubik-bold ml-2 ${
                        forecast.recommendation === "Strong buyer's market"
                          ? "text-green-700"
                          : forecast.recommendation === "Good time to buy"
                            ? "text-blue-700"
                            : "text-yellow-700"
                      }`}
                    >
                      {forecast.recommendation}
                    </Text>
                  </View>
                  <Text className="text-sm font-rubik text-gray-700 mt-1">
                    {forecast.recommendation === "Strong buyer's market"
                      ? "Market prices are rising. Consider selling your property."
                      : forecast.recommendation === "Good time to buy"
                        ? "Market prices are declining. Great opportunity for buyers."
                        : "Market is stable. Balanced conditions for buyers and sellers."}
                  </Text>
                </View>

                {/* Forecast Chart */}
                {Array.isArray(forecast.forecast) &&
                  forecast.forecast.length > 0 && (
                    <>
                      <View className="bg-white p-5 rounded-2xl shadow-sm mb-6">
                        <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                          🔮 3-Month Price Projection
                        </Text>
                        <BarChart
                          data={{
                            labels: forecast.forecast.map((f) =>
                              new Date(f.month + "-01").toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                }
                              )
                            ),
                            datasets: [
                              {
                                data: forecast.forecast.map(
                                  (f) => f.projectedPrice
                                ),
                              },
                            ],
                          }}
                          width={width - 72}
                          height={220}
                          yAxisLabel="$"
                          yAxisSuffix="k"
                          chartConfig={{
                            backgroundColor: "#ffffff",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            decimalPlaces: 0,
                            color: (opacity = 1) =>
                              `rgba(139, 92, 246, ${opacity})`,
                            labelColor: (opacity = 1) =>
                              `rgba(0, 0, 0, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForLabels: { fontSize: 10 },
                          }}
                          style={{ borderRadius: 16 }}
                          showValuesOnTopOfBars
                          fromZero
                        />
                      </View>

                      {/* Projected Prices List */}
                      <View className="bg-white p-5 rounded-2xl shadow-sm">
                        <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                          📊 Projected Prices
                        </Text>
                        {Array.isArray(forecast.forecast) &&
                          forecast.forecast.map((item, index) => (
                            <View
                              key={index}
                              className={`py-3 flex-row justify-between items-center ${
                                index !== forecast.forecast!.length - 1
                                  ? "border-b border-gray-100"
                                  : ""
                              }`}
                            >
                              <Text className="font-rubik-bold text-black-300">
                                {new Date(
                                  item.month + "-01"
                                ).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </Text>
                              <Text className="font-rubik-bold text-purple-600 text-lg">
                                {formatPrice(item.projectedPrice)}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </>
                  )}

                {/* Disclaimer */}
                <View className="bg-yellow-50 p-4 rounded-2xl mt-6 border border-yellow-200">
                  <View className="flex-row items-start">
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#F59E0B"
                    />
                    <Text className="text-xs text-gray-700 font-rubik ml-2 flex-1">
                      These projections are based on historical data and current
                      trends. Actual market conditions may vary. Always consult
                      with a real estate professional before making investment
                      decisions.
                    </Text>
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MarketScreen;
