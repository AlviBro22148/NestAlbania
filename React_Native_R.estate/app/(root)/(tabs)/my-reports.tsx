import { useAlert } from "@/contexts/AlertContext";
import icons from "@/constants/icons";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "@/lib/axios-config";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
      if (error.response?.status === 404) {
        console.log('Reports API not implemented yet');
      } else {
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
      <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full p-8 mb-6">
        <Ionicons name="document-text-outline" size={80} color="#0061FF" />
      </View>
      <Text className="text-2xl font-rubik-extrabold text-gray-900 mb-2">
        {t("reports.noReports")}
      </Text>
      <Text className="text-base font-rubik text-gray-500 text-center px-12 leading-6">
        {t("reports.noReportsDesc")}
      </Text>
      <TouchableOpacity
        onPress={() => setCreateModalVisible(true)}
        className="mt-8 bg-primary-300 px-8 py-4 rounded-2xl"
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
        className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden"
        activeOpacity={0.7}
      >
        {/* Property Images Preview */}
        <View className="h-28 bg-gray-100 flex-row">
          {report.properties.slice(0, 4).map((property, index) => (
            <View
              key={property.id}
              className="flex-1"
              style={{ marginLeft: index > 0 ? 2 : 0 }}
            >
              <Image
                source={{ uri: property.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          ))}
          {report.properties.length === 0 && (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="images-outline" size={40} color="#9CA3AF" />
              <Text className="text-gray-400 font-rubik text-xs mt-2">
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
              <Text className="text-lg font-rubik-bold text-gray-900" numberOfLines={1}>
                {report.name}
              </Text>
              {report.description && (
                <Text className="text-sm text-gray-500 font-rubik mt-1" numberOfLines={2}>
                  {report.description}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteReport(report)}
              className="p-2 -mr-2"
            >
              <Image source={icons.trash} className="w-5 h-5" tintColor="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
            <View className="flex-row items-center flex-1">
              <Ionicons name="home-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 font-rubik-medium ml-1">
                {report.properties.length} {report.properties.length === 1 ? t("reports.property") : t("reports.properties")}
              </Text>
            </View>
            {report.properties.length > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={16} color="#6B7280" />
                <Text className="text-sm text-gray-600 font-rubik-medium ml-1">
                  ${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} {t("reports.avg")}
                </Text>
              </View>
            )}
          </View>

          {/* Timestamp */}
          <View className="flex-row items-center mt-2">
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-400 font-rubik ml-1">
              {t("reports.updated")} {getTimeAgo(report.updatedAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 to-white">
        <View className="flex-1 items-center justify-center">
          <View className="bg-white rounded-full p-8 shadow-xl">
            <ActivityIndicator size="large" color="#0061FF" />
          </View>
          <Text className="text-gray-600 font-rubik-medium mt-6 text-lg">
            {t("common.loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Animated Gradient Header */}
      <Animated.View
        style={{
          opacity: headerOpacity,
          transform: [{ scale: headerScale }],
        }}
      >
        <LinearGradient
          colors={["#DBEAFE", "#BFDBFE", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 py-8 rounded-b-[32px] shadow-lg"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              {/* Icon Container */}
              <View className="relative">
                <View className="bg-white rounded-full p-4 shadow-md">
                  <Ionicons name="document-text" size={32} color="#0061FF" />
                </View>
                {/* Badge */}
                {reports.length > 0 && (
                  <View className="absolute -top-1 -right-1 bg-primary-300 rounded-full min-w-[24px] h-6 items-center justify-center px-2 border-2 border-white">
                    <Text className="text-white text-xs font-rubik-bold">
                      {reports.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* Header Text */}
              <View className="ml-5 flex-1">
                <Text className="text-3xl font-rubik-extrabold text-gray-900">
                  {t("reports.title")}
                </Text>
                <View className="flex-row items-center mt-2">
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-sm font-rubik-bold text-blue-600">
                      {reports.length} {reports.length === 1 ? t("reports.report") : t("reports.reportPlural")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              onPress={() => setCreateModalVisible(true)}
              className="bg-primary-300 w-12 h-12 rounded-full items-center justify-center shadow-lg"
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Decorative Elements */}
          <View className="absolute -right-8 -top-8 w-32 h-32 bg-blue-200 rounded-full opacity-20" />
          <View className="absolute -left-4 -bottom-4 w-24 h-24 bg-indigo-200 rounded-full opacity-20" />
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
            tintColor="#0061FF"
            colors={["#0061FF", "#3B82F6", "#93C5FD"]}
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
              <View className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                <View className="flex-row items-center">
                  <Ionicons name="sparkles" size={20} color="#0061FF" />
                  <Text className="text-sm font-rubik-medium text-gray-700 flex-1 ml-2">
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
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-rubik-bold text-gray-900">
                {t("reports.createReport")}
              </Text>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
                {t("reports.reportName")} *
              </Text>
              <TextInput
                value={newReportName}
                onChangeText={setNewReportName}
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
                value={newReportDescription}
                onChangeText={setNewReportDescription}
                placeholder={t("reports.reportDescriptionPlaceholder")}
                className="bg-gray-100 rounded-xl px-4 py-3 font-rubik text-base text-gray-900"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: "top", minHeight: 80 }}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreateReport}
              disabled={creating}
              className={`py-4 rounded-xl ${creating ? "bg-gray-300" : "bg-primary-300"}`}
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
      </Modal>
    </SafeAreaView>
  );
}
