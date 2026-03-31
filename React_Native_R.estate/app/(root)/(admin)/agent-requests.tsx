import icons from "@/constants/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  InteractionManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AgentRequest {
  id: number;
  userId: string;
  username: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  requestedAt: string;
  status: "Pending" | "Approved" | "Rejected";
}

export default function AgentRequestsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [filter, setFilter] = useState<"Pending" | "Approved" | "Rejected" | "All">("Pending");
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Decline modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(null);

  useEffect(() => {
    if (user?.role !== "Admin") {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("admin.accessDenied"),
      });
      handleBack();
      return;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      loadRequests();
    });
    return () => task.cancel();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/auth/admin/agent-requests?status=${filter}`);
      setRequests(response.data);
    } catch (error) {
      console.error("Error loading agent requests:", error);
      showToast(t("admin.errorLoadingRequests"), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
  }, [filter]);

  const handleApprove = async (request: AgentRequest) => {
    showAlert({
      type: "info",
      title: t("admin.approveRequest"),
      message: t("admin.approveConfirm", { username: request.username }),
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("admin.approve"),
          onPress: async () => {
            try {
              setProcessingId(request.id);
              await api.post(`/api/auth/admin/agent-requests/${request.id}/approve`);

              showToast(t("admin.requestApproved"), "success");

              // Remove from list or update status
              setRequests(prev => prev.filter(r => r.id !== request.id));
            } catch (error: any) {
              console.error("Error approving request:", error);
              showToast(error.response?.data?.message || t("admin.errorApproving"), "error");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    });
  };

  const handleDeclinePress = (request: AgentRequest) => {
    setSelectedRequest(request);
    setDeclineReason("");
    setShowDeclineModal(true);
  };

  const handleDeclineConfirm = async () => {
    if (!selectedRequest) return;

    if (!declineReason.trim()) {
      showToast(t("admin.enterDeclineReason"), "error");
      return;
    }

    try {
      setProcessingId(selectedRequest.id);
      await api.post(`/api/auth/admin/agent-requests/${selectedRequest.id}/decline`, {
        reason: declineReason.trim(),
      });

      showToast(t("admin.requestDeclined"), "success");
      setShowDeclineModal(false);
      setSelectedRequest(null);
      setDeclineReason("");

      // Remove from list or update status
      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
    } catch (error: any) {
      console.error("Error declining request:", error);
      showToast(error.response?.data?.message || t("admin.errorDeclining"), "error");
    } finally {
      setProcessingId(null);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t("notifications.justNow");
    if (seconds < 3600)
      return `${Math.floor(seconds / 60)}${t("notifications.minutesAgo")}`;
    if (seconds < 86400)
      return `${Math.floor(seconds / 3600)}${t("notifications.hoursAgo")}`;
    if (seconds < 604800)
      return `${Math.floor(seconds / 86400)}${t("notifications.daysAgo")}`;
    return date.toLocaleDateString();
  };

  const renderRequest = ({ item }: { item: AgentRequest }) => (
    <View className="rounded-2xl shadow-sm border p-4 mb-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <View className="flex-row items-center mb-3">
        <Image
          source={{
            uri: item.profilePictureUrl || "https://via.placeholder.com/60",
          }}
          className="w-14 h-14 rounded-full"
        />
        <View className="flex-1 ml-3">
          <Text className="text-lg font-rubik-bold" style={{ color: colors.text }}>
            {item.username}
          </Text>
          <Text className="text-sm font-rubik" style={{ color: colors.textSecondary }}>{item.email}</Text>
          <Text className="text-xs font-rubik" style={{ color: colors.textMuted }}>{item.phoneNumber}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs font-rubik text-gray-400">
            {getTimeAgo(item.requestedAt)}
          </Text>
          <View
            className={`mt-1 px-2 py-1 rounded-full ${
              item.status === "Pending"
                ? "bg-yellow-100"
                : item.status === "Approved"
                ? "bg-green-100"
                : "bg-red-100"
            }`}
          >
            <Text
              className={`text-xs font-rubik-semibold ${
                item.status === "Pending"
                  ? "text-yellow-700"
                  : item.status === "Approved"
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {item.status === "Pending"
                ? t("admin.pending")
                : item.status === "Approved"
                ? t("admin.approved")
                : t("admin.rejected")}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons - Only for Pending requests */}
      {item.status === "Pending" && (
        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity
            onPress={() => handleDeclinePress(item)}
            disabled={processingId === item.id}
            className="flex-1 bg-red-50 border border-red-200 py-3 rounded-xl"
          >
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Text className="text-center font-rubik-semibold text-red-600">
                {t("admin.decline")}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleApprove(item)}
            disabled={processingId === item.id}
            className="flex-1 bg-green-500 py-3 rounded-xl"
          >
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-center font-rubik-semibold text-white">
                {t("admin.approve")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-6xl mb-4">📋</Text>
      <Text className="text-xl font-rubik-bold mb-2" style={{ color: colors.text }}>
        {t("admin.noRequests")}
      </Text>
      <Text className="text-center px-8 font-rubik" style={{ color: colors.textSecondary }}>
        {filter === "Pending"
          ? t("admin.noPendingRequests")
          : t("admin.noRequestsInCategory")}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 font-rubik" style={{ color: colors.textSecondary }}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="px-5 py-4 border-b" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <Image source={icons.backArrow} className="w-6 h-6" style={{ tintColor: colors.text }} />
          </TouchableOpacity>
          <Text className="text-2xl font-rubik-bold" style={{ color: colors.text }}>
            {t("admin.agentRequests")}
          </Text>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row gap-2">
          {(["Pending", "Approved", "Rejected", "All"] as const).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setFilter(status)}
              className="flex-1 py-2 rounded-lg"
              style={{ backgroundColor: filter === status ? colors.primary : colors.surfaceElevated }}
            >
              <Text
                className="text-center font-rubik-semibold text-sm"
                style={{ color: filter === status ? "white" : colors.text }}
              >
                {status === "Pending"
                  ? t("admin.pending")
                  : status === "Approved"
                  ? t("admin.approved")
                  : status === "Rejected"
                  ? t("admin.rejected")
                  : t("common.all")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Request List */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRequest}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
      />

      {/* Decline Reason Modal */}
      <Modal
        visible={showDeclineModal}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xl font-rubik-bold mb-2" style={{ color: colors.text }}>
                {t("admin.declineRequest")}
              </Text>
              <Text className="text-sm font-rubik mb-4" style={{ color: colors.textSecondary }}>
                {t("admin.declineReasonLabel", { username: selectedRequest?.username })}
              </Text>

              <TextInput
                value={declineReason}
                onChangeText={setDeclineReason}
                placeholder={t("admin.declineReasonPlaceholder")}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="border rounded-xl p-4 font-rubik min-h-[120px] mb-4"
                style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceElevated }}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowDeclineModal(false);
                    setSelectedRequest(null);
                    setDeclineReason("");
                  }}
                  className="flex-1 py-3 rounded-xl"
                  style={{ backgroundColor: colors.surfaceElevated }}
                >
                  <Text className="text-center font-rubik-semibold" style={{ color: colors.text }}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeclineConfirm}
                  disabled={processingId !== null}
                  className="flex-1 bg-red-500 py-3 rounded-xl"
                >
                  {processingId !== null ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-center font-rubik-semibold text-white">
                      {t("admin.decline")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

