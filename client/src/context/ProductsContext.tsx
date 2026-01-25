import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product } from '../types';
import api from '../utils/api';
import { PERFORMANCE_CONFIG, shouldUseCache, getCachedData, setCachedData } from '../performance.config';
import { limitArraySize, clearLargeCache } from '../utils/memoryOptimizer';

interface ProductsContextType {
  products: Product[];
  displayedProducts: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (force?: boolean) => Promise<void>;
  refreshProducts: () => Promise<void>;
  clearCache: () => void;
  lastFetch: number | null;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  useEffect(() => {
    const cached = getCachedData<Product[]>('products_cache');
    const cacheTime = sessionStorage.getItem('products_cache_time');
    
    if (cached && cached.length > 0) {
      if (import.meta.env.DEV) {
        console.log('⚡ Instant load from cache:', cached.length, 'products');
      }
      // Limit size to prevent memory issues
      const limited = limitArraySize(cached, 2000);
      setProducts(limited);
      setDisplayedProducts(limited.slice(0, 100));
      setLastFetch(cacheTime ? parseInt(cacheTime) : Date.now());
      
      // Load rest instantly (no delay!)
      requestAnimationFrame(() => {
        setDisplayedProducts(limited);
      });
      
      // Check if cache is valid
      if (cacheTime && shouldUseCache(cacheTime, PERFORMANCE_CONFIG.PRODUCTS_CACHE_TIME)) {
        return; // Cache is fresh, don't fetch
      }
    }
    
    // No cache or expired - fetch in background only if token exists
    const token = localStorage.getItem('token');
    if (token) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = useCallback(async (force = false) => {
    // Don't fetch if we have recent data and not forcing
    if (!force && lastFetch) {
      const timeSinceLastFetch = Date.now() - lastFetch;
      if (timeSinceLastFetch < PERFORMANCE_CONFIG.PRODUCTS_CACHE_TIME) {
        console.log('⏭️ Skipping fetch - using cached data');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      if (import.meta.env.DEV) {
        console.log('🔄 Fetching products...');
      }
      const startTime = Date.now();
      const res = await api.get('/products?warehouse=Asosiy ombor');
      const endTime = Date.now();
      if (import.meta.env.DEV) {
        console.log(`✅ Loaded in ${endTime - startTime}ms`);
      }
      
      // Limit size to prevent memory issues
      const productsData = limitArraySize(res.data, 2000) as Product[];
      
      // Update state IMMEDIATELY
      setProducts(productsData);
      setDisplayedProducts(productsData.slice(0, 100));
      setLastFetch(Date.now());
      
      // Cache the results (limit cache size)
      try {
        setCachedData('products_cache', productsData);
      } catch (err) {
        console.warn('Cache too large, clearing old data');
        clearLargeCache();
        setCachedData('products_cache', productsData);
      }
      
      // Load rest instantly
      requestAnimationFrame(() => {
        setDisplayedProducts(productsData);
      });
      
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Mahsulotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [lastFetch]);

  const refreshProducts = useCallback(async () => {
    await fetchProducts(true);
  }, [fetchProducts]);

  const clearCache = useCallback(() => {
    sessionStorage.removeItem('products_cache');
    sessionStorage.removeItem('products_cache_time');
    setProducts([]);
    setDisplayedProducts([]);
    setLastFetch(null);
  }, []);

  const value: ProductsContextType = {
    products,
    displayedProducts,
    loading,
    error,
    fetchProducts,
    refreshProducts,
    clearCache,
    lastFetch
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
