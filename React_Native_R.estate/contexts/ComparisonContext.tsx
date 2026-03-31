import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
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

  // Memoize all callbacks to prevent re-renders
  const addToComparison = useCallback((propertyId: number) => {
    setComparisonList(prev => {
      if (prev.includes(propertyId)) {
        Alert.alert(
          "Already Added",
          "This property is already in your comparison list"
        );
        return prev;
      }

      if (prev.length >= 4) {
        Alert.alert(
          "Maximum Reached",
          "You can only compare up to 4 properties at a time. Remove one to add another."
        );
        return prev;
      }

      return [...prev, propertyId];
    });
  }, []);

  const removeFromComparison = useCallback((propertyId: number) => {
    setComparisonList(prev => prev.filter((id) => id !== propertyId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
  }, []);

  // Use ref-based check to avoid function recreation
  const comparisonListRef = React.useRef(comparisonList);
  comparisonListRef.current = comparisonList;

  const isInComparison = useCallback((propertyId: number) => {
    return comparisonListRef.current.includes(propertyId);
  }, []); // Empty deps - uses ref

  // CRITICAL: Memoize context value - only primitive values in deps
  const value = useMemo(() => ({
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
  }), [comparisonList, addToComparison, removeFromComparison, clearComparison]);

  return (
    <ComparisonContext.Provider value={value}>
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
