import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { radius, spacing, cardDimensions } from "@/constants/spacing";

// Premium shimmer animation component with smooth gradient
const ShimmerPlaceholder = ({ style, isDark }: { style?: any; isDark?: boolean }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.7, 0.4],
  });

  const baseColor = isDark ? "#21262D" : "#E6E8EB";

  return (
    <Animated.View
      style={[
        {
          backgroundColor: baseColor,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Featured Card Skeleton
export const FeaturedCardSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <View style={[styles.featuredCard, { backgroundColor: isDark ? "#161B22" : "#F7F8FA" }]}>
      <ShimmerPlaceholder style={styles.featuredImage} isDark={isDark} />
      <View style={styles.featuredContent}>
        <ShimmerPlaceholder style={[styles.featuredTitle, { borderRadius: radius.xs }]} isDark={isDark} />
        <ShimmerPlaceholder style={[styles.featuredSubtitle, { borderRadius: radius.xs }]} isDark={isDark} />
        <ShimmerPlaceholder style={[styles.featuredPrice, { borderRadius: radius.xs }]} isDark={isDark} />
      </View>
    </View>
  );
};

// Today's Choice Card Skeleton
export const TodaysChoiceCardSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <View style={[styles.todaysChoiceCard, { backgroundColor: isDark ? "#161B22" : "#F7F8FA" }]}>
      <ShimmerPlaceholder style={styles.todaysChoiceImage} isDark={isDark} />
      {/* Badge skeleton */}
      <ShimmerPlaceholder style={styles.badgeSkeleton} isDark={isDark} />
      <View style={styles.todaysChoiceContent}>
        <ShimmerPlaceholder style={[styles.todaysChoiceTitle, { borderRadius: radius.xs }]} isDark={isDark} />
        <ShimmerPlaceholder style={[styles.todaysChoiceSubtitle, { borderRadius: radius.xs }]} isDark={isDark} />
        <View style={styles.priceRow}>
          <ShimmerPlaceholder style={[styles.todaysChoicePrice, { borderRadius: radius.xs }]} isDark={isDark} />
          <ShimmerPlaceholder style={[styles.featuresSkeleton, { borderRadius: radius.badge }]} isDark={isDark} />
        </View>
      </View>
    </View>
  );
};

// Green Home Card Skeleton
export const GreenHomeCardSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <View style={[styles.greenHomeCard, { backgroundColor: isDark ? "#161B22" : "#F7F8FA" }]}>
      <ShimmerPlaceholder style={styles.greenHomeImage} isDark={isDark} />
      <View style={styles.greenHomeContent}>
        <ShimmerPlaceholder style={[styles.greenHomeTitle, { borderRadius: radius.xs }]} isDark={isDark} />
        <ShimmerPlaceholder style={[styles.greenHomeSubtitle, { borderRadius: radius.xs }]} isDark={isDark} />
        <ShimmerPlaceholder style={[styles.greenHomePrice, { borderRadius: radius.xs }]} isDark={isDark} />
      </View>
    </View>
  );
};

// Grid Card Skeleton (enhanced)
export const CardSkeleton = () => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.gridCard, {
      backgroundColor: colors.card,
      borderColor: colors.border,
    }]}>
      <ShimmerPlaceholder style={[styles.gridImage, { borderRadius: radius.md }]} isDark={isDark} />
      <View style={styles.gridContent}>
        <ShimmerPlaceholder style={[styles.gridTitle, { borderRadius: radius.xs }]} isDark={isDark} />
        <ShimmerPlaceholder style={[styles.gridSubtitle, { borderRadius: radius.xs }]} isDark={isDark} />
        <ShimmerPlaceholder style={[styles.gridPrice, { borderRadius: radius.xs }]} isDark={isDark} />
      </View>
    </View>
  );
};

// Property Card Skeleton (new - matches PropertyCard)
export const PropertyCardSkeleton = () => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.propertyCard, {
      backgroundColor: colors.card,
      borderColor: colors.border,
    }]}>
      <ShimmerPlaceholder style={styles.propertyImage} isDark={isDark} />
      <View style={styles.propertyContent}>
        <ShimmerPlaceholder style={[styles.propertyTitle, { borderRadius: radius.xs }]} isDark={isDark} />
        <View style={styles.addressRowSkeleton}>
          <ShimmerPlaceholder style={[styles.locationIconSkeleton, { borderRadius: radius.full }]} isDark={isDark} />
          <ShimmerPlaceholder style={[styles.addressSkeleton, { borderRadius: radius.xs }]} isDark={isDark} />
        </View>
        <ShimmerPlaceholder style={[styles.propertyPrice, { borderRadius: radius.xs }]} isDark={isDark} />
        <View style={styles.featuresRowSkeleton}>
          <ShimmerPlaceholder style={[styles.featureChipSkeleton, { borderRadius: radius.badge }]} isDark={isDark} />
          <ShimmerPlaceholder style={[styles.featureChipSkeleton, { borderRadius: radius.badge }]} isDark={isDark} />
          <ShimmerPlaceholder style={[styles.featureChipSkeleton, { borderRadius: radius.badge }]} isDark={isDark} />
        </View>
      </View>
    </View>
  );
};

