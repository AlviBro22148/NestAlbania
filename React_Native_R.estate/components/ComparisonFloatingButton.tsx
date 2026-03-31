import { useComparison } from "@/contexts/ComparisonContext";
import { router } from "expo-router";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, Pressable, View, StyleSheet } from "react-native";

const ComparisonFloatingButton = memo(function ComparisonFloatingButton() {
  const { t } = useTranslation();
  const { comparisonList, clearComparison } = useComparison();

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
      { text: t("common.clear"), style: "destructive", onPress: clearComparison },
    ]);
  };

  const canCompare = comparisonList.length >= 2;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {t("comparison.comparing")} {comparisonList.length} {t("comparison.properties")}
          </Text>
          <Text style={styles.subtitle}>
            {canCompare ? t("comparison.tapToCompare") : t("comparison.addMore")}
          </Text>
        </View>

        <View style={styles.buttons}>
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>{t("common.clear")}</Text>
          </Pressable>
          <Pressable
            onPress={handleCompare}
            disabled={!canCompare}
            style={[styles.compareBtn, !canCompare && styles.compareBtnDisabled]}
          >
            <Text style={[styles.compareText, !canCompare && styles.compareTextDisabled]}>
              {t("comparison.compare")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 96,
    left: 16,
    right: 16,
  },
  content: {
    backgroundColor: "#0061FF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: "#FFF",
    fontFamily: "Rubik-Bold",
    fontSize: 15,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Rubik-Regular",
    fontSize: 12,
    marginTop: 2,
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  clearBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearText: {
    color: "#FFF",
    fontFamily: "Rubik-SemiBold",
    fontSize: 13,
  },
  compareBtn: {
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  compareBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  compareText: {
    color: "#0061FF",
    fontFamily: "Rubik-Bold",
    fontSize: 13,
  },
  compareTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },
});

export default ComparisonFloatingButton;
