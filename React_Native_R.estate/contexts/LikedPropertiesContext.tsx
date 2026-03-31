import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import api from "@/lib/axios-config";
import { useAuth } from "./AuthContext";
import * as Haptics from "expo-haptics";

// Throttle refresh to prevent API calls during rapid navigation
const REFRESH_THROTTLE_MS = 30000; // 30 seconds

// PERFORMANCE: Split into two contexts to prevent cascade re-renders
// - StateContext: Contains likedIds, isLoading (changes trigger re-renders)
// - ActionsContext: Contains stable functions (never changes, no re-renders)

interface LikedPropertiesStateType {
  likedIds: Set<number>;
  isLoading: boolean;
}

interface LikedPropertiesActionsType {
  isLiked: (propertyId: number) => boolean;
  toggleLike: (propertyId: number) => Promise<boolean>;
  refreshLikedProperties: () => Promise<void>;
  batchCheckLikes: (propertyIds: number[]) => Promise<void>;
}

// Combined type for backwards compatibility
interface LikedPropertiesContextType extends LikedPropertiesStateType, LikedPropertiesActionsType {}

const LikedPropertiesStateContext = createContext<LikedPropertiesStateType | undefined>(undefined);
const LikedPropertiesActionsContext = createContext<LikedPropertiesActionsType | undefined>(undefined);

// Legacy context for backwards compatibility
const LikedPropertiesContext = createContext<LikedPropertiesContextType | undefined>(undefined);

export function LikedPropertiesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  // Don't initialize from cache - always fetch fresh to prevent user data leakage
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const lastRefreshRef = useRef<number>(0);

  // Ref-based state for synchronous access in stable callbacks
  const likedIdsRef = useRef(likedIds);
  likedIdsRef.current = likedIds;
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;
  const hasFetchedRef = useRef(hasFetched);
  hasFetchedRef.current = hasFetched;

  // Fetch all liked property IDs on mount when authenticated (with throttling)
  const refreshLikedProperties = useCallback(async () => {
    if (!isAuthenticatedRef.current) {
      setLikedIds(new Set());
      return;
    }

    // Throttle: skip if we refreshed recently
    const now = Date.now();
    if (hasFetchedRef.current && now - lastRefreshRef.current < REFRESH_THROTTLE_MS) {
      return;
    }

    try {
      setIsLoading(true);
      lastRefreshRef.current = now;

      try {
        const response = await api.get("/api/likedproperties/ids");
        const ids = response.data as number[];
        setLikedIds(new Set(ids));
      } catch (idsError: any) {
        const response = await api.get("/api/likedproperties");
        const ids = response.data.map((item: any) => item.id);
        setLikedIds(new Set(ids));
      }

      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching liked properties:", error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps - uses refs

  // Fetch liked properties when auth state changes
  useEffect(() => {
    if (isAuthenticated && !hasFetched) {
      refreshLikedProperties();
    } else if (!isAuthenticated) {
      setLikedIds(new Set());
      setHasFetched(false);
    }
  }, [isAuthenticated, hasFetched, refreshLikedProperties]);

  // Check if a property is liked (instant, no API call, stable function)
  const isLiked = useCallback(
    (propertyId: number): boolean => {
      return likedIdsRef.current.has(propertyId);
    },
    [], // Empty deps - uses ref
  );

  // Batch check likes for multiple properties (for initial load optimization)
  const batchCheckLikes = useCallback(
    async (propertyIds: number[]) => {
      if (!isAuthenticatedRef.current || propertyIds.length === 0) return;

      // If we already have the full list, no need to check
      if (hasFetchedRef.current) return;

      // Just trigger a full refresh using the lightweight endpoint
      await refreshLikedProperties();
    },
    [refreshLikedProperties],
  );

  // Toggle like status (optimistic update with stable reference)
  const toggleLike = useCallback(
    async (propertyId: number): Promise<boolean> => {
      if (!isAuthenticatedRef.current) return false;

      const wasLiked = likedIdsRef.current.has(propertyId);
      const newLikedState = !wasLiked;

      // Haptic feedback
      if (newLikedState) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Optimistic update
      setLikedIds((prev) => {
        const newSet = new Set(prev);
        if (newLikedState) {
          newSet.add(propertyId);
        } else {
          newSet.delete(propertyId);
        }
        return newSet;
      });

      try {
        if (wasLiked) {
          await api.delete(`/api/likedproperties/${propertyId}`);
        } else {
          await api.post(`/api/likedproperties/${propertyId}`);
        }
        return newLikedState;
      } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Revert on error using functional update
        setLikedIds((prev) => {
          const newSet = new Set(prev);
          if (wasLiked) {
            newSet.add(propertyId);
          } else {
            newSet.delete(propertyId);
          }
          return newSet;
        });

        if (error.response?.status === 404) {
          setLikedIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(propertyId);
            return newSet;
          });
        }
        throw error;
      }
    },
    [], // Empty deps - uses refs
  );

  // PERFORMANCE: Separate state and actions into different context values
  // State changes frequently, actions are stable
  const stateValue = useMemo(
    () => ({
      likedIds,
      isLoading,
    }),
    [likedIds, isLoading],
  );

  const actionsValue = useMemo(
    () => ({
      isLiked,
      toggleLike,
      refreshLikedProperties,
      batchCheckLikes,
    }),
    [isLiked, toggleLike, refreshLikedProperties, batchCheckLikes],
  );

  // Legacy combined value for backwards compatibility
  const combinedValue = useMemo(
    () => ({
      ...stateValue,
      ...actionsValue,
    }),
    [stateValue, actionsValue],
  );

  return (
    <LikedPropertiesActionsContext.Provider value={actionsValue}>
      <LikedPropertiesStateContext.Provider value={stateValue}>
        <LikedPropertiesContext.Provider value={combinedValue}>
          {children}
        </LikedPropertiesContext.Provider>
      </LikedPropertiesStateContext.Provider>
    </LikedPropertiesActionsContext.Provider>
  );
}

// PERFORMANCE: New hooks for selective subscription
// Use these to avoid unnecessary re-renders

// Only subscribes to state changes (likedIds, isLoading)
export function useLikedPropertiesState() {
  const context = useContext(LikedPropertiesStateContext);
  if (context === undefined) {
    throw new Error(
      "useLikedPropertiesState must be used within a LikedPropertiesProvider",
    );
  }
  return context;
}

// Only gets actions (never causes re-renders)
export function useLikedPropertiesActions() {
  const context = useContext(LikedPropertiesActionsContext);
  if (context === undefined) {
    throw new Error(
      "useLikedPropertiesActions must be used within a LikedPropertiesProvider",
    );
  }
  return context;
}

// Legacy hook for backwards compatibility (subscribes to everything)
export function useLikedProperties() {
  const context = useContext(LikedPropertiesContext);
  if (context === undefined) {
    throw new Error(
      "useLikedProperties must be used within a LikedPropertiesProvider",
    );
  }
  return context;
}