// Property List Skeleton
export const PropertyListSkeleton = ({ count = 3, isDark = false }: { count?: number; isDark?: boolean }) => {
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.lg }}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.propertyListCard, {
          backgroundColor: colors.card,
          borderColor: colors.border,
        }]}>
          <ShimmerPlaceholder style={styles.propertyListImage} isDark={isDark} />
          <View style={styles.propertyListContent}>
            <ShimmerPlaceholder style={[styles.propertyListTitle, { borderRadius: radius.xs }]} isDark={isDark} />
            <ShimmerPlaceholder style={[styles.propertyListAddress, { borderRadius: radius.xs }]} isDark={isDark} />
            <View style={styles.propertyListDetails}>
              <ShimmerPlaceholder style={[styles.propertyListDetail, { borderRadius: radius.badge }]} isDark={isDark} />
              <ShimmerPlaceholder style={[styles.propertyListDetail, { borderRadius: radius.badge }]} isDark={isDark} />
              <ShimmerPlaceholder style={[styles.propertyListDetail, { borderRadius: radius.badge }]} isDark={isDark} />
            </View>
            <ShimmerPlaceholder style={[styles.propertyListPrice, { borderRadius: radius.xs }]} isDark={isDark} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Settings List Skeleton
export const SettingsListSkeleton = ({ count = 8, isDark = false }: { count?: number; isDark?: boolean }) => {
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.settingsItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingsItemLeft}>
            <ShimmerPlaceholder style={[styles.settingsIcon, { borderRadius: radius.sm }]} isDark={isDark} />
            <ShimmerPlaceholder style={[styles.settingsText, { borderRadius: radius.xs }]} isDark={isDark} />
          </View>
          <ShimmerPlaceholder style={[styles.settingsArrow, { borderRadius: radius.xs }]} isDark={isDark} />
        </View>
      ))}
    </View>
  );
};

// Notification List Skeleton
export const NotificationListSkeleton = ({ count = 5, isDark = false }: { count?: number; isDark?: boolean }) => {
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.base }}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.notificationCard, {
          backgroundColor: colors.card,
          borderColor: colors.border,
        }]}>
          <View style={styles.notificationRow}>
            <ShimmerPlaceholder style={[styles.notificationIcon, { borderRadius: radius.full }]} isDark={isDark} />
            <View style={styles.notificationContent}>
              <ShimmerPlaceholder style={[styles.notificationTitle, { borderRadius: radius.xs }]} isDark={isDark} />
              <ShimmerPlaceholder style={[styles.notificationMessage, { borderRadius: radius.xs }]} isDark={isDark} />
              <ShimmerPlaceholder style={[styles.notificationTime, { borderRadius: radius.xs }]} isDark={isDark} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

// Chat List Skeleton
export const ChatListSkeleton = ({ count = 4, isDark = false }: { count?: number; isDark?: boolean }) => {
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base }}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.chatCard, {
          backgroundColor: colors.card,
          borderColor: colors.border,
        }]}>
          <View style={styles.chatRow}>
            <ShimmerPlaceholder style={[styles.chatAvatar, { borderRadius: radius.full }]} isDark={isDark} />
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <ShimmerPlaceholder style={[styles.chatName, { borderRadius: radius.xs }]} isDark={isDark} />
                <ShimmerPlaceholder style={[styles.chatTime, { borderRadius: radius.xs }]} isDark={isDark} />
              </View>
              <ShimmerPlaceholder style={[styles.chatMessage, { borderRadius: radius.xs }]} isDark={isDark} />
              <View style={[styles.chatPropertyPreview, { backgroundColor: colors.surfaceElevated, borderRadius: radius.sm }]}>
                <ShimmerPlaceholder style={[styles.chatPropertyImage, { borderRadius: radius.sm }]} isDark={isDark} />
                <View style={{ flex: 1 }}>
                  <ShimmerPlaceholder style={[styles.chatPropertyTitle, { borderRadius: radius.xs }]} isDark={isDark} />
                  <ShimmerPlaceholder style={[styles.chatPropertyPrice, { borderRadius: radius.xs }]} isDark={isDark} />
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

