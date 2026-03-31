import icons from "@/constants/icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Image as ExpoImage } from "expo-image";
import React, { memo } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { formatCurrency } from "@/lib/utils";

interface PropertyCardProps {
  id: number;
  title: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  propertyType: string;
  listingType: string;
  monthlyRent?: number;
  onPress?: () => void;
  isLiked?: boolean;
  isInComparison?: boolean;
  onToggleLike?: () => void;
  onToggleComparison?: () => void;
  propertyTypeLabel?: string;
}

const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

const PropertyCard = memo(
  function PropertyCard({
    title,
    price,
    address,
    bedrooms,
    bathrooms,
    area,
    images,
    listingType,
    monthlyRent,
    onPress,
    isLiked = false,
    isInComparison = false,
    onToggleLike,
    onToggleComparison,
    propertyTypeLabel,
  }: PropertyCardProps) {
    const { colors } = useTheme();
    const isRental = listingType === "Rent";
    const imageUri = images[0] || "";
    const displayPrice = isRental && monthlyRent ? monthlyRent : price;

    return (
      <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.imageBox}>
          {imageUri ? (
            <ExpoImage
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
              cachePolicy="memory-disk"
              recyclingKey={imageUri}
            />
          ) : (
            <View style={[styles.noImage, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={{ color: colors.textMuted }}>No Image</Text>
            </View>
          )}

          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{propertyTypeLabel}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isRental ? "#DBEAFE" : "#DCFCE7" }]}>
              <Text style={[styles.badgeText, { color: isRental ? "#1D4ED8" : "#15803D" }]}>
                {isRental ? "Rent" : "Sale"}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            {onToggleLike && (
              <Pressable onPress={onToggleLike} style={styles.actionBtn}>
                <ExpoImage source={icons.heart} style={{ width: 18, height: 18, tintColor: isLiked ? "#FF6B6B" : "#FFF" }} />
              </Pressable>
            )}
            {onToggleComparison && (
              <Pressable onPress={onToggleComparison} style={[styles.actionBtn, isInComparison && { backgroundColor: colors.primary }]}>
                <ExpoImage source={icons.chart} style={{ width: 18, height: 18, tintColor: "#FFF" }} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>{address}</Text>
          <Text style={[styles.price, { color: colors.accent }]}>
            {formatCurrency(displayPrice)}{isRental && monthlyRent ? "/mo" : ""}
          </Text>
          <View style={styles.features}>
            {bedrooms > 0 && <Text style={[styles.feat, { color: colors.primary, backgroundColor: colors.primaryLight }]}>🛏 {bedrooms}</Text>}
            {bathrooms > 0 && <Text style={[styles.feat, { color: colors.primary, backgroundColor: colors.primaryLight }]}>🚿 {bathrooms}</Text>}
            {area > 0 && <Text style={[styles.feat, { color: colors.primary, backgroundColor: colors.primaryLight }]}>{area}m²</Text>}
          </View>
        </View>
      </Pressable>
    );
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.isLiked === next.isLiked &&
    prev.isInComparison === next.isInComparison &&
    prev.images?.[0] === next.images?.[0]
);

const styles = StyleSheet.create({
  card: { borderRadius: 14, marginBottom: 14, overflow: "hidden", borderWidth: 1 },
  imageBox: { position: "relative" },
  image: { width: "100%", height: 160 },
  noImage: { width: "100%", height: 160, justifyContent: "center", alignItems: "center" },
  badges: { position: "absolute", top: 10, left: 10, flexDirection: "row", gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: "#FFF", fontSize: 10, fontFamily: "Rubik-Bold", textTransform: "uppercase" },
  actions: { position: "absolute", top: 10, right: 10, gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  info: { padding: 12 },
  title: { fontSize: 16, fontFamily: "Rubik-SemiBold", marginBottom: 2 },
  address: { fontSize: 12, fontFamily: "Rubik-Regular", marginBottom: 6 },
  price: { fontSize: 20, fontFamily: "Rubik-Bold", marginBottom: 8 },
  features: { flexDirection: "row", gap: 6 },
  feat: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 11, fontFamily: "Rubik-Medium" },
});

export default PropertyCard;
