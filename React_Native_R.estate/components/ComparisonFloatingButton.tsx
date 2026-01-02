import { useComparison } from "@/contexts/ComparisonContext";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Animated, Text, TouchableOpacity, View } from "react-native";

export default function ComparisonFloatingButton() {
  const { t } = useTranslation();
  const { comparisonList, clearComparison } = useComparison();
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (comparisonList.length > 0) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      // Slide out
      Animated.spring(slideAnim, {
        toValue: 100,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [comparisonList.length]);

  if (comparisonList.length === 0) return null;

  const handleCompare = () => {
    if (comparisonList.length < 2) {
      Alert.alert(t("comparison.notEnough"), t("comparison.needAtLeast2"));
      return;
    }

    router.push(`/property-comparison?ids=${comparisonList.join(",")}`);
  };

  const handleClear = () => {
    Alert.alert(t("comparison.clearTitle"), t("comparison.clearMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.clear"),
        style: "destructive",
        onPress: clearComparison,
      },
    ]);
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
      }}
      className="absolute bottom-24 left-4 right-4"
    >
      <View className="bg-primary-300 rounded-2xl shadow-lg flex-row items-center justify-between px-5 py-4">
        <View className="flex-1 mr-3">
          <Text className="text-white font-rubik-bold text-base">
            {t("comparison.comparing")} {comparisonList.length}{" "}
            {t("comparison.properties")}
          </Text>
          <Text className="text-white/80 font-rubik text-xs mt-0.5">
            {comparisonList.length < 2
              ? t("comparison.addMore")
              : t("comparison.tapToCompare")}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleClear}
            className="bg-white/20 px-4 py-2 rounded-full"
            activeOpacity={0.7}
          >
            <Text className="text-white font-rubik-semibold text-sm">
              {t("common.clear")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCompare}
            disabled={comparisonList.length < 2}
            className={`px-4 py-2 rounded-full ${
              comparisonList.length < 2 ? "bg-white/30" : "bg-white"
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`font-rubik-bold text-sm ${
                comparisonList.length < 2 ? "text-white/50" : "text-primary-300"
              }`}
            >
              {t("comparison.compare")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
