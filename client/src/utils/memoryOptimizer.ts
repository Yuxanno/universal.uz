// Memory optimization utilities

// Limit array size to prevent memory leaks
export const limitArraySize = <T>(array: T[], maxSize: number = 1000): T[] => {
 if (array.length > maxSize) {
 console.warn(`Array size ${array.length} exceeds limit ${maxSize}, truncating`);
 return array.slice(0, maxSize);
 }
 return array;
};

// Clear large objects from memory
export const clearLargeCache = () => {
 try {
 // Clear old caches
 const keys = Object.keys(sessionStorage);
 keys.forEach(key => {
 const item = sessionStorage.getItem(key);
 if (item && item.length > 500000) { // > 500KB
 console.warn(`Removing large cache: ${key} (${(item.length / 1024).toFixed(2)}KB)`);
 sessionStorage.removeItem(key);
 }
 });
 } catch (err) {
 console.error('Error clearing cache:', err);
 }
};

// Debounce with cleanup
export const createDebounce = <T extends (...args: any[]) => any>(
 func: T,
 delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
 let timeoutId: NodeJS.Timeout | null = null;
 
 const debounced = (...args: Parameters<T>) => {
 if (timeoutId) clearTimeout(timeoutId);
 timeoutId = setTimeout(() => func(...args), delay);
 };
 
 debounced.cancel = () => {
 if (timeoutId) {
 clearTimeout(timeoutId);
 timeoutId = null;
 }
 };
 
 return debounced;
};

// Monitor memory usage
export const monitorMemory = () => {
 if ('memory' in performance) {
 const memory = (performance as any).memory;
 const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
 const total = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
 const limit = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
 
 console.log(`Memory: ${used}MB / ${total}MB (Limit: ${limit}MB)`);
 
 // Warning if using > 500MB
 if (memory.usedJSHeapSize > 500 * 1024 * 1024) {
 console.warn('⚠️ High memory usage detected!');
 clearLargeCache();
 }
 }
};

// Auto cleanup on interval
let cleanupInterval: NodeJS.Timeout | null = null;

export const startMemoryMonitoring = () => {
 if (cleanupInterval) return;
 
 cleanupInterval = setInterval(() => {
 monitorMemory();
 }, 30000); // Every 30 seconds
};

export const stopMemoryMonitoring = () => {
 if (cleanupInterval) {
 clearInterval(cleanupInterval);
 cleanupInterval = null;
 }
};
