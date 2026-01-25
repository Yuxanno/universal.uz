import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, RotateCcw, Save, CreditCard, Trash2, X, 
  Package, Banknote, Delete, AlertTriangle, Printer, User, Phone
} from 'lucide-react';
import { CartItem, Product, Customer } from '../../types';
import api from '../../utils/api';
import { useAlert } from '../../hooks/useAlert';
import { useDebounce } from '../../hooks/useDebounce';
import { useLanguage } from '../../context/LanguageContext';
import { useProducts } from '../../context/ProductsContext';
import { useCustomers } from '../../context/CustomersContext';
import CartItemRow from '../../components/pos/CartItemRow';
import { regionNames } from '../../data/regions';
import { searchProducts } from '../../utils/productSearch';
import './Kassa.modern.css';

interface SavedReceipt {
  id: string;
  items: CartItem[];
  total: number;
  savedAt: string;
}

interface PrintReceipt {
  items: { name: string; code: string; price: number; quantity: number }[];
  total: number;
  paymentMethod: 'cash' | 'card';
  date: string;
  receiptNumber: string;
}

export default function Kassa() {
  const { tKey } = useLanguage();
  const location = useLocation();
  const { showAlert, AlertComponent } = useAlert();
  const { displayedProducts, loading: loadingProducts } = useProducts();
  const { customers, addCustomer } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedReceipts, setSavedReceipts] = useState<SavedReceipt[]>([]);
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [showReturnSearch, setShowReturnSearch] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null);
  const [showSavedReceipts, setShowSavedReceipts] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [printReceipt, setPrintReceipt] = useState<PrintReceipt | null>(null);
  const [workerReceiptIds, setWorkerReceiptIds] = useState<string[]>([]);
  const [localPrices, setLocalPrices] = useState<{[key: string]: string}>({});
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    region: ''
  });

  useEffect(() => {
    loadSavedReceipts();
    loadWorkerItems();
    
    // Listen for localStorage changes (when items are loaded from StaffReceipts)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kassaItems' && e.newValue) {
        console.log('🔄 localStorage changed, reloading worker items...');
        loadWorkerItems();
      }
    };
    
    // Also listen for custom event (for same-tab changes)
    const handleKassaItemsUpdate = () => {
      console.log('🔄 Custom event received, reloading worker items...');
      loadWorkerItems();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kassaItemsUpdated', handleKassaItemsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kassaItemsUpdated', handleKassaItemsUpdate);
    };
  }, []);

  // Reload worker items when navigating to this page
  useEffect(() => {
    console.log('🔄 Route changed to Kassa, checking for worker items...');
    loadWorkerItems();
  }, [location.pathname]);

  // Load items from worker (StaffReceipts - "Kassaga yuklash")
  const loadWorkerItems = () => {
    const kassaItems = localStorage.getItem('kassaItems');
    const receiptId = localStorage.getItem('kassaReceiptId');
    
    if (kassaItems) {
      try {
        const items = JSON.parse(kassaItems);
        console.log('📦 Kassaga yuklangan mahsulotlar (raw):', items);
        
        // DEFENSIVE: Group items by product ID to prevent duplicates
        const groupedMap = new Map<string, CartItem>();
        items.forEach((item: CartItem) => {
          const existing = groupedMap.get(item._id);
          if (existing) {
            console.log(`🔄 Duplicate found in localStorage: ${item.name}, merging quantities (${existing.cartQuantity} + ${item.cartQuantity})`);
            existing.cartQuantity += item.cartQuantity;
          } else {
            groupedMap.set(item._id, { ...item });
          }
        });
        const uniqueItems = Array.from(groupedMap.values());
        
        console.log('📦 Kassaga yuklangan mahsulotlar (after dedup):', {
          raw: items.length,
          unique: uniqueItems.length,
          items: uniqueItems
        });
        
        setCart(uniqueItems);
        
        // Set local prices from worker items
        const prices: {[key: string]: string} = {};
        uniqueItems.forEach((item: CartItem) => {
          if (item.price) {
            prices[item._id] = item.price.toString();
          }
        });
        console.log('💰 Narxlar:', prices);
        setLocalPrices(prices);
        
        // Save receipt IDs to delete after payment
        if (receiptId) {
          setWorkerReceiptIds(receiptId.split(','));
        }
        // Clear localStorage after loading
        localStorage.removeItem('kassaItems');
        localStorage.removeItem('kassaReceiptId');
      } catch (err) {
        console.error('Error loading worker items:', err);
      }
    }
  };

  const loadSavedReceipts = () => {
    const saved = localStorage.getItem('savedReceipts');
    if (saved) setSavedReceipts(JSON.parse(saved));
  };

  // Memoize total calculation
  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      const localPrice = localPrices[item._id];
      const price = localPrice !== undefined ? (parseInt(localPrice.replace(/\s/g, '')) || 0) : item.price;
      return sum + price * item.cartQuantity;
    }, 0);
  }, [cart, localPrices]);

  // Debounced search with useEffect - limit results
  useEffect(() => {
    setIsSearching(true);
    if (debouncedSearchQuery.length > 0) {
      // Используем универсальную функцию поиска с поддержкой латиницы/кириллицы
      const results = searchProducts(displayedProducts, debouncedSearchQuery).slice(0, 50);
      setSearchResults(results);
    } else {
      setSearchResults(displayedProducts.slice(0, 50)); // Show first 50
    }
    setIsSearching(false);
  }, [debouncedSearchQuery, displayedProducts]);

  // Memoize callbacks
  const handleNumpadClick = useCallback((value: string) => {
    if (value === 'C') setInputValue('');
    else if (value === '⌫') setInputValue(prev => prev.slice(0, -1));
    else if (value === '+') {
      addProductByCode(inputValue);
    }
    else setInputValue(prev => prev + value);
  }, [inputValue]);

  const handleCartItemClick = useCallback((itemId: string) => {
    setSelectedCartItemId(itemId);
  }, []);

  const addProductByCode = useCallback((code: string) => {
    const product = displayedProducts.find(p => p.code === code);
    if (product) {
      addToCart(product);
      setInputValue('');
    } else if (code) {
      showAlert('Tovar topilmadi', 'Xatolik', 'warning');
    }
  }, [displayedProducts, showAlert]);

  const addToCart = useCallback((product: Product) => {
    // Optimistic update - darhol UI'da ko'rsatadi
    setCart(prev => {
      const existing = prev.find(p => p._id === product._id);
      if (existing) {
        return prev.map(p => p._id === product._id ? {...p, cartQuantity: p.cartQuantity + 1} : p);
      }
      return [...prev, {...product, cartQuantity: 1}];
    });
    // Modal'ni darhol yopadi
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

  // Simplified search handler - just updates query
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleReturnSearch = useCallback((query: string) => {
    setReturnSearchQuery(query);
    if (query.length > 0) {
      // Используем универсальную функцию поиска с поддержкой латиницы/кириллицы
      const results = searchProducts(displayedProducts, query).slice(0, 50);
      setSearchResults(results);
    } else {
      setSearchResults(displayedProducts.slice(0, 50));
    }
  }, [displayedProducts]);

  const toggleReturnMode = useCallback(() => {
    if (!isReturnMode) {
      setCart([]);
      setIsReturnMode(true);
      setSearchResults(displayedProducts.slice(0, 50));
      setShowReturnSearch(true);
    } else {
      setIsReturnMode(false);
      setCart([]);
    }
  }, [isReturnMode, displayedProducts]);

  const openReturnSearch = useCallback(() => {
    setSearchResults(displayedProducts.slice(0, 50));
    setShowReturnSearch(true);
  }, [displayedProducts]);

  const addToReturn = useCallback((product: Product) => {
    addToCart(product);
    setShowReturnSearch(false);
    setReturnSearchQuery('');
  }, [addToCart]);

  const openSearch = useCallback(() => {
    setSearchResults(displayedProducts.slice(0, 50));
    setShowSearch(true);
  }, [displayedProducts]);

  const handlePayment = async (method: 'cash' | 'card') => {
    if (cart.length === 0) return;
    
    const saleItems = cart.map(item => {
      const localPrice = localPrices[item._id];
      const price = localPrice !== undefined ? (parseInt(localPrice.replace(/\s/g, '')) || 0) : item.price;
      return {
        product: item._id,
        name: item.name,
        code: item.code,
        price: price,
        quantity: item.cartQuantity
      };
    });

    const finalTotal = saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const receiptData: PrintReceipt = {
      items: saleItems,
      total: finalTotal,
      paymentMethod: method,
      date: new Date().toLocaleString('uz-UZ'),
      receiptNumber: Date.now().toString().slice(-8)
    };

    try {
      await api.post('/receipts', {
        items: saleItems,
        total: finalTotal,
        paymentMethod: method,
        isReturn: isReturnMode,
        customer: selectedCustomer || null
      });
      
      // Delete worker receipts if they exist
      if (workerReceiptIds.length > 0) {
        for (const id of workerReceiptIds) {
          try {
            await api.delete(`/receipts/${id}`);
          } catch (err) {
            console.error('Error deleting worker receipt:', err);
          }
        }
        setWorkerReceiptIds([]);
      }
      
      setCart([]);
      setLocalPrices({});
      setSelectedCustomer(''); // Reset customer selection
      setShowPayment(false);
      setIsReturnMode(false);
      setPrintReceipt(receiptData);
      setShowReceipt(true);
    } catch (err: any) {
      console.error('Error creating receipt:', err);
      const message = err.response?.data?.message || 'Xatolik yuz berdi';
      showAlert(message, 'Xatolik', 'danger');
    }
  };

  const handlePrint = () => {
    if (!printReceipt) return;
    
    const w = window.open('', '_blank');
    if (!w) {
      showAlert('Popup bloklangan', 'Xatolik', 'danger');
      return;
    }
    
    const formatNum = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    // Build items HTML
    let itemsHtml = '';
    printReceipt.items.forEach((item, i) => {
      itemsHtml += `
        <div class="item">
          <div class="item-name">${i + 1}. ${item.name}</div>
          <div class="item-calc">${item.quantity} x ${formatNum(item.price)}<span class="price">${formatNum(item.price * item.quantity)}</span></div>
        </div>
      `;
    });
    
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@page { 
  size: 2in 4in; 
  margin: 0; 
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  font-family: 'Courier New', monospace;
  font-size: 11px;
  width: 2in;
  padding: 3mm;
  text-align: center;
}
.title { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
.subtitle { font-size: 9px; margin-bottom: 2mm; }
.contacts { font-size: 8px; margin-bottom: 3mm; line-height: 1.4; }
.line { border-top: 1px dashed #000; margin: 2mm 0; }
.meta { font-size: 10px; text-align: left; margin-bottom: 1mm; }
.items { text-align: left; }
.item { margin-bottom: 2mm; }
.item-name { font-weight: bold; }
.item-calc { display: flex; justify-content: space-between; font-size: 10px; }
.price { font-weight: bold; }
.total-box { border: 1px solid #000; padding: 2mm; margin: 2mm 0; }
.total-label { font-size: 12px; font-weight: bold; }
.total-sum { font-size: 14px; font-weight: bold; }
.payment { font-size: 10px; margin: 2mm 0; }
.footer { font-size: 11px; font-weight: bold; }
.footer-sub { font-size: 9px; }
</style>
</head>
<body>

<div class="title">UNIVERSAL</div>
<div class="subtitle">Savdo markazi</div>
<div class="contacts">
+99893 140-00-04 ASADBEK<br>
+99893 657-66-87 RAMAZON<br>
+99888 866-66-59 UYG'UNJON
</div>

<div class="line"></div>

<div class="meta">Sana: ${printReceipt.date}</div>
<div class="meta">Vaqt: ${new Date().toLocaleTimeString('uz-UZ')}</div>
<div class="meta">Chek: #${printReceipt.receiptNumber}</div>

<div class="line"></div>

<div class="items">
${itemsHtml}
</div>

<div class="line"></div>

<div class="total-box">
  <div class="total-label">JAMI:</div>
  <div class="total-sum">${formatNum(printReceipt.total)} so'm</div>
</div>

<div class="payment">To'lov: ${printReceipt.paymentMethod === 'cash' ? 'Naqd pul' : 'Plastik karta'}</div>

<div class="line"></div>

<div class="footer">Xaridingiz uchun rahmat!</div>
<div class="footer-sub">Yana kutamiz!</div>

<script>window.onload=function(){window.print();}</script>
</body>
</html>`;
    
    w.document.write(html);
    w.document.close();
    setShowReceipt(false);
    setPrintReceipt(null);
  };
  const saveReceipt = () => {
    if (cart.length === 0) { showAlert("Chek bo'sh", 'Ogohlantirish', 'warning'); return; }
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
  };

  const loadSavedReceipt = (receipt: SavedReceipt) => {
    setCart(receipt.items);
    const updated = savedReceipts.filter(r => r.id !== receipt.id);
    setSavedReceipts(updated);
    localStorage.setItem('savedReceipts', JSON.stringify(updated));
    setShowSavedReceipts(false);
  };

  const deleteSavedReceipt = (id: string) => {
    const updated = savedReceipts.filter(r => r.id !== id);
    setSavedReceipts(updated);
    localStorage.setItem('savedReceipts', JSON.stringify(updated));
  };

  const handleCreateCustomer = async () => {
    if (!customerFormData.name.trim() || !customerFormData.phone.trim()) {
      showAlert('Ism va telefon raqamini kiriting', 'Xatolik', 'warning');
      return;
    }

    try {
      const customerData = {
        name: customerFormData.name.trim(),
        phone: customerFormData.phone.trim(),
        address: customerFormData.region || ''
      };
      
      const newCustomer = await addCustomer(customerData);
      
      // Auto-select the newly created customer
      setSelectedCustomer(newCustomer._id);
      
      // Reset form and close modal
      setCustomerFormData({ name: '', phone: '', region: '' });
      setShowCustomerModal(false);
      
      showAlert('Mijoz muvaffaqiyatli qo\'shildi!', 'Muvaffaqiyat', 'success');
    } catch (err: any) {
      console.error('Error creating customer:', err);
      const message = err.response?.data?.message || 'Mijoz qo\'shishda xatolik';
      showAlert(message, 'Xatolik', 'danger');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isReturnMode ? 'bg-warning-50 dark:bg-warning-900/10' : 'bg-gray-50 dark:bg-gray-900'}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isReturnMode 
                ? 'bg-warning-100 dark:bg-warning-900/30' 
                : 'bg-primary-100 dark:bg-primary-900/30'
            }`}>
              {isReturnMode ? (
                <RotateCcw className={`w-5 h-5 ${isReturnMode ? 'text-warning-600' : 'text-primary-600'}`} />
              ) : (
                <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div>
              <h1 className="text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100">
                {isReturnMode ? tKey('Qaytarish rejimi') : tKey('Kassa (POS)')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {cart.length} {tKey('ta mahsulot')} • {total.toLocaleString()} {tKey("so'm")}
              </p>
            </div>
          </div>
          
          {/* Customer Select */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                >
                  <option value="">{tKey("Oddiy mijoz")}</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="flex items-center justify-center w-10 h-10 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all hover:scale-105 shadow-md"
                title="Yangi mijoz qo'shish"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSavedReceipts(true)}
              className="relative flex items-center gap-2 px-3 lg:px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs lg:text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:scale-105"  
            >
              <Save className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="hidden sm:inline text-gray-700 dark:text-gray-300">Saqlangan</span>
              {savedReceipts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full font-bold flex items-center justify-center">
                  {savedReceipts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-4 lg:gap-6 p-4 lg:p-6">
        {/* Left - Cart Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Table - Desktop */}
          <div className="hidden lg:flex flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex-col shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
              <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{tKey("Kod")}</div>
              <div className="col-span-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{tKey("MAHSULOT")}</div>
              <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{tKey("OMBOR")}</div>
              <div className="col-span-2 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{tKey("SONI")}</div>
              <div className="col-span-2 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{tKey("NARX")}</div>
              <div className="col-span-1 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{tKey("SUMMA")}</div>
              <div className="col-span-1 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{tKey("AMAL")}</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto">
              {cart.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 py-20">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Package className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">{tKey("Savat bo'sh")}</p>
                    <p className="text-sm text-gray-400 mt-1">{tKey("Mahsulot qo'shish uchun qidiring")}</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {cart.map((item) => (
                    <CartItemRow
                      key={item._id}
                      item={item}
                      localPrice={localPrices[item._id]}
                      isSelected={selectedCartItemId === item._id}
                      onQuantityChange={handleQuantityChange}
                      onPriceChange={handlePriceChange}
                      onRemove={removeFromCart}
                      onClick={handleCartItemClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="lg:hidden flex-1 overflow-auto space-y-3 pb-32">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 py-12">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Package className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-base font-medium">{tKey("Savat bo'sh")}</p>
                  <p className="text-sm text-gray-400 mt-1">{tKey("Mahsulot qo'shish uchun qidiring")}</p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item._id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border-2 p-4 transition-all ${
                    selectedCartItemId === item._id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {item.code}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="p-2 rounded-xl text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-black text-slate-700 dark:text-gray-400 block mb-1.5">{tKey("Soni")}</label>
                      <input
                        type="text"
                        value={item.cartQuantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d+$/.test(val)) {
                            setCart(prev => prev.map(p =>
                              p._id === item._id ? { ...p, cartQuantity: val === '' ? 0 : parseInt(val) } : p
                            ));
                          }
                        }}
                        className="w-full h-12 text-center text-lg font-black border-2 border-slate-300 dark:border-gray-600 dark:bg-gray-700 text-slate-900 dark:text-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-700 dark:text-gray-400 block mb-1.5">{tKey("Narx")}</label>
                      <input
                        type="text"
                        value={localPrices[item._id] !== undefined ? localPrices[item._id] : item.price.toLocaleString()}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\s/g, '');
                          if (val === '' || /^\d+$/.test(val)) {
                            setLocalPrices(prev => ({
                              ...prev,
                              [item._id]: val
                            }));
                          }
                        }}
                        className="w-full h-12 text-right text-base font-bold border-2 border-slate-300 dark:border-gray-600 dark:bg-gray-700 text-slate-900 dark:text-gray-100 rounded-xl px-2 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">{tKey("Summa")}</label>
                      <div className="h-12 flex items-center justify-end px-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/30 rounded-xl border-2 border-primary-200 dark:border-primary-800">
                        <span className="text-base font-bold text-primary-700 dark:text-primary-400">
                          {(() => {
                            const localPrice = localPrices[item._id];
                            const price = localPrice !== undefined ? (parseInt(localPrice.replace(/\s/g, '')) || 0) : item.price;
                            return (price * item.cartQuantity).toLocaleString();
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Right - Numpad & Total (Desktop Only) */}
        <div className="hidden lg:flex w-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex-col shadow-sm">
          {/* Total Display */}
          <div className="total-display mb-4 p-5 bg-gradient-to-br from-pink-100 via-pink-50 to-white dark:from-pink-900/40 dark:via-pink-900/30 dark:to-gray-800 rounded-3xl border-2 border-pink-300 dark:border-pink-700 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-200/40 dark:bg-pink-600/30 rounded-full -mr-12 -mt-12"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-pink-200/40 dark:bg-pink-600/30 rounded-full -ml-10 -mb-10"></div>
            <div className="relative z-10">
              <p className="text-sm font-black text-pink-800 dark:text-pink-200 mb-2 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full animate-pulse"></span>
                {tKey("JAMI SUMMA")}
              </p>
              <p className={`text-4xl font-black ${isReturnMode ? 'text-warning-900 dark:text-warning-200' : 'text-pink-900 dark:text-pink-100'}`}>
                {total.toLocaleString()}
                <span className="text-xl ml-2 font-bold opacity-80">so'm</span>
              </p>
            </div>
          </div>

          {/* Input */}
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addProductByCode(inputValue)}
            placeholder={tKey("Kod kiriting...")}
            className="modern-input w-full px-4 py-4 text-center text-xl font-mono font-bold bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-2xl mb-4 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 dark:text-gray-100 transition-all shadow-md"
          />

          {/* Numpad */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {['7', '8', '9', 'C', '4', '5', '6','⌫', '1', '2', '3', '+', '0', '00', '.'].map((key) => (
              <button
                key={key}
                onClick={() => handleNumpadClick(key)}
                className={`
                  numpad-button flex items-center justify-center rounded-xl text-xl font-black transition-all shadow-md hover:shadow-lg
                  ${key === 'C' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700' : ''}
                  ${key === '⌫' ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700' : ''}
                  ${key === '+' ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 row-span-2' : ''}
                  ${!['C', '⌫', '+'].includes(key) ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-gray-100 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 border border-gray-200 dark:border-gray-600' : ''}
                  ${key === '+' ? 'h-full' : 'h-14'}
                `}
              >
                {key === '⌫' ? <Delete className="w-5 h-5" /> : key}
              </button>
            ))}
          </div>

          {/* Action Buttons - Desktop (3 tugma) */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={openSearch}
              className="press-effect flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold text-sm shadow-md hover:shadow-lg"
            >
              <Search className="w-4 h-4" />
              <span>{tKey("Qidirish")}</span>
            </button>
            <button
              onClick={toggleReturnMode}
              className={`press-effect flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl transition-all font-bold text-sm shadow-md hover:shadow-lg ${
                isReturnMode
                  ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                  : 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-900 hover:from-yellow-200 hover:to-yellow-300 dark:from-yellow-900/30 dark:to-yellow-900/40 dark:text-yellow-300'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{tKey("Qaytarish")}</span>
            </button>
            <button
              onClick={saveReceipt}
              className="press-effect flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-gray-100 rounded-xl hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all font-bold text-sm shadow-md hover:shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{tKey("Saqlash")}</span>
            </button>
          </div>

          {/* Payment Button - Desktop */}
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="press-effect w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white rounded-2xl hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-black text-lg shadow-xl hover:shadow-emerald-500/50 hover:scale-105"
          >
            <CreditCard className="w-6 h-6" />
            {tKey("To'lov qilish")}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Bar - Total & Payment */}
      <div className="lg:hidden glass-effect sticky bottom-0 left-0 right-0 border-t-2 border-pink-200 dark:border-gray-700 shadow-2xl z-20 backdrop-blur-lg bg-white/95 dark:bg-gray-800/95">
        {/* Action Buttons */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-pink-100 dark:border-gray-700">
          {!isReturnMode && (
            <button
              onClick={openSearch}
              className="press-effect flex-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold text-sm shadow-md active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Qidirish</span>
            </button>
          )}
          <button
            onClick={toggleReturnMode}
            className={`press-effect flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl transition-all font-bold text-sm shadow-md active:scale-95 ${
              isReturnMode
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                : 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-900 hover:from-yellow-200 hover:to-yellow-300 dark:from-yellow-900/30 dark:to-yellow-900/40 dark:text-yellow-300'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isReturnMode ? tKey('Bekor') : tKey('Qaytarish')}</span>
          </button>
          {isReturnMode && (
            <button
              onClick={openReturnSearch}
              className="press-effect flex-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-900 rounded-xl hover:from-yellow-200 hover:to-yellow-300 transition-all font-bold text-sm shadow-md active:scale-95 dark:from-yellow-900/30 dark:to-yellow-900/40 dark:text-yellow-300"
            >
              <Search className="w-4 h-4" />
              <span>Qo'shish</span>
            </button>
          )}
          <button
            onClick={saveReceipt}
            className="press-effect flex-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-gray-100 rounded-xl hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all font-bold text-sm shadow-md active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Saqlash</span>
          </button>
        </div>
        
        {/* Total & Payment */}
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 p-4 bg-gradient-to-br from-pink-100 via-pink-50 to-white dark:from-pink-900/30 dark:via-pink-900/20 dark:to-gray-800 rounded-2xl border-2 border-pink-200 dark:border-pink-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-pink-200/30 dark:bg-pink-700/20 rounded-full -mr-8 -mt-8"></div>
            <div className="relative z-10">
              <p className="text-xs font-black text-pink-900 dark:text-pink-100 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse"></span>
                {tKey("JAMI SUMMA")}
              </p>
              <p className={`text-2xl font-black ${isReturnMode ? 'text-warning-700 dark:text-warning-300' : 'text-pink-900 dark:text-pink-100'}`}>
                {total.toLocaleString()}
                <span className="text-sm ml-1 font-bold opacity-70">so'm</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="press-effect flex flex-col items-center justify-center gap-1 px-5 py-3.5 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white rounded-2xl hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-black shadow-xl active:scale-95"
          >
            <CreditCard className="w-6 h-6" />
            <span className="text-sm">{tKey("To'lov")}</span>
          </button>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start lg:items-center justify-center pt-4 lg:pt-0 px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowSearch(false)} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in border-2 border-red-200">
            {/* Header */}
            <div className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Search className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-gray-100 mb-1">{tKey("Mahsulot qidirish")}</h3>
                    <p className="text-sm font-bold text-slate-700 dark:text-gray-400">{tKey("Nom yoki kod bo'yicha toping")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSearch(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600 dark:text-gray-400" strokeWidth={2.5} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder={tKey("Mahsulot nomi yoki kodi...")}
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-base font-semibold bg-white dark:bg-gray-700 border-2 border-red-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 transition-all"
                  autoFocus
                />
              </div>
            </div>
            {/* Results */}
            <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-800">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-semibold text-slate-600">Qidirilmoqda...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                    <Package className="w-10 h-10 text-red-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-gray-100">{tKey("Mahsulot topilmadi")}</p>
                  <p className="text-sm font-semibold text-slate-600 dark:text-gray-400 mt-1">{tKey("Boshqa nom yoki kod bilan qidiring")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.map(product => (
                    <button
                      key={product._id}
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl transition-all text-left border-2 border-red-200 hover:border-red-400 hover:shadow-lg group active:scale-95"
                    >
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Package className="w-8 h-8 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 dark:text-gray-100 truncate mb-1">{product.name}</p>
                        <p className="text-xs text-slate-600 dark:text-gray-400 font-bold mb-2">Kod: {product.code}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">Tan:</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-gray-400">
                            {((product as any).costPrice || 0).toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-slate-600">•</span>
                          <span className="text-sm font-black text-red-600 dark:text-red-400">
                            {product.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowPayment(false)} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-scaleIn border-4 border-white/20">
            {/* Header with Gradient */}
            <div className={`relative overflow-hidden ${
              isReturnMode 
                ? 'bg-gradient-to-br from-warning-400 via-warning-500 to-warning-600' 
                : 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600'
            }`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative p-8">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/30">
                    {isReturnMode ? (
                      <AlertTriangle className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={2.5} />
                    ) : (
                      <CreditCard className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-black text-white drop-shadow-lg mb-1">
                      {isReturnMode ? tKey('Qaytarish') : tKey("To'lov")}
                    </h3>
                    <p className="text-white/90 font-semibold drop-shadow">
                      {isReturnMode ? 'Mijozga qaytariladi' : 'To\'lov turini tanlang'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Amount Card */}
            <div className="p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className={`relative overflow-hidden p-8 rounded-3xl shadow-xl ${
                isReturnMode 
                  ? 'bg-gradient-to-br from-warning-100 to-warning-200 dark:from-warning-900/40 dark:to-warning-900/60 border-2 border-warning-300 dark:border-warning-700' 
                  : 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-900/60 border-2 border-emerald-300 dark:border-emerald-700'
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                <div className="relative">
                  <p className={`text-base font-black uppercase tracking-wider mb-3 ${
                    isReturnMode ? 'text-warning-900 dark:text-warning-100' : 'text-emerald-900 dark:text-emerald-100'
                  }`}>
                    {isReturnMode ? 'Qaytariladigan summa' : 'To\'lov summasi'}
                  </p>
                  <div className="flex items-baseline gap-3">
                    {isReturnMode && <span className="text-3xl font-black text-warning-900 dark:text-warning-100">-</span>}
                    <p className={`text-5xl font-black ${isReturnMode ? 'text-warning-900 dark:text-warning-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
                      {total.toLocaleString()}
                    </p>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">so'm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="px-6 pb-6 space-y-4 bg-white dark:bg-gray-900">
              <button 
                onClick={() => handlePayment('cash')} 
                className={`group w-full relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl ${
                  isReturnMode 
                    ? 'bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700' 
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                }`}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                <div className="relative flex items-center gap-4 p-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30 group-hover:scale-110 transition-transform">
                    <Banknote className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-2xl font-black text-white drop-shadow">Naqd pul</p>
                    <p className="text-sm text-white/80 font-semibold">Kassa orqali to'lov</p>
                  </div>
                  <span className="text-4xl group-hover:scale-110 transition-transform">💵</span>
                </div>
              </button>
              
              <button 
                onClick={() => handlePayment('card')} 
                className="group w-full relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                <div className="relative flex items-center gap-4 p-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30 group-hover:scale-110 transition-transform">
                    <CreditCard className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-2xl font-black text-white drop-shadow">Plastik karta</p>
                    <p className="text-sm text-white/80 font-semibold">Terminal orqali to'lov</p>
                  </div>
                  <span className="text-4xl group-hover:scale-110 transition-transform">💳</span>
                </div>
              </button>
              
              <button 
                onClick={() => setShowPayment(false)} 
                className="w-full py-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-bold text-lg rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Search Modal */}
      {showReturnSearch && (
        <div className="fixed inset-0 z-50 flex items-start lg:items-center justify-center pt-4 lg:pt-0 px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => { setShowReturnSearch(false); if (cart.length === 0) setIsReturnMode(false); }} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in border-2 border-warning-200">
            {/* Header */}
            <div className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-warning-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <RotateCcw className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-gray-100 mb-1">Qaytarish rejimi</h3>
                    <p className="text-sm font-bold text-slate-700 dark:text-gray-400">Qaytariladigan tovarni tanlang</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowReturnSearch(false); if (cart.length === 0) setIsReturnMode(false); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600 dark:text-gray-400" strokeWidth={2.5} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tovar nomi yoki kodi..."
                  value={returnSearchQuery}
                  onChange={e => handleReturnSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-base font-semibold bg-white dark:bg-gray-700 border-2 border-warning-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:border-warning-500 focus:ring-4 focus:ring-warning-500/20 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 transition-all"
                  autoFocus
                />
              </div>
            </div>
            {/* Results */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-gray-800">
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-warning-100 dark:bg-warning-900/30 rounded-2xl flex items-center justify-center mb-4">
                    <AlertTriangle className="w-10 h-10 text-warning-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-gray-100">Tovar topilmadi</p>
                  <p className="text-sm font-semibold text-slate-600 dark:text-gray-400 mt-1">Boshqa nom yoki kod bilan qidiring</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.map(product => (
                    <button
                      key={product._id}
                      onClick={() => addToReturn(product)}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-warning-900/20 hover:bg-warning-50 dark:hover:bg-warning-900/30 rounded-2xl transition-all text-left border-2 border-warning-200 hover:border-warning-400 hover:shadow-lg group"
                    >
                      <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <RotateCcw className="w-8 h-8 text-warning-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 dark:text-gray-100 truncate mb-1">{product.name}</p>
                        <p className="text-xs text-slate-600 dark:text-gray-400 font-bold mb-2">Kod: {product.code}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">Tan:</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-gray-400">
                            {((product as any).costPrice || 0).toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-slate-600">•</span>
                          <span className="text-sm font-black text-warning-600">
                            {product.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Receipts Modal */}
      {showSavedReceipts && (
        <div className="fixed inset-0 z-50 flex items-start lg:items-center justify-center pt-4 lg:pt-0 px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowSavedReceipts(false)} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Save className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Saqlangan cheklar</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{savedReceipts.length} ta chek</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSavedReceipts(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/50 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {savedReceipts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
                    <Save className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">Saqlangan cheklar yo'q</p>
                  <p className="text-sm mt-1">Chekni saqlash uchun "Saqlash" tugmasini bosing</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedReceipts.map(receipt => (
                    <div key={receipt.id} className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 transition-all hover:shadow-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              {receipt.items.length} ta mahsulot
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{receipt.savedAt}</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
                            {receipt.total.toLocaleString()}
                            <span className="text-sm ml-1">so'm</span>
                          </p>
                        </div>
                        <button
                          onClick={() => deleteSavedReceipt(receipt.id)}
                          className="p-2 rounded-xl text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={() => loadSavedReceipt(receipt)}
                        className="w-full py-3 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 transition-all hover:scale-105 shadow-md"
                      >
                        Yuklash
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Print Modal */}
      {showReceipt && printReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md animate-fadeIn" onClick={() => setShowReceipt(false)} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-scaleIn border-4 border-white/20">
            {/* Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative p-8">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/30">
                    <Printer className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-black text-white drop-shadow-lg mb-1">Chek tayyor</h3>
                    <p className="text-white/90 font-semibold drop-shadow">Chop etish yoki saqlash</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="p-6 font-mono text-sm bg-gray-50 dark:bg-gray-900">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-inner">
                <div className="text-center border-b-2 border-dashed border-gray-300 dark:border-gray-600 pb-4 mb-4">
                  <h2 className="text-2xl font-black tracking-widest text-gray-900 dark:text-gray-100 mb-1">UNIVERSAL</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Savdo markazi</p>
                  <div className="text-[10px] leading-relaxed text-gray-600 dark:text-gray-400 space-y-0.5">
                    <p>+99893 140-00-04 ASADBEK</p>
                    <p>+99893 657-66-87 RAMAZON</p>
                    <p>+99888 866-66-59 UYG'UNJON</p>
                  </div>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-4">
                  <p>Sana: {printReceipt.date}</p>
                  <p>Chek: #{printReceipt.receiptNumber}</p>
                </div>
                
                <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-3 mb-3">
                  <div className="space-y-3">
                    {printReceipt.items.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="font-bold text-gray-900 dark:text-gray-100">{i + 1}. {item.name}</div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{item.quantity} x {item.price.toLocaleString()}</span>
                          <span className="font-bold text-gray-700 dark:text-gray-300">{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t-2 border-gray-900 dark:border-gray-100 pt-3 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-gray-900 dark:text-gray-100">JAMI:</span>
                    <span className="text-xl font-black text-gray-900 dark:text-gray-100">{printReceipt.total.toLocaleString()} so'm</span>
                  </div>
                </div>
                
                <div className="text-center py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    To'lov: {printReceipt.paymentMethod === 'cash' ? '💵 Naqd pul' : '💳 Plastik karta'}
                  </p>
                </div>
                
                <div className="text-center mt-4 pt-4 border-t border-dashed border-gray-300 dark:border-gray-600">
                  <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Xaridingiz uchun rahmat!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Yana kutamiz! 😊</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all hover:scale-105 shadow-lg"
              >
                <Printer className="w-5 h-5" />
                Chop etish
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {AlertComponent}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowCustomerModal(false)} 
          />
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl relative z-10 animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">Yangi mijoz</h3>
              </div>
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setCustomerFormData({ name: '', phone: '', region: '' });
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Ism */}
              <div>
                <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Ism
                </label>
                <input
                  type="text"
                  value={customerFormData.name}
                  onChange={(e) => setCustomerFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mijoz ismi"
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={customerFormData.phone}
                    onChange={(e) => setCustomerFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+998 (XX) XXX-XX-XX"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Viloyat */}
              <div>
                <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Viloyat
                </label>
                <div className="relative">
                  <select
                    value={customerFormData.region}
                    onChange={(e) => setCustomerFormData(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-base text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Viloyatni tanlang</option>
                    {regionNames.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setCustomerFormData({ name: '', phone: '', region: '' });
                }}
                className="flex-1 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-all border-2 border-gray-200 dark:border-gray-600"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleCreateCustomer}
                className="flex-1 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
