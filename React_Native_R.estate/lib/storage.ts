import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage interface for consistency between MMKV and AsyncStorage
interface StorageAdapter {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  contains(key: string): boolean;
}

// In-memory cache for AsyncStorage fallback (keeps API synchronous)
const memoryCache: Record<string, string> = {};
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// AsyncStorage adapter with in-memory cache for synchronous reads
const asyncStorageAdapter: StorageAdapter = {
  getString(key: string): string | undefined {
    return memoryCache[key];
  },
  set(key: string, value: string): void {
    memoryCache[key] = value;
    // Persist to AsyncStorage in background
    AsyncStorage.setItem(key, value).catch(() => {});
  },
  delete(key: string): void {
    delete memoryCache[key];
    AsyncStorage.removeItem(key).catch(() => {});
  },
  contains(key: string): boolean {
    return key in memoryCache;
  },
};

// Try to use MMKV, fall back to AsyncStorage adapter
let storage: StorageAdapter;
let usingMMKV = false;

try {
  // Paranoid MMKV loading - handles all known export styles (CJS, ESM, Nitro)
  const mmkvModule = require('react-native-mmkv');
  let MMKVClass = mmkvModule.MMKV;
  if (!MMKVClass && mmkvModule.default) {
    MMKVClass = mmkvModule.default.MMKV || mmkvModule.default;
  }
  
  // If we still don't have it, try a direct native access check as a last resort
  const globalAny = global as any;
  if (!MMKVClass && typeof globalAny.MMKV !== 'undefined') {
    MMKVClass = globalAny.MMKV;
  }

  if (typeof MMKVClass === 'function') {
    storage = new MMKVClass({ id: 'auth-storage' });
    usingMMKV = true;
    console.log('[Storage] Using MMKV (Verified)');
  } else {
    throw new Error('MMKV class not found in module exports');
  }
} catch (error: any) {
  console.log(`[Storage] MMKV fallback: ${error.message || 'Module not found'}`);
  storage = asyncStorageAdapter;
}

// Initialize AsyncStorage cache (call this early in app lifecycle)
export const initializeStorage = async (): Promise<void> => {
  if (usingMMKV) return;
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const keys = [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USER_ID, STORAGE_KEYS.PUSH_TOKEN, STORAGE_KEYS.HAS_SEEN_ONBOARDING, STORAGE_KEYS.THEME_PREFERENCE];
      const pairs = await AsyncStorage.multiGet(keys);
      let loadedCount = 0;
      pairs.forEach(([key, value]) => {
        if (value !== null) {
          memoryCache[key] = value;
          loadedCount++;
        }
      });
      isInitialized = true;
      console.log(`[Storage] AsyncStorage initialized, loaded ${loadedCount} keys`);
    } catch (error) {
      console.warn('[Storage] Failed to initialize from AsyncStorage:', error);
      isInitialized = true; // Still mark as initialized to prevent blocking
    }
  })();

  return initPromise;
};

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
  PUSH_TOKEN: 'pushToken',
  HAS_SEEN_ONBOARDING: 'hasSeenOnboarding',
  THEME_PREFERENCE: 'themePreference',
} as const;

// Typed helper functions for auth tokens
export const authStorage = {
  // Get tokens (synchronous - fast!)
  getAccessToken: (): string | undefined => {
    return storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: (): string | undefined => {
    return storage.getString(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getUserId: (): string | undefined => {
    return storage.getString(STORAGE_KEYS.USER_ID);
  },

  // Set tokens
  setAccessToken: (token: string): void => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  setRefreshToken: (token: string): void => {
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  setUserId: (userId: string): void => {
    storage.set(STORAGE_KEYS.USER_ID, userId);
  },

  // Set all tokens at once
  setTokens: (accessToken: string, refreshToken: string, userId?: string): void => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (userId) {
      storage.set(STORAGE_KEYS.USER_ID, userId);
    }
  },

  // Clear all auth data (for logout)
  clearAll: (): void => {
    storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
    storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
    storage.delete(STORAGE_KEYS.USER_ID);
  },

  // Check if user has tokens
  hasTokens: (): boolean => {
    return storage.contains(STORAGE_KEYS.ACCESS_TOKEN) &&
           storage.contains(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // Push token management
  getPushToken: (): string | undefined => {
    return storage.getString(STORAGE_KEYS.PUSH_TOKEN);
  },

  setPushToken: (token: string): void => {
    storage.set(STORAGE_KEYS.PUSH_TOKEN, token);
  },

  clearPushToken: (): void => {
    storage.delete(STORAGE_KEYS.PUSH_TOKEN);
  },
};

// Onboarding storage helpers
export const onboardingStorage = {
  hasSeenOnboarding: (): boolean => {
    return storage.getString(STORAGE_KEYS.HAS_SEEN_ONBOARDING) === 'true';
  },

  setOnboardingComplete: (): void => {
    storage.set(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
  },

  resetOnboarding: (): void => {
    storage.delete(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
  },
};

// Theme storage helpers
export type ThemePreference = 'light' | 'dark' | 'system';

export const themeStorage = {
  getTheme: (): ThemePreference => {
    const theme = storage.getString(STORAGE_KEYS.THEME_PREFERENCE);
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      return theme;
    }
    return 'system';
  },

  setTheme: (theme: ThemePreference): void => {
    storage.set(STORAGE_KEYS.THEME_PREFERENCE, theme);
  },
};

// Export for backward compatibility
export { storage };
