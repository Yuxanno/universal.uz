import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product } from '../types';
import api from '../utils/api';
import { PERFORMANCE_CONFIG, shouldUseCache, getCachedData, setCachedData } from '../performance.config';
import { clearLargeCache } from '../utils/memoryOptimizer';
import { getSocket } from '../utils/socket';

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
 // ОПТИМИЗАЦИЯ: Показываем все товары сразу из кеша
 setProducts(cached);
 setDisplayedProducts(cached);
 setLastFetch(cacheTime ? parseInt(cacheTime) : Date.now());
 
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
 console.log('🔄 Fetching products from WarehouseInventory...');
 }
 const startTime = Date.now();
 
 // Get main warehouse first
 const warehousesRes = await api.get('/warehouses');
 const mainWarehouse = warehousesRes.data.find((w: any) => w.name === 'Asosiy ombor');
 
 if (!mainWarehouse) {
 throw new Error('Main warehouse not found');
 }
 
 // Fetch from WarehouseInventory instead of Product model
 const res = await api.get(`/inventory/warehouse/${mainWarehouse._id}`);
 const endTime = Date.now();
 if (import.meta.env.DEV) {
 console.log(`✅ Loaded ${res.data.length} products from inventory in ${endTime - startTime}ms`);
 }
 
 // Map inventory data to product format
 const productsData = res.data.map((inv: any) => ({
 ...inv.product,
 quantity: inv.quantity,
 minStock: inv.minStock,
 _inventoryId: inv._id,
 _warehouseId: mainWarehouse._id
 })) as Product[];
 
 // Update state IMMEDIATELY
 setProducts(productsData);
 setDisplayedProducts(productsData);
 setLastFetch(Date.now());
 
 // Cache the results
 try {
 setCachedData('products_cache', productsData);
 } catch (err) {
 console.warn('Cache too large, clearing old data');
 clearLargeCache();
 setCachedData('products_cache', productsData);
 }
 
 } catch (err: any) {
 console.error('Error fetching products:', err);
 setError(err.response?.data?.message || 'Mahsulotlarni yuklashda xatolik');
 } finally {
 setLoading(false);
 }
 }, [lastFetch]);

 // Socket.IO real-time updates for ProductsContext
 useEffect(() => {
 const socket = getSocket();
 if (!socket) {
 console.log('⚠️ [ProductsContext] Socket not initialized yet');
 return;
 }

 const handleInventoryUpdate = (data: any) => {
 console.log('📦 [ProductsContext] Inventory updated via socket, refreshing products...');
 fetchProducts(true); // Force refresh
 };

 socket.on('inventory:updated', handleInventoryUpdate);
 console.log('🔌 [ProductsContext] Socket listener attached');

 return () => {
 socket.off('inventory:updated', handleInventoryUpdate);
 };
 }, [fetchProducts]);

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
