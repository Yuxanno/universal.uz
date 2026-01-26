// PERFORMANCE CONFIGURATION

export const PERFORMANCE_CONFIG = {
 // Pagination
 INITIAL_LOAD: 100, // Load first 100 items immediately
 ITEMS_PER_PAGE: 50,
 MAX_SEARCH_RESULTS: 50,
 MAX_PRODUCTS: 2000, // Limit to prevent memory issues
 
 // Debounce times (ms) - REDUCED for instant feel
 SEARCH_DEBOUNCE: 150, // Reduced from 300ms
 INPUT_DEBOUNCE: 100, // Reduced from 200ms
 
 // Cache times (ms)
 PRODUCTS_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
 CUSTOMERS_CACHE_TIME: 10 * 60 * 1000, // 10 minutes
 
 // Virtual scrolling
 ROW_HEIGHT: 80,
 OVERSCAN_COUNT: 3, // Reduced from 5
 
 // Background loading delay (ms) - INSTANT!
 BACKGROUND_LOAD_DELAY: 0, // Instant! (was 500ms)
 
 // Image optimization
 IMAGE_LAZY_LOAD: true,
 IMAGE_QUALITY: 80,
 
 // Animation durations (ms) - INSTANT!
 ANIMATION_FAST: 50, // Reduced from 150ms
 ANIMATION_NORMAL: 100, // Reduced from 300ms
 
 // Features
 ENABLE_BACKDROP_BLUR: false, // Very expensive!
 ENABLE_COMPLEX_GRADIENTS: false,
 ENABLE_SHADOWS: true,
 ENABLE_TRANSITIONS: true,
 
 // Memory management
 MEMORY_WARNING_THRESHOLD: 500 * 1024 * 1024, // 500MB
 CACHE_SIZE_LIMIT: 500000, // 500KB per cache item
};

// Helper functions
export const shouldUseCache = (cacheTime: string | null, maxAge: number): boolean => {
 if (!cacheTime) return false;
 const now = Date.now();
 const cached = parseInt(cacheTime);
 return (now - cached) < maxAge;
};

export const getCachedData = <T>(key: string): T | null => {
 try {
 const data = sessionStorage.getItem(key);
 return data ? JSON.parse(data) : null;
 } catch {
 return null;
 }
};

export const setCachedData = <T>(key: string, data: T): void => {
 try {
 sessionStorage.setItem(key, JSON.stringify(data));
 sessionStorage.setItem(`${key}_time`, Date.now().toString());
 } catch (err) {
 console.warn('Cache storage failed:', err);
 }
};

export const clearCache = (key?: string): void => {
 if (key) {
 sessionStorage.removeItem(key);
 sessionStorage.removeItem(`${key}_time`);
 } else {
 sessionStorage.clear();
 }
};

// Chunk array for progressive loading
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
 const chunks: T[][] = [];
 for (let i = 0; i < array.length; i += chunkSize) {
 chunks.push(array.slice(i, i + chunkSize));
 }
 return chunks;
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
 func: T,
 delay: number
): ((...args: Parameters<T>) => void) => {
 let timeoutId: NodeJS.Timeout | null = null;
 let lastRan = 0;
 
 return (...args: Parameters<T>) => {
 const now = Date.now();
 
 if (now - lastRan >= delay) {
 func(...args);
 lastRan = now;
 } else {
 if (timeoutId) clearTimeout(timeoutId);
 timeoutId = setTimeout(() => {
 func(...args);
 lastRan = Date.now();
 }, delay - (now - lastRan));
 }
 };
};
