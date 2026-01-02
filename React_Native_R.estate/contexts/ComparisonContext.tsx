import React, { createContext, useContext, useState, ReactNode } from "react";
import { Alert } from "react-native";

interface ComparisonContextType {
  comparisonList: number[];
  addToComparison: (propertyId: number) => void;
  removeFromComparison: (propertyId: number) => void;
  clearComparison: () => void;
  isInComparison: (propertyId: number) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(
  undefined
);

export const ComparisonProvider = ({ children }: { children: ReactNode }) => {
  const [comparisonList, setComparisonList] = useState<number[]>([]);

  const addToComparison = (propertyId: number) => {
    if (comparisonList.includes(propertyId)) {
      Alert.alert(
        "Already Added",
        "This property is already in your comparison list"
      );
      return;
    }

    if (comparisonList.length >= 4) {
      Alert.alert(
        "Maximum Reached",
        "You can only compare up to 4 properties at a time. Remove one to add another."
      );
      return;
    }

    setComparisonList([...comparisonList, propertyId]);
  };

  const removeFromComparison = (propertyId: number) => {
    setComparisonList(comparisonList.filter((id) => id !== propertyId));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  const isInComparison = (propertyId: number) => {
    return comparisonList.includes(propertyId);
  };

  return (
    <ComparisonContext.Provider
      value={{
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
};
