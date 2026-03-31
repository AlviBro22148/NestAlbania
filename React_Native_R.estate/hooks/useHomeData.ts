import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-config";
import { queryKeys } from "@/lib/queryClient";
import { prefetchPropertyImages } from "@/lib/imagePreloader";

interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  status: string;
  images: string[];
  userId: string;
  ownerName?: string;
  createdAt: string;
}

interface YourChoicePagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

interface HomeDataResponse {
  featured: Property[];
  todaysChoice: Property[];
  greenHomes: Property[];
  yourChoice: Property[];
  yourChoicePagination: YourChoicePagination | null;
}

// Empty data for instant render while cache loads
const EMPTY_HOME_DATA: HomeDataResponse = {
  featured: [],
  todaysChoice: [],
  greenHomes: [],
  yourChoice: [],
  yourChoicePagination: null,
};

// Combined hook for all home screen data - INSTAGRAM STYLE CACHING
export function useHomeData() {
  const query = useQuery({
    queryKey: ["home-data"],
    queryFn: async (): Promise<HomeDataResponse> => {
      try {
        const response = await api.get("/api/properties/home");
        const data = response.data;

        if (!data) {
          return EMPTY_HOME_DATA;
        }

        // Prefetch images in background (non-blocking)
        if (data.todaysChoice?.length) {
          setTimeout(() => prefetchPropertyImages(data.todaysChoice), 0);
        }
        if (data.featured?.length) {
          setTimeout(() => prefetchPropertyImages(data.featured), 500);
        }
        if (data.greenHomes?.length) {
          setTimeout(() => prefetchPropertyImages(data.greenHomes), 1000);
        }

        return data;
      } catch (error) {
        console.error("[useHomeData] Error fetching:", error);
        throw error;
      }
    },
    // INSTAGRAM CACHING: Show cache instantly, never auto-refetch
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000, // Keep 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return query;
}

// Export individual query keys for invalidation
export const homeDataKeys = {
  all: ["home-data"] as const,
};
