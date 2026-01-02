import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import api from "@/lib/axios-config";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
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
  createdAt: string;
  listingType: string;
  monthlyRent?: number;
  leaseTermMonths?: number;
}

const UserProperties = () => {
  const { user } = useAuth();
  const { showAlert, showToast } = useAlert();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const { t } = useTranslation();

  const fetchMyProperties = async () => {
    try {
      const response = await api.get("/api/properties/my-properties");
      setProperties(response.data);
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      showToast(t("errors.loadingFailed"), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMyProperties();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyProperties();
  };

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

  const confirmDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await api.delete(`/api/properties/${id}`);
      setProperties(properties.filter((p) => p.id !== id));
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
  };

  const handleMarkAsSold = (id: number, title: string) => {
    showAlert({
      type: "warning",
      title: t("properties.markAsSold"),
      message: `${t("properties.markAsSoldConfirm")} "${title}"?`,
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("properties.markSold"),
          style: "default",
          onPress: () => confirmMarkAsSold(id),
        },
      ],
    });
  };

  const confirmMarkAsSold = async (id: number) => {
    try {
      setUpdatingStatusId(id);
      await api.put(`/api/properties/${id}/mark-sold`);
      setProperties(
        properties.map((p) => (p.id === id ? { ...p, status: "Sold" } : p))
      );
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
  };

  const handleMarkAsRented = (id: number, title: string) => {
    showAlert({
      type: "warning",
      title: t("properties.markAsRented"),
      message: `${t("properties.markAsRentedConfirm")} "${title}"?`,
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("properties.markRented"),
          style: "default",
          onPress: () => confirmMarkAsRented(id),
        },
      ],
    });
  };

  const confirmMarkAsRented = async (id: number) => {
    try {
      setUpdatingStatusId(id);
      await api.put(`/api/properties/${id}/mark-rented`);
      setProperties(
        properties.map((p) => (p.id === id ? { ...p, status: "Rented" } : p))
      );
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
  };

  const handleMarkAsAvailable = (id: number, title: string) => {
    showAlert({
      type: "info",
      title: t("properties.markAsAvailable"),
      message: `${t("properties.markAsAvailableConfirm")} "${title}"?`,
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("properties.markAvailable"),
          style: "default",
          onPress: () => confirmMarkAsAvailable(id),
        },
      ],
    });
  };

  const confirmMarkAsAvailable = async (id: number) => {
    try {
      setUpdatingStatusId(id);
      await api.put(`/api/properties/${id}/mark-available`);
      setProperties(
        properties.map((p) => (p.id === id ? { ...p, status: "Available" } : p))
      );
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
  };

  const handleEdit = (property: Property) => {
    router.push({
      pathname: "/(root)/(tabs)/edit-property/[propertyId]",
      params: { propertyId: property.id.toString() },
    });
  };

  const renderPropertyCard = ({ item }: { item: Property }) => {
    const isRental = item.listingType?.toLowerCase() === "rent";

    return (
      <View className="bg-white rounded-xl mb-4 shadow-sm overflow-hidden">
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
                className="text-lg font-rubik-bold text-gray-900"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text className="text-sm font-rubik text-gray-500 mt-1">
                {item.propertyType}
              </Text>
            </View>
            <Text className="text-lg font-rubik-bold text-blue-600 ml-2">
              {isRental
                ? `$${item.monthlyRent?.toLocaleString()}/mo`
                : `$${item.price.toLocaleString()}`}
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text
              className="text-sm font-rubik text-gray-600 ml-1"
              numberOfLines={1}
            >
              {item.address}
            </Text>
          </View>

          {/* Property Features */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-row items-center">
              <Ionicons name="bed-outline" size={18} color="#6B7280" />
              <Text className="text-sm font-rubik text-gray-700 ml-1">
                {item.bedrooms} {t("properties.bedrooms")}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="water-outline" size={18} color="#6B7280" />
              <Text className="text-sm font-rubik text-gray-700 ml-1">
                {item.bathrooms} {t("properties.bathrooms")}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="resize-outline" size={18} color="#6B7280" />
              <Text className="text-sm font-rubik text-gray-700 ml-1">
                {item.area} m²
              </Text>
            </View>
          </View>

          {/* Rental Info */}
          {isRental && item.leaseTermMonths && (
            <View className="bg-purple-50 p-3 rounded-lg mb-4">
              <Text className="text-purple-700 font-rubik text-sm">
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
      <Ionicons name="home-outline" size={80} color="#D1D5DB" />
      <Text className="text-xl font-semibold text-gray-700 mt-4">
        {t("properties.noPropertiesYet")}
      </Text>
      <Text className="text-gray-500 text-center mt-2 px-8">
        {t("properties.startByCreating")}
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(root)/(tabs)/create-property")}
        className="bg-blue-600 px-6 py-3 rounded-lg mt-6"
      >
        <Text className="text-white font-semibold">
          {t("properties.createProperty")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-gray-600 mt-4">{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-rubik-bold text-gray-900">
              {t("profile.myProperties")}
            </Text>
            <Text className="text-sm font-rubik text-gray-500 mt-1">
              {properties.length}{" "}
              {properties.length === 1
                ? t("profile.property")
                : t("profile.properties")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(root)/(tabs)/create-property")}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <View className="flex-row items-center">
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-1">
                {t("common.new")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        className="mb-12"
        data={properties}
        renderItem={renderPropertyCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default UserProperties;
