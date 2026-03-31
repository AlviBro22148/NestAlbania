import { useAuth } from "@/contexts/AuthContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { useTheme } from "@/contexts/ThemeContext";
import { shadows, coloredShadows } from "@/constants/shadows";
import { radius, spacing, layout } from "@/constants/spacing";
import { Tabs, router } from "expo-router";
import React, { memo, useCallback, useMemo } from "react";
import { Image as ExpoImage } from "expo-image";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import icons from "../../../constants/icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Custom Tab Bar Component
const CustomTabBar = memo(({ state, descriptors, navigation }: any) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
        },
      ]}
    >
      <View style={styles.tabBarInner}>
        {state.routes.slice(0, 5).map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          return (
            <TabButton
              key={route.key}
              routeKey={route.key}
              routeName={route.name}
              icon={options.tabBarIcon}
              label={options.tabBarLabel || route.name}
              isFocused={isFocused}
              navigation={navigation}
              colors={colors}
              isDark={isDark}
            />
          );
        })}
      </View>
    </View>
  );
});
CustomTabBar.displayName = "CustomTabBar";

// Individual Tab Button with animation
const TabButton = memo(
  ({
    routeKey,
    routeName,
    icon,
    label,
    isFocused,
    navigation,
    colors,
    isDark,
  }: {
    routeKey: string;
    routeName: string;
    icon: any;
    label: string;
    isFocused: boolean;
    navigation: any;
    colors: any;
    isDark: boolean;
  }) => {
    const scale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
      scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }, [scale]);

    // Stable onPress — does not recreate on parent re-render
    const onPress = useCallback(() => {
      const event = navigation.emit({
        type: "tabPress",
        target: routeKey,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    }, [isFocused, navigation, routeKey, routeName]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const iconColor = isFocused ? colors.primary : colors.icon;
    const iconElement = icon
      ? icon({ color: iconColor, focused: isFocused })
      : null;

    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tabButton, animatedStyle]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
      >
        <View
          style={[
            styles.tabIconWrapper,
            isFocused && {
              backgroundColor: colors.primaryLight,
            },
          ]}
        >
          {iconElement}
        </View>
        {isFocused && (
          <Text
            style={[styles.tabLabel, { color: colors.primary }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </AnimatedPressable>
    );
  },
);
TabButton.displayName = "TabButton";

// Tab Icon Component
const TabIcon = memo(({ icon, color }: { icon: any; color: string }) => (
  <ExpoImage
    source={icon}
    style={[styles.tabIcon, { tintColor: color }]}
    contentFit="contain"
  />
));
TabIcon.displayName = "TabIcon";

// Floating Add Button — only shown to Agents/Admins, no path subscription
const FloatingAddButton = memo(() => {
  const { user } = useAuth();
  const { comparisonList } = useComparison();
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const isComparisonActive = comparisonList.length > 0;
  const isAgentOrAdmin = user?.role === "Admin" || user?.role === "Agent";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isComparisonActive || !isAgentOrAdmin) return null;

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={() => router.push({ pathname: "/(root)/create-property" as any })}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.floatingButton,
        {
          backgroundColor: colors.accent,
          ...coloredShadows.accent.lg,
        },
        animatedStyle,
      ]}
    >
      <Text style={styles.floatingButtonText}>+</Text>
    </AnimatedPressable>
  );
});
FloatingAddButton.displayName = "FloatingAddButton";

// Main Tabs Layout
const TabsLayout = () => {
  const { colors } = useTheme();

  const screenOptions = React.useMemo(() => ({
    tabBarShowLabel: false,
    headerShown: false,
    animation: "none" as const,
    lazy: true,
    freezeOnBlur: true,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.icon,
    tabBarStyle: { display: "none" as const },
  }), [colors.primary, colors.icon]);

  return (
    <>
      <Tabs
        screenOptions={screenOptions}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ tabBarIcon: ({ color }) => <TabIcon icon={icons.home} color={color} />, tabBarLabel: "Home" }} />
        <Tabs.Screen name="explore" options={{ tabBarIcon: ({ color }) => <TabIcon icon={icons.search} color={color} />, tabBarLabel: "Explore" }} />
        <Tabs.Screen name="market" options={{ tabBarIcon: ({ color }) => <TabIcon icon={icons.chart} color={color} />, tabBarLabel: "Market" }} />
        <Tabs.Screen name="services" options={{ tabBarIcon: ({ color }) => <TabIcon icon={icons.localservice} color={color} />, tabBarLabel: "Services" }} />
        <Tabs.Screen name="profile" options={{ tabBarIcon: ({ color }) => <TabIcon icon={icons.person} color={color} />, tabBarLabel: "Profile" }} />
      </Tabs>

      <FloatingAddButton />
    </>
  );
};

export default memo(TabsLayout);

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    paddingTop: 8,
  },
  tabBarInner: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: spacing.base,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  tabIconWrapper: {
    width: 48,
    height: 36,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    width: 26,
    height: 26,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: "Rubik-Medium",
    marginTop: 2,
    letterSpacing: 0.25,
  },
  floatingButton: {
    position: "absolute",
    bottom: layout.tabBarHeight + 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "Rubik-Light",
    marginTop: -2,
  },
});
