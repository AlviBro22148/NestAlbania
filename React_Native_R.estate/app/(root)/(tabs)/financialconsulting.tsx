import CustomButton from "@/components/CustomButton";
import InputModal from "@/components/InputModal";
import icons from "@/constants/icons";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const handleBack = useBackNavigation("/(root)/(tabs)/profile");

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

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
      >
        {/* Header */}
        <View className="flex flex-row items-center justify-between mt-5">
          <TouchableOpacity onPress={handleBack}>
            <Image source={icons.backArrow} className="w-6 h-6" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold">
            {t("financial.title")}
          </Text>
          <View className="w-6" />
        </View>

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
          <Text className="text-2xl font-rubik-bold text-black-300 mb-4">
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
            <Text className="text-sm font-rubik-medium mb-2">
              {t("financial.propertyPrice")} ($)
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center">
              <Text className="text-primary-300 font-rubik-bold mr-2">$</Text>
              <Text
                className={`font-rubik flex-1 ${
                  propertyPrice ? "text-black" : "text-gray-400"
                }`}
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
            <Text className="text-sm font-rubik-medium mb-2">
              {t("financial.downPayment")} (%)
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center">
              <Text
                className={`font-rubik flex-1 ${
                  downPayment ? "text-black" : "text-gray-400"
                }`}
              >
                {downPayment || "20"}
              </Text>
              <Text className="text-primary-300 font-rubik-bold">%</Text>
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
            <Text className="text-sm font-rubik-medium mb-2">
              {t("financial.interestRate")} (%)
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center">
              <Text
                className={`font-rubik flex-1 ${
                  interestRate ? "text-black" : "text-gray-400"
                }`}
              >
                {interestRate || "3.5"}
              </Text>
              <Text className="text-primary-300 font-rubik-bold">%</Text>
            </View>
          </TouchableOpacity>

          {/* Loan Term */}
          <View className="mb-4">
            <Text className="text-sm font-rubik-medium mb-2">
              {t("financial.loanTerm")}
            </Text>
            <View className="flex flex-row gap-2">
              {loanTermOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setLoanTerm(option.value)}
                  className={`flex-1 py-3 rounded-lg border ${
                    loanTerm === option.value
                      ? "bg-primary-300 border-primary-300"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-center font-rubik-semibold ${
                      loanTerm === option.value
                        ? "text-white"
                        : "text-black-300"
                    }`}
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
            <Text className="text-sm font-rubik-medium mb-2">
              {t("financial.monthlyIncome")} ({t("financial.optional")})
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center">
              <Text className="text-primary-300 font-rubik-bold mr-2">$</Text>
              <Text
                className={`font-rubik flex-1 ${
                  monthlyIncome ? "text-black" : "text-gray-400"
                }`}
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
            <Text className="text-2xl font-rubik-bold text-black-300 mb-4">
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
            <View className="bg-gray-50 rounded-xl p-5 mb-4">
              <View className="flex flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-black-200 font-rubik">
                  {t("financial.loanAmount")}
                </Text>
                <Text className="text-black-300 font-rubik-bold">
                  {formatCurrency(result.loanAmount)}
                </Text>
              </View>

              <View className="flex flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-black-200 font-rubik">
                  {t("financial.downPaymentAmount")}
                </Text>
                <Text className="text-black-300 font-rubik-bold">
                  {formatCurrency(result.downPaymentAmount)}
                </Text>
              </View>

              <View className="flex flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-black-200 font-rubik">
                  {t("financial.totalPayment")}
                </Text>
                <Text className="text-black-300 font-rubik-bold">
                  {formatCurrency(result.totalPayment)}
                </Text>
              </View>

              <View className="flex flex-row justify-between items-center py-3">
                <Text className="text-black-200 font-rubik">
                  {t("financial.totalInterest")}
                </Text>
                <Text className="text-red-500 font-rubik-bold">
                  {formatCurrency(result.totalInterest)}
                </Text>
              </View>
            </View>

            {/* Affordability */}
            {monthlyIncome && result.affordablePrice > 0 && (
              <View className="bg-green-50 rounded-xl p-5 border border-green-200">
                <View className="flex flex-row items-center mb-3">
                  <View className="bg-green-500 p-2 rounded-full mr-3">
                    <Text className="text-white text-lg">✓</Text>
                  </View>
                  <Text className="text-green-800 font-rubik-bold text-lg flex-1">
                    {t("financial.affordability")}
                  </Text>
                </View>
                <Text className="text-green-700 font-rubik mb-2">
                  {t("financial.basedOnIncome")}
                </Text>
                <Text className="text-green-900 font-rubik-bold text-2xl">
                  {formatCurrency(result.affordablePrice)}
                </Text>
                {parseFloat(propertyPrice) > result.affordablePrice && (
                  <Text className="text-orange-600 font-rubik text-sm mt-3">
                    ⚠️ {t("financial.aboveAffordable")}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Financing Options */}
        <View className="mt-8">
          <Text className="text-2xl font-rubik-bold text-black-300 mb-4">
            {t("financial.options")}
          </Text>

          {/* Conventional Loan */}
          <View className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <View className="flex flex-row items-center mb-3">
              <View className="bg-blue-100 p-3 rounded-full mr-3">
                <Text className="text-2xl">🏦</Text>
              </View>
              <Text className="text-lg font-rubik-bold text-black-300 flex-1">
                {t("financial.conventional")}
              </Text>
            </View>
            <Text className="text-black-200 font-rubik text-sm mb-2">
              • {t("financial.conventionalDesc1")}
            </Text>
            <Text className="text-black-200 font-rubik text-sm mb-2">
              • {t("financial.conventionalDesc2")}
            </Text>
            <Text className="text-black-200 font-rubik text-sm">
              • {t("financial.conventionalDesc3")}
            </Text>
          </View>

          {/* FHA Loan */}
          <View className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <View className="flex flex-row items-center mb-3">
              <View className="bg-green-100 p-3 rounded-full mr-3">
                <Text className="text-2xl">🏘️</Text>
              </View>
              <Text className="text-lg font-rubik-bold text-black-300 flex-1">
                {t("financial.fha")}
              </Text>
            </View>
            <Text className="text-black-200 font-rubik text-sm mb-2">
              • {t("financial.fhaDesc1")}
            </Text>
            <Text className="text-black-200 font-rubik text-sm mb-2">
              • {t("financial.fhaDesc2")}
            </Text>
            <Text className="text-black-200 font-rubik text-sm">
              • {t("financial.fhaDesc3")}
            </Text>
          </View>

          {/* VA Loan */}
          <View className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <View className="flex flex-row items-center mb-3">
              <View className="bg-purple-100 p-3 rounded-full mr-3">
                <Text className="text-2xl">🎖️</Text>
              </View>
              <Text className="text-lg font-rubik-bold text-black-300 flex-1">
                {t("financial.va")}
              </Text>
            </View>
            <Text className="text-black-200 font-rubik text-sm mb-2">
              • {t("financial.vaDesc1")}
            </Text>
            <Text className="text-black-200 font-rubik text-sm mb-2">
              • {t("financial.vaDesc2")}
            </Text>
            <Text className="text-black-200 font-rubik text-sm">
              • {t("financial.vaDesc3")}
            </Text>
          </View>
        </View>

        {/* Tips */}
        <View className="mt-8 bg-yellow-50 rounded-xl p-5 border border-yellow-200">
          <Text className="text-lg font-rubik-bold text-yellow-800 mb-3">
            💡 {t("financial.tips")}
          </Text>
          <Text className="text-yellow-700 font-rubik text-sm mb-2">
            • {t("financial.tip1")}
          </Text>
          <Text className="text-yellow-700 font-rubik text-sm mb-2">
            • {t("financial.tip2")}
          </Text>
          <Text className="text-yellow-700 font-rubik text-sm mb-2">
            • {t("financial.tip3")}
          </Text>
          <Text className="text-yellow-700 font-rubik text-sm">
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
