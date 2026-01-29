import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
 Search, RotateCcw, Save, CreditCard, Trash2, X, 
 Package, Banknote, Delete, AlertTriangle, Printer, User, Phone
} from 'lucide-react';
import { CartItem, Product } from '../../types';
import api from '../../utils/api';
// import { socket } from '../../utils/socket';
import { useAlert } from '../../hooks/useAlert';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/ToastContainer';
import { useDebounce } from '../../hooks/useDebounce';
import { useLanguage } from '../../context/LanguageContext';
import { useProducts } from '../../context/ProductsContext';
import { useCustomers } from '../../context/CustomersContext';
import CartItemRow from '../../components/pos/CartItemRow';
import PaymentModal from '../../components/pos/PaymentModal';
import { regionNames } from '../../data/regions';
import { searchProducts } from '../../utils/productSearch';
import PhoneInput from '../../components/PhoneInput';
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
 const toast = useToast();
 const { displayedProducts, loading, refreshProducts } = useProducts();
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
 const [showCustomerSelect, setShowCustomerSelect] = useState(false);
 const [customerSearchQuery, setCustomerSearchQuery] = useState('');
 const [customerFormData, setCustomerFormData] = useState({
 name: '',
 phone: '+998',
 region: ''
 });

 // Load items from worker (StaffReceipts - "Kassaga yuklash")
 const loadWorkerItems = useCallback(() => {
 const kassaItems = localStorage.getItem('kassaItems');
 const receiptId = localStorage.getItem('kassaReceiptId');
 const customerId = localStorage.getItem('kassaCustomerId');
 
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
 // Map costPrice to tan_narx for validation
 groupedMap.set(item._id, { 
 ...item,
 tan_narx: item.costPrice || item.tan_narx,
 optom_narx: item.price || item.optom_narx
 });
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
 
 // Load customer from localStorage
 if (customerId !== null) {
 setSelectedCustomer(customerId); // '' for Oddiy mijoz, ID for specific customer
 console.log('👤 Mijoz yuklandi:', customerId || 'Oddiy mijoz');
 }
 
 // Save receipt IDs to delete after payment
 if (receiptId) {
 setWorkerReceiptIds(receiptId.split(','));
 }
 // Clear localStorage after loading
 localStorage.removeItem('kassaItems');
 localStorage.removeItem('kassaReceiptId');
 localStorage.removeItem('kassaCustomerId');
 } catch (err) {
 console.error('Error loading worker items:', err);
 }
 }
 }, []);

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
 }, [loadWorkerItems]);

 // Reload worker items when navigating to this page
 useEffect(() => {
 console.log('🔄 Route changed to Kassa, checking for worker items...');
 loadWorkerItems();
 }, [location.pathname, loadWorkerItems]);

 // ИСПРАВЛЕНИЕ: Загружаем товары при монтировании, если их нет
 useEffect(() => {
 if (displayedProducts.length === 0 && !loading) {
 refreshProducts();
 }
 }, [displayedProducts.length, loading, refreshProducts]);

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
 // Map costPrice to tan_narx for validation
 return [...prev, {
 ...product, 
 cartQuantity: 1,
 tan_narx: product.costPrice || product.tan_narx,
 optom_narx: product.price || product.optom_narx
 }];
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

 const addToReturn = useCallback((product: Product) => {
 addToCart(product);
 setShowReturnSearch(false);
 setReturnSearchQuery('');
 }, [addToCart]);

 const openSearch = useCallback(() => {
 setSearchResults(displayedProducts.slice(0, 50));
 setShowSearch(true);
 }, [displayedProducts]);
 
 // Calculate total amount
 const totalAmount = useMemo(() => {
 return cart.reduce((sum, item) => {
 const localPrice = localPrices[item._id];
 const price = localPrice !== undefined ? (parseInt(localPrice.replace(/\s/g, '')) || 0) : item.price;
 return sum + (price * item.cartQuantity);
 }, 0);
 }, [cart, localPrices]);

 const handlePayment = async (cashAmount: number, cardAmount: number, debtAmount: number) => {
 if (cart.length === 0) return;
 
 // Check if debt exists but no customer selected
 if (debtAmount > 0 && !selectedCustomer) {
 showAlert('Qarz yaratish uchun mijoz tanlang!', 'Xatolik', 'danger');
 return;
 }
 
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
 
 // Determine payment method
 let paymentMethod: 'cash' | 'card' | 'mixed' = 'cash';
 if (cashAmount > 0 && cardAmount > 0) {
 paymentMethod = 'mixed';
 } else if (cardAmount > 0) {
 paymentMethod = 'card';
 }

 const receiptData: PrintReceipt = {
 items: saleItems,
 total: finalTotal,
 paymentMethod: paymentMethod as 'cash' | 'card',
 date: new Date().toLocaleDateString('en-GB').replace(/\//g, '.') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
 receiptNumber: Date.now().toString().slice(-8)
 };

 try {
 await api.post('/receipts', {
 items: saleItems,
 total: finalTotal,
 paymentMethod: paymentMethod,
 cashAmount: cashAmount,
 cardAmount: cardAmount,
 debtAmount: debtAmount,
 isReturn: isReturnMode,
 customer: selectedCustomer || null
 });
 
 // Refresh products to update quantities in real-time
 refreshProducts();
 
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
 
 // Show success message
 if (debtAmount > 0) {
 toast.success(`Savdo muvaffaqiyatli! Qarz: ${debtAmount.toLocaleString()} so'm`);
 } else {
 toast.success('Savdo muvaffaqiyatli yakunlandi!');
 }
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
.subtitle { font-size: 9px; margin-bottom: 3mm; }
.contacts { 
 display: grid; 
 grid-template-columns: 1fr 1fr; 
 gap: 1mm 2mm; 
 font-size: 8px; 
 margin-bottom: 3mm; 
 text-align: left;
 line-height: 1.3;
}
.contact-item { white-space: nowrap; }
.contact-item strong { font-weight: bold; }
.line { border-top: 1px dashed #000; margin: 2mm 0; }
.meta { font-size: 10px; text-align: left; margin-bottom: 1mm; }
.items { text-align: left; }
.item { margin-bottom: 2mm; }
.item-name { font-weight: bold; }
.item-calc { display: flex; justify-content: space-between; font-size: 10px; }
.price { font-weight: bold; }
.total-box { border: 2px solid #000; padding: 2mm; margin: 2mm 0; text-align: center; }
.total-sum { font-size: 13px; font-weight: bold; }
.payment { font-size: 10px; margin: 2mm 0; }
.footer { font-size: 11px; font-weight: bold; }
.footer-sub { font-size: 9px; }
</style>
</head>
<body>

<div class="title">UNIVERSAL</div>
<div class="subtitle">Savdo markazi</div>
<div class="contacts">
 <div class="contact-item"><strong>+99893 140-00-04</strong><br>ASADBEK</div>
 <div class="contact-item"><strong>+99893 657-66-87</strong><br>RAMAZON</div>
 <div class="contact-item"><strong>+99888 866-66-59</strong><br>UYG'UNJON</div>
 <div class="contact-item"><strong>+99850 779-22-03</strong><br>OPERATOR</div>
</div>

<div class="line"></div>

<div class="meta">Sana: ${printReceipt.date}</div>
<div class="meta">Chek: #${printReceipt.receiptNumber}</div>

<div class="line"></div>

<div class="items">
${itemsHtml}
</div>

<div class="line"></div>

<div class="total-box">
 <div class="total-sum">JAMI: ${formatNum(printReceipt.total)} so'm</div>
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
 setCustomerFormData({ name: '', phone: '+998', region: '' });
 setShowCustomerModal(false);
 
 showAlert('Mijoz muvaffaqiyatli qo\'shildi!', 'Muvaffaqiyat', 'success');
 } catch (err: any) {
 console.error('Error creating customer:', err);
 const message = err.response?.data?.message || 'Mijoz qo\'shishda xatolik';
 showAlert(message, 'Xatolik', 'danger');
 }
 };

 return (
 <div className={`min-h-screen flex flex-col ${isReturnMode ? 'bg-warning-50 dark:bg-warning-900/10' : 'bg-neutral-50 dark:bg-neutral-900'}`}>
 {/* Alert Component - должен быть поверх всех модальных окон */}
 <div className="relative z-[100]">
 {AlertComponent}
 </div>
 
 {/* Toast Container */}
 <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
 
 {/* Header */}
 <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-3 sticky top-0 z-40 shadow-sm">
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
 <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
 {isReturnMode ? tKey('Qaytarish rejimi') : tKey('Kassa (POS)')}
 </h1>
 <p className="text-sm font-semibold">
 <span className="text-neutral-600 dark:text-neutral-400">{cart.length} {tKey('ta mahsulot')}</span>
 <span className="mx-2 text-neutral-300 dark:text-neutral-600">•</span>
 <span className="text-pink-600 dark:text-pink-400 font-bold">{total.toLocaleString()} {tKey("so'm")}</span>
 </p>
 </div>
 </div>

 {/* Customer Select & Saved Receipts */}
 <div className="flex items-center gap-2">
 {/* Customer Select */}
 <div className="flex items-center gap-2">
 <button
 onClick={() => setShowCustomerSelect(true)}
 className="relative flex items-center gap-2 px-3 py-2.5 bg-neutral-50 border-2 border-neutral-200 rounded-lg text-sm font-semibold text-neutral-900 hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all min-w-[250px]"
 >
 <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
 <div className="flex-1 text-left min-w-0">
 {selectedCustomer ? (
 <>
 <div className="truncate font-bold leading-tight">
 {customers.find(c => c._id === selectedCustomer)?.name || tKey("Oddiy mijoz")}
 </div>
 {customers.find(c => c._id === selectedCustomer)?.phone && (
 <div className="text-xs text-neutral-500 truncate leading-tight">
 {customers.find(c => c._id === selectedCustomer)?.phone}
 </div>
 )}
 </>
 ) : (
 <div className="truncate leading-tight">{tKey("Oddiy mijoz")}</div>
 )}
 </div>
 <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
 </svg>
 </button>
 <button
 onClick={() => setShowCustomerModal(true)}
 className="flex items-center justify-center w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all hover:scale-105 shadow-md"
 title="Yangi mijoz qo'shish"
 >
 <span className="text-xl font-bold leading-none">+</span>
 </button>
 </div>

 <button
 onClick={() => setShowSavedReceipts(true)}
 className="relative flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all hover:scale-105" 
 >
 <Save className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
 <span className="text-neutral-700 dark:text-neutral-300">Saqlangan</span>
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
 <div className="flex-1 flex overflow-hidden gap-6 p-6 pb-28">{/* pb-28 для нижней панели */}
 {/* Left - Cart Section */}
 <div className="flex-1 flex flex-col overflow-hidden">
 {/* Table */}
 <div className="flex flex-1 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex-col shadow-sm">
 {/* Table Wrapper with Horizontal Scroll */}
 <div className="flex-1 overflow-x-auto overflow-y-auto">
 <div className="min-w-[1000px]">{/* Минимальная ширина для таблицы */}
 {/* Table Header */}
 <div className="grid grid-cols-12 gap-3 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-neutral-200 dark:border-neutral-600">
 <div className="col-span-1 text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">{tKey("Kod")}</div>
 <div className="col-span-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">{tKey("MAHSULOT")}</div>
 <div className="col-span-1 text-center text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">{tKey("OMBOR")}</div>
 <div className="col-span-1 text-right text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">{tKey("TAN NARX")}</div>
 <div className="col-span-2 text-center text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">{tKey("SONI")}</div>
 <div className="col-span-2 text-right text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">{tKey("NARX")}</div>
 <div className="col-span-2 text-right text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">{tKey("SUMMA")}</div>
 <div className="col-span-1 text-center text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">{tKey("AMAL")}</div>
 </div>

 {/* Table Body */}
 {cart.length === 0 ? (
 <div className="flex items-center justify-center h-full text-neutral-400 py-20">
 <div className="text-center">
 <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
 <Package className="w-10 h-10 opacity-50" />
 </div>
 <p className="text-lg font-medium">{tKey("Savat bo'sh")}</p>
 <p className="text-sm text-neutral-400 mt-1">{tKey("Mahsulot qo'shish uchun qidiring")}</p>
 </div>
 </div>
 ) : (
 <div className="divide-y divide-neutral-100">
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
 showAlert={showAlert}
 showToast={(title, message) => toast.warning(title, message, 4000)}
 />
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Right - Numpad & Total */}
 <div className="flex w-96 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 flex-col shadow-sm">
 {/* Total Display */}
 <div className="total-display mb-4 p-5 bg-gradient-to-br from-blue-50 via-sky-50 to-white dark:from-blue-900/30 dark:via-blue-800/20 dark:to-gray-800 rounded-3xl border-2 border-blue-200 dark:border-blue-700 shadow-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/40 dark:bg-blue-600/20 rounded-full -mr-12 -mt-12"></div>
 <div className="absolute bottom-0 left-0 w-20 h-20 bg-sky-100/40 dark:bg-sky-600/20 rounded-full -ml-10 -mb-10"></div>
 <div className="relative z-10">
 <p className="text-sm font-black mb-2 uppercase tracking-widest flex items-center gap-2">
 <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
 <span style={{ color: '#1e3a8a' }}>{tKey("JAMI SUMMA")}</span>
 </p>
 <p className="text-4xl font-black" style={{ color: '#1e3a8a !important' }}>
 <span style={{ color: '#1e3a8a' }}>{total.toLocaleString()}</span>
 <span className="text-xl ml-2 font-bold" style={{ color: '#2563eb' }}> so'm</span>
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
 className="modern-input w-full px-4 py-4 text-center text-xl font-mono font-bold bg-white dark:bg-neutral-700 border-2 border-blue-300 dark:border-neutral-600 rounded-2xl mb-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 transition-all shadow-md"
 style={{ color: '#1e3a8a' }}
 />

 {/* Numpad */}
 <div className="grid grid-cols-4 gap-2">
 {['7', '8', '9', 'C', '4', '5', '6','⌫', '1', '2', '3', '+', '0', '00', '.'].map((key) => (
 <button
 key={key}
 onClick={() => handleNumpadClick(key)}
 className={`
 numpad-button flex items-center justify-center rounded-xl text-xl font-black transition-all shadow-md hover:shadow-lg
 ${key === 'C' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700' : ''}
 ${key === '⌫' ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700' : ''}
 ${key === '+' ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 row-span-2' : ''}
 ${!['C', '⌫', '+'].includes(key) ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-neutral-900 dark:text-neutral-100 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 border border-neutral-200 dark:border-neutral-600' : ''}
 ${key === '+' ? 'h-full' : 'h-14'}
 `}
 >
 {key === '⌫' ? <Delete className="w-5 h-5" /> : key}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Bottom Action Bar - Fixed - Responsive to sidebar */}
 <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-800 border-t border-neutral-200 dark:border-neutral-700 shadow-lg z-20 transition-all duration-300 pl-0 lg:pl-64">
 <div className="px-6 py-2">
 <div className="flex items-center gap-2">
 {/* Action Buttons - Responsive positioning */}
 <button
 onClick={openSearch}
 className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all font-semibold text-sm shadow-md hover:shadow-lg active:scale-95"
 >
 <Search className="w-4 h-4" strokeWidth={2.5} />
 <span>Qidirish</span>
 </button>
 
 <button
 onClick={toggleReturnMode}
 className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 ${
 isReturnMode
 ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
 : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900'
 }`}
 >
 <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
 <span>{isReturnMode ? 'Bekor qilish' : 'Qaytarish'}</span>
 </button>
 
 <button
 onClick={saveReceipt}
 className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all font-semibold text-sm shadow-md hover:shadow-lg active:scale-95"
 >
 <Save className="w-4 h-4" strokeWidth={2.5} />
 <span>Saqlash</span>
 </button>

 {/* Spacer */}
 <div className="flex-1"></div>

 {/* Payment Button - Always on right */}
 <button
 onClick={() => setShowPayment(true)}
 disabled={cart.length === 0}
 className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-lg hover:shadow-xl active:scale-95"
 >
 <CreditCard className="w-5 h-5" strokeWidth={2.5} />
 <span>To'lov qilish</span>
 </button>
 </div>
 </div>
 </div>

 {/* Search Modal */}
 {showSearch && (
 <div className="fixed inset-0 z-50 flex items-start lg:items-center justify-center pt-4 lg:pt-0 px-4">
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowSearch(false)} />
 <div className="bg-white dark:bg-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in border-2 border-red-200">
 {/* Header */}
 <div className="p-6 bg-white dark:bg-neutral-800">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
 <Search className="w-8 h-8 text-white" strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-2xl font-black text-slate-900 dark:text-neutral-100 mb-1">{tKey("Mahsulot qidirish")}</h3>
 <p className="text-sm font-bold text-slate-700 dark:text-neutral-400">{tKey("Nom yoki kod bo'yicha toping")}</p>
 </div>
 </div>
 <button
 onClick={() => setShowSearch(false)}
 className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
 >
 <X className="w-6 h-6 text-slate-600 dark:text-neutral-400" strokeWidth={2.5} />
 </button>
 </div>
 <div className="relative flex items-center">
 <Search className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
 <input
 type="text"
 placeholder={tKey("Mahsulot nomi yoki kodi...")}
 value={searchQuery}
 onChange={e => handleSearch(e.target.value)}
 className="w-full pl-12 pr-4 py-4 text-base font-semibold bg-white dark:bg-neutral-700 border-2 border-red-300 dark:border-neutral-600 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 transition-all"
 autoFocus
 />
 </div>
 </div>
 {/* Results */}
 <div className="flex-1 overflow-auto p-4 bg-white dark:bg-neutral-800">
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
 <p className="text-lg font-bold text-slate-900 dark:text-neutral-100">{tKey("Mahsulot topilmadi")}</p>
 <p className="text-sm font-semibold text-slate-600 dark:text-neutral-400 mt-1">{tKey("Boshqa nom yoki kod bilan qidiring")}</p>
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
 <p className="font-black text-slate-900 dark:text-neutral-100 truncate mb-1">{product.name}</p>
 <p className="text-xs text-slate-600 dark:text-neutral-400 font-bold mb-2">Kod: {product.code}</p>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-slate-600">Tan:</span>
 <span className="text-sm font-bold text-slate-700 dark:text-neutral-400">
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
 <div className="bg-white dark:bg-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-scaleIn border-4 border-white/20">
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
 <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">so'm</span>
 </div>
 </div>
 </div>
 </div>

 {/* Payment Options */}
 <div className="px-6 pb-6 space-y-4 bg-white dark:bg-neutral-900">
 <button 
 onClick={() => setShowPayment(true)} 
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
 <p className="text-2xl font-black text-white drop-shadow">{isReturnMode ? 'Qaytarishni tasdiqlash' : "To'lov qilish"}</p>
 <p className="text-sm text-white/80 font-semibold">Naqd, karta yoki qarz</p>
 </div>
 <span className="text-4xl group-hover:scale-110 transition-transform">💰</span>
 </div>
 </button>
 </div>
 </div>
 </div>
 )}
 
 {/* Payment Modal */}
 {showPayment && (
 <PaymentModal
 total={totalAmount}
 customerName={customers.find(c => c._id === selectedCustomer)?.name}
 customerId={selectedCustomer}
 onConfirm={handlePayment}
 onClose={() => setShowPayment(false)}
 />
 )}

 {/* Return Search Modal */}
 {showReturnSearch && (
 <div className="fixed inset-0 z-50 flex items-start lg:items-center justify-center pt-4 lg:pt-0 px-4">
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => { setShowReturnSearch(false); if (cart.length === 0) setIsReturnMode(false); }} />
 <div className="bg-white dark:bg-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in border-2 border-warning-200">
 {/* Header */}
 <div className="p-6 bg-white dark:bg-neutral-800">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 bg-warning-500 rounded-2xl flex items-center justify-center shadow-lg">
 <RotateCcw className="w-8 h-8 text-white" strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-2xl font-black text-slate-900 dark:text-neutral-100 mb-1">Qaytarish rejimi</h3>
 <p className="text-sm font-bold text-slate-700 dark:text-neutral-400">Qaytariladigan tovarni tanlang</p>
 </div>
 </div>
 <button
 onClick={() => { setShowReturnSearch(false); if (cart.length === 0) setIsReturnMode(false); }}
 className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
 >
 <X className="w-6 h-6 text-slate-600 dark:text-neutral-400" strokeWidth={2.5} />
 </button>
 </div>
 <div className="relative flex items-center">
 <Search className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
 <input
 type="text"
 placeholder="Tovar nomi yoki kodi..."
 value={returnSearchQuery}
 onChange={e => handleReturnSearch(e.target.value)}
 className="w-full pl-12 pr-4 py-4 text-base font-semibold bg-white dark:bg-neutral-700 border-2 border-warning-300 dark:border-neutral-600 rounded-2xl focus:outline-none focus:border-warning-500 focus:ring-4 focus:ring-warning-500/20 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 transition-all"
 autoFocus
 />
 </div>
 </div>
 {/* Results */}
 <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-neutral-800">
 {searchResults.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12">
 <div className="w-20 h-20 bg-warning-100 dark:bg-warning-900/30 rounded-2xl flex items-center justify-center mb-4">
 <AlertTriangle className="w-10 h-10 text-warning-500" />
 </div>
 <p className="text-lg font-bold text-slate-900 dark:text-neutral-100">Tovar topilmadi</p>
 <p className="text-sm font-semibold text-slate-600 dark:text-neutral-400 mt-1">Boshqa nom yoki kod bilan qidiring</p>
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
 <p className="font-black text-slate-900 dark:text-neutral-100 truncate mb-1">{product.name}</p>
 <p className="text-xs text-slate-600 dark:text-neutral-400 font-bold mb-2">Kod: {product.code}</p>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-slate-600">Tan:</span>
 <span className="text-sm font-bold text-slate-700 dark:text-neutral-400">
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
 <div className="bg-white dark:bg-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
 {/* Header */}
 <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-neutral-500 rounded-2xl flex items-center justify-center shadow-lg">
 <Save className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Saqlangan cheklar</h3>
 <p className="text-sm text-neutral-600 dark:text-neutral-400">{savedReceipts.length} ta chek</p>
 </div>
 </div>
 <button
 onClick={() => setShowSavedReceipts(false)}
 className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/50 dark:hover:bg-neutral-700 transition-colors"
 >
 <X className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
 </button>
 </div>
 </div>
 {/* Content */}
 <div className="flex-1 overflow-auto p-4">
 {savedReceipts.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
 <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-700 rounded-2xl flex items-center justify-center mb-4">
 <Save className="w-10 h-10 opacity-50" />
 </div>
 <p className="text-lg font-medium">Saqlangan cheklar yo'q</p>
 <p className="text-sm mt-1">Chekni saqlash uchun "Saqlash" tugmasini bosing</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {savedReceipts.map(receipt => (
 <div key={receipt.id} className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl border-2 border-neutral-200 dark:border-neutral-600 hover:border-primary-500 transition-all hover:shadow-lg">
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
 <Package className="w-4 h-4 text-primary-600 dark:text-primary-400" />
 </div>
 <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
 {receipt.items.length} ta mahsulot
 </span>
 </div>
 <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{receipt.savedAt}</p>
 <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
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
 <div className="bg-white dark:bg-neutral-800 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-scaleIn border-4 border-white/20">
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
 <div className="p-6 font-mono text-sm bg-neutral-50 dark:bg-neutral-900">
 <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border-2 border-neutral-200 dark:border-neutral-700 shadow-inner">
 <div className="text-center border-b-2 border-dashed border-neutral-300 dark:border-neutral-600 pb-4 mb-4">
 <h2 className="text-2xl font-black tracking-widest text-neutral-900 dark:text-neutral-100 mb-1">UNIVERSAL</h2>
 <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Savdo markazi</p>
 <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-400 text-left mx-auto" style={{ maxWidth: '200px' }}>
 <div><strong className="font-bold">+99893 140-00-04</strong><br />ASADBEK</div>
 <div><strong className="font-bold">+99893 657-66-87</strong><br />RAMAZON</div>
 <div><strong className="font-bold">+99888 866-66-59</strong><br />UYG'UNJON</div>
 <div><strong className="font-bold">+99850 779-22-03</strong><br />OPERATOR</div>
 </div>
 </div>
 
 <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400 mb-4">
 <p>Sana: {printReceipt.date}</p>
 <p>Chek: #{printReceipt.receiptNumber}</p>
 </div>
 
 <div className="border-t border-dashed border-neutral-300 dark:border-neutral-600 pt-3 mb-3">
 <div className="space-y-3">
 {printReceipt.items.map((item, i) => (
 <div key={i} className="space-y-1">
 <div className="font-bold text-neutral-900 dark:text-neutral-100">{i + 1}. {item.name}</div>
 <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
 <span>{item.quantity} x {item.price.toLocaleString()}</span>
 <span className="font-bold text-neutral-700 dark:text-neutral-300">{(item.price * item.quantity).toLocaleString()}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 
 <div className="border-t-2 border-neutral-900 dark:border-neutral-100 pt-3 mb-3">
 <div className="text-center">
 <span className="text-xl font-black text-neutral-900 dark:text-neutral-100">JAMI: {printReceipt.total.toLocaleString()} so'm</span>
 </div>
 </div>
 
 <div className="text-center py-2 bg-neutral-100 dark:bg-neutral-700 rounded-xl">
 <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
 To'lov: {printReceipt.paymentMethod === 'cash' ? '💵 Naqd pul' : '💳 Plastik karta'}
 </p>
 </div>
 
 <div className="text-center mt-4 pt-4 border-t border-dashed border-neutral-300 dark:border-neutral-600">
 <p className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">Xaridingiz uchun rahmat!</p>
 <p className="text-xs text-neutral-500 dark:text-neutral-400">Yana kutamiz! 😊</p>
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="p-6 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex gap-3">
 <button
 onClick={handlePrint}
 className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all hover:scale-105 shadow-lg"
 >
 <Printer className="w-5 h-5" />
 Chop etish
 </button>
 <button
 onClick={() => setShowReceipt(false)}
 className="flex-1 py-4 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-2xl font-bold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all"
 >
 Yopish
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Customer Select Modal */}
 {showCustomerSelect && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div 
 className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
 onClick={() => setShowCustomerSelect(false)} 
 />
 <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in border-2 border-red-200">
 {/* Header */}
 <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
 <User className="w-6 h-6 text-white" strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-lg font-black text-neutral-900 mb-0.5">Mijozni tanlang</h3>
 <p className="text-xs font-semibold text-neutral-700">Ism yoki telefon bo'yicha qidiring</p>
 </div>
 </div>
 <button
 onClick={() => setShowCustomerSelect(false)}
 className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 transition-colors"
 >
 <X className="w-5 h-5 text-neutral-600" strokeWidth={2.5} />
 </button>
 </div>
 <div className="relative flex items-center">
 <Search className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
 <input
 type="text"
 placeholder="Mijoz ismi yoki telefon raqami..."
 value={customerSearchQuery}
 onChange={(e) => setCustomerSearchQuery(e.target.value)}
 className="w-full pl-10 pr-3 py-3 text-sm font-semibold bg-white border-2 border-red-300 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-neutral-900 placeholder:text-neutral-400 transition-all"
 autoFocus
 />
 </div>
 </div>
 
 {/* Results */}
 <div className="flex-1 overflow-auto p-3 bg-neutral-50">
 {/* Oddiy mijoz option */}
 <button
 onClick={() => {
 setSelectedCustomer('');
 setShowCustomerSelect(false);
 setCustomerSearchQuery('');
 }}
 className={`w-full flex items-center gap-3 p-3 mb-2 rounded-xl transition-all text-left border-2 hover:shadow-md group ${
 selectedCustomer === '' 
 ? 'bg-red-500 border-red-600 shadow-md' 
 : 'bg-white border-neutral-300 hover:border-red-400'
 }`}
 >
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
 selectedCustomer === '' 
 ? 'bg-white/20' 
 : 'bg-red-100'
 }`}>
 <User className={`w-5 h-5 ${
 selectedCustomer === '' 
 ? 'text-white' 
 : 'text-red-600'
 }`} strokeWidth={2.5} />
 </div>
 <div className="flex-1">
 <p className={`text-sm font-black ${
 selectedCustomer === '' 
 ? 'text-white' 
 : 'text-neutral-900'
 }`}>
 {tKey("Oddiy mijoz")}
 </p>
 <p className={`text-xs font-medium ${
 selectedCustomer === '' 
 ? 'text-white/90' 
 : 'text-neutral-600'
 }`}>
 Doimiy mijoz emas
 </p>
 </div>
 {selectedCustomer === '' && (
 <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
 <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
 </div>
 )}
 </button>

 {/* Customer list */}
 <div className="space-y-2">
 {customers
 .filter(customer => {
 const query = customerSearchQuery.toLowerCase();
 return customer.name.toLowerCase().includes(query) || 
 customer.phone.toLowerCase().includes(query);
 })
 .map(customer => (
 <button
 key={customer._id}
 onClick={() => {
 setSelectedCustomer(customer._id);
 setShowCustomerSelect(false);
 setCustomerSearchQuery('');
 }}
 className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border-2 hover:shadow-md group ${
 selectedCustomer === customer._id 
 ? 'bg-red-500 border-red-600 shadow-md' 
 : 'bg-white border-neutral-300 hover:border-red-400'
 }`}
 >
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
 selectedCustomer === customer._id 
 ? 'bg-white/20' 
 : 'bg-red-100'
 }`}>
 <User className={`w-5 h-5 ${
 selectedCustomer === customer._id 
 ? 'text-white' 
 : 'text-red-600'
 }`} strokeWidth={2.5} />
 </div>
 <div className="flex-1 min-w-0">
 <p className={`text-sm font-black truncate ${
 selectedCustomer === customer._id 
 ? 'text-white' 
 : 'text-neutral-900'
 }`}>
 {customer.name}
 </p>
 <div className="flex items-center gap-1.5">
 <Phone className={`w-3 h-3 ${
 selectedCustomer === customer._id 
 ? 'text-white/90' 
 : 'text-neutral-600'
 }`} />
 <p className={`text-xs font-semibold ${
 selectedCustomer === customer._id 
 ? 'text-white' 
 : 'text-neutral-900'
 }`}>
 {customer.phone}
 </p>
 </div>
 {customer.address && (
 <p className={`text-xs font-medium mt-0.5 ${
 selectedCustomer === customer._id 
 ? 'text-white/80' 
 : 'text-neutral-600'
 }`}>
 {customer.address}
 </p>
 )}
 </div>
 {selectedCustomer === customer._id && (
 <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
 <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
 </div>
 )}
 </button>
 ))}
 </div>

 {customers.filter(customer => {
 const query = customerSearchQuery.toLowerCase();
 return customer.name.toLowerCase().includes(query) || 
 customer.phone.toLowerCase().includes(query);
 }).length === 0 && customerSearchQuery && (
 <div className="flex flex-col items-center justify-center py-12">
 <div className="w-20 h-20 bg-neutral-200 rounded-2xl flex items-center justify-center mb-4">
 <User className="w-10 h-10 text-neutral-400" />
 </div>
 <p className="text-lg font-bold text-neutral-900">Mijoz topilmadi</p>
 <p className="text-sm font-semibold text-neutral-600 mt-1">Boshqa ism yoki telefon bilan qidiring</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Customer Modal */}
 {showCustomerModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div 
 className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
 onClick={() => setShowCustomerModal(false)} 
 />
 <div className="bg-white dark:bg-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl relative z-10 animate-scaleIn">
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-2xl flex items-center justify-center">
 <User className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
 </div>
 <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">Yangi mijoz</h3>
 </div>
 <button
 onClick={() => {
 setShowCustomerModal(false);
 setCustomerFormData({ name: '', phone: '+998', region: '' });
 }}
 className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
 >
 <X className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
 </button>
 </div>

 {/* Form */}
 <div className="p-6 space-y-5">
 {/* Ism */}
 <div>
 <label className="block text-base font-bold text-neutral-900 dark:text-neutral-100 mb-3">
 Ism
 </label>
 <input
 type="text"
 value={customerFormData.name}
 onChange={(e) => setCustomerFormData(prev => ({ ...prev, name: e.target.value }))}
 placeholder="Mijoz ismi"
 className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-700 border-2 border-neutral-200 dark:border-neutral-600 rounded-2xl text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all"
 autoFocus
 />
 </div>

 {/* Telefon */}
 <div>
 <label className="block text-base font-bold text-neutral-900 dark:text-neutral-100 mb-3">
 Telefon
 </label>
 <PhoneInput
 value={customerFormData.phone}
 onChange={(phone) => setCustomerFormData(prev => ({ ...prev, phone }))}
 />
 </div>

 {/* Viloyat */}
 <div>
 <label className="block text-base font-bold text-neutral-900 dark:text-neutral-100 mb-3">
 Viloyat
 </label>
 <div className="relative">
 <select
 value={customerFormData.region}
 onChange={(e) => setCustomerFormData(prev => ({ ...prev, region: e.target.value }))}
 className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-700 border-2 border-neutral-200 dark:border-neutral-600 rounded-2xl text-base text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
 >
 <option value="">Viloyatni tanlang</option>
 {regionNames.map((region) => (
 <option key={region} value={region}>
 {region}
 </option>
 ))}
 </select>
 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
 <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
 </svg>
 </div>
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="p-6 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex gap-3">
 <button
 onClick={() => {
 setShowCustomerModal(false);
 setCustomerFormData({ name: '', phone: '+998', region: '' });
 }}
 className="flex-1 py-4 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-2xl font-bold hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-all border-2 border-neutral-200 dark:border-neutral-600"
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
