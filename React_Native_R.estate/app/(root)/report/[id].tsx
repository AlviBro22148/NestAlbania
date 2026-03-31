import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import icons from "@/constants/icons";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  InteractionManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/my-reports");

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
    const task = InteractionManager.runAfterInteractions(() => {
      fetchReport();
    });
    return () => task.cancel();
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
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-6" style={{ backgroundColor: colors.background }}>
        <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
        <Text className="text-xl font-rubik-bold mt-4" style={{ color: colors.text }}>
          {t("reports.reportNotFound")}
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          className="mt-6 px-6 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-rubik-bold">{t("common.back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalValue = report.properties.reduce((sum, p) => sum + p.price, 0);
  const avgPrice = report.properties.length > 0 ? totalValue / report.properties.length : 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View className="px-5 py-4 border-b" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={handleBack} className="mr-3">
              <Image source={icons.backArrow} className="w-6 h-6" style={{ tintColor: colors.text }} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-rubik-bold" numberOfLines={1} style={{ color: colors.text }}>
                {report.name}
              </Text>
              {report.description && (
                <Text className="text-sm font-rubik mt-1" numberOfLines={2} style={{ color: colors.textSecondary }}>
                  {report.description}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setEditModalVisible(true)}
              className="p-2 rounded-full ml-2"
              style={{ backgroundColor: colors.surfaceElevated }}
            >
              <Ionicons name="pencil" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Stats */}
        <View className="mx-4 mt-4 rounded-2xl p-4 shadow-sm border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className="text-lg font-rubik-bold mb-3" style={{ color: colors.text }}>
            {t("reports.summary")}
          </Text>
          <View className="flex-row">
            <View className="flex-1 items-center py-3 border-r" style={{ borderColor: colors.border }}>
              <Text className="text-3xl font-rubik-bold" style={{ color: colors.primary }}>
                {report.properties.length}
              </Text>
              <Text className="text-sm font-rubik mt-1" style={{ color: colors.textSecondary }}>
                {t("reports.properties")}
              </Text>
            </View>
            <View className="flex-1 items-center py-3 border-r" style={{ borderColor: colors.border }}>
              <Text className="text-xl font-rubik-bold text-green-600">
                {formatPrice(totalValue)}
              </Text>
              <Text className="text-sm font-rubik mt-1" style={{ color: colors.textSecondary }}>
                {t("reports.totalValue")}
              </Text>
            </View>
            <View className="flex-1 items-center py-3">
              <Text className="text-xl font-rubik-bold text-blue-600">
                {formatPrice(avgPrice)}
              </Text>
              <Text className="text-sm font-rubik mt-1" style={{ color: colors.textSecondary }}>
                {t("reports.avgPrice")}
              </Text>
            </View>
          </View>
        </View>

        {/* Properties List */}
        <View className="px-4 mt-4 pb-32">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-rubik-bold" style={{ color: colors.text }}>
              {t("reports.propertiesInReport")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(root)/explore")}
              className="flex-row items-center"
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text className="font-rubik-medium ml-1" style={{ color: colors.primary }}>
                {t("reports.addMore")}
              </Text>
            </TouchableOpacity>
          </View>

          {report.properties.length === 0 ? (
            <View className="rounded-2xl p-8 items-center border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Ionicons name="home-outline" size={48} color={colors.textMuted} />
              <Text className="text-lg font-rubik-bold mt-4" style={{ color: colors.text }}>
                {t("reports.noPropertiesYet")}
              </Text>
              <Text className="text-sm font-rubik text-center mt-2" style={{ color: colors.textSecondary }}>
                {t("reports.addPropertiesHint")}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(root)/explore")}
                className="mt-4 px-6 py-3 rounded-xl"
                style={{ backgroundColor: colors.primary }}
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
                className="rounded-2xl mb-3 overflow-hidden shadow-sm border"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
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
                    <Text className="text-base font-rubik-bold" numberOfLines={1} style={{ color: colors.text }}>
                      {property.title}
                    </Text>
                    <Text className="text-sm font-rubik mt-1" numberOfLines={1} style={{ color: colors.textSecondary }}>
                      {property.address}
                    </Text>
                    <Text className="text-lg font-rubik-bold mt-2" style={{ color: colors.primary }}>
                      {formatPrice(property.price)}
                    </Text>

                    {/* Property Meta */}
                    <View className="flex-row items-center mt-2">
                      <View className="flex-row items-center mr-3">
                        <Ionicons name="bed-outline" size={14} color={colors.textMuted} />
                        <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>{property.bedrooms}</Text>
                      </View>
                      <View className="flex-row items-center mr-3">
                        <Ionicons name="water-outline" size={14} color={colors.textMuted} />
                        <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>{property.bathrooms}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="resize-outline" size={14} color={colors.textMuted} />
                        <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>{property.area}m²</Text>
                      </View>
                    </View>

                    {/* Notes Preview */}
                    {property.notes && (
                      <View className="rounded-lg px-2 py-1 mt-2" style={{ backgroundColor: isDark ? '#422006' : '#FEF9C3' }}>
                        <Text className="text-xs font-rubik" numberOfLines={1} style={{ color: isDark ? '#FDE047' : '#A16207' }}>
                          {property.notes}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row border-t" style={{ borderColor: colors.border }}>
                  <TouchableOpacity
                    onPress={() => openNotesModal(property)}
                    className="flex-1 flex-row items-center justify-center py-3 border-r"
                    style={{ borderColor: colors.border }}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                    <Text className="font-rubik-medium ml-2 text-sm" style={{ color: colors.primary }}>
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
        statusBarTranslucent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-3xl p-6" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-rubik-bold" style={{ color: colors.text }}>
                {t("reports.editReport")}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-2">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.textSecondary }}>
                {t("reports.reportName")} *
              </Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder={t("reports.reportNamePlaceholder")}
                className="rounded-xl px-4 py-3 font-rubik text-base"
                style={{ backgroundColor: colors.surfaceElevated, color: colors.text }}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.textSecondary }}>
                {t("reports.reportDescription")}
              </Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder={t("reports.reportDescriptionPlaceholder")}
                className="rounded-xl px-4 py-3 font-rubik text-base"
                style={{ backgroundColor: colors.surfaceElevated, color: colors.text, textAlignVertical: "top", minHeight: 80 }}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveEdit}
              disabled={saving}
              className="py-4 rounded-xl"
              style={{ backgroundColor: saving ? colors.textMuted : colors.primary }}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={notesModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-3xl p-6" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-rubik-bold" style={{ color: colors.text }}>
                {t("reports.propertyNotes")}
              </Text>
              <TouchableOpacity onPress={() => setNotesModalVisible(false)} className="p-2">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedProperty && (
              <View className="rounded-xl p-3 mb-4 flex-row items-center" style={{ backgroundColor: colors.surfaceElevated }}>
                <Image
                  source={{ uri: selectedProperty.image }}
                  className="w-16 h-16 rounded-lg"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-rubik-bold" numberOfLines={1} style={{ color: colors.text }}>
                    {selectedProperty.title}
                  </Text>
                  <Text className="text-sm font-rubik-bold mt-1" style={{ color: colors.primary }}>
                    {formatPrice(selectedProperty.price)}
                  </Text>
                </View>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.textSecondary }}>
                {t("reports.yourNotes")}
              </Text>
              <TextInput
                value={propertyNotes}
                onChangeText={setPropertyNotes}
                placeholder={t("reports.notesPlaceholder")}
                className="rounded-xl px-4 py-3 font-rubik text-base"
                style={{ backgroundColor: colors.surfaceElevated, color: colors.text, textAlignVertical: "top", minHeight: 120 }}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveNotes}
              disabled={savingNotes}
              className="py-4 rounded-xl"
              style={{ backgroundColor: savingNotes ? colors.textMuted : colors.primary }}
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
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

