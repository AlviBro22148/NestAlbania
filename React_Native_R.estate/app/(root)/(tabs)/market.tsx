import { useTheme } from "@/contexts/ThemeContext";
import { useMarketData } from "@/hooks/useMarketData";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, memo, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  Text,
  View,
  StyleSheet,
} from "react-native";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";
import { BarChart, LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { InteractionManager } from "react-native";
import { formatCurrency, formatPriceShort } from "@/lib/utils";

// Memoized Chart components to prevent expensive re-renders
const MemoizedBarChart = memo(BarChart);
const MemoizedLineChart = memo(LineChart);

const { width } = Dimensions.get("window");

// Tab button component
// PERFORMANCE: Removed spring animations - using simple opacity feedback
const TabButton = memo(function TabButton({
  label,
  icon,
  isActive,
  onPress,
  colors,
}: {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        {
          backgroundColor: isActive ? colors.primary : colors.surfaceElevated,
          borderWidth: isActive ? 0 : 1,
          borderColor: colors.border,
        },
        pressed && styles.tabButtonPressed,
      ]}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={isActive ? "white" : colors.icon}
      />
      <Text
        style={[
          styles.tabButtonText,
          { color: isActive ? "white" : colors.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
});

// Market Overview Section Component
const MarketOverview = memo(({ overview, pricesByType, colors, isDark, cardShadow, formatPrice, chartConfig }: any) => {
  const chartData = useMemo(() => ({
    labels: pricesByType.map((item: any) => item.propertyType.substring(0, 6)),
    datasets: [{ data: pricesByType.map((item: any) => item.averagePrice) }],
  }), [pricesByType]);

  return (
    <View>
      <View style={styles.statsGrid}>
        <StatCard
          icon="home"
          value={overview.totalProperties}
          label="Properties"
          badge="Total"
          colors={colors}
          cardShadow={cardShadow}
        />
        <StatCard
          icon="checkmark-circle"
          value={overview.availableProperties}
          label="For Sale"
          badge="Available"
          iconColor="#10B981"
          badgeBg={isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"}
          colors={colors}
          cardShadow={cardShadow}
        />
        <StatCard
          icon="cash"
          value={formatPrice(overview.averagePrice)}
          label="Avg Price"
          badge="Avg"
          iconColor="#F59E0B"
          badgeBg={isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7"}
          isSmall
          colors={colors}
          cardShadow={cardShadow}
        />
        <StatCard
          icon="trending-up"
          value={formatPrice(overview.medianPrice)}
          label="Median Price"
          badge="Median"
          iconColor="#8B5CF6"
          badgeBg={isDark ? "rgba(139, 92, 246, 0.2)" : "#EDE9FE"}
          isSmall
          colors={colors}
          cardShadow={cardShadow}
        />
      </View>

      <View style={[styles.overviewContainer, { backgroundColor: colors.surface }, cardShadow]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>💰 Price Range</Text>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs font-rubik mb-1" style={{ color: colors.textSecondary }}>Lowest</Text>
            <Text className="text-xl font-rubik-bold text-green-500">{formatPrice(overview.lowestPrice)}</Text>
          </View>
          <View className="h-16 w-px" style={{ backgroundColor: colors.border }} />
          <View>
            <Text className="text-xs font-rubik mb-1" style={{ color: colors.textSecondary }}>Highest</Text>
            <Text className="text-xl font-rubik-bold text-red-500">{formatPrice(overview.highestPrice)}</Text>
          </View>
        </View>
      </View>

      {pricesByType.length > 0 && (
        <View style={[styles.overviewContainer, { backgroundColor: colors.surface }, cardShadow]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🏘️ Average Prices by Type</Text>
          <MemoizedBarChart
            data={chartData}
            width={width - 72}
            height={220}
            yAxisLabel="$"
            chartConfig={chartConfig}
            formatYLabel={(value) => formatPriceShort(parseFloat(value) * 1000)}
            style={{ borderRadius: 16 }}
            showValuesOnTopOfBars
            fromZero
          />
        </View>
      )}

      {pricesByType.length > 0 && (
        <View style={[styles.overviewContainer, { backgroundColor: colors.surface }, cardShadow]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Detailed Breakdown</Text>
          {pricesByType.map((item: any, index: number) => (
            <View key={index} className="py-3" style={{ borderBottomWidth: index !== pricesByType.length - 1 ? 1 : 0, borderBottomColor: colors.borderLight }}>
              <View className="flex-row justify-between items-center mb-1">
                <Text className="font-rubik-bold" style={{ color: colors.text }}>{item.propertyType}</Text>
                <Text className="font-rubik-bold" style={{ color: colors.primary }}>{formatPrice(item.averagePrice)}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs font-rubik" style={{ color: colors.textSecondary }}>{item.count} properties</Text>
                <Text className="text-xs font-rubik" style={{ color: colors.textSecondary }}>{formatPrice(item.minPrice)} - {formatPrice(item.maxPrice)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

// Stat Card Sub-component
const StatCard = memo(({ icon, value, label, badge, iconColor, badgeBg, isSmall, colors, cardShadow }: any) => (
  <View style={[styles.statCard, { backgroundColor: colors.surface }, cardShadow]}>
    <View style={styles.statCardHeader}>
      <View style={[styles.statIconCircle, { backgroundColor: badgeBg || colors.primaryLight }]}>
        <Ionicons name={icon as any} size={20} color={iconColor || colors.primary} />
      </View>
      <View style={[styles.statBadge, { backgroundColor: badgeBg || colors.primaryLight }]}>
        <Text style={[styles.statBadgeText, { color: iconColor || colors.primary }]}>{badge}</Text>
      </View>
    </View>
    <Text style={[isSmall ? styles.statValueSmall : styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
  </View>
));

// Market Trends Section Component
const MarketTrends = memo(({ trends, colors, isDark, cardShadow, formatPrice, chartConfig }: any) => {
  const chartData = useMemo(() => ({
    labels: trends.trends.map((t: any) => t.month.substring(5, 7)),
    datasets: [{ data: trends.trends.map((t: any) => t.averagePrice) }],
  }), [trends]);

  if (trends.trends.length === 0) {
    return (
      <View style={[styles.overviewContainer, { backgroundColor: colors.surface }, cardShadow]}>
        <View className="items-center py-8">
          <Ionicons name="analytics-outline" size={64} color={colors.textMuted} />
          <Text className="text-lg font-rubik-bold mt-4 text-center" style={{ color: colors.text }}>No Trend Data</Text>
          <Text className="text-sm font-rubik mt-2 text-center" style={{ color: colors.textSecondary }}>Not enough recent data to show trends</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View className="p-5 rounded-2xl shadow-sm mb-6" style={{ backgroundColor: colors.surface }}>
        <Text className="text-lg font-rubik-bold mb-4" style={{ color: colors.text }}>📈 Market Trend (Last 6 Months)</Text>
        {trends.trendPercentage !== null && (
          <View className="flex-row items-center justify-center mb-4">
            <Ionicons
              name={trends.trendDirection === "up" ? "trending-up" : trends.trendDirection === "down" ? "trending-down" : "remove"}
              size={32}
              color={trends.trendDirection === "up" ? "#10B981" : trends.trendDirection === "down" ? "#EF4444" : "#F59E0B"}
            />
            <Text className={`text-3xl font-rubik-bold ml-2 ${trends.trendDirection === "up" ? "text-green-600" : trends.trendDirection === "down" ? "text-red-600" : "text-yellow-600"}`}>
              {trends.trendPercentage > 0 ? "+" : ""}{trends.trendPercentage}%
            </Text>
          </View>
        )}
        <MemoizedLineChart
          data={chartData}
          width={width - 72}
          height={220}
          yAxisLabel="$"
          chartConfig={{ ...chartConfig, propsForDots: { r: "4", strokeWidth: "2", stroke: colors.primary } }}
          formatYLabel={(value) => formatPriceShort(parseFloat(value) * 1000)}
          bezier
          style={{ borderRadius: 16, marginTop: 10 }}
        />
      </View>

      <View className="p-5 rounded-2xl shadow-sm" style={{ backgroundColor: colors.surface }}>
        <Text className="text-lg font-rubik-bold mb-4" style={{ color: colors.text }}>📅 Monthly Breakdown</Text>
        {trends.trends.map((item: any, index: number) => (
          <View key={index} className="py-3 flex-row justify-between items-center" style={{ borderBottomWidth: index !== trends.trends.length - 1 ? 1 : 0, borderBottomColor: colors.borderLight }}>
            <View>
              <Text className="font-rubik-bold" style={{ color: colors.text }}>
                {new Date(item.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </Text>
              <Text className="text-xs font-rubik mt-1" style={{ color: colors.textSecondary }}>{item.count} listings</Text>
            </View>
            <Text className="font-rubik-bold text-lg" style={{ color: colors.primary }}>{formatPrice(item.averagePrice)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

// Market Forecast Section Component
const MarketForecast = memo(({ forecast, colors, isDark, cardShadow, formatPrice, chartConfig }: any) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(forecast.forecast)) return null;
    return {
      labels: forecast.forecast.map((f: any) => new Date(f.month + "-01").toLocaleDateString("en-US", { month: "short" })),
      datasets: [{ data: forecast.forecast.map((f: any) => f.projectedPrice) }],
    };
  }, [forecast]);

  if (forecast.forecast === "insufficient_data") {
    return (
      <View style={[styles.overviewContainer, { backgroundColor: colors.surface }, cardShadow]}>
        <View className="items-center py-8">
          <Ionicons name="analytics-outline" size={64} color={colors.textMuted} />
          <Text className="text-lg font-rubik-bold mt-4 text-center" style={{ color: colors.text }}>Insufficient Data</Text>
          <Text className="text-sm font-rubik mt-2 text-center" style={{ color: colors.textSecondary }}>{forecast.message || "Not enough data for forecast"}</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View className="p-5 rounded-2xl shadow-sm mb-6" style={{ backgroundColor: colors.surface }}>
        <Text className="text-lg font-rubik-bold mb-4" style={{ color: colors.text }}>🎯 Current Market Status</Text>
        <View className="items-center py-4">
          <Text className="text-sm font-rubik mb-2" style={{ color: colors.textSecondary }}>Average Price</Text>
          <Text className="text-3xl font-rubik-bold" style={{ color: colors.primary }}>{formatPrice(forecast.currentAveragePrice)}</Text>
          <View className="flex-row items-center mt-3">
            <Ionicons name={forecast.growthRate >= 0 ? "trending-up" : "trending-down"} size={20} color={forecast.growthRate >= 0 ? "#10B981" : "#EF4444"} />
            <Text className={`text-lg font-rubik-bold ml-2 ${forecast.growthRate >= 0 ? "text-green-500" : "text-red-500"}`}>
              {forecast.growthRate > 0 ? "+" : ""}{forecast.growthRate}%
            </Text>
            <Text className="text-sm font-rubik ml-2" style={{ color: colors.textSecondary }}>growth rate</Text>
          </View>
        </View>
      </View>

      <View className={`p-5 rounded-2xl shadow-sm mb-6 ${forecast.recommendation?.includes("buyer") ? "bg-green-50 border border-green-200" : forecast.recommendation?.includes("buy") ? "bg-blue-50 border border-blue-200" : "bg-yellow-50 border border-yellow-200"}`}>
        <View className="flex-row items-center mb-2">
          <Ionicons name={forecast.recommendation?.includes("buyer") ? "trending-up" : forecast.recommendation?.includes("buy") ? "cart" : "pause-circle"} size={24} color={forecast.recommendation?.includes("buyer") ? "#10B981" : forecast.recommendation?.includes("buy") ? "#0061FF" : "#F59E0B"} />
          <Text className={`text-lg font-rubik-bold ml-2 ${forecast.recommendation?.includes("buyer") ? "text-green-700" : forecast.recommendation?.includes("buy") ? "text-blue-700" : "text-yellow-700"}`}>{forecast.recommendation}</Text>
        </View>
        <Text className="text-sm font-rubik text-gray-700 mt-1">{forecast.message || "Market conditions are stable."}</Text>
      </View>

      {chartData && (
        <View className="p-5 rounded-2xl shadow-sm mb-6" style={{ backgroundColor: colors.surface }}>
          <Text className="text-lg font-rubik-bold mb-4" style={{ color: colors.text }}>🔮 3-Month Price Projection</Text>
          <MemoizedBarChart
            data={chartData}
            width={width - 72}
            height={220}
            yAxisLabel="$"
            yAxisSuffix="k"
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})` }}
            style={{ borderRadius: 16 }}
            showValuesOnTopOfBars
            fromZero
          />
        </View>
      )}

      {Array.isArray(forecast.forecast) && (
        <View className="p-5 rounded-2xl shadow-sm" style={{ backgroundColor: colors.surface }}>
          <Text className="text-lg font-rubik-bold mb-4" style={{ color: colors.text }}>📊 Projected Prices</Text>
          {forecast.forecast.map((item: any, index: number) => (
            <View key={index} className="py-3 flex-row justify-between items-center" style={{ borderBottomWidth: index !== forecast.forecast.length - 1 ? 1 : 0, borderBottomColor: colors.borderLight }}>
              <Text className="font-rubik-bold" style={{ color: colors.text }}>
                {new Date(item.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </Text>
              <Text className="font-rubik-bold text-purple-500 text-lg">{formatPrice(item.projectedPrice)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const MarketScreen = memo(function MarketScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "trends" | "forecast"
  >("overview");

  // Use cached market data hook - INSTANT from cache
  const { data, isLoading, isFetching, refetch, error } = useMarketData();

  const overview = data?.overview ?? null;
  const pricesByType = data?.pricesByType ?? [];
  const trends = data?.trends ?? null;
  const forecast = data?.forecast ?? null;

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const formatPrice = useCallback((price: number) => {
    return formatCurrency(price);
  }, []);

  // FIX: Moved useMemo above early returns so hooks are always called in the same order
  const chartConfig = useMemo(
    () => ({
      backgroundColor: colors.surface,
      backgroundGradientFrom: colors.surface,
      backgroundGradientTo: colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) =>
        isDark
          ? `rgba(75, 123, 236, ${opacity})`
          : `rgba(30, 58, 95, ${opacity})`,
      labelColor: (opacity = 1) =>
        isDark
          ? `rgba(248, 250, 252, ${opacity})`
          : `rgba(26, 31, 54, ${opacity})`,
      style: { borderRadius: 16 },
      propsForLabels: { fontSize: 10 },
    }),
    [colors.surface, isDark],
  );

  // Defer rendering of heavy components (charts) to keep interactions smooth
  const [canRenderCharts, setCanRenderCharts] = useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        setCanRenderCharts(true);
      });
    }, 800); // Wait longer for UI to settle
    return () => clearTimeout(timer);
  }, []);

  // Memoized Chart sections to prevent whole-screen re-renders
  const OverviewSection = useMemo(() => {
    if (!overview || !canRenderCharts) return null;
    return (
      <Animated.View entering={FadeInDown.duration(400)}>
        <MarketOverview
          overview={overview}
          pricesByType={pricesByType}
          colors={colors}
          isDark={isDark}
          cardShadow={cardShadow}
          formatPrice={formatPrice}
          chartConfig={chartConfig}
        />
      </Animated.View>
    );
  }, [overview, pricesByType, canRenderCharts, colors, isDark, cardShadow, formatPrice, chartConfig]);

  const TrendsSection = useMemo(() => {
    if (!trends || !canRenderCharts) return null;
    return (
      <Animated.View entering={FadeInDown.duration(400)}>
        <MarketTrends
          trends={trends}
          colors={colors}
          isDark={isDark}
          cardShadow={cardShadow}
          formatPrice={formatPrice}
          chartConfig={chartConfig}
        />
      </Animated.View>
    );
  }, [trends, canRenderCharts, colors, isDark, cardShadow, formatPrice, chartConfig]);

  const ForecastSection = useMemo(() => {
    if (!forecast || !canRenderCharts) return null;
    return (
      <Animated.View entering={FadeInDown.duration(400)}>
        <MarketForecast
          forecast={forecast}
          colors={colors}
          isDark={isDark}
          cardShadow={cardShadow}
          formatPrice={formatPrice}
          chartConfig={chartConfig}
        />
      </Animated.View>
    );
  }, [forecast, canRenderCharts, colors, isDark, cardShadow, formatPrice, chartConfig]);

  // Only show loading on initial load (no cached data)
  if (isLoading && !overview) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t("market.loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !overview) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={64} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {t("market.errorLoading")}
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error instanceof Error ? error.message : "Unknown error"}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>{t("common.reset")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const tabs = [
    { key: "overview", labelKey: "market.overview", icon: "stats-chart" },
    { key: "trends", labelKey: "market.marketTrends", icon: "trending-up" },
    { key: "forecast", labelKey: "market.priceChange", icon: "telescope" },
  ];

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
              {t("market.title")}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {t("market.subtitle")}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Selector */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              label={t(tab.labelKey)}
              icon={tab.icon}
              isActive={selectedTab === tab.key}
              onPress={() => setSelectedTab(tab.key as any)}
              colors={colors}
            />
          ))}
        </Animated.ScrollView>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {selectedTab === "overview" && OverviewSection}
        {selectedTab === "trends" && TrendsSection}
        {selectedTab === "forecast" && ForecastSection}
      </Animated.ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.base,
    fontFamily: "Rubik-Regular",
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: "Rubik-Bold",
    marginTop: spacing.base,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: "Rubik-Regular",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.xl,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontFamily: "Rubik-Bold",
    fontSize: 14,
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
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Rubik-Regular",
    marginTop: 2,
  },
  tabContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    gap: spacing.sm,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  tabButtonPressed: {
    opacity: 0.8,
  },
  tabButtonText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontFamily: "Rubik-Medium",
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: 100,
  },
  overviewContainer: {
    padding: spacing.xl,
    borderRadius: radius["2xl"],
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Rubik-Bold",
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: "46%",
    padding: spacing.base,
    borderRadius: radius.card,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statBadgeText: {
    fontSize: 11,
    fontFamily: "Rubik-Bold",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Rubik-Bold",
  },
  statValueSmall: {
    fontSize: 18,
    fontFamily: "Rubik-Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Rubik-Regular",
    marginTop: 2,
  },
});

export default MarketScreen;
