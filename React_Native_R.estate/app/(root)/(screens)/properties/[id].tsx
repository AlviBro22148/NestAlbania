import ContactOwnerModal from "@/components/ContactOwnerModal";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { usePropertyDetail, useReports } from "@/hooks/useProperties";
import api from "@/lib/axios-config";
import { translateText } from "@/lib/translate";
import { shadows, shadowsDark } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { formatCurrency } from "@/lib/utils";
import React, { useEffect, useState, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Dimensions,
  InteractionManager,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  FlatList,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

// Animated button component
const ActionButton = ({
  onPress,
  backgroundColor,
  textColor = "#FFFFFF",
  icon,
  label,
  disabled = false,
  style,
}: {
  onPress: () => void;
  backgroundColor: string;
  textColor?: string;
  icon?: string;
  label: string;
  disabled?: boolean;
  style?: any;
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.actionButton,
        { backgroundColor: disabled ? "#94A3B8" : backgroundColor },
        animatedStyle,
        style,
      ]}
    >
      {icon && <Ionicons name={icon as any} size={20} color={textColor} />}
      <Text
        style={[
          styles.actionButtonText,
          { color: textColor, marginLeft: icon ? 8 : 0 },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

// Feature card component
const FeatureCard = ({
  emoji,
  value,
  label,
  colors,
}: {
  emoji: string;
  value: string;
  label: string;
  colors: any;
}) => (
  <View
    style={[styles.featureCard, { backgroundColor: colors.surfaceElevated }]}
  >
    <View
      style={[
        styles.featureIconCircle,
        { backgroundColor: colors.primaryLight },
      ]}
    >
      <Text style={styles.featureEmoji}>{emoji}</Text>
    </View>
    <Text style={[styles.featureValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.featureLabel, { color: colors.textSecondary }]}>
      {label}
    </Text>
  </View>
);

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const handleBack = useBackNavigation("/(root)/explore");
  const queryClient = useQueryClient();

  // Use cached React Query hooks - INSTANT from cache
  const propertyId = typeof id === "string" ? parseInt(id, 10) : 0;
  const { data: property, isLoading: loading } = usePropertyDetail(propertyId);
  const { data: reports = [] } = useReports();

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

  const { t, i18n } = useTranslation();
  const { showToast } = useAlert();
  const { user } = useAuth();
  const { startConversation, hasExistingConversation } = useChat();
  const { colors, isDark } = useTheme();

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [startingChat, setStartingChat] = useState(false);
  const [createReportMode, setCreateReportMode] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [newReportDescription, setNewReportDescription] = useState("");
  const [addingToReport, setAddingToReport] = useState(false);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  // Animation values
  const scrollY = useSharedValue(0);
  const backButtonScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Parallax effect for hero image
  const heroAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-100, 0, 300],
      [-50, 0, 100],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.3, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  // Back button press animation
  const handleBackPressIn = () => {
    backButtonScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handleBackPressOut = () => {
    backButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  const cardShadow = isDark ? shadowsDark.md : shadows.md;

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

  // Check if property is in a specific report
  const isPropertyInReport = (
    reportId: string,
    propertyId: number,
  ): boolean => {
    const report = reports.find((r: Report) => r.id === reportId);
    if (!report) return false;
    return report.properties.some((p: ReportProperty) => p.propertyId === propertyId);
  };

  // Get reports containing a specific property
  const getReportsContainingProperty = (propertyId: number): Report[] => {
    return reports.filter((report: Report) =>
      report.properties.some((p: ReportProperty) => p.propertyId === propertyId),
    );
  };

  // Create a new report
  const createReport = async (
    name: string,
    description?: string,
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
    // Invalidate reports cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    return newReport;
  };

  // Add property to report
  const addPropertyToReport = async (reportId: string, propertyData: any) => {
    await api.post(`/api/reports/${reportId}/properties`, {
      propertyId: propertyData.id,
    });
    // Invalidate reports cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ["reports"] });
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
      return null;
    }
  };

  // Load coordinates and lazy-load map AFTER interactions settle
  useEffect(() => {
    if (property?.address && !coordinates) {
      const task = InteractionManager.runAfterInteractions(() => {
        setLoadingMap(true);
        getCoordinatesFromAddress(property.address).then((coords) => {
          setCoordinates(coords);
          setLoadingMap(false);
          // Only show map after a slight delay to let the screen breathe
          setTimeout(() => setShouldLoadMap(true), 500);
        });
      });
      return () => task.cancel();
    }
  }, [property?.address]);

  const translatePropertyContent = async () => {
    if (!property) return;
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
    return formatCurrency(price);
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
        newReportDescription.trim() || undefined,
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
        chatMessage.trim(),
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
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.notFoundText, { color: colors.text }]}>
          {t("properties.propertyNotFound")}
        </Text>
      </View>
    );
  }

  const isRental = property.listingType === "Rent" || false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Gallery with Parallax */}
        <View style={styles.heroContainer}>
          <Animated.View style={[styles.heroImageWrapper, heroAnimatedStyle]}>
            <Animated.FlatList
              data={property.images}
              renderItem={({ item, index }) => (
                <ExpoImage
                  key={index}
                  source={{ uri: item }}
                  style={styles.heroImage}
                  contentFit="cover"
                  priority={index === 0 ? "high" : "low"}
                  recyclingKey={`${propertyId}-img-${index}`}
                />
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event: any) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / width,
                );
                setCurrentImageIndex(index);
              }}
              scrollEventThrottle={16}
              keyExtractor={(_, index: number) => index.toString()}
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              windowSize={3}
              removeClippedSubviews={Platform.OS === "android"}
            />
          </Animated.View>

          {/* Gradient overlay */}
          <View style={styles.heroGradient} />

          {/* Back button */}
          <AnimatedPressable
            onPress={handleBack}
            onPressIn={handleBackPressIn}
            onPressOut={handleBackPressOut}
            style={[
              styles.backButton,
              {
                backgroundColor: isDark
                  ? "rgba(22, 27, 34, 0.9)"
                  : "rgba(255, 255, 255, 0.95)",
              },
              cardShadow,
              backButtonAnimatedStyle,
            ]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </AnimatedPressable>

          {/* Image counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} / {property.images.length}
            </Text>
          </View>
        </View>

        {/* Property Details Card */}
        <View
          style={[
            styles.detailsCard,
            { backgroundColor: colors.surface },
            cardShadow,
          ]}
        >
          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View
              style={[styles.typeBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.typeBadgeText}>
                {t(`propertyTypes.${property.propertyType.toLowerCase()}`)}
              </Text>
            </View>
            <View style={styles.rightBadges}>
              {/* Listing Type Badge */}
              <View
                style={[
                  styles.listingBadge,
                  { backgroundColor: isRental ? "#F3E8FF" : "#DBEAFE" },
                ]}
              >
                <Text
                  style={[
                    styles.listingBadgeText,
                    { color: isRental ? "#7C3AED" : "#2563EB" },
                  ]}
                >
                  {isRental ? "🔑 For Rent" : "🏷️ For Sale"}
                </Text>
              </View>
              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      property.status === "Available"
                        ? "#DCFCE7"
                        : property.status === "Rented"
                          ? "#F3E8FF"
                          : "#FEE2E2",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        property.status === "Available"
                          ? "#15803D"
                          : property.status === "Rented"
                            ? "#7C3AED"
                            : "#DC2626",
                    },
                  ]}
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

          {/* Translation indicator */}
          {translating && (
            <View
              style={[
                styles.translatingBanner,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.translatingText, { color: colors.primary }]}>
                {i18n.language === "sq"
                  ? "Duke përkthyer..."
                  : "Translating..."}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text style={[styles.propertyTitle, { color: colors.text }]}>
            {translatedTitle}
          </Text>

          {/* Address */}
          <View style={styles.addressRow}>
            <Ionicons name="location" size={18} color={colors.accent} />
            <Text style={[styles.addressText, { color: colors.textSecondary }]}>
              {property.address}
            </Text>
          </View>

          {/* Price Display */}
          {isRental ? (
            <View style={styles.priceContainer}>
              <Text style={[styles.priceText, { color: colors.accent }]}>
                {formatPrice(property.monthlyRent || 0)}
                <Text style={styles.priceUnit}>/mo</Text>
              </Text>
              {property.securityDeposit && (
                <Text
                  style={[styles.priceDetail, { color: colors.textSecondary }]}
                >
                  💰 Security Deposit: {formatPrice(property.securityDeposit)}
                </Text>
              )}
              {property.leaseTermMonths && (
                <Text
                  style={[styles.priceDetail, { color: colors.textSecondary }]}
                >
                  📅 Lease Term: {property.leaseTermMonths} months
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.priceText, { color: colors.accent }]}>
              {formatPrice(property.price)}
            </Text>
          )}

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {property.bedrooms > 0 && (
              <FeatureCard
                emoji="🛏️"
                value={property.bedrooms.toString()}
                label={t("properties.bedrooms")}
                colors={colors}
              />
            )}
            {property.bathrooms > 0 && (
              <FeatureCard
                emoji="🚿"
                value={property.bathrooms.toString()}
                label={t("properties.bathrooms")}
                colors={colors}
              />
            )}
            {property.area > 0 && (
              <FeatureCard
                emoji="📐"
                value={`${property.area}m²`}
                label={t("properties.area")}
                colors={colors}
              />
            )}
          </View>

          {/* Rental-Specific Features */}
          {isRental && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🔑 Rental Details
              </Text>
              <View
                style={[
                  styles.rentalDetailsCard,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                {property.furnishedStatus && (
                  <View style={styles.rentalDetailRow}>
                    <Text style={styles.rentalDetailEmoji}>🛋️</Text>
                    <Text
                      style={[
                        styles.rentalDetailText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rentalDetailLabel,
                          { color: colors.text },
                        ]}
                      >
                        Furnished:
                      </Text>{" "}
                      {property.furnishedStatus}
                    </Text>
                  </View>
                )}
                <View style={styles.rentalDetailRow}>
                  <Text style={styles.rentalDetailEmoji}>
                    {property.utilitiesIncluded ?? false ? "✅" : "❌"}
                  </Text>
                  <Text
                    style={[
                      styles.rentalDetailText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    <Text
                      style={[styles.rentalDetailLabel, { color: colors.text }]}
                    >
                      Utilities:
                    </Text>{" "}
                    {property.utilitiesIncluded ?? false ? "Included" : "Not Included"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Eco Score Section */}
          {(property.ecoScore ?? 0) > 0 && (
            <View style={styles.ecoScoreContainer}>
              <View style={styles.ecoScoreHeader}>
                <View style={styles.ecoScoreInfo}>
                  <Text style={styles.ecoScoreTitle}>
                    {t("greenHomes.ecoScore")}
                  </Text>
                  <Text style={styles.ecoScoreDesc}>
                    {t("greenHomes.ecoScoreDescription")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.ecoScoreBadge,
                    {
                      backgroundColor:
                        (property?.ecoScore ?? 0) >= 80
                          ? "#10B981"
                          : (property?.ecoScore ?? 0) >= 60
                            ? "#84CC16"
                            : (property?.ecoScore ?? 0) >= 40
                              ? "#EAB308"
                              : "#F59E0B",
                    },
                  ]}
                >
                  <Text style={styles.ecoScoreValue}>{property.ecoScore ?? 0}</Text>
                </View>
              </View>

              {/* Certifications */}
              {((property.hasLEEDCertification ?? false) ||
                (property.hasEnergyStarCertification ?? false)) && (
                <View style={styles.certificationsRow}>
                  {(property.hasLEEDCertification ?? false) && (
                    <View style={styles.certBadgeLeed}>
                      <Text style={styles.certBadgeLeedText}>
                        🏆 LEED {property.leedLevel ?? ""}
                      </Text>
                    </View>
                  )}
                  {(property.hasEnergyStarCertification ?? false) && (
                    <View style={styles.certBadgeEnergy}>
                      <Text style={styles.certBadgeEnergyText}>
                        ⭐ {t("greenHomes.energyStar")}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Green Features List */}
              <Text style={styles.greenFeaturesTitle}>
                {t("greenHomes.greenFeatures")}
              </Text>
              <View style={styles.greenFeaturesGrid}>
                {(property.hasSolarPanels ?? false) && (
                  <View style={styles.greenFeatureChip}>
                    <Text style={styles.greenFeatureText}>
                      ☀️ {t("greenHomes.solarPanels")}
                    </Text>
                  </View>
                )}
                {(property.hasEnergyEfficientAppliances ?? false) && (
                  <View style={styles.greenFeatureChip}>
                    <Text style={styles.greenFeatureText}>
                      ⚡ {t("greenHomes.energyEfficientAppliances")}
                    </Text>
                  </View>
                )}
                {(property.hasLEDLighting ?? false) && (
                  <View style={styles.greenFeatureChip}>
                    <Text style={styles.greenFeatureText}>
                      💡 {t("greenHomes.ledLighting")}
                    </Text>
                  </View>
                )}
                {(property.hasSmartThermostats ?? false) && (
                  <View style={styles.greenFeatureChip}>
                    <Text style={styles.greenFeatureText}>
                      🌡️ {t("greenHomes.smartThermostats")}
                    </Text>
                  </View>
                )}
                {(property.hasDoubleGlazedWindows ?? false) && (
                  <View style={styles.greenFeatureChip}>
                    <Text style={styles.greenFeatureText}>
                      🪟 {t("greenHomes.doubleGlazedWindows")}
                    </Text>
                  </View>
                )}
                {(property.hasRainwaterHarvesting ?? false) && (
                  <View style={styles.greenFeatureChip}>
                    <Text style={styles.greenFeatureText}>
                      💧 {t("greenHomes.rainwaterHarvesting")}
                    </Text>
                  </View>
                )}
                {(property.hasGreenRoof ?? false) && (
                  <View style={styles.greenFeatureChip}>
                    <Text style={styles.greenFeatureText}>
                      🌱 {t("greenHomes.greenRoof")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("properties.description")}
            </Text>
            <Text
              style={[styles.descriptionText, { color: colors.textSecondary }]}
            >
              {translatedDescription}
            </Text>
          </View>

          {/* Map Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📍 {t("properties.location")}
            </Text>

            {loadingMap || !shouldLoadMap ? (
              <View
                style={[
                  styles.mapLoading,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text
                  style={[
                    styles.mapLoadingText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {loadingMap ? "Getting coordinates..." : "Loading map..."}
                </Text>
              </View>
            ) : coordinates ? (
              <View
                style={[styles.mapContainer, { borderColor: colors.border }]}
              >
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false} // Performance: Disable map scrolling inside scrollview
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={coordinates}
                    title={property.title}
                    description={property.address}
                  />
                </MapView>

                <Pressable
                  onPress={handleOpenMaps}
                  style={[
                    styles.mapButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="navigate" size={20} color={colors.primary} />
                  <Text
                    style={[styles.mapButtonText, { color: colors.primary }]}
                  >
                    Open in Google Maps
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View
                style={[
                  styles.mapUnavailable,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Ionicons
                  name="map-outline"
                  size={48}
                  color={colors.textMuted}
                />
                <Text
                  style={[
                    styles.mapUnavailableText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Map location not available for this address
                </Text>
              </View>
            )}
          </View>

          {/* Owner Info */}
          <View
            style={[
              styles.ownerCard,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <View
              style={[
                styles.ownerAvatar,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles.ownerInfo}>
              <Text
                style={[styles.ownerLabel, { color: colors.textSecondary }]}
              >
                {t("properties.listedBy")}
              </Text>
              <Text style={[styles.ownerName, { color: colors.text }]}>
                {property.ownerName ?? "Unknown"}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Add to Report Button */}
            <ActionButton
              onPress={() => setReportModalVisible(true)}
              backgroundColor={colors.primaryLight}
              textColor={colors.primary}
              icon="document-text-outline"
              label={
                reportsContainingProperty.length > 0
                  ? t("reports.inReports", {
                      count: reportsContainingProperty.length,
                    })
                  : t("reports.addToReport")
              }
              style={[
                styles.reportButton,
                { borderColor: colors.primary, borderWidth: 2 },
              ]}
            />

            {/* Chat with Agent Button - Only for Users */}
            {canStartChat && (
              <ActionButton
                onPress={handleGoToChat}
                backgroundColor="#10B981"
                icon="chatbubbles"
                label={
                  existingConversation
                    ? t("chat.continueChat")
                    : t("chat.chatWithAgent")
                }
              />
            )}

            {/* Contact Button */}
            <ActionButton
              onPress={() => setContactModalVisible(true)}
              backgroundColor={colors.accent}
              icon="call"
              label={t("properties.contactOwner")}
            />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Add to Report Modal */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => {
          setReportModalVisible(false);
          setCreateReportMode(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View
              className="rounded-t-3xl p-6 max-h-[80%]"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  className="text-2xl font-rubik-bold"
                  style={{ color: colors.text }}
                >
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
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {createReportMode ? (
                /* Create New Report Form */
                <View>
                  <View className="mb-4">
                    <Text
                      className="text-sm font-rubik-medium mb-2"
                      style={{ color: colors.textSecondary }}
                    >
                      {t("reports.reportName")} *
                    </Text>
                    <TextInput
                      value={newReportName}
                      onChangeText={setNewReportName}
                      placeholder={t("reports.reportNamePlaceholder")}
                      className="rounded-xl px-4 py-3 font-rubik text-base"
                      style={{
                        backgroundColor: colors.surfaceElevated,
                        color: colors.text,
                      }}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View className="mb-6">
                    <Text
                      className="text-sm font-rubik-medium mb-2"
                      style={{ color: colors.textSecondary }}
                    >
                      {t("reports.reportDescription")}
                    </Text>
                    <TextInput
                      value={newReportDescription}
                      onChangeText={setNewReportDescription}
                      placeholder={t("reports.reportDescriptionPlaceholder")}
                      className="rounded-xl px-4 py-3 font-rubik text-base"
                      style={{
                        backgroundColor: colors.surfaceElevated,
                        color: colors.text,
                        textAlignVertical: "top",
                        minHeight: 80,
                      }}
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setCreateReportMode(false)}
                      className="flex-1 py-4 rounded-xl"
                      style={{ backgroundColor: colors.surfaceElevated }}
                    >
                      <Text
                        className="text-center font-rubik-bold text-lg"
                        style={{ color: colors.text }}
                      >
                        {t("common.back")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCreateAndAddToReport}
                      disabled={addingToReport}
                      className="flex-1 py-4 rounded-xl"
                      style={{
                        backgroundColor: addingToReport
                          ? colors.textMuted
                          : colors.primary,
                      }}
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
                    className="flex-row items-center p-4 rounded-xl mb-3 border-2 border-dashed"
                    style={{
                      backgroundColor: isDark ? colors.primaryLight : "#EFF6FF",
                      borderColor: colors.primary,
                    }}
                  >
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Ionicons name="add" size={24} color="#FFFFFF" />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text
                        className="text-base font-rubik-bold"
                        style={{ color: colors.primary }}
                      >
                        {t("reports.createNewReport")}
                      </Text>
                      <Text
                        className="text-sm font-rubik"
                        style={{ color: colors.textSecondary }}
                      >
                        {t("reports.createNewReportDesc")}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Existing Reports */}
                  {reports.length > 0 && (
                    <Text
                      className="text-sm font-rubik-medium mb-2 mt-2"
                      style={{ color: colors.textSecondary }}
                    >
                      {t("reports.existingReports")}
                    </Text>
                  )}

                  {reports.map((report: any) => {
                    const isInReport = isPropertyInReport(
                      report.id,
                      property?.id || 0,
                    );
                    return (
                      <TouchableOpacity
                        key={report.id}
                        onPress={() =>
                          !isInReport && handleAddToReport(report.id)
                        }
                        disabled={isInReport || addingToReport}
                        className="flex-row items-center p-4 rounded-xl mb-2 border"
                        style={{
                          backgroundColor: isInReport
                            ? isDark
                              ? "#064E3B"
                              : "#ECFDF5"
                            : colors.surface,
                          borderColor: isInReport ? "#10B981" : colors.border,
                        }}
                      >
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: isInReport
                              ? isDark
                                ? "#065F46"
                                : "#D1FAE5"
                              : colors.surfaceElevated,
                          }}
                        >
                          <Ionicons
                            name={
                              isInReport
                                ? "checkmark-circle"
                                : "document-text-outline"
                            }
                            size={24}
                            color={
                              isInReport ? "#10B981" : colors.textSecondary
                            }
                          />
                        </View>
                        <View className="ml-4 flex-1">
                          <Text
                            className="text-base font-rubik-bold"
                            style={{
                              color: isInReport ? "#10B981" : colors.text,
                            }}
                          >
                            {report.name}
                          </Text>
                          <Text
                            className="text-sm font-rubik"
                            style={{ color: colors.textSecondary }}
                          >
                            {report.properties.length} {t("reports.properties")}
                            {isInReport && ` • ${t("reports.alreadyAdded")}`}
                          </Text>
                        </View>
                        {!isInReport && (
                          <Ionicons
                            name="add-circle-outline"
                            size={24}
                            color={colors.primary}
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
                        color={colors.textMuted}
                      />
                      <Text
                        className="font-rubik mt-2 text-center"
                        style={{ color: colors.textSecondary }}
                      >
                        {t("reports.noReportsYet")}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Start Chat Modal */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setChatModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View
              className="rounded-t-3xl p-6"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  className="text-2xl font-rubik-bold"
                  style={{ color: colors.text }}
                >
                  {t("chat.startConversationTitle")}
                </Text>
                <TouchableOpacity
                  onPress={() => setChatModalVisible(false)}
                  className="p-2"
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Property Preview */}
              <View
                className="flex-row items-center rounded-xl p-3 mb-4"
                style={{ backgroundColor: colors.surfaceElevated }}
              >
                {property?.images?.[0] && (
                  <ExpoImage
                    source={{ uri: property.images[0] }}
                    className="w-16 h-16 rounded-lg mr-3"
                    style={{ width: 64, height: 64, borderRadius: 8, marginRight: 12 }}
                  />
                )}
                <View className="flex-1">
                  <Text
                    className="text-base font-rubik-bold"
                    numberOfLines={1}
                    style={{ color: colors.text }}
                  >
                    {translatedTitle}
                  </Text>
                  <Text
                    className="text-sm font-rubik-bold"
                    style={{ color: colors.primary }}
                  >
                    {formatPrice(property.price)}
                  </Text>
                </View>
              </View>

              {/* Agent Info */}
              <View
                className="flex-row items-center mb-4 p-3 rounded-xl"
                style={{ backgroundColor: isDark ? "#064E3B" : "#ECFDF5" }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: isDark ? "#065F46" : "#D1FAE5" }}
                >
                  <Ionicons name="person" size={20} color="#10B981" />
                </View>
                <View>
                  <Text
                    className="text-sm font-rubik"
                    style={{ color: colors.textSecondary }}
                  >
                    {t("chat.chattingWith")}
                  </Text>
                  <Text
                    className="text-base font-rubik-bold"
                    style={{ color: colors.text }}
                  >
                    {property.ownerName ?? "Unknown"}
                  </Text>
                </View>
              </View>

              {/* Message Input */}
              <View className="mb-4">
                <Text
                  className="text-sm font-rubik-medium mb-2"
                  style={{ color: colors.textSecondary }}
                >
                  {t("chat.yourMessage")} *
                </Text>
                <TextInput
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  placeholder={t("chat.messagePlaceholder")}
                  className="rounded-xl px-4 py-3 font-rubik text-base min-h-[100px]"
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    color: colors.text,
                  }}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                onPress={handleStartChat}
                disabled={startingChat || !chatMessage.trim()}
                className="py-4 rounded-xl flex-row items-center justify-center"
                style={{
                  backgroundColor:
                    startingChat || !chatMessage.trim()
                      ? colors.textMuted
                      : "#10B981",
                }}
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
        </KeyboardAvoidingView>
      </Modal>

      <ContactOwnerModal
        visible={contactModalVisible}
        ownerName={property.ownerName ?? "Unknown"}
        ownerPhone={property.ownerPhone ?? ""}
        ownerEmail={property.ownerEmail ?? ""}
        onClose={() => setContactModalVisible(false)}
      />
    </View>
  );
}

const HERO_HEIGHT = 340;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 20,
    fontFamily: "Rubik-Bold",
  },
  heroContainer: {
    height: HERO_HEIGHT,
    overflow: "hidden",
  },
  heroImageWrapper: {
    height: HERO_HEIGHT + 50,
  },
  heroImage: {
    width,
    height: HERO_HEIGHT + 50,
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  imageCounter: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  imageCounterText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Rubik-Medium",
  },
  detailsCard: {
    marginTop: -24,
    borderTopLeftRadius: radius.cardLg,
    borderTopRightRadius: radius.cardLg,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.base,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Rubik-SemiBold",
  },
  rightBadges: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  listingBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  listingBadgeText: {
    fontSize: 12,
    fontFamily: "Rubik-Medium",
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: "Rubik-Medium",
  },
  translatingBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  translatingText: {
    marginLeft: spacing.sm,
    fontSize: 13,
    fontFamily: "Rubik-Medium",
  },
  propertyTitle: {
    fontSize: 28,
    fontFamily: "Rubik-Bold",
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  addressText: {
    marginLeft: spacing.xs,
    fontSize: 15,
    fontFamily: "Rubik-Regular",
    flex: 1,
  },
  priceContainer: {
    marginBottom: spacing.xl,
  },
  priceText: {
    fontSize: 32,
    fontFamily: "Rubik-ExtraBold",
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  priceUnit: {
    fontSize: 20,
    fontFamily: "Rubik-Medium",
  },
  priceDetail: {
    fontSize: 14,
    fontFamily: "Rubik-Regular",
    marginTop: 4,
  },
  featuresGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureCard: {
    flex: 1,
    minWidth: 100,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureValue: {
    fontSize: 18,
    fontFamily: "Rubik-Bold",
    marginBottom: 2,
  },
  featureLabel: {
    fontSize: 12,
    fontFamily: "Rubik-Regular",
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Rubik-Bold",
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: "Rubik-Regular",
    lineHeight: 24,
  },
  rentalDetailsCard: {
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.md,
  },
  rentalDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rentalDetailEmoji: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  rentalDetailText: {
    fontSize: 14,
    fontFamily: "Rubik-Regular",
  },
  rentalDetailLabel: {
    fontFamily: "Rubik-Bold",
  },
  ecoScoreContainer: {
    backgroundColor: "#ECFDF5",
    borderRadius: radius.cardLg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  ecoScoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.base,
  },
  ecoScoreInfo: {
    flex: 1,
  },
  ecoScoreTitle: {
    fontSize: 22,
    fontFamily: "Rubik-Bold",
    color: "#064E3B",
  },
  ecoScoreDesc: {
    fontSize: 13,
    fontFamily: "Rubik-Regular",
    color: "#047857",
    marginTop: 4,
  },
  ecoScoreBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  ecoScoreValue: {
    fontSize: 28,
    fontFamily: "Rubik-ExtraBold",
    color: "#FFFFFF",
  },
  certificationsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  certBadgeLeed: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  certBadgeLeedText: {
    fontSize: 13,
    fontFamily: "Rubik-Bold",
    color: "#065F46",
  },
  certBadgeEnergy: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  certBadgeEnergyText: {
    fontSize: 13,
    fontFamily: "Rubik-Bold",
    color: "#1E40AF",
  },
  greenFeaturesTitle: {
    fontSize: 16,
    fontFamily: "Rubik-Bold",
    color: "#064E3B",
    marginBottom: spacing.md,
  },
  greenFeaturesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  greenFeatureChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  greenFeatureText: {
    fontSize: 13,
    fontFamily: "Rubik-Regular",
    color: "#065F46",
  },
  mapLoading: {
    height: 200,
    borderRadius: radius.cardLg,
    alignItems: "center",
    justifyContent: "center",
  },
  mapLoadingText: {
    fontFamily: "Rubik-Regular",
    marginTop: spacing.sm,
  },
  mapContainer: {
    borderRadius: radius.cardLg,
    overflow: "hidden",
    borderWidth: 1,
  },
  map: {
    width: "100%",
    height: 220,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.base,
    borderTopWidth: 1,
  },
  mapButtonText: {
    marginLeft: spacing.sm,
    fontFamily: "Rubik-Bold",
    fontSize: 14,
  },
  mapUnavailable: {
    padding: spacing.xl,
    borderRadius: radius.cardLg,
    alignItems: "center",
  },
  mapUnavailableText: {
    fontFamily: "Rubik-Regular",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  ownerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  ownerLabel: {
    fontSize: 12,
    fontFamily: "Rubik-Regular",
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 16,
    fontFamily: "Rubik-Bold",
  },
  actionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.base,
    borderRadius: radius.button,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "Rubik-Bold",
  },
  reportButton: {
    borderWidth: 2,
  },
});

