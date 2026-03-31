import { InteractionManager } from "react-native";
import { Image as ExpoImage } from "expo-image";

// Queue for image prefetching to avoid overwhelming the network
let prefetchQueue: string[] = [];
let isPrefetching = false;
const BATCH_SIZE = 5;
const BATCH_DELAY = 100; // ms between batches

// Prefetch a single image using ExpoImage for consistency
async function prefetchImage(uri: string): Promise<boolean> {
  if (!uri || typeof uri !== "string") return false;

  try {
    // ExpoImage prefetch handles memory and disk caching efficiently
    await ExpoImage.prefetch(uri);
    return true;
  } catch {
    // Silently fail - image will load normally when viewed
    return false;
  }
}

// Process the prefetch queue in batches when interactions are idle
async function processQueue() {
  if (isPrefetching || prefetchQueue.length === 0) return;

  isPrefetching = true;

  while (prefetchQueue.length > 0) {
    const batch = prefetchQueue.splice(0, BATCH_SIZE);
    
    // Use InteractionManager to ensure we don't block the UI thread during prefetch
    await new Promise(resolve => {
      InteractionManager.runAfterInteractions(async () => {
        await Promise.allSettled(batch.map(prefetchImage));
        resolve(null);
      });
    });

    // Small delay between batches to not overwhelm
    if (prefetchQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  isPrefetching = false;
}

// Add images to prefetch queue (deduped)
export function queueImagePrefetch(uris: string[]) {
  const validUris = uris.filter(uri => uri && typeof uri === "string");
  const newUris = validUris.filter(uri => !prefetchQueue.includes(uri));

  if (newUris.length > 0) {
    prefetchQueue.push(...newUris);
    // Start processing after current interactions finish
    InteractionManager.runAfterInteractions(() => {
      processQueue();
    });
  }
}

// Prefetch images from properties array (first image of each)
export function prefetchPropertyImages(properties: Array<{ images?: string[] }>) {
  if (!properties || !Array.isArray(properties)) return;

  const imageUris = properties
    .map(p => p.images?.[0])
    .filter((uri): uri is string => !!uri);

  queueImagePrefetch(imageUris);
}

// Prefetch all images from a single property (for detail view)
export function prefetchAllPropertyImages(property: { images?: string[] }) {
  if (!property?.images) return;
  queueImagePrefetch(property.images);
}

// Clear the prefetch queue (useful when navigating away)
export function clearPrefetchQueue() {
  prefetchQueue = [];
}

// Preload with priority (immediately, bypassing queue)
export async function prefetchImmediate(uri: string): Promise<boolean> {
  return prefetchImage(uri);
}

// Get current queue size (for debugging)
export function getPrefetchQueueSize(): number {
  return prefetchQueue.length;
}
