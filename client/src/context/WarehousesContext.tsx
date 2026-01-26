import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Warehouse } from '../types';
import api from '../utils/api';
import { getCachedData, setCachedData } from '../performance.config';

interface WarehousesContextType {
 warehouses: Warehouse[];
 mainWarehouse: Warehouse | null;
 loading: boolean;
 error: string | null;
 fetchWarehouses: (force?: boolean) => Promise<void>;
 refreshWarehouses: () => Promise<void>;
 clearCache: () => void;
}

const WarehousesContext = createContext<WarehousesContextType | undefined>(undefined);

export function WarehousesProvider({ children }: { children: ReactNode }) {
 const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
 const [mainWarehouse, setMainWarehouse] = useState<Warehouse | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 const cached = getCachedData<Warehouse[]>('warehouses_cache');
 if (cached) {
 if (import.meta.env.DEV) {
 console.log('📦 Loading warehouses from cache');
 }
 setWarehouses(cached);
 const main = cached.find(w => w.name === 'Asosiy ombor');
 if (main) setMainWarehouse(main);
 } else {
 // Only fetch if token exists
 const token = localStorage.getItem('token');
 if (token) {
 fetchWarehouses();
 }
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const fetchWarehouses = useCallback(async (force = false) => {
 if (!force && warehouses.length > 0) return;

 try {
 setLoading(true);
 setError(null);
 const res = await api.get('/warehouses');
 setWarehouses(res.data);
 setCachedData('warehouses_cache', res.data);
 
 const main = res.data.find((w: Warehouse) => w.name === 'Asosiy ombor');
 if (main) {
 setMainWarehouse(main);
 } else {
 const newMain = await api.post('/warehouses', { name: 'Asosiy ombor', address: '' });
 setMainWarehouse(newMain.data);
 setWarehouses([...res.data, newMain.data]);
 }
 } catch (err: any) {
 setError(err.response?.data?.message || 'Omborlarni yuklashda xatolik');
 } finally {
 setLoading(false);
 }
 }, [warehouses.length]);

 const refreshWarehouses = useCallback(async () => {
 await fetchWarehouses(true);
 }, [fetchWarehouses]);

 const clearCache = useCallback(() => {
 sessionStorage.removeItem('warehouses_cache');
 sessionStorage.removeItem('warehouses_cache_time');
 setWarehouses([]);
 setMainWarehouse(null);
 }, []);

 return (
 <WarehousesContext.Provider value={{
 warehouses,
 mainWarehouse,
 loading,
 error,
 fetchWarehouses,
 refreshWarehouses,
 clearCache
 }}>
 {children}
 </WarehousesContext.Provider>
 );
}

export function useWarehouses() {
 const context = useContext(WarehousesContext);
 if (!context) {
 throw new Error('useWarehouses must be used within WarehousesProvider');
 }
 return context;
}
