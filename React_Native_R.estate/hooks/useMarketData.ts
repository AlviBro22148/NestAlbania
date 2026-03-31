import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-config";

interface MarketOverview {
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  averagePrice: number;
  medianPrice: number;
  lowestPrice: number;
  highestPrice: number;
}

interface PropertyTypeData {
  propertyType: string;
  averagePrice: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}

interface TrendData {
  trends: { month: string; averagePrice: number; count: number }[];
  trendPercentage: number | null;
  trendDirection: string;
}

interface ForecastData {
  forecast?: string | { month: string; projectedPrice: number }[];
  message?: string;
  currentAveragePrice: number;
  growthRate: number;
  recommendation: string;
}

interface MarketData {
  overview: MarketOverview | null;
  pricesByType: PropertyTypeData[];
  trends: TrendData | null;
  forecast: ForecastData | null;
}

const EMPTY_MARKET_DATA: MarketData = {
  overview: null,
  pricesByType: [],
  trends: null,
  forecast: null,
};

// Combined hook for all market data - INSTAGRAM STYLE CACHING
export function useMarketData() {
  return useQuery({
    queryKey: ["market-data"],
    queryFn: async (): Promise<MarketData> => {
      try {
        // Fetch all endpoints in parallel
        const results = await Promise.allSettled([
          api.get("/api/MarketAnalysis/overview"),
          api.get("/api/MarketAnalysis/by-property-type"),
          api.get("/api/MarketAnalysis/trends"),
          api.get("/api/MarketAnalysis/forecast"),
        ]);

        const data: MarketData = {
          overview: results[0].status === "fulfilled" ? results[0].value.data : null,
          pricesByType: results[1].status === "fulfilled" ? results[1].value.data : [],
          trends: results[2].status === "fulfilled" ? results[2].value.data : {
            trends: [],
            trendPercentage: null,
            trendDirection: "stable",
          },
          forecast: results[3].status === "fulfilled" ? results[3].value.data : {
            forecast: "insufficient_data",
            message: "Unable to load forecast",
            currentAveragePrice: 0,
            growthRate: 0,
            recommendation: "Data unavailable",
          },
        };

        return data;
      } catch (error) {
        console.error("[useMarketData] Error:", error);
        throw error;
      }
    },
    // INSTAGRAM CACHING: Show cache instantly, only refresh on pull-to-refresh
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: EMPTY_MARKET_DATA,
  });
}

export const marketDataKeys = {
  all: ["market-data"] as const,
};
