import ContactOwnerModal from "@/components/ContactOwnerModal";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api from "@/lib/axios-config";
import { translateText } from "@/lib/translate";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Local interfaces for reports
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
  id: string;
  name: string;
  description?: string;
  properties: ReportProperty[];
  createdAt: string;
  updatedAt: string;
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const handleBack = useBackNavigation("/(root)/(tabs)/explore");
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [translatedDescription, setTranslatedDescription] = useState("");
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);

  // Reports state (replacing context)
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const { t, i18n } = useTranslation();
  const { showToast } = useAlert();
  const { user } = useAuth();
  const { startConversation, hasExistingConversation } = useChat();

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [startingChat, setStartingChat] = useState(false);
  const [createReportMode, setCreateReportMode] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [newReportDescription, setNewReportDescription] = useState("");
  const [addingToReport, setAddingToReport] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPropertyDetails();
      fetchReports();
    }, [id])
  );

  useEffect(() => {
    if (property) {
      if (i18n.language === "en") {
        setTranslatedDescription(property.description);
        setTranslatedTitle(property.title);
      } else {
        translatePropertyContent();
      }
    }
  }, [property, i18n.language]);

  // Fetch reports from API
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const response = await api.get("/api/reports");
      const reportsData = response.data || [];

      const transformedReports: Report[] = reportsData.map((r: any) => ({
        id: r.id.toString(),
        name: r.name,
        description: r.description,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        properties: (r.properties || []).map((p: any) => ({
          id: p.id,
          propertyId: p.propertyId || p.property?.id,
          title: p.property?.title || p.title || "Unknown Property",
          address: p.property?.address || p.address || "",
          price: p.property?.price || p.price || 0,
          image:
            p.property?.images?.[0]?.url || p.property?.image || p.image || "",
          bedrooms: p.property?.bedrooms || p.bedrooms || 0,
          bathrooms: p.property?.bathrooms || p.bathrooms || 0,
          area: p.property?.area || p.area || 0,
          notes: p.notes || "",
        })),
      }));

      setReports(transformedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  // Check if property is in a specific report
  const isPropertyInReport = (
    reportId: string,
    propertyId: number
  ): boolean => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return false;
    return report.properties.some((p) => p.propertyId === propertyId);
  };

  // Get reports containing a specific property
  const getReportsContainingProperty = (propertyId: number): Report[] => {
    return reports.filter((report) =>
      report.properties.some((p) => p.propertyId === propertyId)
    );
  };

  // Create a new report
  const createReport = async (
    name: string,
    description?: string
  ): Promise<Report> => {
    const response = await api.post("/api/reports", { name, description });
    const newReport: Report = {
      id: response.data.id.toString(),
      name: response.data.name,
      description: response.data.description,
      properties: [],
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    };
    setReports((prev) => [...prev, newReport]);
    return newReport;
  };

  // Add property to report
  const addPropertyToReport = async (reportId: string, propertyData: any) => {
    await api.post(`/api/reports/${reportId}/properties`, {
      propertyId: propertyData.id,
    });
    // Refresh reports to get updated data
    await fetchReports();
  };

  const getCoordinatesFromAddress = async (address: string) => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "NestAlbaniaApp/1.0",
        },
      });

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }

      return null;
    } catch (error) {
      console.error("Error geocoding address:", error);
      return null;
    }
  };

  const fetchPropertyDetails = async () => {
    try {
      const response = await api.get(`/api/properties/${id}`);
      setProperty(response.data);
      setTranslatedDescription(response.data.description);
      setTranslatedTitle(response.data.title);

      if (response.data.address) {
        setLoadingMap(true);
        const coords = await getCoordinatesFromAddress(response.data.address);
        setCoordinates(coords);
        setLoadingMap(false);
      }
    } catch (error) {
      console.error("Error fetching property details:", error);
    } finally {
      setLoading(false);
    }
  };

  const translatePropertyContent = async () => {
    setTranslating(true);
    try {
      const [translatedDesc, translatedTtl] = await Promise.all([
        translateText(property.description, i18n.language),
        translateText(property.title, i18n.language),
      ]);

      setTranslatedDescription(translatedDesc);
      setTranslatedTitle(translatedTtl);
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedDescription(property.description);
      setTranslatedTitle(property.title);
    } finally {
      setTranslating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleOpenMaps = () => {
    const encodedAddress = encodeURIComponent(property.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(url);
  };

  const handleAddToReport = async (reportId: string) => {
    if (!property) return;

    try {
      setAddingToReport(true);
      await addPropertyToReport(reportId, {
        id: property.id,
        title: property.title,
        price: property.price,
        address: property.address,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        propertyType: property.propertyType,
        images: property.images,
      });
      setReportModalVisible(false);
      showToast(t("reports.addedToReport"), "success");
    } catch (error) {
      showToast(t("reports.errorAddingToReport"), "error");
    } finally {
      setAddingToReport(false);
    }
  };

  const handleCreateAndAddToReport = async () => {
    if (!newReportName.trim()) {
      showToast(t("reports.enterReportName"), "error");
      return;
    }

    if (!property) return;

    try {
      setAddingToReport(true);
      const newReport = await createReport(
        newReportName.trim(),
        newReportDescription.trim() || undefined
      );
      await addPropertyToReport(newReport.id, {
        id: property.id,
        title: property.title,
        price: property.price,
        address: property.address,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        propertyType: property.propertyType,
        images: property.images,
      });
      setReportModalVisible(false);
      setCreateReportMode(false);
      setNewReportName("");
      setNewReportDescription("");
      showToast(t("reports.createdAndAdded"), "success");
    } catch (error) {
      showToast(t("reports.errorCreating"), "error");
    } finally {
      setAddingToReport(false);
    }
  };

  const reportsContainingProperty = property
    ? getReportsContainingProperty(property.id)
    : [];

  // Check if current user is the property owner (agent/admin shouldn't chat with themselves)
  const isOwnProperty = property?.userId === user?.id;
  const isUserRole = user?.role === "User";
  const canStartChat = isUserRole && !isOwnProperty && property?.userId;

  // Check for existing conversation
  const existingConversation = property
    ? hasExistingConversation(property.id)
    : undefined;

  // Handle starting a chat with the agent
  const handleStartChat = async () => {
    if (!chatMessage.trim()) {
      showToast(t("chat.enterMessage"), "error");
      return;
    }

    if (!property?.userId) {
      showToast(t("chat.agentNotAvailable"), "error");
      return;
    }

    try {
      setStartingChat(true);
      const conversation = await startConversation(
        property.id,
        property.userId,
        chatMessage.trim()
      );
      setChatModalVisible(false);
      setChatMessage("");
      showToast(t("chat.messageSent"), "success");
      // Navigate to the chat
      router.push(`/(root)/chat/${conversation.id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      showToast(t("chat.errorStarting"), "error");
    } finally {
      setStartingChat(false);
    }
  };

  // Handle going to existing chat
  const handleGoToChat = () => {
    if (existingConversation) {
      router.push(`/(root)/chat/${existingConversation.id}`);
    } else {
      setChatModalVisible(true);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0061ff" />
      </View>
    );
  }

  if (!property) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-xl font-rubik-bold">
          {t("properties.propertyNotFound")}
        </Text>
      </View>
    );
  }

  const isRental = property.listingType === "Rent";

  return (
    <SafeAreaView className="flex-1 bg-white mb-12">
      <ScrollView>
        {/* Image Gallery */}
        <View className="relative">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {property.images.map((image: string, index: number) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={{ width, height: 300 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={handleBack}
            className="absolute top-4 left-4 bg-white/90 rounded-full w-10 h-10 items-center justify-center"
          >
            <Text className="text-xl mb-2">←</Text>
          </TouchableOpacity>

          <View className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full">
            <Text className="text-white text-sm">
              {currentImageIndex + 1} / {property.images.length}
            </Text>
          </View>
        </View>

        {/* Property Details */}
        <View className="p-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="bg-primary-300 px-3 py-1 rounded-full">
              <Text className="text-white text-sm font-rubik-medium">
                {t(`propertyTypes.${property.propertyType.toLowerCase()}`)}
              </Text>
            </View>
            <View className="flex-row gap-2">
              {/* Listing Type Badge */}
              <View
                className={`px-3 py-1 rounded-full ${isRental ? "bg-purple-100" : "bg-blue-100"}`}
              >
                <Text
                  className={`text-sm font-rubik-medium ${isRental ? "text-purple-700" : "text-blue-700"}`}
                >
                  {isRental ? "🔑 For Rent" : "🏷️ For Sale"}
                </Text>
              </View>
              {/* Status Badge */}
              <View
                className={`px-3 py-1 rounded-full ${
                  property.status === "Available"
                    ? "bg-green-100"
                    : property.status === "Rented"
                      ? "bg-purple-100"
                      : "bg-red-100"
                }`}
              >
                <Text
                  className={`text-sm font-rubik-medium ${
                    property.status === "Available"
                      ? "text-green-700"
                      : property.status === "Rented"
                        ? "text-purple-700"
                        : "text-red-700"
                  }`}
                >
                  {property.status === "Available"
                    ? t("properties.Available")
                    : property.status === "Rented"
                      ? t("properties.Rented")
                      : t("properties.Sold")}
                </Text>
              </View>
            </View>
          </View>

          {translating && (
            <View className="flex-row items-center mb-3 bg-blue-50 p-2 rounded-lg">
              <ActivityIndicator size="small" color="#0061ff" />
              <Text className="text-blue-600 ml-2 text-sm">
                {i18n.language === "sq"
                  ? "Duke përkthyer..."
                  : "Translating..."}
              </Text>
            </View>
          )}

          <Text className="text-3xl font-rubik-bold text-black-300 mb-2">
            {translatedTitle}
          </Text>

          <Text className="text-gray-600 mb-4">📍 {property.address}</Text>

          {/* Price Display - Different for Sale vs Rent */}
          {isRental ? (
            <View className="mb-6">
              <Text className="text-4xl font-rubik-bold text-primary-300">
                {formatPrice(property.monthlyRent)}/mo
              </Text>
              {property.securityDeposit && (
                <Text className="text-gray-600 mt-1 font-rubik">
                  💰 Security Deposit: {formatPrice(property.securityDeposit)}
                </Text>
              )}
              {property.leaseTermMonths && (
                <Text className="text-gray-600 font-rubik">
                  📅 Lease Term: {property.leaseTermMonths} months
                </Text>
              )}
            </View>
          ) : (
            <Text className="text-4xl font-rubik-bold text-primary-300 mb-6">
              {formatPrice(property.price)}
            </Text>
          )}

          {/* Features Grid */}
          <View className="flex-row flex-wrap gap-4 mb-6">
            {property.bedrooms > 0 && (
              <View className="bg-gray-100 px-4 py-3 rounded-xl flex-1 min-w-[100px]">
                <Text className="text-2xl mb-1">🛏️</Text>
                <Text className="text-lg font-rubik-bold">
                  {property.bedrooms}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {t("properties.bedrooms")}
                </Text>
              </View>
            )}
            {property.bathrooms > 0 && (
              <View className="bg-gray-100 px-4 py-3 rounded-xl flex-1 min-w-[100px]">
                <Text className="text-2xl mb-1">🚿</Text>
                <Text className="text-lg font-rubik-bold">
                  {property.bathrooms}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {t("properties.bathrooms")}
                </Text>
              </View>
            )}
            {property.area > 0 && (
              <View className="bg-gray-100 px-4 py-3 rounded-xl flex-1 min-w-[100px]">
                <Text className="text-2xl mb-1">📐</Text>
                <Text className="text-lg font-rubik-bold">
                  {property.area}m²
                </Text>
                <Text className="text-gray-600 text-sm">
                  {t("properties.area")}
                </Text>
              </View>
            )}
          </View>

          {/* Rental-Specific Features */}
          {isRental && (
            <View className="mb-6">
              <Text className="text-xl font-rubik-bold mb-3">
                🔑 Rental Details
              </Text>
              <View className="bg-gray-50 rounded-xl p-4 gap-3">
                {property.furnishedStatus && (
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2">🛋️</Text>
                    <Text className="font-rubik text-gray-700">
                      <Text className="font-rubik-bold">Furnished:</Text>{" "}
                      {property.furnishedStatus}
                    </Text>
                  </View>
                )}
                <View className="flex-row items-center">
                  <Text className="text-lg mr-2">
                    {property.utilitiesIncluded ? "✅" : "❌"}
                  </Text>
                  <Text className="font-rubik text-gray-700">
                    <Text className="font-rubik-bold">Utilities:</Text>{" "}
                    {property.utilitiesIncluded ? "Included" : "Not Included"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Eco Score Section */}
          {property.ecoScore > 0 && (
            <View className="mb-6 bg-green-50 rounded-2xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-2xl font-rubik-bold text-green-900">
                    {t("greenHomes.ecoScore")}
                  </Text>
                  <Text className="text-sm font-rubik text-green-700 mt-1">
                    {t("greenHomes.ecoScoreDescription")}
                  </Text>
                </View>
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{
                    backgroundColor:
                      property.ecoScore >= 80
                        ? "#10B981"
                        : property.ecoScore >= 60
                          ? "#84CC16"
                          : property.ecoScore >= 40
                            ? "#EAB308"
                            : "#F59E0B",
                  }}
                >
                  <Text className="text-3xl font-rubik-extrabold text-white">
                    {property.ecoScore}
                  </Text>
                </View>
              </View>

              {/* Certifications */}
              {(property.hasLEEDCertification ||
                property.hasEnergyStarCertification) && (
                <View className="flex-row gap-2 mb-4 flex-wrap">
                  {property.hasLEEDCertification && (
                    <View className="bg-green-100 px-4 py-2 rounded-full">
                      <Text className="text-sm font-rubik-bold text-green-800">
                        🏆 LEED {property.leedLevel || ""}
                      </Text>
                    </View>
                  )}
                  {property.hasEnergyStarCertification && (
                    <View className="bg-blue-100 px-4 py-2 rounded-full">
                      <Text className="text-sm font-rubik-bold text-blue-800">
                        ⭐ {t("greenHomes.energyStar")}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Green Features List */}
              <Text className="text-lg font-rubik-bold text-green-900 mb-3">
                {t("greenHomes.greenFeatures")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {property.hasSolarPanels && (
                  <View className="bg-white px-3 py-2 rounded-lg">
                    <Text className="text-sm font-rubik text-green-800">
                      ☀️ {t("greenHomes.solarPanels")}
                    </Text>
                  </View>
                )}
                {property.hasEnergyEfficientAppliances && (
                  <View className="bg-white px-3 py-2 rounded-lg">
                    <Text className="text-sm font-rubik text-green-800">
                      ⚡ {t("greenHomes.energyEfficientAppliances")}
                    </Text>
                  </View>
                )}
                {property.hasLEDLighting && (
                  <View className="bg-white px-3 py-2 rounded-lg">
                    <Text className="text-sm font-rubik text-green-800">
                      💡 {t("greenHomes.ledLighting")}
                    </Text>
                  </View>
                )}
                {property.hasSmartThermostats && (
                  <View className="bg-white px-3 py-2 rounded-lg">
                    <Text className="text-sm font-rubik text-green-800">
                      🌡️ {t("greenHomes.smartThermostats")}
                    </Text>
                  </View>
                )}
                {property.hasDoubleGlazedWindows && (
                  <View className="bg-white px-3 py-2 rounded-lg">
                    <Text className="text-sm font-rubik text-green-800">
                      🪟 {t("greenHomes.doubleGlazedWindows")}
                    </Text>
                  </View>
                )}
                {property.hasRainwaterHarvesting && (
                  <View className="bg-white px-3 py-2 rounded-lg">
                    <Text className="text-sm font-rubik text-green-800">
                      💧 {t("greenHomes.rainwaterHarvesting")}
                    </Text>
                  </View>
                )}
                {property.hasGreenRoof && (
                  <View className="bg-white px-3 py-2 rounded-lg">
                    <Text className="text-sm font-rubik text-green-800">
                      🌱 {t("greenHomes.greenRoof")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Description */}
          <View className="mb-6">
            <Text className="text-xl font-rubik-bold mb-3">
              {t("properties.description")}
            </Text>
            <Text className="text-gray-700 leading-6">
              {translatedDescription}
            </Text>
          </View>

          {/* Map Section */}
          <View className="mb-6">
            <Text className="text-xl font-rubik-bold mb-3">
              📍 {t("properties.location")}
            </Text>

            {loadingMap ? (
              <View className="h-64 bg-gray-100 rounded-2xl items-center justify-center">
                <ActivityIndicator size="large" color="#0061FF" />
                <Text className="text-gray-500 font-rubik mt-2">
                  Loading map...
                </Text>
              </View>
            ) : coordinates ? (
              <View className="rounded-2xl overflow-hidden border-2 border-gray-200">
                <MapView
                  style={{ width: "100%", height: 250 }}
                  initialRegion={{
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={coordinates}
                    title={property.title}
                    description={property.address}
                  />
                </MapView>

                <TouchableOpacity
                  onPress={handleOpenMaps}
                  className="bg-white p-4 flex-row items-center justify-center border-t border-gray-200"
                >
                  <Ionicons name="navigate" size={20} color="#0061FF" />
                  <Text className="ml-2 text-primary-300 font-rubik-bold">
                    Open in Google Maps
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-gray-100 p-6 rounded-2xl items-center">
                <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 font-rubik mt-2 text-center">
                  Map location not available for this address
                </Text>
              </View>
            )}
          </View>

          {/* Owner Info */}
          <View className="bg-gray-100 p-4 rounded-xl">
            <Text className="text-sm text-gray-600 mb-1">
              {t("properties.listedBy")}
            </Text>
            <Text className="text-lg font-rubik-bold">
              {property.ownerName}
            </Text>
          </View>

          {/* Add to Report Button */}
          <TouchableOpacity
            onPress={() => setReportModalVisible(true)}
            className="bg-blue-50 border-2 border-primary-300 py-4 rounded-xl mt-6 flex-row items-center justify-center"
          >
            <Ionicons name="document-text-outline" size={20} color="#0061FF" />
            <Text className="text-primary-300 text-center font-rubik-bold text-lg ml-2">
              {reportsContainingProperty.length > 0
                ? t("reports.inReports", {
                    count: reportsContainingProperty.length,
                  })
                : t("reports.addToReport")}
            </Text>
          </TouchableOpacity>

          {/* Chat with Agent Button - Only for Users */}
          {canStartChat && (
            <TouchableOpacity
              onPress={handleGoToChat}
              className="bg-green-500 py-4 rounded-xl mt-3 flex-row items-center justify-center"
            >
              <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
              <Text className="text-white text-center font-rubik-bold text-lg ml-2">
                {existingConversation
                  ? t("chat.continueChat")
                  : t("chat.chatWithAgent")}
              </Text>
            </TouchableOpacity>
          )}

          {/* Contact Button */}
          <TouchableOpacity
            onPress={() => setContactModalVisible(true)}
            className="bg-primary-300 py-4 rounded-xl mt-3 mb-7"
          >
            <Text className="text-white text-center font-rubik-bold text-lg">
              {t("properties.contactOwner")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add to Report Modal */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setReportModalVisible(false);
          setCreateReportMode(false);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-rubik-bold text-gray-900">
                {createReportMode
                  ? t("reports.createReport")
                  : t("reports.addToReport")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setReportModalVisible(false);
                  setCreateReportMode(false);
                }}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {createReportMode ? (
              /* Create New Report Form */
              <View>
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

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setCreateReportMode(false)}
                    className="flex-1 py-4 rounded-xl bg-gray-100"
                  >
                    <Text className="text-gray-700 text-center font-rubik-bold text-lg">
                      {t("common.back")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreateAndAddToReport}
                    disabled={addingToReport}
                    className={`flex-1 py-4 rounded-xl ${addingToReport ? "bg-gray-300" : "bg-primary-300"}`}
                  >
                    {addingToReport ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-white text-center font-rubik-bold text-lg">
                        {t("reports.createAndAdd")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Report Selection List */
              <ScrollView
                className="max-h-80"
                showsVerticalScrollIndicator={false}
              >
                {/* Create New Report Option */}
                <TouchableOpacity
                  onPress={() => setCreateReportMode(true)}
                  className="flex-row items-center p-4 bg-blue-50 rounded-xl mb-3 border-2 border-dashed border-primary-300"
                >
                  <View className="w-12 h-12 bg-primary-300 rounded-full items-center justify-center">
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-base font-rubik-bold text-primary-300">
                      {t("reports.createNewReport")}
                    </Text>
                    <Text className="text-sm text-gray-500 font-rubik">
                      {t("reports.createNewReportDesc")}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Existing Reports */}
                {reports.length > 0 && (
                  <Text className="text-sm font-rubik-medium text-gray-500 mb-2 mt-2">
                    {t("reports.existingReports")}
                  </Text>
                )}

                {reports.map((report) => {
                  const isInReport = isPropertyInReport(
                    report.id,
                    property?.id || 0
                  );
                  return (
                    <TouchableOpacity
                      key={report.id}
                      onPress={() =>
                        !isInReport && handleAddToReport(report.id)
                      }
                      disabled={isInReport || addingToReport}
                      className={`flex-row items-center p-4 rounded-xl mb-2 border ${
                        isInReport
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                          isInReport ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <Ionicons
                          name={
                            isInReport
                              ? "checkmark-circle"
                              : "document-text-outline"
                          }
                          size={24}
                          color={isInReport ? "#10B981" : "#6B7280"}
                        />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text
                          className={`text-base font-rubik-bold ${
                            isInReport ? "text-green-700" : "text-gray-900"
                          }`}
                        >
                          {report.name}
                        </Text>
                        <Text className="text-sm text-gray-500 font-rubik">
                          {report.properties.length} {t("reports.properties")}
                          {isInReport && ` • ${t("reports.alreadyAdded")}`}
                        </Text>
                      </View>
                      {!isInReport && (
                        <Ionicons
                          name="add-circle-outline"
                          size={24}
                          color="#0061FF"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {reports.length === 0 && (
                  <View className="py-8 items-center">
                    <Ionicons
                      name="folder-open-outline"
                      size={48}
                      color="#9CA3AF"
                    />
                    <Text className="text-gray-500 font-rubik mt-2 text-center">
                      {t("reports.noReportsYet")}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Start Chat Modal */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChatModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-rubik-bold text-gray-900">
                {t("chat.startConversationTitle")}
              </Text>
              <TouchableOpacity
                onPress={() => setChatModalVisible(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Property Preview */}
            <View className="flex-row items-center bg-gray-50 rounded-xl p-3 mb-4">
              {property.images?.[0] && (
                <Image
                  source={{ uri: property.images[0] }}
                  className="w-16 h-16 rounded-lg mr-3"
                />
              )}
              <View className="flex-1">
                <Text
                  className="text-base font-rubik-bold text-gray-900"
                  numberOfLines={1}
                >
                  {translatedTitle}
                </Text>
                <Text className="text-sm font-rubik-bold text-primary-300">
                  {formatPrice(property.price)}
                </Text>
              </View>
            </View>

            {/* Agent Info */}
            <View className="flex-row items-center mb-4 p-3 bg-green-50 rounded-xl">
              <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                <Ionicons name="person" size={20} color="#10B981" />
              </View>
              <View>
                <Text className="text-sm text-gray-500 font-rubik">
                  {t("chat.chattingWith")}
                </Text>
                <Text className="text-base font-rubik-bold text-gray-900">
                  {property.ownerName}
                </Text>
              </View>
            </View>

            {/* Message Input */}
            <View className="mb-4">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
                {t("chat.yourMessage")} *
              </Text>
              <TextInput
                value={chatMessage}
                onChangeText={setChatMessage}
                placeholder={t("chat.messagePlaceholder")}
                className="bg-gray-100 rounded-xl px-4 py-3 font-rubik text-base text-gray-900 min-h-[100px]"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={handleStartChat}
              disabled={startingChat || !chatMessage.trim()}
              className={`py-4 rounded-xl flex-row items-center justify-center ${
                startingChat || !chatMessage.trim()
                  ? "bg-gray-300"
                  : "bg-green-500"
              }`}
            >
              {startingChat ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text className="text-white text-center font-rubik-bold text-lg ml-2">
                    {t("chat.sendMessage")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ContactOwnerModal
        visible={contactModalVisible}
        ownerName={property.ownerName}
        ownerPhone={property.ownerPhone}
        ownerEmail={property.ownerEmail}
        onClose={() => setContactModalVisible(false)}
      />
    </SafeAreaView>
  );
}
