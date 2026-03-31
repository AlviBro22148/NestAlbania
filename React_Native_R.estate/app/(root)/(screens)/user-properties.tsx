import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import api from "@/lib/axios-config";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { shadows, shadowsDark } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";

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
  createdAt: string;
  listingType: string;
  monthlyRent?: number;
  leaseTermMonths?: number;
}

const UserProperties = () => {
  const { user } = useAuth();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const handleBack = useBackNavigation("/(root)/(tabs)/profile");
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // Use React Query for cached user properties - INSTANT from cache
  const { data: properties = [], isLoading: loading, isFetching, refetch } = useQuery({
    queryKey: ["user-properties"],
    queryFn: async () => {
      const response = await api.get("/api/properties/my-properties");
      return response.data as Property[];
    },
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDelete = (id: number, title: string) => {
    showAlert({
      type: "warning",
      title: t("properties.deleteProperty"),
      message: `${t("properties.deletePropertyConfirm")} "${title}"? This action cannot be undone.`,
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => confirmDelete(id),
        },
      ],
    });
  };

  const confirmDelete = useCallback(async (id: number) => {
    try {
      setDeletingId(id);
      await api.delete(`/api/properties/${id}`);
      // Update cache optimistically
      queryClient.setQueryData(["user-properties"], (old: Property[] | undefined) => {
        if (!old) return old;
        return old.filter((p) => p.id !== id);
      });
      showToast(t("properties.propertyDeleted"), "success");
    } catch (error: any) {
      console.error("Error deleting property:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.response?.data?.message || t("errors.deleteFailed"),
      });
    } finally {
      setDeletingId(null);
    }
  }, [queryClient, showToast, showAlert, t]);

  const handleMarkAsSold = useCallback((id: number, title: string) => {
    showAlert({
      type: "warning",
      title: t("properties.markAsSold"),
      message: `${t("properties.markAsSoldConfirm")} "${title}"?`,
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("properties.markSold"),
          style: "default",
          onPress: async () => {
            try {
              setUpdatingStatusId(id);
              await api.put(`/api/properties/${id}/mark-sold`);
              queryClient.setQueryData(["user-properties"], (old: Property[] | undefined) => {
                if (!old) return old;
                return old.map((p) => (p.id === id ? { ...p, status: "Sold" } : p));
              });
              showToast(t("properties.markedAsSold"), "success");
            } catch (error: any) {
              console.error("Error marking property as sold:", error);
              showAlert({
                type: "error",
                title: t("common.error"),
                message: error.response?.data?.message || t("errors.updateFailed"),
              });
            } finally {
              setUpdatingStatusId(null);
            }
          },
        },
      ],
    });
  }, [queryClient, showAlert, showToast, t]);

  const handleMarkAsRented = useCallback((id: number, title: string) => {
    showAlert({
      type: "warning",
      title: t("properties.markAsRented"),
      message: `${t("properties.markAsRentedConfirm")} "${title}"?`,
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("properties.markRented"),
          style: "default",
          onPress: async () => {
            try {
              setUpdatingStatusId(id);
              await api.put(`/api/properties/${id}/mark-rented`);
              queryClient.setQueryData(["user-properties"], (old: Property[] | undefined) => {
                if (!old) return old;
                return old.map((p) => (p.id === id ? { ...p, status: "Rented" } : p));
              });
              showToast(t("properties.markedAsRented"), "success");
            } catch (error: any) {
              console.error("Error marking property as rented:", error);
              showAlert({
                type: "error",
                title: t("common.error"),
                message: error.response?.data?.message || t("errors.updateFailed"),
              });
            } finally {
              setUpdatingStatusId(null);
            }
          },
        },
      ],
    });
  }, [queryClient, showAlert, showToast, t]);

  const handleMarkAsAvailable = useCallback((id: number, title: string) => {
    showAlert({
      type: "info",
      title: t("properties.markAsAvailable"),
      message: `${t("properties.markAsAvailableConfirm")} "${title}"?`,
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("properties.markAvailable"),
          style: "default",
          onPress: async () => {
            try {
              setUpdatingStatusId(id);
              await api.put(`/api/properties/${id}/mark-available`);
              queryClient.setQueryData(["user-properties"], (old: Property[] | undefined) => {
                if (!old) return old;
                return old.map((p) => (p.id === id ? { ...p, status: "Available" } : p));
              });
              showToast(t("properties.markedAsAvailable"), "success");
            } catch (error: any) {
              console.error("Error marking property as available:", error);
              showAlert({
                type: "error",
                title: t("common.error"),
                message: error.response?.data?.message || t("errors.updateFailed"),
              });
            } finally {
              setUpdatingStatusId(null);
            }
          },
        },
      ],
    });
  }, [queryClient, showAlert, showToast, t]);

  const handleEdit = (property: Property) => {
    router.push({
      pathname: "/(root)/edit-property/[propertyId]",
      params: { propertyId: property.id.toString() },
    });
  };

  const renderPropertyCard = ({ item }: { item: Property }) => {
    const isRental = item.listingType?.toLowerCase() === "rent";

    return (
      <View className="rounded-xl mb-4 shadow-sm overflow-hidden" style={{ backgroundColor: colors.surface }}>
        <Image
          source={{
            uri: item.images[0] || "https://via.placeholder.com/400x200",
          }}
          className="w-full h-48"
          resizeMode="cover"
        />

        {/* Status & Type Badges */}
        <View className="absolute top-3 left-3 flex-row gap-2">
          <View
            className={`px-3 py-1 rounded-full ${
              item.status === "Available"
                ? "bg-green-500"
                : item.status === "Sold"
                  ? "bg-red-500"
                  : item.status === "Rented"
                    ? "bg-purple-500"
                    : "bg-yellow-500"
            }`}
          >
            <Text className="text-white text-xs font-rubik-semibold">
              {item.status === "Available"
                ? isRental
                  ? t("properties.OnRent", "On Rent")
                  : t("properties.OnSale", "On Sale")
                : item.status === "Rented"
                  ? t("properties.Rented", "Rented")
                  : t("properties.Sold")}
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${isRental ? "bg-purple-500" : "bg-blue-500"}`}
          >
            <Text className="text-white text-xs font-rubik-semibold">
              {isRental ? "🔑 Rent" : "🏷️ Sale"}
            </Text>
          </View>
        </View>

        {/* Property Details */}
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text
                className="text-lg font-rubik-bold"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text className="text-sm font-rubik mt-1" style={{ color: colors.textSecondary }}>
                {item.propertyType}
              </Text>
            </View>
            <Text className="text-lg font-rubik-bold ml-2" style={{ color: colors.primary }}>
              {isRental
                ? `$${item.monthlyRent?.toLocaleString()}/mo`
                : `$${item.price.toLocaleString()}`}
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text
              className="text-sm font-rubik ml-1"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {item.address}
            </Text>
          </View>

          {/* Property Features */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-row items-center">
              <Ionicons name="bed-outline" size={18} color={colors.textMuted} />
              <Text className="text-sm font-rubik ml-1" style={{ color: colors.text }}>
                {item.bedrooms} {t("properties.bedrooms")}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="water-outline" size={18} color={colors.textMuted} />
              <Text className="text-sm font-rubik ml-1" style={{ color: colors.text }}>
                {item.bathrooms} {t("properties.bathrooms")}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="resize-outline" size={18} color={colors.textMuted} />
              <Text className="text-sm font-rubik ml-1" style={{ color: colors.text }}>
                {item.area} m²
              </Text>
            </View>
          </View>

          {/* Rental Info */}
          {isRental && item.leaseTermMonths && (
            <View className="p-3 rounded-lg mb-4" style={{ backgroundColor: isDark ? "#8B5CF620" : "#F3E8FF" }}>
              <Text className="font-rubik text-sm" style={{ color: "#8B5CF6" }}>
                📅 Lease Term: {item.leaseTermMonths} months
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleEdit(item)}
                className="flex-1 flex-row items-center justify-center bg-blue-600 py-3 rounded-lg"
              >
                <Ionicons name="pencil" size={19} color="white" />
                <Text className="text-white font-rubik-semibold ml-2">
                  {t("common.edit")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.title)}
                disabled={deletingId === item.id}
                className="flex-1 flex-row items-center justify-center bg-red-500 py-3 rounded-lg"
              >
                {deletingId === item.id ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={19} color="white" />
                    <Text className="text-white font-rubik-semibold ml-2">
                      {t("common.delete")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {item.status === "Available" ? (
              <TouchableOpacity
                onPress={() =>
                  isRental
                    ? handleMarkAsRented(item.id, item.title)
                    : handleMarkAsSold(item.id, item.title)
                }
                disabled={updatingStatusId === item.id}
                className={`flex-row items-center justify-center py-3 rounded-lg ${
                  isRental ? "bg-purple-500" : "bg-orange-500"
                }`}
              >
                {updatingStatusId === item.id ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={19}
                      color="white"
                    />
                    <Text className="text-white font-rubik-semibold ml-2">
                      {isRental
                        ? t("properties.markAsRented", "Mark as Rented")
                        : t("properties.markAsSold")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleMarkAsAvailable(item.id, item.title)}
                disabled={updatingStatusId === item.id}
                className="flex-row items-center justify-center bg-green-500 py-3 rounded-lg"
              >
                {updatingStatusId === item.id ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="refresh-circle-outline"
                      size={19}
                      color="white"
                    />
                    <Text className="text-white font-rubik-semibold ml-2">
                      {t("properties.markAsAvailable")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="home-outline" size={80} color={colors.textMuted} />
      <Text className="text-xl font-semibold mt-4" style={{ color: colors.text }}>
        {t("properties.noPropertiesYet")}
      </Text>
      <Text className="text-center mt-2 px-8" style={{ color: colors.textSecondary }}>
        {t("properties.startByCreating")}
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(root)/create-property")}
        className="px-6 py-3 rounded-lg mt-6"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-white font-semibold">
          {t("properties.createProperty")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t("common.loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[styles.header, { backgroundColor: colors.surface }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            className="p-2 -ml-2 mr-1"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("profile.myProperties")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {properties.length}{" "}
              {properties.length === 1 ? t("profile.property") : t("profile.properties")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(root)/create-property")}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>{t("common.new")}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
      </Animated.View>

      <FlatList
        className="mb-12"
        data={properties}
        renderItem={renderPropertyCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default UserProperties;

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
    marginTop: spacing.md,
    fontFamily: "Rubik-Regular",
  },
  header: {
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Rubik-Bold",
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Rubik-Regular",
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  addButtonText: {
    color: "white",
    fontFamily: "Rubik-SemiBold",
    marginLeft: 4,
  },
  accentLine: {
    height: 3,
    marginTop: spacing.sm,
  },
});

