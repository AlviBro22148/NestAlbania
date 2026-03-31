import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/lib/axios-config";

// Throttle refresh to prevent API calls during rapid navigation
const REFRESH_THROTTLE_MS = 30000; // 30 seconds

// User Preference type definition
export interface UserPreference {
  id?: number;
  userId?: string;
  preferredPropertyTypes: string[];
  minBedrooms?: number | null;
  maxBedrooms?: number | null;
  minBathrooms?: number | null;
  maxBathrooms?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
  preferredCities: string[];
  listingType?: string | null;
  wantsGarage?: boolean | null;
  wantsPetFriendly?: boolean | null;
  wantsPool?: boolean | null;
  wantsGym?: boolean | null;
  wantsAirConditioning?: boolean | null;
  prefersGreenHomes?: boolean | null;
  minEcoScore?: number | null;
  createdAt?: string;
  updatedAt?: string | null;
  hasPreferences: boolean;
}

// Default empty preferences
const defaultPreferences: UserPreference = {
  preferredPropertyTypes: [],
  preferredCities: [],
  hasPreferences: false,
};

const PREFERENCES_CACHE_KEY = "@user_preferences";

/**
 * Hook to manage user preferences
 * Uses AsyncStorage for caching and API for persistence
 * No context provider needed - avoids navigation context issues
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreference>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const lastRefreshRef = useRef<number>(0);
  const hasFetchedRef = useRef(false);

  // Load preferences from cache on mount
  useEffect(() => {
    loadFromCache();
  }, []);

  // Load from AsyncStorage cache
  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(PREFERENCES_CACHE_KEY);
      if (cached) {
        setPreferences(JSON.parse(cached));
      }
    } catch (error) {
      console.error("Error loading preferences from cache:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save to AsyncStorage cache
  const saveToCache = async (prefs: UserPreference) => {
    try {
      await AsyncStorage.setItem(PREFERENCES_CACHE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error("Error saving preferences to cache:", error);
    }
  };

  // Fetch preferences from API (with throttling)
  const fetchPreferences = useCallback(async (force = false) => {
    // Throttle: skip if we refreshed recently (unless forced)
    const now = Date.now();
    if (!force && hasFetchedRef.current && now - lastRefreshRef.current < REFRESH_THROTTLE_MS) {
      return preferences;
    }

    setLoading(true);
    try {
      lastRefreshRef.current = now;
      const response = await api.get("/api/auth/preferences");
      const data = response.data;

      const prefs: UserPreference = {
        id: data.id,
        userId: data.userId,
        preferredPropertyTypes: data.preferredPropertyTypes || [],
        minBedrooms: data.minBedrooms,
        maxBedrooms: data.maxBedrooms,
        minBathrooms: data.minBathrooms,
        maxBathrooms: data.maxBathrooms,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        minArea: data.minArea,
        maxArea: data.maxArea,
        preferredCities: data.preferredCities || [],
        listingType: data.listingType,
        wantsGarage: data.wantsGarage,
        wantsPetFriendly: data.wantsPetFriendly,
        wantsPool: data.wantsPool,
        wantsGym: data.wantsGym,
        wantsAirConditioning: data.wantsAirConditioning,
        prefersGreenHomes: data.prefersGreenHomes,
        minEcoScore: data.minEcoScore,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        hasPreferences: data.hasPreferences,
      };

      setPreferences(prefs);
      await saveToCache(prefs);
      hasFetchedRef.current = true;
      return prefs;
    } catch (error) {
      console.error("Error fetching preferences:", error);
      return preferences;
    } finally {
      setLoading(false);
    }
  }, [preferences]);

  // Save preferences to API
  const savePreferences = useCallback(async (prefs: Partial<UserPreference>) => {
    setSaving(true);
    try {
      await api.post("/api/auth/preferences", {
        preferredPropertyTypes: prefs.preferredPropertyTypes || [],
        minBedrooms: prefs.minBedrooms,
        maxBedrooms: prefs.maxBedrooms,
        minBathrooms: prefs.minBathrooms,
        maxBathrooms: prefs.maxBathrooms,
        minPrice: prefs.minPrice,
        maxPrice: prefs.maxPrice,
        minArea: prefs.minArea,
        maxArea: prefs.maxArea,
        preferredCities: prefs.preferredCities || [],
        listingType: prefs.listingType,
        wantsGarage: prefs.wantsGarage,
        wantsPetFriendly: prefs.wantsPetFriendly,
        wantsPool: prefs.wantsPool,
        wantsGym: prefs.wantsGym,
        wantsAirConditioning: prefs.wantsAirConditioning,
        prefersGreenHomes: prefs.prefersGreenHomes,
        minEcoScore: prefs.minEcoScore,
      });

      // Force refresh preferences after saving (bypass throttle)
      await fetchPreferences(true);
      return true;
    } catch (error) {
      console.error("Error saving preferences:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [fetchPreferences]);

  // Clear preferences
  const clearPreferences = useCallback(async () => {
    setSaving(true);
    try {
      await api.delete("/api/auth/preferences");
      setPreferences(defaultPreferences);
      await AsyncStorage.removeItem(PREFERENCES_CACHE_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing preferences:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  // Clear cache (used on logout)
  const clearCache = useCallback(async () => {
    setPreferences(defaultPreferences);
    await AsyncStorage.removeItem(PREFERENCES_CACHE_KEY);
  }, []);

  return {
    preferences,
    loading,
    saving,
    hasPreferences: preferences.hasPreferences,
    fetchPreferences,
    savePreferences,
    clearPreferences,
    clearCache,
  };
};

export default useUserPreferences;
