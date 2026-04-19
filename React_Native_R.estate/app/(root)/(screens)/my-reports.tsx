import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import icons from "@/constants/icons";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-config";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

interface ReportProperty {
  id: number;
  propertyId: number;
  title: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  status: string;
  image?: string;
  addedAt: string;
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

export default function MyReportsScreen() {
  const { t } = useTranslation();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const handleBack = useBackNavigation("/(root)/profile");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [newReportDescription, setNewReportDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/reports');
      const reportsData = response.data || [];

      const transformedReports: Report[] = reportsData.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        properties: (r.properties || []).map((rp: any) => ({
          id: rp.id,
          propertyId: rp.propertyId,
          title: rp.property?.title || 'Unknown Property',
          price: rp.property?.price || 0,
          address: rp.property?.address || '',
          bedrooms: rp.property?.bedrooms || 0,
          bathrooms: rp.property?.bathrooms || 0,
          area: rp.property?.area || 0,
          propertyType: rp.property?.propertyType || '',
          status: rp.property?.status || '',
          image: rp.property?.image,
          addedAt: rp.addedAt,
          notes: rp.notes,
        })),
      }));

      setReports(transformedReports);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching reports:', error);
      }
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const handleCreateReport = async () => {
    if (!newReportName.trim()) {
      showToast(t("reports.enterReportName"), "error");
      return;
    }

    try {
      setCreating(true);
      await api.post('/api/reports', {
        name: newReportName.trim(),
        description: newReportDescription.trim() || undefined
      });
      setCreateModalVisible(false);
      setNewReportName("");
      setNewReportDescription("");
      showToast(t("reports.reportCreated"), "success");
      queryClient.invalidateQueries({ queryKey: ['reports'] }); // Sync with React Query
      await fetchReports();
    } catch (error) {
      console.error("Error creating report:", error);
      showToast(t("reports.errorCreating"), "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteReport = (report: Report) => {
    showAlert({
      type: "warning",
      title: t("reports.deleteTitle"),
      message: t("reports.deleteMessage", { name: report.name }),
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/reports/${report.id}`);
              showToast(t("reports.reportDeleted"), "success");
              queryClient.invalidateQueries({ queryKey: ['reports'] }); // Sync with React Query
              await fetchReports();
            } catch (error) {
              showToast(t("reports.errorDeleting"), "error");
            }
          },
        },
      ],
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t("notifications.justNow");
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${t("notifications.minutesAgo")}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t("notifications.hoursAgo")}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}${t("notifications.daysAgo")}`;
    return date.toLocaleDateString();
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-32">
      <View className="rounded-full p-8 mb-6" style={{ backgroundColor: isDark ? colors.surfaceElevated : "#EFF6FF" }}>
        <Ionicons name="document-text-outline" size={80} color={colors.primary} />
      </View>
      <Text className="text-2xl font-rubik-extrabold mb-2" style={{ color: colors.text }}>
        {t("reports.noReports")}
      </Text>
      <Text className="text-base font-rubik text-center px-12 leading-6" style={{ color: colors.textSecondary }}>
        {t("reports.noReportsDesc")}
      </Text>
      <TouchableOpacity
        onPress={() => setCreateModalVisible(true)}
        className="mt-8 px-8 py-4 rounded-2xl"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-white font-rubik-bold text-base">
          {t("reports.createFirst")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderReportCard = ({ item: report }: { item: Report }) => {
    const totalValue = report.properties.reduce((sum, p) => sum + p.price, 0);
    const avgPrice = report.properties.length > 0
      ? totalValue / report.properties.length
      : 0;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(root)/report/${report.id}`)}
        className="rounded-2xl mb-4 shadow-sm border overflow-hidden"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        activeOpacity={0.7}
      >
        {/* Property Images Preview */}
        <View className="h-28 flex-row" style={{ backgroundColor: colors.surfaceElevated }}>
          {report.properties.slice(0, 4).map((property, index) => (
            <View
              key={property.id}
              className="flex-1"
              style={{ marginLeft: index > 0 ? 2 : 0 }}
            >
              <ExpoImage
                source={{ uri: property.image }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
          ))}
          {report.properties.length === 0 && (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="images-outline" size={40} color={colors.textMuted} />
              <Text className="font-rubik text-xs mt-2" style={{ color: colors.textMuted }}>
                {t("reports.noPropertiesYet")}
              </Text>
            </View>
          )}
          {report.properties.length > 4 && (
            <View className="absolute right-2 bottom-2 bg-black/60 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-rubik-bold">
                +{report.properties.length - 4}
              </Text>
            </View>
          )}
        </View>

        {/* Report Details */}
        <View className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-lg font-rubik-bold" style={{ color: colors.text }} numberOfLines={1}>
                {report.name}
              </Text>
              {report.description && (
                <Text className="text-sm font-rubik mt-1" style={{ color: colors.textSecondary }} numberOfLines={2}>
                  {report.description}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteReport(report)}
              className="p-2 -mr-2"
            >
              <ExpoImage source={icons.trash} style={{ width: 20, height: 20 }} tintColor="#EF4444" contentFit="contain" />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View className="flex-row items-center mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center flex-1">
              <Ionicons name="home-outline" size={16} color={colors.textMuted} />
              <Text className="text-sm font-rubik-medium ml-1" style={{ color: colors.textSecondary }}>
                {report.properties.length} {report.properties.length === 1 ? t("reports.property") : t("reports.properties")}
              </Text>
            </View>
            {report.properties.length > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={16} color={colors.textMuted} />
                <Text className="text-sm font-rubik-medium ml-1" style={{ color: colors.textSecondary }}>
                  ${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} {t("reports.avg")}
                </Text>
              </View>
            )}
          </View>

          {/* Timestamp */}
          <View className="flex-row items-center mt-2">
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text className="text-xs font-rubik ml-1" style={{ color: colors.textMuted }}>
              {t("reports.updated")} {getTimeAgo(report.updatedAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <View className="rounded-full p-8 shadow-xl" style={{ backgroundColor: colors.surface }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text className="font-rubik-medium mt-6 text-lg" style={{ color: colors.textSecondary }}>
            {t("common.loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Animated Gradient Header */}
      <Animated.View
        style={{
          opacity: headerOpacity,
          transform: [{ scale: headerScale }],
        }}
      >
        <LinearGradient
          colors={isDark ? [colors.surface, colors.surfaceElevated, colors.background] : ["#DBEAFE", "#BFDBFE", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 py-8 rounded-b-[32px] shadow-lg"
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full mb-4"
            style={{ backgroundColor: isDark ? colors.surfaceElevated : "rgba(255,255,255,0.8)" }}
          >
            <ExpoImage source={icons.backArrow} style={{ width: 20, height: 20 }} tintColor={colors.text} contentFit="contain" />
          </TouchableOpacity>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              {/* Icon Container */}
              <View className="relative">
                <View className="rounded-full p-4 shadow-md" style={{ backgroundColor: colors.surface }}>
                  <Ionicons name="document-text" size={32} color={colors.primary} />
                </View>
                {/* Badge */}
                {reports.length > 0 && (
                  <View className="absolute -top-1 -right-1 rounded-full min-w-[24px] h-6 items-center justify-center px-2 border-2 border-white" style={{ backgroundColor: colors.primary }}>
                    <Text className="text-white text-xs font-rubik-bold">
                      {reports.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* Header Text */}
              <View className="ml-5 flex-1">
                <Text className="text-3xl font-rubik-extrabold" style={{ color: colors.text }}>
                  {t("reports.title")}
                </Text>
                <View className="flex-row items-center mt-2">
                  <View className="px-3 py-1 rounded-full" style={{ backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "#DBEAFE" }}>
                    <Text className="text-sm font-rubik-bold" style={{ color: colors.primary }}>
                      {reports.length} {reports.length === 1 ? t("reports.report") : t("reports.reportPlural")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              onPress={() => setCreateModalVisible(true)}
              className="w-12 h-12 rounded-full items-center justify-center shadow-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Decorative Elements */}
          <View className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: isDark ? colors.primary : "#BFDBFE" }} />
          <View className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: isDark ? colors.primary : "#C7D2FE" }} />
        </LinearGradient>
      </Animated.View>

      {/* Reports List */}
      <Animated.FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 8,
          paddingBottom: 100,
        }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary, "#3B82F6", "#93C5FD"]}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={
          reports.length > 0 ? (
            <View className="mb-4">
              <View className="p-4 rounded-2xl border" style={{ backgroundColor: isDark ? colors.surface : "#EFF6FF", borderColor: isDark ? colors.border : "#BFDBFE" }}>
                <View className="flex-row items-center">
                  <Ionicons name="sparkles" size={20} color={colors.primary} />
                  <Text className="text-sm font-rubik-medium flex-1 ml-2" style={{ color: colors.text }}>
                    {t("reports.headerTip")}
                  </Text>
                </View>
              </View>
            </View>
          ) : null
        }
      />

      {/* Create Report Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-3xl p-6" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-rubik-bold" style={{ color: colors.text }}>
                {t("reports.createReport")}
              </Text>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
                {t("reports.reportName")} *
              </Text>
              <TextInput
                value={newReportName}
                onChangeText={setNewReportName}
                placeholder={t("reports.reportNamePlaceholder")}
                className="rounded-xl px-4 py-3 font-rubik text-base"
                style={{ backgroundColor: colors.surfaceElevated, color: colors.text }}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
                {t("reports.reportDescription")}
              </Text>
              <TextInput
                value={newReportDescription}
                onChangeText={setNewReportDescription}
                placeholder={t("reports.reportDescriptionPlaceholder")}
                className="rounded-xl px-4 py-3 font-rubik text-base"
                style={{ backgroundColor: colors.surfaceElevated, color: colors.text, textAlignVertical: "top", minHeight: 80 }}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreateReport}
              disabled={creating}
              className="py-4 rounded-xl"
              style={{ backgroundColor: creating ? colors.textMuted : colors.primary }}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-center font-rubik-bold text-lg">
                  {t("reports.create")}
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

