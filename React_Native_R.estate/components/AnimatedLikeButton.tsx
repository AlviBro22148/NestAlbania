import React, { memo } from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
import icons from "@/constants/icons";
import { useTheme } from "@/contexts/ThemeContext";

interface AnimatedLikeButtonProps {
  isLiked: boolean;
  onPress: () => void;
  size?: "small" | "medium" | "large";
  style?: any;
  accessibilityLabel?: string;
}

const SIZE_MAP = {
  small: { button: 36, icon: 18, radius: 8 },
  medium: { button: 42, icon: 22, radius: 8 },
  large: { button: 48, icon: 26, radius: 10 },
};

// Variant for cards with semi-transparent background
export const AnimatedLikeButtonCard = memo(function AnimatedLikeButtonCard({
  isLiked,
  onPress,
  size = "medium",
  darkIcon = false,
  accessibilityLabel,
}: AnimatedLikeButtonProps & { darkIcon?: boolean }) {
  const { colors, isDark } = useTheme();
  const sizes = SIZE_MAP[size];

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.cardButton,
        {
          width: sizes.button,
          height: sizes.button,
          borderRadius: sizes.radius,
          backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)",
          transform: [{ scale: pressed ? 0.9 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (isLiked ? "Remove from favorites" : "Add to favorites")}
    >
      <ExpoImage
        source={icons.heart}
        style={{
          width: sizes.icon,
          height: sizes.icon,
          tintColor: isLiked ? colors.accent : (darkIcon ? colors.text : "#FFF"),
        }}
        contentFit="contain"
      />
    </Pressable>
  );
});

// Standalone like button (for property detail, etc.)
export const AnimatedLikeButton = memo(function AnimatedLikeButton({
  isLiked,
  onPress,
  size = "medium",
  style,
  accessibilityLabel,
}: AnimatedLikeButtonProps) {
  const { colors } = useTheme();
  const sizes = SIZE_MAP[size];

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.standaloneButton,
        {
          width: sizes.button,
          height: sizes.button,
          borderRadius: sizes.radius,
          backgroundColor: isLiked ? colors.accentLight : colors.surfaceElevated,
          borderColor: isLiked ? colors.accent : colors.border,
          transform: [{ scale: pressed ? 0.9 : 1 }],
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (isLiked ? "Remove from favorites" : "Add to favorites")}
    >
      <ExpoImage
        source={icons.heart}
        style={{
          width: sizes.icon,
          height: sizes.icon,
          tintColor: isLiked ? colors.accent : colors.textMuted,
        }}
        contentFit="contain"
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cardButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  standaloneButton: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});

export default AnimatedLikeButtonCard;
