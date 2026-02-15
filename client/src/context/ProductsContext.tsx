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
 const cachedTopProducts = sessionStorage.getItem('top_products_order');
 
 if (cached && cached.length > 0) {
 if (import.meta.env.DEV) {
 console.log('⚡ Instant load from cache:', cached.length, 'products');
 }
 
 // If we have cached top products order, use it for sorting
 let sortedCached = cached;
 if (cachedTopProducts) {
 try {
 const topProductIds = JSON.parse(cachedTopProducts) as string[];
 const topProductsMap = new Map<string, number>();
 topProductIds.forEach((id, index) => {
 topProductsMap.set(id, index);
 });
 
 sortedCached = [...cached].sort((a, b) => {
 const aRank = topProductsMap.get(a._id);
 const bRank = topProductsMap.get(b._id);
 
 if (aRank !== undefined && bRank !== undefined) {
 return aRank - bRank;
 }
 if (aRank !== undefined) return -1;
 if (bRank !== undefined) return 1;
 
 const aSoldCount = a.soldCount || 0;
 const bSoldCount = b.soldCount || 0;
 if (bSoldCount !== aSoldCount) {
 return bSoldCount - aSoldCount;
 }
 
 return a.name.localeCompare(b.name);
 });
 
 console.log('📊 Applied cached top products order');
 } catch (err) {
 console.warn('⚠️ Could not parse cached top products order');
 }
 }
 
 // ОПТИМИЗАЦИЯ: Показываем все товары сразу из кеша
 setProducts(sortedCached);
 setDisplayedProducts(sortedCached);
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
 
 // Fetch top products first to get sales ranking
 let topProductsMap = new Map<string, number>(); // productId -> rank (lower is better)
 try {
 const topRes = await api.get('/stats/top-products?limit=100');
 if (topRes.data && Array.isArray(topRes.data)) {
 topRes.data.forEach((item: any, index: number) => {
 // Store rank (0 = most sold, 1 = second most sold, etc.)
 topProductsMap.set(item._id, index);
 });
 console.log(`📊 Loaded ${topProductsMap.size} top products for ranking`);
 }
 } catch (err) {
 console.warn('⚠️ Could not fetch top products, using default sorting');
 }
 
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
 
 // Sort products by top products ranking (most sold first)
 const sortedProducts = [...productsData].sort((a, b) => {
 const aRank = topProductsMap.get(a._id);
 const bRank = topProductsMap.get(b._id);
 
 // If both products are in top products list, sort by rank
 if (aRank !== undefined && bRank !== undefined) {
 return aRank - bRank; // Lower rank = higher priority
 }
 
 // If only A is in top products, A comes first
 if (aRank !== undefined) return -1;
 
 // If only B is in top products, B comes first
 if (bRank !== undefined) return 1;
 
 // If neither is in top products, sort by soldCount (fallback)
 const aSoldCount = a.soldCount || 0;
 const bSoldCount = b.soldCount || 0;
 if (bSoldCount !== aSoldCount) {
 return bSoldCount - aSoldCount;
 }
 
 // Final fallback: alphabetical by name
 return a.name.localeCompare(b.name);
 });
 
 if (import.meta.env.DEV) {
 console.log(`📊 Top 5 products in POS order:`, sortedProducts.slice(0, 5).map(p => ({
 name: p.name,
 soldCount: p.soldCount || 0,
 isTopProduct: topProductsMap.has(p._id),
 rank: topProductsMap.get(p._id)
 })));
 }
 
 // Update state IMMEDIATELY with sorted products
 setProducts(sortedProducts);
 setDisplayedProducts(sortedProducts);
 setLastFetch(Date.now());
 
 // Cache the results (sorted products) and top products order
 try {
 setCachedData('products_cache', sortedProducts);
 // Also cache the top products order for faster sorting on next load
 const topProductIds = Array.from(topProductsMap.keys());
 sessionStorage.setItem('top_products_order', JSON.stringify(topProductIds));
 } catch (err) {
 console.warn('Cache too large, clearing old data');
 clearLargeCache();
 setCachedData('products_cache', sortedProducts);
 try {
 const topProductIds = Array.from(topProductsMap.keys());
 sessionStorage.setItem('top_products_order', JSON.stringify(topProductIds));
 } catch (e) {
 console.warn('Could not cache top products order');
 }
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

 const handleInventoryUpdate = () => {
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
 sessionStorage.removeItem('top_products_order'); // Clear top products order cache too
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
