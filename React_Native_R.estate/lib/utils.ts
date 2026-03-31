/**
 * High-performance currency formatter using string manipulation.
 * Avoids the massive overhead of Intl.NumberFormat on Android.
 */
export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "$0";
  }

  // Round to nearest integer for property prices
  const rounded = Math.round(amount);
  
  // Format with commas: 1234567 -> 1,234,567
  const parts = rounded.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return "$" + parts[0];
}

/**
 * Short price formatter for charts (e.g., 150000 -> 150k)
 */
export function formatPriceShort(price: number): string {
  if (!price || isNaN(price)) return "0";
  
  if (price >= 1000000) {
    return (price / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (price >= 1000) {
    return (price / 1000).toFixed(0) + "k";
  }
  return price.toString();
}

/**
 * Throttling helper for high-frequency updates
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
