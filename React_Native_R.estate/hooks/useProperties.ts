import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-config";
import { queryKeys } from "@/lib/queryClient";
import { prefetchPropertyImages, prefetchAllPropertyImages } from "@/lib/imagePreloader";

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
  ownerPhone?: string;
  ownerEmail?: string;
  createdAt: string;
  listingType?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  leaseTermMonths?: number;
  furnishedStatus?: string;
  utilitiesIncluded?: boolean;
  ecoScore?: number;
  hasLEEDCertification?: boolean;
  hasEnergyStarCertification?: boolean;
  leedLevel?: string;
  hasSolarPanels?: boolean;
  hasEnergyEfficientAppliances?: boolean;
  hasLEDLighting?: boolean;
  hasSmartThermostats?: boolean;
  hasDoubleGlazedWindows?: boolean;
  hasRainwaterHarvesting?: boolean;
  hasGreenRoof?: boolean;
}

interface YourChoiceResponse {
  properties: Property[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

// Fetch Featured Properties
export function useFeaturedProperties() {
  return useQuery({
    queryKey: queryKeys.properties.featured(),
    queryFn: async (): Promise<Property[]> => {
      const response = await api.get("/api/properties/featured");
      // Prefetch images for faster display
      prefetchPropertyImages(response.data);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch Today's Choice Properties
export function useTodaysChoice() {
  return useQuery({
    queryKey: queryKeys.properties.todaysChoice(),
    queryFn: async (): Promise<Property[]> => {
      try {
        const response = await api.get("/api/properties/todays-choice");
        // Prefetch images for faster display
        prefetchPropertyImages(response.data);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch Green Homes
export function useGreenHomes() {
  return useQuery({
    queryKey: queryKeys.properties.greenHomes(),
    queryFn: async (): Promise<Property[]> => {
      const response = await api.get("/api/properties/green-homes");
      // Prefetch images for faster display
      prefetchPropertyImages(response.data);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch Your Choice with infinite scroll
export function useYourChoice(enabled: boolean = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.properties.yourChoice(1),
    queryFn: async ({ pageParam = 1 }): Promise<YourChoiceResponse> => {
      const response = await api.get("/api/properties/your-choice", {
        params: { page: pageParam, pageSize: 10 },
      });
      // Prefetch images for faster display
      prefetchPropertyImages(response.data.properties);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch Property Detail with image preloading - INSTAGRAM-STYLE CACHING
export function usePropertyDetail(propertyId: number) {
  return useQuery({
    queryKey: queryKeys.properties.detail(propertyId),
    queryFn: async (): Promise<Property> => {
      const response = await api.get(`/api/properties/${propertyId}`);
      // Prefetch all property images for gallery view
      prefetchAllPropertyImages(response.data);
      return response.data;
    },
    enabled: !!propertyId,
    // Instagram-style caching: show cache instantly, refresh in background
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// Prefetch property detail with images (for faster navigation)
export function usePrefetchProperty() {
  const queryClient = useQueryClient();

  return (propertyId: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.properties.detail(propertyId),
      queryFn: async () => {
        const response = await api.get(`/api/properties/${propertyId}`);
        // Prefetch all property images
        prefetchAllPropertyImages(response.data);
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}

// Invalidate all property queries (for refresh)
export function useInvalidateProperties() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
  };
}

// Fetch user reports with Instagram-style caching
export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const response = await api.get("/api/reports");
      const reportsData = response.data || [];

      return reportsData.map((r: any) => ({
        id: r.id.toString(),
        name: r.name,
        description: r.description,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        properties: (r.properties || []).map((p: any) => ({
          id: p.id,
          propertyId: p.propertyId || p.property?.id,
          title: p.property?.title || p.title || "Unknown Property",
          address: p.property?.address || p.address || "",
          price: p.property?.price || p.price || 0,
          image: p.property?.images?.[0]?.url || p.property?.image || p.image || "",
          bedrooms: p.property?.bedrooms || p.bedrooms || 0,
          bathrooms: p.property?.bathrooms || p.bathrooms || 0,
          area: p.property?.area || p.area || 0,
          notes: p.notes || "",
        })),
      }));
    },
    // Instagram-style caching
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// Explore properties with filters and pagination (cached)
interface ExploreFilters {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyTypes?: string[];
  listingType?: string;
  cities?: string[];
  amenities?: string[];
}

interface PaginatedResponse {
  properties: Property[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalProperties: number;
  hasNextPage: boolean;
}

export function useExploreProperties(filters: ExploreFilters = {}) {
  const hasFilters = Object.keys(filters).length > 0;

  return useInfiniteQuery({
    queryKey: queryKeys.properties.explore(filters),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse> => {
      let response;

      if (hasFilters) {
        response = await api.post<PaginatedResponse>("/api/properties/filter", {
          ...filters,
          page: pageParam,
          pageSize: 10,
        });
      } else {
        response = await api.get<PaginatedResponse>(
          `/api/properties/paginated?page=${pageParam}&pageSize=10`
        );
      }

      // Prefetch images in background
      setTimeout(() => prefetchPropertyImages(response.data.properties), 0);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNextPage) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    // INSTAGRAM CACHING: Show cache instantly, only refresh on pull-to-refresh
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