// Horizontal skeleton list
export const HorizontalSkeletonList = ({
  count = 3,
  SkeletonComponent
}: {
  count?: number;
  SkeletonComponent: React.ComponentType;
}) => {
  return (
    <View style={styles.horizontalList}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalList: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
  },
  // Featured Card Skeleton
  featuredCard: {
    width: cardDimensions.featured.width,
    height: cardDimensions.featured.height,
    borderRadius: radius.card,
    overflow: "hidden",
    marginRight: spacing.base,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    borderRadius: radius.card,
    position: "absolute",
  },
  featuredContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  featuredTitle: {
    height: 24,
    width: "80%",
    marginBottom: 8,
  },
  featuredSubtitle: {
    height: 16,
    width: "60%",
    marginBottom: 8,
  },
  featuredPrice: {
    height: 24,
    width: "40%",
  },
  // Today's Choice Skeleton
  todaysChoiceCard: {
    width: cardDimensions.todaysChoice.width,
    height: cardDimensions.todaysChoice.height,
    borderRadius: radius.cardLg,
    overflow: "hidden",
    marginRight: spacing.base,
  },
  todaysChoiceImage: {
    width: "100%",
    height: "100%",
    borderRadius: radius.cardLg,
    position: "absolute",
  },
  badgeSkeleton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 100,
    height: 32,
    borderRadius: radius.badge,
  },
  todaysChoiceContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  todaysChoiceTitle: {
    height: 28,
    width: "85%",
    marginBottom: 8,
  },
  todaysChoiceSubtitle: {
    height: 18,
    width: "70%",
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todaysChoicePrice: {
    height: 32,
    width: "40%",
  },
  featuresSkeleton: {
    height: 32,
    width: 80,
  },
  // Green Home Skeleton
  greenHomeCard: {
    width: cardDimensions.todaysChoice.width,
    height: cardDimensions.todaysChoice.height,
    borderRadius: radius.cardLg,
    overflow: "hidden",
    marginRight: spacing.base,
  },
  greenHomeImage: {
    width: "100%",
    height: "100%",
    borderRadius: radius.cardLg,
    position: "absolute",
  },
  greenHomeContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  greenHomeTitle: {
    height: 28,
    width: "85%",
    marginBottom: 8,
  },
  greenHomeSubtitle: {
    height: 18,
    width: "70%",
    marginBottom: 12,
  },
  greenHomePrice: {
    height: 32,
    width: "50%",
  },
  // Grid Card Skeleton
  gridCard: {
    flex: 1,
    marginTop: spacing.base,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  gridImage: {
    width: "100%",
    height: cardDimensions.grid.imageHeight,
  },
  gridContent: {
    marginTop: spacing.md,
  },
  gridTitle: {
    height: 20,
    width: "70%",
    marginBottom: 6,
  },
  gridSubtitle: {
    height: 14,
    width: "50%",
    marginBottom: 10,
  },
  gridPrice: {
    height: 22,
    width: "35%",
  },
  // Property Card Skeleton
  propertyCard: {
    borderRadius: radius.card,
    marginBottom: spacing.base,
    overflow: "hidden",
    borderWidth: 1,
  },
  propertyImage: {
    width: "100%",
    height: 200,
  },
  propertyContent: {
    padding: spacing.base,
  },
  propertyTitle: {
    height: 22,
    width: "75%",
    marginBottom: 8,
  },
  addressRowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  locationIconSkeleton: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  addressSkeleton: {
    height: 16,
    width: "60%",
  },
  propertyPrice: {
    height: 28,
    width: "40%",
    marginBottom: 12,
  },
  featuresRowSkeleton: {
    flexDirection: "row",
    gap: 10,
  },
  featureChipSkeleton: {
    width: 60,
    height: 28,
  },
  // Property List Skeleton
  propertyListCard: {
    marginBottom: spacing.base,
    borderRadius: radius.card,
    overflow: "hidden",
    borderWidth: 1,
  },
  propertyListImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  propertyListContent: {
    padding: spacing.base,
  },
  propertyListTitle: {
    height: 22,
    width: "75%",
    marginBottom: 8,
  },
  propertyListAddress: {
    height: 16,
    width: "60%",
    marginBottom: 12,
  },
  propertyListDetails: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 10,
  },
  propertyListDetail: {
    height: 28,
    width: 60,
  },
  propertyListPrice: {
    height: 26,
    width: "40%",
  },
  // Settings List Skeleton
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.md,
  },
  settingsText: {
    height: 18,
    width: 140,
  },
  settingsArrow: {
    width: 20,
    height: 20,
  },
  // Notification List Skeleton
  notificationCard: {
    marginBottom: spacing.md,
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
  },
  notificationRow: {
    flexDirection: "row",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    height: 18,
    width: "70%",
    marginBottom: 8,
  },
  notificationMessage: {
    height: 14,
    width: "90%",
    marginBottom: 8,
  },
  notificationTime: {
    height: 12,
    width: "30%",
  },
  // Chat List Skeleton
  chatCard: {
    marginBottom: spacing.md,
    borderRadius: radius.card,
    padding: spacing.base,
    borderWidth: 1,
  },
  chatRow: {
    flexDirection: "row",
  },
  chatAvatar: {
    width: 56,
    height: 56,
  },
  chatContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  chatName: {
    height: 18,
    width: "50%",
  },
  chatTime: {
    height: 12,
    width: 50,
  },
  chatMessage: {
    height: 14,
    width: "80%",
    marginBottom: 10,
  },
  chatPropertyPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
  },
  chatPropertyImage: {
    width: 40,
    height: 40,
    marginRight: spacing.sm,
  },
  chatPropertyTitle: {
    height: 12,
    width: "70%",
    marginBottom: 4,
  },
  chatPropertyPrice: {
    height: 12,
    width: "40%",
  },
});
