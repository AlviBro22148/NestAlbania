import ComparisonFloatingButton from "@/components/ComparisonFloatingButton";
import PropertyCard from "@/components/PropertyCard";
import FilterModal, { PropertyFilters } from "@/components/PropertyFilter";
import icons from "@/constants/icons";
import { useComparison } from "@/contexts/ComparisonContext";
import { useLikedPropertiesActions } from "@/contexts/LikedPropertiesContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useExploreProperties } from "@/hooks/useProperties";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Image as ExpoImage } from "expo-image";
import {
  ActivityIndicator,
  RefreshControl,
  Text,
  TextInput,
  Pressable,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Property {
  id: number;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  images: string[];
  listingType: string;
  monthlyRent: number | null;
}

export default function ExploreScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isLiked, toggleLike } = useLikedPropertiesActions();
  const { isInComparison, addToComparison, removeFromComparison } = useComparison();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<PropertyFilters>({});
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useExploreProperties(activeFilters);

  // Debounce search - 400ms for less frequent updates
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  // Flatten pages into single array
  const properties = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.properties);
  }, [data]);

  // Filter by search query
  const filteredProperties = useMemo(() => {
    if (!debouncedQuery.trim()) return properties;
    const q = debouncedQuery.toLowerCase();
    return properties.filter(
      (p) => p.title.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    );
  }, [debouncedQuery, properties]);

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  // Simplified handlers - no useCallback wrapper for simple operations
  const handlePropertyPress = (id: number) => router.push(`/(root)/properties/${id}`);
  const handleToggleLike = (id: number) => toggleLike(id);
  const handleToggleComparison = (id: number) => {
    isInComparison(id) ? removeFromComparison(id) : addToComparison(id);
  };

  const loadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) fetchNextPage();
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item }: { item: Property }) => (
    <View style={styles.cardWrapper}>
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
        isLiked={isLiked(item.id)}
        isInComparison={isInComparison(item.id)}
        onToggleLike={() => handleToggleLike(item.id)}
        onToggleComparison={() => handleToggleComparison(item.id)}
        propertyTypeLabel={t(`propertyTypes.${item.propertyType.toLowerCase()}`)}
      />
    </View>
  ), [isLiked, isInComparison, t]);

  const ListEmpty = useMemo(() => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🏠</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {t("properties.noPropertiesFound")}
        </Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {searchQuery || hasActiveFilters ? t("properties.tryDifferentSearch") : t("properties.beFirstToAdd")}
        </Text>
      </View>
    );
  }, [isLoading, searchQuery, hasActiveFilters, t, colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.accent, { backgroundColor: colors.accent }]} />
          <Text style={[styles.title, { color: colors.text }]}>{t("properties.explore")}</Text>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceElevated }]}>
          <ExpoImage source={icons.search} style={[styles.searchIcon, { tintColor: colors.icon }]} />
          <TextInput
            placeholder={t("placeholders.searchProperties")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
            placeholderTextColor={colors.textMuted}
          />
          <Pressable onPress={() => setFilterModalVisible(true)} style={[styles.filterBtn, { backgroundColor: colors.background }]}>
            <ExpoImage source={icons.filter} style={[styles.filterIcon, { tintColor: colors.icon }]} />
            {hasActiveFilters && <View style={[styles.filterDot, { backgroundColor: colors.accent }]} />}
          </Pressable>
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Results count */}
        <View style={styles.resultsRow}>
          <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
            {filteredProperties.length} {t("properties.propertiesFound")}
          </Text>
          {hasActiveFilters && (
            <Pressable onPress={() => setActiveFilters({})} style={[styles.clearFilters, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.clearFiltersText, { color: colors.accent }]}>{t("common.clearAll")}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      {isLoading && properties.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlashList
          data={filteredProperties}
          keyExtractor={(item) => `p-${item.id}`}
          renderItem={renderItem}
          estimatedItemSize={280}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          drawDistance={200}
          overrideItemLayout={(layout) => { layout.size = 280; }}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={isFetchingNextPage ? (
            <View style={styles.footer}><ActivityIndicator color={colors.primary} /></View>
          ) : null}
          ListEmptyComponent={ListEmpty}
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={setActiveFilters}
        initialFilters={activeFilters}
      />

      <ComparisonFloatingButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, marginTop: 8 },
  accent: { width: 4, height: 26, borderRadius: 2, marginRight: 10 },
  title: { fontSize: 26, fontFamily: "Rubik-Bold" },
  searchBox: { flexDirection: "row", alignItems: "center", height: 48, borderRadius: 12, paddingLeft: 14, paddingRight: 6, marginBottom: 12 },
  searchIcon: { width: 20, height: 20, marginRight: 10 },
  searchInput: { flex: 1, fontFamily: "Rubik-Regular", fontSize: 15, height: "100%" },
  filterBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  filterIcon: { width: 18, height: 18 },
  filterDot: { position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: 4 },
  clearBtn: { padding: 6, marginLeft: 2 },
  resultsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultsText: { fontSize: 13, fontFamily: "Rubik-Regular" },
  clearFilters: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  clearFiltersText: { fontSize: 11, fontFamily: "Rubik-SemiBold" },
  cardWrapper: { paddingHorizontal: 20 },
  list: { paddingBottom: 100 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  footer: { paddingVertical: 16, alignItems: "center" },
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Rubik-Bold", marginBottom: 6 },
  emptyText: { textAlign: "center", fontSize: 13, fontFamily: "Rubik-Regular" },
});
