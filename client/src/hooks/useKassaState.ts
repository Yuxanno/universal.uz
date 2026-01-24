import { useState, useCallback, useMemo, useEffect } from 'react';
import { CartItem, Product, Customer } from '../types';
import api from '../utils/api';
import { useAlert } from './useAlert';

interface SavedReceipt {
  id: string;
  items: CartItem[];
  total: number;
  savedAt: string;
}

export function useKassaState() {
  const { showAlert } = useAlert();
  
  // Core state
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [localPrices, setLocalPrices] = useState<{[key: string]: string}>({});
  
  // UI state
  const [inputValue, setInputValue] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null);
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [showReturnSearch, setShowReturnSearch] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [showSavedReceipts, setShowSavedReceipts] = useState(false);
  const [savedReceipts, setSavedReceipts] = useState<SavedReceipt[]>([]);
  const [workerReceiptIds, setWorkerReceiptIds] = useState<string[]>([]);

  // Memoized total calculation
  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      const localPrice = localPrices[item._id];
      const price = localPrice !== undefined ? (parseInt(localPrice.replace(/\s/g, '')) || 0) : item.price;
      return sum + price * item.cartQuantity;
    }, 0);
  }, [cart, localPrices]);

  // Load initial data
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    loadSavedReceipts();
    loadWorkerItems();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products?warehouse=Asosiy ombor');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  }, []);

  const loadSavedReceipts = useCallback(() => {
    const saved = localStorage.getItem('savedReceipts');
    if (saved) setSavedReceipts(JSON.parse(saved));
  }, []);

  const loadWorkerItems = useCallback(() => {
    const kassaItems = localStorage.getItem('kassaItems');
    const receiptId = localStorage.getItem('kassaReceiptId');
    
    if (kassaItems) {
      try {
        const items = JSON.parse(kassaItems);
        
        // Group items by product ID to prevent duplicates
        const groupedMap = new Map<string, CartItem>();
        items.forEach((item: CartItem) => {
          const existing = groupedMap.get(item._id);
          if (existing) {
            existing.cartQuantity += item.cartQuantity;
          } else {
            groupedMap.set(item._id, { ...item });
          }
        });
        const uniqueItems = Array.from(groupedMap.values());
        
        setCart(uniqueItems);
        
        // Set local prices
        const prices: {[key: string]: string} = {};
        uniqueItems.forEach((item: CartItem) => {
          if (item.price) {
            prices[item._id] = item.price.toString();
          }
        });
        setLocalPrices(prices);
        
        if (receiptId) {
          setWorkerReceiptIds(receiptId.split(','));
        }
        
        localStorage.removeItem('kassaItems');
        localStorage.removeItem('kassaReceiptId');
      } catch (err) {
        console.error('Error loading worker items:', err);
      }
    }
  }, []);

  // Cart operations
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p._id === product._id);
      if (existing) {
        return prev.map(p => p._id === product._id ? {...p, cartQuantity: p.cartQuantity + 1} : p);
      }
      return [...prev, {...product, cartQuantity: 1}];
    });
    setShowSearch(false);
    setSearchQuery('');
    setInputValue('');
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item._id !== id));
  }, []);

  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    setCart(prev => prev.map(p =>
      p._id === id ? { ...p, cartQuantity: quantity } : p
    ));
  }, []);

  const handlePriceChange = useCallback((id: string, price: string) => {
    setLocalPrices(prev => ({
      ...prev,
      [id]: price
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setLocalPrices({});
    setSelectedCustomer('');
  }, []);

  // Receipt operations
  const saveReceipt = useCallback(() => {
    if (cart.length === 0) {
      showAlert("Chek bo'sh", 'Ogohlantirish', 'warning');
      return;
    }
    const newSaved: SavedReceipt = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      savedAt: new Date().toLocaleString()
    };
    const updated = [...savedReceipts, newSaved];
    setSavedReceipts(updated);
    localStorage.setItem('savedReceipts', JSON.stringify(updated));
    setCart([]);
    showAlert('Chek saqlandi!', 'Muvaffaqiyat', 'success');
  }, [cart, total, savedReceipts, showAlert]);

  const loadSavedReceipt = useCallback((receipt: SavedReceipt) => {
    setCart(receipt.items);
    const updated = savedReceipts.filter(r => r.id !== receipt.id);
    setSavedReceipts(updated);
    localStorage.setItem('savedReceipts', JSON.stringify(updated));
    setShowSavedReceipts(false);
  }, [savedReceipts]);

  const deleteSavedReceipt = useCallback((id: string) => {
    const updated = savedReceipts.filter(r => r.id !== id);
    setSavedReceipts(updated);
    localStorage.setItem('savedReceipts', JSON.stringify(updated));
  }, [savedReceipts]);

  // Return mode
  const toggleReturnMode = useCallback(() => {
    if (!isReturnMode) {
      setCart([]);
      setIsReturnMode(true);
    } else {
      setIsReturnMode(false);
      setCart([]);
    }
  }, [isReturnMode]);

  return {
    // State
    products,
    customers,
    selectedCustomer,
    cart,
    localPrices,
    inputValue,
    showPayment,
    showSearch,
    searchQuery,
    selectedCartItemId,
    isReturnMode,
    showReturnSearch,
    returnSearchQuery,
    showSavedReceipts,
    savedReceipts,
    workerReceiptIds,
    total,
    
    // Setters
    setSelectedCustomer,
    setInputValue,
    setShowPayment,
    setShowSearch,
    setSearchQuery,
    setSelectedCartItemId,
    setShowReturnSearch,
    setReturnSearchQuery,
    setShowSavedReceipts,
    setWorkerReceiptIds,
    
    // Actions
    addToCart,
    removeFromCart,
    handleQuantityChange,
    handlePriceChange,
    clearCart,
    saveReceipt,
    loadSavedReceipt,
    deleteSavedReceipt,
    toggleReturnMode,
    fetchProducts
  };
}
