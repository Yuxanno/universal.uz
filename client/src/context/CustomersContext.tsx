import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Customer } from '../types';
import api from '../utils/api';
import { PERFORMANCE_CONFIG, shouldUseCache, getCachedData, setCachedData } from '../performance.config';

interface CustomersContextType {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  fetchCustomers: (force?: boolean) => Promise<void>;
  refreshCustomers: () => Promise<void>;
  addCustomer: (customer: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  clearCache: () => void;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedData<Customer[]>('customers_cache');
    const cacheTime = sessionStorage.getItem('customers_cache_time');
    
    if (cached && cacheTime && shouldUseCache(cacheTime, PERFORMANCE_CONFIG.CUSTOMERS_CACHE_TIME)) {
      console.log('📦 Loading customers from cache');
      setCustomers(cached);
    } else {
      fetchCustomers();
    }
  }, []);

  const fetchCustomers = useCallback(async (force = false) => {
    if (!force) {
      const cacheTime = sessionStorage.getItem('customers_cache_time');
      if (cacheTime && shouldUseCache(cacheTime, PERFORMANCE_CONFIG.CUSTOMERS_CACHE_TIME)) {
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/customers');
      setCustomers(res.data);
      setCachedData('customers_cache', res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mijozlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCustomers = useCallback(async () => {
    await fetchCustomers(true);
  }, [fetchCustomers]);

  const addCustomer = useCallback(async (customerData: Partial<Customer>) => {
    const res = await api.post('/customers', customerData);
    const newCustomer = res.data;
    setCustomers(prev => [...prev, newCustomer]);
    setCachedData('customers_cache', [...customers, newCustomer]);
    return newCustomer;
  }, [customers]);

  const updateCustomer = useCallback(async (id: string, data: Partial<Customer>) => {
    await api.put(`/customers/${id}`, data);
    setCustomers(prev => prev.map(c => c._id === id ? { ...c, ...data } : c));
    const updated = customers.map(c => c._id === id ? { ...c, ...data } : c);
    setCachedData('customers_cache', updated);
  }, [customers]);

  const deleteCustomer = useCallback(async (id: string) => {
    await api.delete(`/customers/${id}`);
    setCustomers(prev => prev.filter(c => c._id !== id));
    const filtered = customers.filter(c => c._id !== id);
    setCachedData('customers_cache', filtered);
  }, [customers]);

  const clearCache = useCallback(() => {
    sessionStorage.removeItem('customers_cache');
    sessionStorage.removeItem('customers_cache_time');
    setCustomers([]);
  }, []);

  return (
    <CustomersContext.Provider value={{
      customers,
      loading,
      error,
      fetchCustomers,
      refreshCustomers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      clearCache
    }}>
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (!context) {
    throw new Error('useCustomers must be used within CustomersProvider');
  }
  return context;
}
