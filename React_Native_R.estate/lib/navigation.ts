// Navigation utilities
// This file is kept minimal to avoid navigation context issues

import { router } from "expo-router";

/**
 * Safe navigation wrapper - uses router directly
 * Navigation should only be called from within the navigation context
 */
export const safeNavigate = (path: string, method: "replace" | "push" = "replace") => {
  try {
    if (method === "replace") {
      router.replace(path as any);
    } else {
      router.push(path as any);
    }
  } catch (error) {
    console.warn("Navigation failed:", error);
  }
};

/**
 * Safe replace - convenience wrapper
 */
export const safeReplace = (path: string) => safeNavigate(path, "replace");

/**
 * Safe push - convenience wrapper
 */
export const safePush = (path: string) => safeNavigate(path, "push");
