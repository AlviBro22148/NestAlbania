/**
 * Nearby Places Service using OpenStreetMap Overpass API (FREE)
 * Optimized for speed and reliability
 */

export interface NearbyPlace {
  id: string;
  name: string;
  category: ServiceCategory;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website: string;
  description: string;
  latitude: number;
  longitude: number;
  rating: number;
  distance: number;
  openingHours?: string;
}

export type ServiceCategory =
  | "Schools"
  | "Hospitals"
  | "Transportation"
  | "Shopping"
  | "Restaurants";

// Simple in-memory cache
interface CacheEntry {
  data: NearbyPlace[];
  timestamp: number;
  location: { lat: number; lon: number };
}

const cache: Map<string, CacheEntry> = new Map();
const CACHE_DURATION = 5 * 60 * 1000;
const CACHE_DISTANCE_THRESHOLD = 0.5;

// Optimized queries - single combined query for speed
const CATEGORY_QUERIES: Record<ServiceCategory, string> = {
  Restaurants: `node["amenity"~"restaurant|cafe|fast_food"](around:RADIUS,LAT,LON);`,
  Shopping: `node["shop"~"supermarket|mall|convenience"](around:RADIUS,LAT,LON);`,
  Hospitals: `node["amenity"~"hospital|clinic|pharmacy"](around:RADIUS,LAT,LON);`,
  Transportation: `node["highway"="bus_stop"](around:RADIUS,LAT,LON);node["amenity"="fuel"](around:RADIUS,LAT,LON);`,
  Schools: `node["amenity"~"school|university"](around:RADIUS,LAT,LON);`,
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  school: "School",
  university: "University",
  hospital: "Hospital",
  clinic: "Clinic",
  pharmacy: "Pharmacy",
  bus_stop: "Bus Stop",
  fuel: "Gas Station",
  supermarket: "Supermarket",
  mall: "Mall",
  convenience: "Store",
  restaurant: "Restaurant",
  cafe: "Cafe",
  fast_food: "Fast Food",
};

// Multiple endpoints for reliability - ordered by speed/reliability
const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCacheKey(category: ServiceCategory, radius: number): string {
  return `${category}-${radius}`;
}

function isCacheValid(entry: CacheEntry, userLat: number, userLon: number): boolean {
  const isRecent = Date.now() - entry.timestamp < CACHE_DURATION;
  const distance = calculateDistance(entry.location.lat, entry.location.lon, userLat, userLon);
  return isRecent && distance < CACHE_DISTANCE_THRESHOLD;
}

function parseOSMElement(element: any, category: ServiceCategory, userLat: number, userLon: number): NearbyPlace | null {
  const tags = element.tags || {};
  const lat = element.lat || element.center?.lat;
  const lon = element.lon || element.center?.lon;

  if (!lat || !lon) return null;

  const name = tags.name || tags["name:en"] || tags["name:sq"];
  if (!name) return null;

  const amenityType = tags.amenity || tags.shop || tags.highway || "";

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    category,
    address: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || "Address not available",
    city: tags["addr:city"] || tags["addr:suburb"] || "",
    state: tags["addr:state"] || "",
    zipCode: tags["addr:postcode"] || "",
    phone: (tags.phone || tags["contact:phone"] || "").replace(/\s+/g, ""),
    website: tags.website ? (tags.website.startsWith("http") ? tags.website : `https://${tags.website}`) : "",
    description: TYPE_DESCRIPTIONS[amenityType] || category,
    latitude: lat,
    longitude: lon,
    rating: 0,
    distance: calculateDistance(userLat, userLon, lat, lon),
    openingHours: tags.opening_hours,
  };
}

/**
 * Fetch with timeout - shorter timeout for faster fallback
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 6000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Try fetching from multiple endpoints with fast fallback
 */
async function fetchFromEndpoints(query: string): Promise<any> {
  const errors: string[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
        },
        6000 // 6 second timeout per endpoint
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      errors.push(`${endpoint}: ${response.status}`);
    } catch (error: any) {
      errors.push(`${endpoint}: ${error.message}`);
      // Continue to next endpoint immediately
    }
  }

  throw new Error(`All endpoints failed: ${errors.join(", ")}`);
}

