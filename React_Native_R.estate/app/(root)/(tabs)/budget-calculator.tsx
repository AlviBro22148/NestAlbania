// app/(root)/(tabs)/budget-calculator.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAlert } from "@/contexts/AlertContext";

type CalculatorMode = "buying" | "renting";

interface BuyingInputs {
  annualIncome: string;
  monthlyDebts: string;
  downPayment: string;
  interestRate: string;
  loanTerm: string;
  propertyTax: string;
  homeInsurance: string;
  hoaFees: string;
}

interface RentingInputs {
  monthlyIncome: string;
  otherDebts: string;
  utilitiesBudget: string;
  savingsGoal: string;
}

interface BuyingResults {
  maxPurchasePrice: number;
  maxMonthlyPayment: number;
  estimatedMortgage: number;
  totalMonthlyPayment: number;
  downPaymentAmount: number;
  loanAmount: number;
}

interface RentingResults {
  maxRent: number;
  recommendedRent: number;
  remainingBudget: number;
  savingsAmount: number;
}

const BudgetCalculatorScreen = () => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [mode, setMode] = useState<CalculatorMode>("buying");

  // Buying inputs
  const [buyingInputs, setBuyingInputs] = useState<BuyingInputs>({
    annualIncome: "",
    monthlyDebts: "",
    downPayment: "",
    interestRate: "3.5",
    loanTerm: "30",
    propertyTax: "1.2",
    homeInsurance: "100",
    hoaFees: "0",
  });

  // Renting inputs
  const [rentingInputs, setRentingInputs] = useState<RentingInputs>({
    monthlyIncome: "",
    otherDebts: "",
    utilitiesBudget: "",
    savingsGoal: "20",
  });

  const [buyingResults, setBuyingResults] = useState<BuyingResults | null>(
    null
  );
  const [rentingResults, setRentingResults] = useState<RentingResults | null>(
    null
  );

  const calculateBuying = () => {
    const income = parseFloat(buyingInputs.annualIncome);
    const debts = parseFloat(buyingInputs.monthlyDebts) || 0;
    const downPmt = parseFloat(buyingInputs.downPayment);
    const rate = parseFloat(buyingInputs.interestRate) / 100 / 12;
    const term = parseFloat(buyingInputs.loanTerm) * 12;
    const taxRate = parseFloat(buyingInputs.propertyTax) / 100 / 12;
    const insurance = parseFloat(buyingInputs.homeInsurance) || 0;
    const hoa = parseFloat(buyingInputs.hoaFees) || 0;

    if (!income || !downPmt) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.fillAllFields"),
      });
      return;
    }

    // 28/36 rule: Housing should be max 28% of gross monthly income
    const monthlyIncome = income / 12;
    const maxHousingPayment = monthlyIncome * 0.28;

    // Also check debt-to-income ratio (max 36%)
    const maxTotalDebt = monthlyIncome * 0.36;
    const availableForHousing = maxTotalDebt - debts;

    // Use the lower of the two
    const maxMonthlyPayment = Math.min(maxHousingPayment, availableForHousing);

    // Subtract property tax, insurance, and HOA to get max mortgage payment
    const maxMortgagePayment = maxMonthlyPayment - insurance - hoa;

    // Calculate max loan amount using mortgage payment formula
    // M = P * [r(1+r)^n] / [(1+r)^n - 1]
    // Solve for P: P = M * [(1+r)^n - 1] / [r(1+r)^n]
    const maxLoanAmount =
      (maxMortgagePayment * (Math.pow(1 + rate, term) - 1)) /
      (rate * Math.pow(1 + rate, term));

    // Calculate max purchase price
    const maxPurchasePrice = maxLoanAmount + downPmt;

    // Calculate actual monthly payment with property costs
    const mortgagePayment =
      (maxLoanAmount * (rate * Math.pow(1 + rate, term))) /
      (Math.pow(1 + rate, term) - 1);

    const propertyTaxMonthly = maxPurchasePrice * taxRate;
    const totalMonthly = mortgagePayment + propertyTaxMonthly + insurance + hoa;

    setBuyingResults({
      maxPurchasePrice: Math.round(maxPurchasePrice),
      maxMonthlyPayment: Math.round(maxMonthlyPayment),
      estimatedMortgage: Math.round(mortgagePayment),
      totalMonthlyPayment: Math.round(totalMonthly),
      downPaymentAmount: downPmt,
      loanAmount: Math.round(maxLoanAmount),
    });
  };

  const calculateRenting = () => {
    const income = parseFloat(rentingInputs.monthlyIncome);
    const debts = parseFloat(rentingInputs.otherDebts) || 0;
    const utilities = parseFloat(rentingInputs.utilitiesBudget) || 0;
    const savingsPercent = parseFloat(rentingInputs.savingsGoal) / 100;

    if (!income) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("validation.enterMonthlyIncome"),
      });
      return;
    }

    // 30% rule: Rent should be max 30% of gross monthly income
    const maxRent = income * 0.3;

    // Recommended is 25% for more financial flexibility
    const recommendedRent = income * 0.25;

    // Calculate remaining budget after rent, debts, utilities, and savings
    const savingsAmount = income * savingsPercent;
    const remainingBudget =
      income - recommendedRent - debts - utilities - savingsAmount;

    setRentingResults({
      maxRent: Math.round(maxRent),
      recommendedRent: Math.round(recommendedRent),
      remainingBudget: Math.round(remainingBudget),
      savingsAmount: Math.round(savingsAmount),
    });
  };

  const handleCalculate = () => {
    if (mode === "buying") {
      calculateBuying();
    } else {
      calculateRenting();
    }
  };

  const handleReset = () => {
    if (mode === "buying") {
      setBuyingInputs({
        annualIncome: "",
        monthlyDebts: "",
        downPayment: "",
        interestRate: "3.5",
        loanTerm: "30",
        propertyTax: "1.2",
        homeInsurance: "100",
        hoaFees: "0",
      });
      setBuyingResults(null);
    } else {
      setRentingInputs({
        monthlyIncome: "",
        otherDebts: "",
        utilitiesBudget: "",
        savingsGoal: "20",
      });
      setRentingResults(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-rubik-bold text-black-300">
              💰 {t("budgetCalculator.title")}
            </Text>
            <Text className="text-sm font-rubik text-gray-500 mt-1">
              {t("budgetCalculator.subtitle")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleReset}
            className="bg-gray-100 px-4 py-2 rounded-full"
          >
            <Text className="text-sm font-rubik-semibold text-gray-700">
              {t("common.reset")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Mode Selector */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setMode("buying")}
            className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
              mode === "buying" ? "bg-primary-300" : "bg-gray-100"
            }`}
          >
            <Ionicons
              name="home"
              size={20}
              color={mode === "buying" ? "white" : "#666876"}
            />
            <Text
              className={`ml-2 font-rubik-bold ${
                mode === "buying" ? "text-white" : "text-gray-700"
              }`}
            >
              {t("budgetCalculator.buying")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("renting")}
            className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
              mode === "renting" ? "bg-primary-300" : "bg-gray-100"
            }`}
          >
            <Ionicons
              name="key"
              size={20}
              color={mode === "renting" ? "white" : "#666876"}
            />
            <Text
              className={`ml-2 font-rubik-bold ${
                mode === "renting" ? "text-white" : "text-gray-700"
              }`}
            >
              {t("budgetCalculator.renting")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
      >
        {mode === "buying" ? (
          <>
            {/* Buying Form */}
            <View className="bg-white p-5 rounded-2xl shadow-sm mb-4">
              <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                {t("budgetCalculator.incomeExpenses")}
              </Text>

              {/* Annual Income */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.annualIncome")} *
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <Text className="text-gray-500 font-rubik-semibold">$</Text>
                  <TextInput
                    value={buyingInputs.annualIncome}
                    onChangeText={(text) =>
                      setBuyingInputs({ ...buyingInputs, annualIncome: text })
                    }
                    keyboardType="numeric"
                    placeholder="80000"
                    className="flex-1 py-3 ml-2 font-rubik"
                  />
                </View>
              </View>

              {/* Monthly Debts */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.monthlyDebts")}
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <Text className="text-gray-500 font-rubik-semibold">$</Text>
                  <TextInput
                    value={buyingInputs.monthlyDebts}
                    onChangeText={(text) =>
                      setBuyingInputs({ ...buyingInputs, monthlyDebts: text })
                    }
                    keyboardType="numeric"
                    placeholder="500"
                    className="flex-1 py-3 ml-2 font-rubik"
                  />
                </View>
                <Text className="text-xs text-gray-500 font-rubik mt-1">
                  {t("budgetCalculator.debtsHint")}
                </Text>
              </View>

              {/* Down Payment */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.downPayment")} *
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <Text className="text-gray-500 font-rubik-semibold">$</Text>
                  <TextInput
                    value={buyingInputs.downPayment}
                    onChangeText={(text) =>
                      setBuyingInputs({ ...buyingInputs, downPayment: text })
                    }
                    keyboardType="numeric"
                    placeholder="50000"
                    className="flex-1 py-3 ml-2 font-rubik"
                  />
                </View>
              </View>
            </View>

            {/* Loan Details */}
            <View className="bg-white p-5 rounded-2xl shadow-sm mb-4">
              <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                {t("budgetCalculator.loanDetails")}
              </Text>

              {/* Interest Rate */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.interestRate")}
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <TextInput
                    value={buyingInputs.interestRate}
                    onChangeText={(text) =>
                      setBuyingInputs({ ...buyingInputs, interestRate: text })
                    }
                    keyboardType="numeric"
                    placeholder="3.5"
                    className="flex-1 py-3 font-rubik"
                  />
                  <Text className="text-gray-500 font-rubik-semibold">%</Text>
                </View>
              </View>

              {/* Loan Term */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.loanTerm")}
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() =>
                      setBuyingInputs({ ...buyingInputs, loanTerm: "15" })
                    }
                    className={`flex-1 py-3 rounded-xl border ${
                      buyingInputs.loanTerm === "15"
                        ? "bg-primary-100 border-primary-300"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-center font-rubik-semibold ${
                        buyingInputs.loanTerm === "15"
                          ? "text-primary-300"
                          : "text-gray-700"
                      }`}
                    >
                      15 {t("budgetCalculator.years")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setBuyingInputs({ ...buyingInputs, loanTerm: "30" })
                    }
                    className={`flex-1 py-3 rounded-xl border ${
                      buyingInputs.loanTerm === "30"
                        ? "bg-primary-100 border-primary-300"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-center font-rubik-semibold ${
                        buyingInputs.loanTerm === "30"
                          ? "text-primary-300"
                          : "text-gray-700"
                      }`}
                    >
                      30 {t("budgetCalculator.years")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Additional Costs */}
            <View className="bg-white p-5 rounded-2xl shadow-sm mb-4">
              <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                {t("budgetCalculator.additionalCosts")}
              </Text>

              {/* Property Tax */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.propertyTaxRate")}
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <TextInput
                    value={buyingInputs.propertyTax}
                    onChangeText={(text) =>
                      setBuyingInputs({ ...buyingInputs, propertyTax: text })
                    }
                    keyboardType="numeric"
                    placeholder="1.2"
                    className="flex-1 py-3 font-rubik"
                  />
                  <Text className="text-gray-500 font-rubik-semibold">%</Text>
                </View>
              </View>

              {/* Home Insurance */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.homeInsurance")}
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <Text className="text-gray-500 font-rubik-semibold">$</Text>
                  <TextInput
                    value={buyingInputs.homeInsurance}
                    onChangeText={(text) =>
                      setBuyingInputs({ ...buyingInputs, homeInsurance: text })
                    }
                    keyboardType="numeric"
                    placeholder="100"
                    className="flex-1 py-3 ml-2 font-rubik"
                  />
                </View>
              </View>

              {/* HOA Fees */}
              <View>
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.hoaFees")}
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <Text className="text-gray-500 font-rubik-semibold">$</Text>
                  <TextInput
                    value={buyingInputs.hoaFees}
                    onChangeText={(text) =>
                      setBuyingInputs({ ...buyingInputs, hoaFees: text })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    className="flex-1 py-3 ml-2 font-rubik"
                  />
                </View>
              </View>
            </View>

            {/* Buying Results - REVISED FOR READABILITY */}
            {buyingResults && (
              <View className="bg-gradient-to-br from-primary-300 to-primary-400 p-6 rounded-2xl shadow-lg mb-4">
                <Text className="text-black font-rubik-bold text-xl mb-4 mt-3">
                  {t("budgetCalculator.yourResults")}
                </Text>

                {/* Maximum Purchase Price (White Background for High Contrast) */}
                <View className="bg-white p-4 rounded-xl mb-3 border border-primary-300">
                  <Text className="text-primary-600 font-rubik text-sm mb-1">
                    {t("budgetCalculator.maxPurchasePrice")}
                  </Text>
                  <Text className="text-black-300 font-rubik-bold text-3xl">
                    {formatCurrency(buyingResults.maxPurchasePrice)}
                  </Text>
                </View>

                <View className="flex-row gap-3 mb-3">
                  {/* Down Payment (White Background) */}
                  <View className="flex-1 bg-white p-4 rounded-xl border border-primary-300">
                    <Text className="text-primary-600 font-rubik text-xs mb-1">
                      {t("budgetCalculator.downPayment")}
                    </Text>
                    <Text className="text-black-300 font-rubik-bold text-lg">
                      {formatCurrency(buyingResults.downPaymentAmount)}
                    </Text>
                  </View>

                  {/* Loan Amount (White Background) */}
                  <View className="flex-1 bg-white p-4 rounded-xl border border-primary-300">
                    <Text className="text-primary-600 font-rubik text-xs mb-1">
                      {t("budgetCalculator.loanAmount")}
                    </Text>
                    <Text className="text-black-300 font-rubik-bold text-lg">
                      {formatCurrency(buyingResults.loanAmount)}
                    </Text>
                  </View>
                </View>

                {/* Total Monthly Payment (Solid Primary Background) */}
                <View className="bg-primary-500/50 p-4 rounded-xl mb-3 border border-primary-300">
                  <Text className="text-black/80 font-rubik text-sm mb-1">
                    {t("budgetCalculator.totalMonthlyPayment")}
                  </Text>
                  <Text className="text-black font-rubik-bold text-2xl">
                    {formatCurrency(buyingResults.totalMonthlyPayment)}
                  </Text>
                  <View className="mt-2 pt-2 border-t border-white/20">
                    <Text className="text-black/80 font-rubik text-xs">
                      {t("budgetCalculator.mortgage")}:{" "}
                      {formatCurrency(buyingResults.estimatedMortgage)}
                    </Text>
                  </View>
                </View>

                <View className="bg-yellow-50 p-3 rounded-xl">
                  <View className="flex-row items-start">
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#F59E0B"
                    />
                    <Text className="flex-1 text-xs font-rubik text-gray-700 ml-2">
                      {t("budgetCalculator.budgetRule")}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Renting Form */}
            <View className="bg-white p-5 rounded-2xl shadow-sm mb-4">
              <Text className="text-lg font-rubik-bold text-black-300 mb-4">
                {t("budgetCalculator.incomeExpenses")}
              </Text>

              {/* Monthly Income */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.monthlyIncome")} *
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <Text className="text-gray-500 font-rubik-semibold">$</Text>
                  <TextInput
                    value={rentingInputs.monthlyIncome}
                    onChangeText={(text) =>
                      setRentingInputs({
                        ...rentingInputs,
                        monthlyIncome: text,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="5000"
                    className="flex-1 py-3 ml-2 font-rubik"
                  />
                </View>
              </View>

              {/* Other Debts */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.otherDebts")}
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <Text className="text-gray-500 font-rubik-semibold">$</Text>
                  <TextInput
                    value={rentingInputs.otherDebts}
                    onChangeText={(text) =>
                      setRentingInputs({ ...rentingInputs, otherDebts: text })
                    }
                    keyboardType="numeric"
                    placeholder="300"
                    className="flex-1 py-3 ml-2 font-rubik"
                  />
                </View>
                <Text className="text-xs text-gray-500 font-rubik mt-1">
                  {t("budgetCalculator.debtsHintRent")}
                </Text>
              </View>

              {/* Utilities Budget */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.utilities")}
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <Text className="text-gray-500 font-rubik-semibold">$</Text>
                  <TextInput
                    value={rentingInputs.utilitiesBudget}
                    onChangeText={(text) =>
                      setRentingInputs({
                        ...rentingInputs,
                        utilitiesBudget: text,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="150"
                    className="flex-1 py-3 ml-2 font-rubik"
                  />
                </View>
                <Text className="text-xs text-gray-500 font-rubik mt-1">
                  {t("budgetCalculator.utilitiesHint")}
                </Text>
              </View>

              {/* Savings Goal */}
              <View>
                <Text className="text-sm font-rubik-semibold text-black-300 mb-2">
                  {t("budgetCalculator.savingsGoal")}
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <TextInput
                    value={rentingInputs.savingsGoal}
                    onChangeText={(text) =>
                      setRentingInputs({ ...rentingInputs, savingsGoal: text })
                    }
                    keyboardType="numeric"
                    placeholder="20"
                    className="flex-1 py-3 font-rubik"
                  />
                  <Text className="text-gray-500 font-rubik-semibold">%</Text>
                </View>
              </View>
            </View>
            {/* Renting Results - REVISED FOR READABILITY */}
            {rentingResults && (
              <View className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg mb-4">
                <Text className="text-black font-rubik-bold text-xl mb-4 mt-3">
                  {t("budgetCalculator.rentalBudget")}
                </Text>

                {/* Recommended Rent (White Background for High Contrast) */}
                <View className="bg-white p-4 rounded-xl mb-3 border border-green-300">
                  <Text className="text-green-600 font-rubik text-sm mb-1">
                    {t("budgetCalculator.recommendedRent")}
                  </Text>
                  <Text className="text-black-300 font-rubik-bold text-3xl">
                    {formatCurrency(rentingResults.recommendedRent)}
                  </Text>
                </View>
                {/* Maximum Rent (Solid Green Background) */}
                <View className="bg-green-700/50 p-4 rounded-xl mb-3 border border-green-400">
                  <Text className="text-white/80 font-rubik text-sm mb-1">
                    {t("budgetCalculator.maxRent")}
                  </Text>
                  <Text className="text-white font-rubik-bold text-2xl">
                    {formatCurrency(rentingResults.maxRent)}
                  </Text>
                </View>
                <View className="flex-row gap-3 mb-3">
                  {/* Monthly Savings (White Background) */}
                  <View className="flex-1 bg-white p-4 rounded-xl border border-green-300">
                    <Text className="text-green-600 font-rubik text-xs mb-1">
                      {t("budgetCalculator.monthlySavings")}
                    </Text>
                    <Text className="text-black-300 font-rubik-bold text-lg">
                      {formatCurrency(rentingResults.savingsAmount)}
                    </Text>
                  </View>
                  {/* Remaining Budget (White Background) */}
                  <View className="flex-1 bg-white p-4 rounded-xl border border-green-300">
                    <Text className="text-green-600 font-rubik text-xs mb-1">
                      {t("budgetCalculator.remainingBudget")}
                    </Text>
                    <Text className="text-black-300 font-rubik-bold text-lg">
                      {formatCurrency(rentingResults.remainingBudget)}
                    </Text>
                  </View>
                </View>
                <View className="bg-yellow-50 p-3 rounded-xl">
                  <View className="flex-row items-start">
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#F59E0B"
                    />
                    <Text className="flex-1 text-xs font-rubik text-gray-700 ml-2">
                      {t("budgetCalculator.rentRule")}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Calculate Button */}
        <TouchableOpacity
          onPress={handleCalculate}
          className="bg-primary-300 py-4 rounded-xl shadow-lg"
          activeOpacity={0.8}
        >
          <Text className="text-center font-rubik-bold text-white text-lg">
            {t("budgetCalculator.calculate")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BudgetCalculatorScreen;
