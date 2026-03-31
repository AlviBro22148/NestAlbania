import CustomButton from "@/components/CustomButton";
import InputModal from "@/components/InputModal";
import icons from "@/constants/icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { shadows, shadowsDark } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";

interface MortgageResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  affordablePrice: number;
  downPaymentAmount: number;
  loanAmount: number;
}

export default function FinancialConsultingScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");

  // Calculator inputs
  const [propertyPrice, setPropertyPrice] = useState("");
  const [downPayment, setDownPayment] = useState("20");
  const [interestRate, setInterestRate] = useState("3.5");
  const [loanTerm, setLoanTerm] = useState("30");
  const [monthlyIncome, setMonthlyIncome] = useState("");

  // Results
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>(null);
  const [tempValue, setTempValue] = useState("");

  const openInputModal = (
    field: string,
    title: string,
    placeholder: string,
    currentValue: string,
    setValue: (value: string) => void,
    keyboardType: any = "numeric"
  ) => {
    setModalConfig({ field, title, placeholder, setValue, keyboardType });
    setTempValue(currentValue);
    setModalVisible(true);
  };

  const saveFromModal = () => {
    if (modalConfig) {
      modalConfig.setValue(tempValue);
    }
    setModalVisible(false);
    setTempValue("");
  };

  const calculateMortgage = () => {
    const price = parseFloat(propertyPrice);
    const downPct = parseFloat(downPayment);
    const rate = parseFloat(interestRate);
    const years = parseInt(loanTerm);
    const income = parseFloat(monthlyIncome);

    if (!price || !downPct || !rate || !years) {
      alert(t("financial.fillAllFields"));
      return;
    }

    // Calculate loan amount
    const downPaymentAmt = (price * downPct) / 100;
    const loanAmt = price - downPaymentAmt;

    // Calculate monthly payment
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    const monthlyPmt =
      (loanAmt * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalPmt = monthlyPmt * numPayments;
    const totalInt = totalPmt - loanAmt;

    // Calculate affordable price (assuming 28% of income for housing)
    let affordablePrice = 0;
    if (income) {
      const maxMonthlyPayment = income * 0.28;
      affordablePrice =
        (maxMonthlyPayment * (Math.pow(1 + monthlyRate, numPayments) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments));
      affordablePrice = affordablePrice / (1 - downPct / 100);
    }

    setResult({
      monthlyPayment: monthlyPmt,
      totalPayment: totalPmt,
      totalInterest: totalInt,
      affordablePrice,
      downPaymentAmount: downPaymentAmt,
      loanAmount: loanAmt,
    });
    setShowResult(true);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const loanTermOptions = [
    { labelKey: "financial.15years", value: "15" },
    { labelKey: "financial.20years", value: "20" },
    { labelKey: "financial.25years", value: "25" },
    { labelKey: "financial.30years", value: "30" },
  ];

  const cardShadow = isDark ? shadowsDark.sm : shadows.sm;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[styles.header, { backgroundColor: colors.surface }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
          >
            <Image source={icons.backArrow} style={styles.backIcon} tintColor={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("financial.title")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t("financial.subtitle")}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Info Card */}
        <View className="mt-8 bg-gradient-to-br from-primary-300 to-primary-400 rounded-2xl p-6">
          <View className="flex flex-row items-center mb-3">
            <View className="bg-white/20 p-3 rounded-full mr-3">
              <Text className="text-3xl">💰</Text>
            </View>
            <Text className="text-xl font-rubik-bold text-white flex-1">
              {t("financial.welcome")}
            </Text>
          </View>
          <Text className="text-white/90 font-rubik text-sm leading-6">
            {t("financial.description")}
          </Text>
        </View>

        {/* Mortgage Calculator */}
        <View className="mt-8">
          <Text className="text-2xl font-rubik-bold mb-4" style={{ color: colors.text }}>
            {t("financial.calculator")}
          </Text>

          {/* Property Price */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "propertyPrice",
                t("financial.propertyPrice"),
                "250000",
                propertyPrice,
                setPropertyPrice
              )
            }
            className="mb-4"
          >
            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              {t("financial.propertyPrice")} ($)
            </Text>
            <View className="rounded-lg px-4 py-3 flex-row items-center" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Text className="font-rubik-bold mr-2" style={{ color: colors.primary }}>$</Text>
              <Text
                className="font-rubik flex-1"
                style={{ color: propertyPrice ? colors.text : colors.textMuted }}
              >
                {propertyPrice || t("financial.enterPropertyPrice")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Down Payment */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "downPayment",
                t("financial.downPayment"),
                "20",
                downPayment,
                setDownPayment
              )
            }
            className="mb-4"
          >
            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              {t("financial.downPayment")} (%)
            </Text>
            <View className="rounded-lg px-4 py-3 flex-row items-center" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Text
                className="font-rubik flex-1"
                style={{ color: downPayment ? colors.text : colors.textMuted }}
              >
                {downPayment || "20"}
              </Text>
              <Text className="font-rubik-bold" style={{ color: colors.primary }}>%</Text>
            </View>
          </TouchableOpacity>

          {/* Interest Rate */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "interestRate",
                t("financial.interestRate"),
                "3.5",
                interestRate,
                setInterestRate
              )
            }
            className="mb-4"
          >
            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              {t("financial.interestRate")} (%)
            </Text>
            <View className="rounded-lg px-4 py-3 flex-row items-center" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Text
                className="font-rubik flex-1"
                style={{ color: interestRate ? colors.text : colors.textMuted }}
              >
                {interestRate || "3.5"}
              </Text>
              <Text className="font-rubik-bold" style={{ color: colors.primary }}>%</Text>
            </View>
          </TouchableOpacity>

          {/* Loan Term */}
          <View className="mb-4">
            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              {t("financial.loanTerm")}
            </Text>
            <View className="flex flex-row gap-2">
              {loanTermOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setLoanTerm(option.value)}
                  className="flex-1 py-3 rounded-lg"
                  style={{
                    backgroundColor: loanTerm === option.value ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: loanTerm === option.value ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    className="text-center font-rubik-semibold"
                    style={{ color: loanTerm === option.value ? '#FFFFFF' : colors.text }}
                  >
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Monthly Income (Optional) */}
          <TouchableOpacity
            onPress={() =>
              openInputModal(
                "monthlyIncome",
                t("financial.monthlyIncome"),
                "5000",
                monthlyIncome,
                setMonthlyIncome
              )
            }
            className="mb-6"
          >
            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              {t("financial.monthlyIncome")} ({t("financial.optional")})
            </Text>
            <View className="rounded-lg px-4 py-3 flex-row items-center" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Text className="font-rubik-bold mr-2" style={{ color: colors.primary }}>$</Text>
              <Text
                className="font-rubik flex-1"
                style={{ color: monthlyIncome ? colors.text : colors.textMuted }}
              >
                {monthlyIncome || t("financial.enterIncome")}
              </Text>
            </View>
          </TouchableOpacity>

          <CustomButton
            title={t("financial.calculate")}
            onPress={calculateMortgage}
            className="bg-primary-300"
          />
        </View>

        {/* Results */}
        {showResult && result && (
          <View className="mt-8">
            <Text className="text-2xl font-rubik-bold mb-4" style={{ color: colors.text }}>
              {t("financial.results")}
            </Text>

            {/* Monthly Payment - Highlighted */}
            <View className="bg-primary-300 rounded-2xl p-6 mb-4">
              <Text className="text-white/80 font-rubik-medium text-sm mb-2">
                {t("financial.monthlyPayment")}
              </Text>
              <Text className="text-white font-rubik-bold text-4xl">
                {formatCurrency(result.monthlyPayment)}
              </Text>
              <Text className="text-white/60 font-rubik text-xs mt-1">
                {t("financial.perMonth")}
              </Text>
            </View>

            {/* Other Details */}
            <View className="rounded-xl p-5 mb-4" style={{ backgroundColor: colors.surfaceElevated }}>
              <View className="flex flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text className="font-rubik" style={{ color: colors.textSecondary }}>
                  {t("financial.loanAmount")}
                </Text>
                <Text className="font-rubik-bold" style={{ color: colors.text }}>
                  {formatCurrency(result.loanAmount)}
                </Text>
              </View>

              <View className="flex flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text className="font-rubik" style={{ color: colors.textSecondary }}>
                  {t("financial.downPaymentAmount")}
                </Text>
                <Text className="font-rubik-bold" style={{ color: colors.text }}>
                  {formatCurrency(result.downPaymentAmount)}
                </Text>
              </View>

              <View className="flex flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text className="font-rubik" style={{ color: colors.textSecondary }}>
                  {t("financial.totalPayment")}
                </Text>
                <Text className="font-rubik-bold" style={{ color: colors.text }}>
                  {formatCurrency(result.totalPayment)}
                </Text>
              </View>

              <View className="flex flex-row justify-between items-center py-3">
                <Text className="font-rubik" style={{ color: colors.textSecondary }}>
                  {t("financial.totalInterest")}
                </Text>
                <Text className="font-rubik-bold" style={{ color: colors.danger }}>
                  {formatCurrency(result.totalInterest)}
                </Text>
              </View>
            </View>

            {/* Affordability */}
            {monthlyIncome && result.affordablePrice > 0 && (
              <View className="rounded-xl p-5" style={{ backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderWidth: 1, borderColor: isDark ? '#10B981' : '#A7F3D0' }}>
                <View className="flex flex-row items-center mb-3">
                  <View className="bg-green-500 p-2 rounded-full mr-3">
                    <Text className="text-white text-lg">✓</Text>
                  </View>
                  <Text className="font-rubik-bold text-lg flex-1" style={{ color: isDark ? '#A7F3D0' : '#065F46' }}>
                    {t("financial.affordability")}
                  </Text>
                </View>
                <Text className="font-rubik mb-2" style={{ color: isDark ? '#6EE7B7' : '#047857' }}>
                  {t("financial.basedOnIncome")}
                </Text>
                <Text className="font-rubik-bold text-2xl" style={{ color: isDark ? '#ECFDF5' : '#064E3B' }}>
                  {formatCurrency(result.affordablePrice)}
                </Text>
                {parseFloat(propertyPrice) > result.affordablePrice && (
                  <Text className="font-rubik text-sm mt-3" style={{ color: colors.warning }}>
                    ⚠️ {t("financial.aboveAffordable")}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Financing Options */}
        <View className="mt-8">
          <Text className="text-2xl font-rubik-bold mb-4" style={{ color: colors.text }}>
            {t("financial.options")}
          </Text>

          {/* Conventional Loan */}
          <View className="rounded-xl p-5 mb-4" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <View className="flex flex-row items-center mb-3">
              <View className="p-3 rounded-full mr-3" style={{ backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE' }}>
                <Text className="text-2xl">🏦</Text>
              </View>
              <Text className="text-lg font-rubik-bold flex-1" style={{ color: colors.text }}>
                {t("financial.conventional")}
              </Text>
            </View>
            <Text className="font-rubik text-sm mb-2" style={{ color: colors.textSecondary }}>
              • {t("financial.conventionalDesc1")}
            </Text>
            <Text className="font-rubik text-sm mb-2" style={{ color: colors.textSecondary }}>
              • {t("financial.conventionalDesc2")}
            </Text>
            <Text className="font-rubik text-sm" style={{ color: colors.textSecondary }}>
              • {t("financial.conventionalDesc3")}
            </Text>
          </View>

          {/* FHA Loan */}
          <View className="rounded-xl p-5 mb-4" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <View className="flex flex-row items-center mb-3">
              <View className="p-3 rounded-full mr-3" style={{ backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }}>
                <Text className="text-2xl">🏘️</Text>
              </View>
              <Text className="text-lg font-rubik-bold flex-1" style={{ color: colors.text }}>
                {t("financial.fha")}
              </Text>
            </View>
            <Text className="font-rubik text-sm mb-2" style={{ color: colors.textSecondary }}>
              • {t("financial.fhaDesc1")}
            </Text>
            <Text className="font-rubik text-sm mb-2" style={{ color: colors.textSecondary }}>
              • {t("financial.fhaDesc2")}
            </Text>
            <Text className="font-rubik text-sm" style={{ color: colors.textSecondary }}>
              • {t("financial.fhaDesc3")}
            </Text>
          </View>

          {/* VA Loan */}
          <View className="rounded-xl p-5 mb-4" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <View className="flex flex-row items-center mb-3">
              <View className="p-3 rounded-full mr-3" style={{ backgroundColor: isDark ? '#4C1D95' : '#EDE9FE' }}>
                <Text className="text-2xl">🎖️</Text>
              </View>
              <Text className="text-lg font-rubik-bold flex-1" style={{ color: colors.text }}>
                {t("financial.va")}
              </Text>
            </View>
            <Text className="font-rubik text-sm mb-2" style={{ color: colors.textSecondary }}>
              • {t("financial.vaDesc1")}
            </Text>
            <Text className="font-rubik text-sm mb-2" style={{ color: colors.textSecondary }}>
              • {t("financial.vaDesc2")}
            </Text>
            <Text className="font-rubik text-sm" style={{ color: colors.textSecondary }}>
              • {t("financial.vaDesc3")}
            </Text>
          </View>
        </View>

        {/* Tips */}
        <View className="mt-8 rounded-xl p-5" style={{ backgroundColor: isDark ? '#78350F' : '#FEF3C7', borderWidth: 1, borderColor: isDark ? '#F59E0B' : '#FDE68A' }}>
          <Text className="text-lg font-rubik-bold mb-3" style={{ color: isDark ? '#FEF3C7' : '#92400E' }}>
            💡 {t("financial.tips")}
          </Text>
          <Text className="font-rubik text-sm mb-2" style={{ color: isDark ? '#FDE68A' : '#B45309' }}>
            • {t("financial.tip1")}
          </Text>
          <Text className="font-rubik text-sm mb-2" style={{ color: isDark ? '#FDE68A' : '#B45309' }}>
            • {t("financial.tip2")}
          </Text>
          <Text className="font-rubik text-sm mb-2" style={{ color: isDark ? '#FDE68A' : '#B45309' }}>
            • {t("financial.tip3")}
          </Text>
          <Text className="font-rubik text-sm" style={{ color: isDark ? '#FDE68A' : '#B45309' }}>
            • {t("financial.tip4")}
          </Text>
        </View>
      </ScrollView>

      {/* Input Modal */}
      {modalConfig && (
        <InputModal
          visible={modalVisible}
          title={modalConfig.title}
          placeholder={modalConfig.placeholder}
          value={tempValue}
          onChangeText={setTempValue}
          onClose={() => setModalVisible(false)}
          onSave={saveFromModal}
          keyboardType={modalConfig.keyboardType}
          multiline={false}
          numberOfLines={1}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Rubik-Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Rubik-Regular",
    marginTop: 2,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  accentLine: {
    height: 3,
    marginTop: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
});

