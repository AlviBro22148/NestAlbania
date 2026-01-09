import { useAlert } from "@/contexts/AlertContext";
import icons from "@/constants/icons";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/lib/axios-config";

// Local interfaces
interface ReportProperty {
  id: number;
  propertyId: number;
  title: string;
  address: string;
  price: number;
  image: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  notes?: string;
}

interface Report {
  id: number;
  name: string;
  description?: string;
  properties: ReportProperty[];
  createdAt: string;
  updatedAt: string;
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const handleBack = useBackNavigation("/(root)/(tabs)/my-reports");

  const [report, setReport] = useState<Report | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<ReportProperty | null>(null);
  const [propertyNotes, setPropertyNotes] = useState("");

  const fetchReport = useCallback(async () => {
    if (!id) return;
    const reportId = parseInt(id, 10);

    try {
      const response = await api.get(`/api/reports/${reportId}`);
      const reportData = response.data;

      if (reportData) {
        // Transform properties to match local interface
        const transformedReport: Report = {
          id: reportData.id,
          name: reportData.name,
          description: reportData.description,
          createdAt: reportData.createdAt,
          updatedAt: reportData.updatedAt,
          properties: (reportData.properties || []).map((p: any) => ({
            id: p.id,
            propertyId: p.propertyId || p.property?.id,
            title: p.property?.title || p.title || "Unknown Property",
            address: p.property?.address || p.address || "",
            price: p.property?.price || p.price || 0,
            image: p.property?.images?.[0]?.url || p.property?.image || p.image || "",
            bedrooms: p.property?.bedrooms || p.bedrooms || 0,
            bathrooms: p.property?.bathrooms || p.bathrooms || 0,
            area: p.property?.area || p.area || 0,
            notes: p.notes || "",
          })),
        };

        setReport(transformedReport);
        setEditName(transformedReport.name);
        setEditDescription(transformedReport.description || "");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReport();
    setRefreshing(false);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !id) {
      showToast(t("reports.enterReportName"), "error");
      return;
    }

    try {
      setSaving(true);
      const reportId = parseInt(id, 10);
      await api.put(`/api/reports/${reportId}`, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditModalVisible(false);
      await fetchReport();
      showToast(t("reports.reportUpdated"), "success");
    } catch (error) {
      showToast(t("reports.errorUpdating"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProperty = (property: ReportProperty) => {
    if (!id) return;
    const reportId = parseInt(id, 10);

    showAlert({
      type: "warning",
      title: t("reports.removePropertyTitle"),
      message: t("reports.removePropertyMessage", { title: property.title }),
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/reports/${reportId}/properties/${property.propertyId}`);
              await fetchReport();
              showToast(t("reports.propertyRemoved"), "success");
            } catch (error) {
              showToast(t("reports.errorRemoving"), "error");
            }
          },
        },
      ],
    });
  };

  const openNotesModal = (property: ReportProperty) => {
    setSelectedProperty(property);
    setPropertyNotes(property.notes || "");
    setNotesModalVisible(true);
  };

  const [savingNotes, setSavingNotes] = useState(false);

  const handleSaveNotes = async () => {
    if (!selectedProperty || !id) return;

    try {
      setSavingNotes(true);
      const reportId = parseInt(id, 10);
      await api.put(`/api/reports/${reportId}/properties/${selectedProperty.propertyId}`, {
        Notes: propertyNotes,
      });
      setNotesModalVisible(false);
      await fetchReport();
      showToast(t("reports.notesSaved"), "success");
    } catch (error) {
      console.error("Error saving notes:", error);
      showToast(t("reports.errorSavingNotes"), "error");
    } finally {
      setSavingNotes(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0061FF" />
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-rubik-bold text-gray-900 mt-4">
          {t("reports.reportNotFound")}
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          className="mt-6 bg-primary-300 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-rubik-bold">{t("common.back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalValue = report.properties.reduce((sum, p) => sum + p.price, 0);
  const avgPrice = report.properties.length > 0 ? totalValue / report.properties.length : 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0061FF" />
        }
      >
        {/* Header */}
        <View className="bg-white px-5 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={handleBack} className="mr-3">
              <Image source={icons.backArrow} className="w-6 h-6" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-rubik-bold text-black-300" numberOfLines={1}>
                {report.name}
              </Text>
              {report.description && (
                <Text className="text-sm text-gray-500 font-rubik mt-1" numberOfLines={2}>
                  {report.description}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setEditModalVisible(true)}
              className="bg-gray-100 p-2 rounded-full ml-2"
            >
              <Ionicons name="pencil" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Stats */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-rubik-bold text-gray-900 mb-3">
            {t("reports.summary")}
          </Text>
          <View className="flex-row">
            <View className="flex-1 items-center py-3 border-r border-gray-100">
              <Text className="text-3xl font-rubik-bold text-primary-300">
                {report.properties.length}
              </Text>
              <Text className="text-sm text-gray-500 font-rubik mt-1">
                {t("reports.properties")}
              </Text>
            </View>
            <View className="flex-1 items-center py-3 border-r border-gray-100">
              <Text className="text-xl font-rubik-bold text-green-600">
                {formatPrice(totalValue)}
              </Text>
              <Text className="text-sm text-gray-500 font-rubik mt-1">
                {t("reports.totalValue")}
              </Text>
            </View>
            <View className="flex-1 items-center py-3">
              <Text className="text-xl font-rubik-bold text-blue-600">
                {formatPrice(avgPrice)}
              </Text>
              <Text className="text-sm text-gray-500 font-rubik mt-1">
                {t("reports.avgPrice")}
              </Text>
            </View>
          </View>
        </View>

        {/* Properties List */}
        <View className="px-4 mt-4 pb-32">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-rubik-bold text-gray-900">
              {t("reports.propertiesInReport")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(root)/(tabs)/explore")}
              className="flex-row items-center"
            >
              <Ionicons name="add-circle-outline" size={20} color="#0061FF" />
              <Text className="text-primary-300 font-rubik-medium ml-1">
                {t("reports.addMore")}
              </Text>
            </TouchableOpacity>
          </View>

          {report.properties.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
              <Ionicons name="home-outline" size={48} color="#9CA3AF" />
              <Text className="text-lg font-rubik-bold text-gray-900 mt-4">
                {t("reports.noPropertiesYet")}
              </Text>
              <Text className="text-sm text-gray-500 font-rubik text-center mt-2">
                {t("reports.addPropertiesHint")}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/explore")}
                className="mt-4 bg-primary-300 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-rubik-bold">
                  {t("reports.browseProperties")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            report.properties.map((property) => (
              <TouchableOpacity
                key={property.id}
                onPress={() => router.push(`/(root)/properties/${property.propertyId}`)}
                className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm border border-gray-100"
                activeOpacity={0.7}
              >
                <View className="flex-row">
                  {/* Property Image */}
                  <Image
                    source={{ uri: property.image }}
                    className="w-28 h-full"
                    resizeMode="cover"
                  />

                  {/* Property Details */}
                  <View className="flex-1 p-3">
                    <Text className="text-base font-rubik-bold text-gray-900" numberOfLines={1}>
                      {property.title}
                    </Text>
                    <Text className="text-sm text-gray-500 font-rubik mt-1" numberOfLines={1}>
                      {property.address}
                    </Text>
                    <Text className="text-lg font-rubik-bold text-primary-300 mt-2">
                      {formatPrice(property.price)}
                    </Text>

                    {/* Property Meta */}
                    <View className="flex-row items-center mt-2">
                      <View className="flex-row items-center mr-3">
                        <Ionicons name="bed-outline" size={14} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">{property.bedrooms}</Text>
                      </View>
                      <View className="flex-row items-center mr-3">
                        <Ionicons name="water-outline" size={14} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">{property.bathrooms}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="resize-outline" size={14} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">{property.area}m²</Text>
                      </View>
                    </View>

                    {/* Notes Preview */}
                    {property.notes && (
                      <View className="bg-yellow-50 rounded-lg px-2 py-1 mt-2">
                        <Text className="text-xs text-yellow-700 font-rubik" numberOfLines={1}>
                          {property.notes}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row border-t border-gray-100">
                  <TouchableOpacity
                    onPress={() => openNotesModal(property)}
                    className="flex-1 flex-row items-center justify-center py-3 border-r border-gray-100"
                  >
                    <Ionicons name="create-outline" size={18} color="#0061FF" />
                    <Text className="text-primary-300 font-rubik-medium ml-2 text-sm">
                      {property.notes ? t("reports.editNotes") : t("reports.addNotes")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveProperty(property)}
                    className="flex-1 flex-row items-center justify-center py-3"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text className="text-red-500 font-rubik-medium ml-2 text-sm">
                      {t("common.delete")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Report Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-rubik-bold text-gray-900">
                {t("reports.editReport")}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-2">
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
                {t("reports.reportName")} *
              </Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder={t("reports.reportNamePlaceholder")}
                className="bg-gray-100 rounded-xl px-4 py-3 font-rubik text-base text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
                {t("reports.reportDescription")}
              </Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder={t("reports.reportDescriptionPlaceholder")}
                className="bg-gray-100 rounded-xl px-4 py-3 font-rubik text-base text-gray-900"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: "top", minHeight: 80 }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveEdit}
              disabled={saving}
              className={`py-4 rounded-xl ${saving ? "bg-gray-300" : "bg-primary-300"}`}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-center font-rubik-bold text-lg">
                  {t("common.save")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={notesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-rubik-bold text-gray-900">
                {t("reports.propertyNotes")}
              </Text>
              <TouchableOpacity onPress={() => setNotesModalVisible(false)} className="p-2">
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedProperty && (
              <View className="bg-gray-50 rounded-xl p-3 mb-4 flex-row items-center">
                <Image
                  source={{ uri: selectedProperty.image }}
                  className="w-16 h-16 rounded-lg"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-rubik-bold text-gray-900" numberOfLines={1}>
                    {selectedProperty.title}
                  </Text>
                  <Text className="text-sm text-primary-300 font-rubik-bold mt-1">
                    {formatPrice(selectedProperty.price)}
                  </Text>
                </View>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
                {t("reports.yourNotes")}
              </Text>
              <TextInput
                value={propertyNotes}
                onChangeText={setPropertyNotes}
                placeholder={t("reports.notesPlaceholder")}
                className="bg-gray-100 rounded-xl px-4 py-3 font-rubik text-base text-gray-900"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                style={{ textAlignVertical: "top", minHeight: 120 }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveNotes}
              disabled={savingNotes}
              className={`py-4 rounded-xl ${savingNotes ? "bg-gray-300" : "bg-primary-300"}`}
            >
              {savingNotes ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-center font-rubik-bold text-lg">
                  {t("common.save")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
