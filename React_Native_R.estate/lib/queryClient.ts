import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import api from "@/lib/axios-config";
import { Image as ExpoImage } from "expo-image";
import { InteractionManager } from "react-native";

// Create MMKV instance for query cache (separate from auth storage)
let cacheStorage: any = null;
try {
  const mmkvModule = require("react-native-mmkv");
  let MMKVClass = mmkvModule.MMKV;
  if (!MMKVClass && mmkvModule.default) {
    MMKVClass = mmkvModule.default.MMKV || mmkvModule.default;
  }
  
  if (typeof MMKVClass === 'function') {
    cacheStorage = new MMKVClass({ id: "query-cache" });
    console.log("[Cache] Using MMKV (Verified)");
  } else {
    throw new Error("MMKV class not found");
  }
} catch (e: any) {
  console.log(`[Cache] MMKV initialization failed: ${e.message}`);
  cacheStorage = null;
}
if (!cacheStorage) {
  console.log("[Cache] Using memory-only (MMKV requires native build)");
}

// Throttled MMKV Persister - prevents UI freezes during serialization
let persistTimeout: ReturnType<typeof setTimeout> | null = null;
let lastPersistTime = 0;
const PERSIST_THROTTLE_MS = 30000; // Increase to 30 seconds to minimize JS bridge traffic

export const mmkvPersister = cacheStorage ? {
  persistClient: async (client: any) => {
    // Throttle persistence to prevent UI freezes
    const now = Date.now();
    if (now - lastPersistTime < PERSIST_THROTTLE_MS) {
      // Schedule a delayed persist instead
      if (persistTimeout) clearTimeout(persistTimeout);
      persistTimeout = setTimeout(() => {
        mmkvPersister?.persistClient(client);
      }, PERSIST_THROTTLE_MS);
      return;
    }

    lastPersistTime = now;

    // Run serialization ONLY after interactions are finished and with a delay
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        try {
          // Optimization: only persist what's needed or check size
          const serialized = JSON.stringify(client);
          cacheStorage.set("react-query-cache", serialized);
          console.log("[Cache] Persisted to disk");
        } catch (e) {
          // Silent fail
        }
      }, 1000); // 1 second buffer after interactions
    });
  },
  restoreClient: async () => {
    try {
      const cached = cacheStorage.getString("react-query-cache");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Silent fail
    }
    return undefined;
  },
  removeClient: async () => {
    try {
      cacheStorage.delete("react-query-cache");
    } catch (e) {
      // Silent fail
    }
  },
} : null;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // INSTAGRAM-STYLE CACHING:
      staleTime: Infinity, 
      gcTime: 12 * 60 * 60 * 1000, // Reduce to 12 hours to keep cache smaller
      retry: 1, // Reduce retries
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false, 
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: 1,
    },
  },
});

// Prefetch all main tab data on app startup - Instagram style
export async function prefetchAllTabData() {
  try {
    // Phase 1: Home Data (Essential)
    await queryClient.prefetchQuery({
      queryKey: ["home-data"],
      queryFn: async () => {
        const response = await api.get("/api/properties/home");
        // Only prefetch images for featured properties, carefully
        prefetchImagesFromProperties(response.data.featured || [], 3); 
        return response.data;
      },
      staleTime: Infinity,
    });

    // Phase 2: Explore Data (Wait 2 seconds)
    setTimeout(() => {
      InteractionManager.runAfterInteractions(async () => {
        await queryClient.prefetchInfiniteQuery({
          queryKey: ["properties", "explore", {}],
          queryFn: async () => {
            const response = await api.get("/api/properties/paginated?page=1&pageSize=10");
            // Don't prefetch images here to avoid flooding the bridge
            return response.data;
          },
          initialPageParam: 1,
          staleTime: Infinity,
        });
      });
    }, 2000);

    // Phase 3: Market Data (Wait 5 seconds)
    setTimeout(() => {
      InteractionManager.runAfterInteractions(async () => {
        await queryClient.prefetchQuery({
          queryKey: ["market-data"],
          queryFn: async () => {
            const results = await Promise.allSettled([
              api.get("/api/MarketAnalysis/overview"),
              api.get("/api/MarketAnalysis/by-property-type"),
            ]);
            return {
              overview: results[0].status === "fulfilled" ? results[0].value.data : null,
              pricesByType: results[1].status === "fulfilled" ? results[1].value.data : [],
            };
          },
          staleTime: Infinity,
        });
      });
    }, 5000);
  } catch (error) {
    console.log("[Cache] Prefetch error:", error);
  }
}

// Helper to prefetch images from properties with limit
function prefetchImagesFromProperties(properties: any[], limit: number = 5) {
  if (!properties?.length) return;

  const imageUrls = properties
    .slice(0, limit)
    .filter(p => p.images?.length > 0)
    .map(p => p.images[0]);

  // Prefetch slowly
  imageUrls.forEach((url, index) => {
    setTimeout(() => {
      ExpoImage.prefetch(url, "memory-disk").catch(() => {});
    }, index * 200); // 200ms gap between each image prefetch
  });
}

// Query keys for type safety and consistency
export const queryKeys = {
  // Properties
  properties: {
    all: ["properties"] as const,
    featured: () => [...queryKeys.properties.all, "featured"] as const,
    todaysChoice: () => [...queryKeys.properties.all, "todays-choice"] as const,
    greenHomes: () => [...queryKeys.properties.all, "green-homes"] as const,
    yourChoice: (page: number) => [...queryKeys.properties.all, "your-choice", page] as const,
    detail: (id: number) => [...queryKeys.properties.all, "detail", id] as const,
    search: (filters: any) => [...queryKeys.properties.all, "search", filters] as const,
    explore: (filters: any) => [...queryKeys.properties.all, "explore", filters] as const,
    explorePaginated: () => [...queryKeys.properties.all, "explore-paginated"] as const,
  },
  // Liked properties
  likes: {
    all: ["likes"] as const,
    ids: () => [...queryKeys.likes.all, "ids"] as const,
  },
  // User
  user: {
    all: ["user"] as const,
    preferences: () => [...queryKeys.user.all, "preferences"] as const,
    notifications: () => [...queryKeys.user.all, "notifications"] as const,
  },
};