/**
 * Fetch a single category with retry
 */
async function fetchCategoryWithRetry(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  category: ServiceCategory,
  retries: number = 2
): Promise<NearbyPlace[]> {
  // Check cache first
  const cacheKey = getCacheKey(category, radiusMeters);
  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached, latitude, longitude)) {
    return cached.data;
  }

  const queryTemplate = CATEGORY_QUERIES[category];
  const query = queryTemplate
    .replace(/RADIUS/g, radiusMeters.toString())
    .replace(/LAT/g, latitude.toString())
    .replace(/LON/g, longitude.toString());

  const fullQuery = `[out:json][timeout:8];(${query});out body;`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fetchFromEndpoints(fullQuery);

      const places: NearbyPlace[] = [];
      for (const element of data.elements || []) {
        const place = parseOSMElement(element, category, latitude, longitude);
        if (place) places.push(place);
      }

      places.sort((a, b) => a.distance - b.distance);

      // Cache the results
      cache.set(cacheKey, {
        data: places,
        timestamp: Date.now(),
        location: { lat: latitude, lon: longitude },
      });

      return places;
    } catch (error) {
        return [];
      // Wait a bit before retry
      await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }

  return [];
}

/**
 * Fetch all categories in parallel with guaranteed completion
 */
export async function fetchAllNearbyPlacesProgressive(
  latitude: number,
  longitude: number,
  radiusKm: number,
  onCategoryLoaded: (category: ServiceCategory, places: NearbyPlace[]) => void
): Promise<void> {
  const radiusMeters = Math.min(radiusKm * 1000, 8000);

  const categories: ServiceCategory[] = [
    "Restaurants",
    "Shopping",
    "Transportation",
    "Hospitals",
    "Schools",
  ];

  // Create promises for all categories
  const fetchPromises = categories.map(async (category) => {
    try {
      const places = await fetchCategoryWithRetry(latitude, longitude, radiusMeters, category, 2);
      onCategoryLoaded(category, places);
      return { category, success: true, count: places.length };
    } catch (error) {
      onCategoryLoaded(category, []);
      return { category, success: false, count: 0 };
    }
  });

  // Wait for all to complete (with individual timeouts already handled)
  const results = await Promise.allSettled(fetchPromises);

  // All categories handled
}

/**
 * Quick fetch - returns cached data immediately if available
 */
export function getCachedPlaces(
  latitude: number,
  longitude: number,
  radiusKm: number
): NearbyPlace[] | null {
  const radiusMeters = Math.min(radiusKm * 1000, 8000);
  const allPlaces: NearbyPlace[] = [];
  const categories: ServiceCategory[] = ["Restaurants", "Shopping", "Transportation", "Hospitals", "Schools"];

  let hasValidCache = false;
  for (const category of categories) {
    const cacheKey = getCacheKey(category, radiusMeters);
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached, latitude, longitude)) {
      allPlaces.push(...cached.data);
      hasValidCache = true;
    }
  }

  if (hasValidCache) {
    allPlaces.sort((a, b) => a.distance - b.distance);
    return allPlaces;
  }

  return null;
}

/**
 * Clear cache (call when user manually refreshes)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Reverse geocode - with caching
 */
let lastGeocode: { lat: number; lon: number; result: any; timestamp: number } | null = null;

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ city: string; country: string; displayName: string } | null> {
  if (lastGeocode) {
    const dist = calculateDistance(lastGeocode.lat, lastGeocode.lon, latitude, longitude);
    if (dist < 1 && Date.now() - lastGeocode.timestamp < 10 * 60 * 1000) {
      return lastGeocode.result;
    }
  }

  try {
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { headers: { "User-Agent": "NestAlbaniaApp/1.0" } },
      5000
    );

    if (!response.ok) return null;

    const data = await response.json();
    const result = {
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || "",
      country: data.address?.country || "",
      displayName: data.display_name || "",
    };

    lastGeocode = { lat: latitude, lon: longitude, result, timestamp: Date.now() };
    return result;
  } catch {
    return null;
  }
}
