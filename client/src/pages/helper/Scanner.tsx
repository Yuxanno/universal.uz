import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Search, Send, Plus, Package, ShoppingCart, CheckCircle, Loader2, Trash2, Tag, X, Minus } from 'lucide-react';
import { Product, CartItem } from '../../types';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/ToastContainer';

interface CartItemWithOriginalPrice extends CartItem {
 originalPrice?: number;
}

export default function HelperScanner() {
 const { showAlert, AlertComponent } = useAlert();
 const toast = useToast();
 const [scanning, setScanning] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [cart, setCart] = useState<CartItemWithOriginalPrice[]>([]);
 const [products, setProducts] = useState<Product[]>([]);
 const [searchResults, setSearchResults] = useState<Product[]>([]);
 const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
 const [sending, setSending] = useState(false);
 const [syncing, setSyncing] = useState(false);
 const [receiptStatus, setReceiptStatus] = useState<'draft' | 'pending'>('draft');
 const [lastSyncedCart, setLastSyncedCart] = useState<string>('');
 void lastSyncedCart; // Used for cart sync tracking
 const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
 const [showArchive, setShowArchive] = useState(false);
 const [archivedReceipts, setArchivedReceipts] = useState<any[]>([]);
 const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);
 const [showCustomerModal, setShowCustomerModal] = useState(false);
 const [sendToArchive, setSendToArchive] = useState(false);
 const [selectedCustomer, setSelectedCustomer] = useState<string>('');
 const [customers, setCustomers] = useState<any[]>([]);
 const [customerSearchQuery, setCustomerSearchQuery] = useState('');
 const scannerRef = useRef<Html5Qrcode | null>(null);
 const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const hasLocalChanges = useRef(false);
 const isFirstLoad = useRef(true);
 const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const isLoadingFromArchive = useRef(false); // Flag to prevent sync when loading from archive

 useEffect(() => {
 const init = async () => {
 try {
 const [productsRes, customersRes] = await Promise.all([
 api.get('/products'),
 api.get('/customers')
 ]);
 setProducts(productsRes.data);
 setCustomers(customersRes.data);
 // Don't load draft on initial load
 } catch (err) {
 console.error('Error fetching data:', err);
 }
 };
 init();
 
 return () => {
 if (checkIntervalRef.current) {
 clearInterval(checkIntervalRef.current);
 }
 if (scannerRef.current) {
 try {
 const state = scannerRef.current.getState();
 if (state === 2) { // 2 = SCANNING state
 scannerRef.current.stop().catch(() => {
 // Ignore errors during cleanup
 });
 }
 } catch (err) {
 // Ignore errors - scanner might already be stopped
 }
 }
 if (syncTimeoutRef.current) {
 clearTimeout(syncTimeoutRef.current);
 }
 };
 }, []);

 // Синхронизация корзины на сервер
 const syncToServer = useCallback(async (items: CartItemWithOriginalPrice[]) => {
 if (receiptStatus === 'pending') return;
 
 setSyncing(true);
 try {
 const serverItems = items.map(item => ({
 product: item._id,
 name: item.name,
 code: item.code,
 price: item.price,
 quantity: item.cartQuantity
 }));
 
 const res = await api.put('/receipts/draft', { 
 items: serverItems,
 draftId: currentDraftId,
 status: 'archived' // Always save as archived (no draft status)
 });
 
 // Update draft ID if it changed
 if (res.data._id) {
 setCurrentDraftId(res.data._id);
 }
 
 // Сохраняем что синхронизировали
 setLastSyncedCart(JSON.stringify(serverItems));
 hasLocalChanges.current = false;
 } catch (err) {
 console.error('Error syncing draft:', err);
 } finally {
 setSyncing(false);
 }
 }, [receiptStatus, currentDraftId]);

 // Отложенная синхронизация при изменении корзины
 useEffect(() => {
 // Пропускаем первую загрузку
 if (isFirstLoad.current) return;
 if (receiptStatus === 'pending') return;
 // Skip sync when loading from archive
 if (isLoadingFromArchive.current) {
 isLoadingFromArchive.current = false;
 return;
 }
 
 // Отмечаем что есть локальные изменения
 hasLocalChanges.current = true;
 
 // Отменяем предыдущий таймер
 if (syncTimeoutRef.current) {
 clearTimeout(syncTimeoutRef.current);
 }
 
 // Синхронизируем через 300ms (быстрее для real-time)
 syncTimeoutRef.current = setTimeout(() => {
 syncToServer(cart);
 }, 300);
 
 }, [cart, syncToServer, receiptStatus]);

 const startScanner = async () => {
 setScannedProduct(null);
 setSearchQuery('');
 setSearchResults([]);
 setScanning(true);

 setTimeout(async () => {
 try {
 const html5QrCode = new Html5Qrcode('qr-reader');
 scannerRef.current = html5QrCode;
 
 console.log('🎥 Starting QR scanner...');
 
 // Get available cameras and prefer back camera
 const cameras = await Html5Qrcode.getCameras();
 const backCamera = cameras.find(cam => 
 cam.label.toLowerCase().includes('back') || 
 cam.label.toLowerCase().includes('rear') ||
 cam.label.toLowerCase().includes('environment')
 );
 
 const cameraId = backCamera?.id || { facingMode: 'environment' };
 
 await html5QrCode.start(
 cameraId,
 { 
 fps: 30, // Increased from 10 to 30 for faster scanning
 qrbox: function(viewfinderWidth, viewfinderHeight) {
 // Dynamic qrbox size based on screen
 const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
 const qrboxSize = Math.floor(minEdge * 0.7); // 70% of smaller dimension
 return {
 width: qrboxSize,
 height: qrboxSize
 };
 },
 aspectRatio: 1.0,
 disableFlip: false // Allow flipping for better detection
 },
 (decodedText) => {
 console.log('✅ QR Code scanned:', decodedText);
 let product = null;

 try {
 const parsed = JSON.parse(decodedText);
 console.log('📦 Parsed QR data:', parsed);
 if (parsed.code) {
 product = products.find(p => p.code === parsed.code);
 } else if (parsed._id || parsed.id) {
 product = products.find(p => p._id === (parsed._id || parsed.id));
 }
 } catch (parseErr) {
 console.log('📝 QR is plain text, searching by code:', decodedText);
 product = products.find(p => p.code === decodedText);
 }

 if (product) {
 console.log('✅ Product found:', product.name);
 setScannedProduct(product);
 toast.success('Tovar topildi!', product.name);
 } else {
 console.log('❌ Product not found for:', decodedText);
 showAlert('Tovar topilmadi: ' + decodedText, 'Xatolik', 'warning');
 }
 stopScanner();
 },
 (_errorMessage) => {
 // Scan error - ignore (happens frequently)
 }
 );
 
 console.log('✅ QR scanner started successfully');
 } catch (err: any) {
 console.error('❌ Scanner error:', err);
 showAlert('Kamerani ishga tushirishda xatolik: ' + err.message, 'Xatolik', 'danger');
 setScanning(false);
 }
 }, 100);
 };

 const stopScanner = async () => {
 if (scannerRef.current) {
 try {
 const state = scannerRef.current.getState();
 if (state === 2) { // 2 = SCANNING state
 await scannerRef.current.stop();
 }
 } catch (err) {
 // Ignore errors - scanner might already be stopped
 }
 scannerRef.current = null;
 }
 setScanning(false);
 };

 const handleSearch = (query: string) => {
 setSearchQuery(query);
 setScannedProduct(null);
 if (query.length > 0) {
 const results = products.filter(p =>
 p.name.toLowerCase().includes(query.toLowerCase()) ||
 p.code.toLowerCase().includes(query.toLowerCase())
 );
 setSearchResults(results);
 } else {
 setSearchResults([]);
 }
 };

 const addToCart = (product: Product) => {
 // Don't allow adding if receipt is pending
 if (receiptStatus === 'pending') {
 showAlert('Chek yuborilgan, o\'zgartirish mumkin emas', 'Ogohlantirish', 'warning');
 return;
 }
 
 // Mark that we're no longer in first load (enable auto-sync)
 isFirstLoad.current = false;
 
 setCart(prev => {
 const existing = prev.find(p => p._id === product._id);
 if (existing) {
 return prev.map(p => p._id === product._id ? { ...p, cartQuantity: p.cartQuantity + 1 } : p);
 }
 // Add with empty price input, store dona_narx separately
 return [...prev, { 
 ...product, 
 cartQuantity: 1, 
 price: 0, // Пустой инпут
 originalPrice: product.dona_narx || product.price, // Сохраняем dona_narx
 optom_narx: product.price || product.optom_narx // Для валидации
 }];
 });
 setSearchQuery(''); // Очищаем поисковый инпут
 setSearchResults([]);
 setScannedProduct(null);
 };

 const removeFromCart = useCallback(async (id: string) => {
 // Don't allow removing if receipt is pending
 if (receiptStatus === 'pending') {
 showAlert('Chek yuborilgan, o\'zgartirish mumkin emas', 'Ogohlantirish', 'warning');
 return;
 }
 
 const newCart = cart.filter(item => item._id !== id);
 setCart(newCart);
 
 // If cart becomes empty, delete the receipt from archive
 if (newCart.length === 0 && currentDraftId) {
 try {
 await api.delete(`/receipts/${currentDraftId}`);
 setCurrentDraftId(null);
 console.log('🗑️ Receipt deleted from archive (cart empty)');
 } catch (err) {
 console.error('Error deleting empty receipt:', err);
 }
 }
 }, [receiptStatus, showAlert, cart, currentDraftId]);

 const loadArchive = async () => {
 try {
 console.log('📦 [Helper] Loading archived receipts...');
 const res = await api.get('/receipts/my-archived');
 console.log('📦 [Helper] Archived receipts loaded:', {
 count: res.data.length,
 receipts: res.data
 });
 setArchivedReceipts(res.data);
 } catch (err) {
 console.error('❌ [Helper] Error loading archive:', err);
 }
 };

 useEffect(() => {
 if (showArchive) {
 loadArchive();
 }
 }, [showArchive]);

 const sendToCashier = async () => {
 if (cart.length === 0) return;
 
 // If customer already selected, send directly without modal
 if (selectedCustomer) {
 setSending(true);
 try {
 await api.put('/receipts/draft', {
 items: cart.map(item => ({
 product: item._id,
 name: item.name,
 code: item.code,
 price: item.price || 0,
 quantity: item.cartQuantity
 })),
 customer: selectedCustomer,
 draftId: currentDraftId,
 status: 'pending' // Change status to pending when sending to cashier
 });
 
 showAlert("Chek kassaga yuborildi!", 'Muvaffaqiyat', 'success');
 setCart([]);
 setReceiptStatus('draft');
 setSelectedCustomer('');
 setLastSyncedCart('');
 setCurrentDraftId(null);
 hasLocalChanges.current = false;
 isFirstLoad.current = true; // Reset to first load for next cart
 } catch (err: any) {
 console.error('Error sending receipt:', err);
 showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
 } finally {
 setSending(false);
 }
 } else {
 // Open customer modal
 setSendToArchive(false);
 setShowCustomerModal(true);
 }
 };

 const sendToArchiveFunc = async () => {
 if (cart.length === 0) return;
 
 // If customer already selected, save directly without modal
 if (selectedCustomer) {
 setSending(true);
 try {
 // Just save with archived status directly
 await api.put('/receipts/draft', {
 items: cart.map(item => ({
 product: item._id,
 name: item.name,
 code: item.code,
 price: item.price || 0,
 quantity: item.cartQuantity
 })),
 customer: selectedCustomer,
 draftId: currentDraftId,
 status: 'archived' // Set status to archived directly
 });
 
 showAlert("Chek arxivga saqlandi!", 'Muvaffaqiyat', 'success');
 setCart([]);
 setReceiptStatus('draft');
 setSelectedCustomer('');
 setLastSyncedCart('');
 setCurrentDraftId(null);
 hasLocalChanges.current = false;
 isFirstLoad.current = true; // Reset to first load for next cart
 loadArchive();
 } catch (err: any) {
 console.error('Error sending receipt:', err);
 showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
 } finally {
 setSending(false);
 }
 } else {
 // Open customer modal
 setSendToArchive(true);
 setShowCustomerModal(true);
 }
 };

 const handleConfirmSend = async () => {
 setSending(true);
 setShowCustomerModal(false);
 
 try {
 // Update draft with customer info and set status
 await api.put('/receipts/draft', {
 items: cart.map(item => ({
 product: item._id,
 name: item.name,
 code: item.code,
 price: item.price || 0,
 quantity: item.cartQuantity
 })),
 customer: selectedCustomer || null,
 draftId: currentDraftId,
 status: sendToArchive ? 'archived' : 'pending' // Set status based on action
 });
 
 showAlert(sendToArchive ? "Chek arxivga saqlandi!" : "Chek kassaga yuborildi!", 'Muvaffaqiyat', 'success');
 setCart([]);
 setReceiptStatus('draft');
 setSelectedCustomer('');
 setLastSyncedCart('');
 setCurrentDraftId(null);
 hasLocalChanges.current = false;
 isFirstLoad.current = true; // Reset to first load for next cart
 if (sendToArchive) {
 loadArchive(); // Reload archive only if saved to archive
 }
 } catch (err: any) {
 console.error('Error sending receipt:', err);
 showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
 } finally {
 setSending(false);
 }
 };

 const handleLoadFromArchive = async (receipt: any) => {
 try {
 // Set flag to prevent sync when loading from archive
 isLoadingFromArchive.current = true;
 
 // Save current cart to archive if not empty
 if (cart.length > 0 && currentDraftId) {
 // Current cart already has a draft ID, it will stay in archive
 console.log('💾 Current cart already saved in archive');
 }
 
 // Load archived receipt items to cart
 const items = receipt.items.map((item: any) => ({
 _id: item.product,
 name: item.name,
 code: item.code,
 price: item.price,
 cartQuantity: item.quantity,
 quantity: 0,
 originalPrice: item.price
 }));
 
 setCart(items);
 // Set customer from archived receipt
 setSelectedCustomer(receipt.customer?._id || '');
 
 // Keep the receipt ID and change status to draft (real-time updates)
 setCurrentDraftId(receipt._id);
 
 // Update status to draft so it shows as "real-time" in kassa
 await api.put('/receipts/draft', {
 items: items.map((item: any) => ({
 product: item._id,
 name: item.name,
 code: item.code,
 price: item.price,
 quantity: item.cartQuantity
 })),
 customer: receipt.customer?._id || null,
 draftId: receipt._id,
 status: 'draft' // Change from archived to draft
 });
 
 console.log('📝 Loaded receipt from archive, changed to draft status:', receipt._id);
 
 // Reload archive and close modal
 loadArchive();
 setShowArchive(false);
 
 toast.success('Xarid davom ettirilmoqda');
 } catch (err) {
 console.error('Error loading from archive:', err);
 isLoadingFromArchive.current = false; // Reset flag on error
 showAlert('Xatolik yuz berdi', 'Xatolik', 'danger');
 }
 };

 const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.cartQuantity, 0);

 // Функция для вставки dona_narx
 const fillOriginalPrice = useCallback((id: string) => {
 if (receiptStatus === 'pending') {
 showAlert('Chek yuborilgan, o\'zgartirish mumkin emas', 'Ogohlantirish', 'warning');
 return;
 }
 
 setCart(prev => prev.map(item => {
 if (item._id === id) {
 // Проверяем есть ли dona_narx
 if (!item.originalPrice || item.originalPrice === 0) {
 showAlert('Dona narx kiritilmagan!', 'Ogohlantirish', 'warning');
 return item; // Не меняем цену
 }
 
 console.log('🏷️ Filling dona narx:', {
 id: item._id,
 name: item.name,
 currentPrice: item.price,
 donaNarx: item.originalPrice
 });
 return { ...item, price: item.originalPrice };
 }
 return item;
 }));
 }, [receiptStatus, showAlert]);

 return (
 <div className="space-y-4">
 {/* Alert Component - должен быть поверх всего */}
 <div className="relative z-[100]">
 {AlertComponent}
 </div>
 
 {/* Toast Container */}
 <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
 
 {/* Search Bar */}
 <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-3">
 <div className="flex gap-2">
 <div className="relative flex items-center flex-1">
 <Search className="absolute left-3 w-4 h-4 text-surface-400 pointer-events-none" />
 <input
 type="text"
 value={searchQuery}
 onChange={e => handleSearch(e.target.value)}
 placeholder="Tovar qidirish..."
 className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-surface-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
 />
 </div>
 <button
 onClick={() => setShowArchive(true)}
 className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all"
 >
 <Package className="w-4 h-4" />
 <span className="hidden sm:inline">Arxiv</span>
 </button>
 <button
 onClick={scanning ? stopScanner : startScanner}
 className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all ${
 scanning 
 ? 'bg-gray-500 hover:bg-gray-600 text-white' 
 : 'bg-red-500 hover:bg-red-600 text-white'
 }`}
 >
 <QrCode className="w-4 h-4" />
 <span className="hidden sm:inline">{scanning ? 'Stop' : 'QR'}</span>
 </button>
 </div>
 </div>

 {/* QR Scanner - Fullscreen Modal */}
 {scanning && (
 <div className="fixed inset-0 z-50 bg-black flex flex-col m-0 p-0" style={{ marginTop: 0, paddingTop: 0 }}>
 {/* Header */}
 <div className="relative z-20 bg-gradient-to-b from-black via-black/80 to-transparent">
 <div className="safe-top px-4 py-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
 <QrCode className="w-5 h-5 text-white" />
 </div>
 <div>
 <h3 className="text-white text-lg font-bold">QR Skaner</h3>
 <p className="text-white/70 text-xs">Kodni markazga qo'ying</p>
 </div>
 </div>
 <button
 onClick={stopScanner}
 className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full transition-all"
 >
 <X className="w-6 h-6" />
 </button>
 </div>
 </div>

 {/* Scanner Container - Full Screen */}
 <div className="flex-1 relative">
 {/* Video container */}
 <div id="qr-reader" />
 
 {/* Scanning Frame Overlay - Centered */}
 <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
 <div className="relative w-64 h-64 sm:w-72 sm:h-72">
 {/* Corner Borders */}
 <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl" />
 <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl" />
 <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl" />
 <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl" />
 
 {/* Scanning Line Animation */}
 <div className="absolute inset-0 overflow-hidden">
 <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-scan" />
 </div>
 
 {/* Center Dot */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
 </div>
 </div>
 </div>

 {/* Footer Instructions */}
 <div className="relative z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
 <div className="safe-bottom px-6 py-6 space-y-3">
 <div className="flex items-center justify-center gap-2 text-white/90">
 <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
 <Package className="w-4 h-4" />
 </div>
 <p className="text-sm font-medium">QR kodni ramka ichiga joylashtiring</p>
 </div>
 <div className="flex items-center justify-center gap-4 text-white/60 text-xs">
 <span>• Yaxshi yoritilgan joy</span>
 <span>• Barqaror ushlab turing</span>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Scanned Product */}
 {scannedProduct && (
 <div className="card bg-success-50 border-success-200">
 <div className="flex items-center gap-2 mb-3">
 <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
 <CheckCircle className="w-4 h-4 text-white" />
 </div>
 <span className="font-medium text-success-700">Tovar topildi!</span>
 </div>
 <div className="flex items-center justify-between">
 <div>
 <p className="font-semibold text-surface-900 text-lg">{scannedProduct.name}</p>
 <p className="text-sm text-surface-500">Kod: {scannedProduct.code}</p>
 <p className="text-sm text-surface-500">Mavjud: {scannedProduct.quantity} dona</p>
 </div>
 <button onClick={() => addToCart(scannedProduct)} className="btn-success">
 <Plus className="w-4 h-4" />
 Qo'shish
 </button>
 </div>
 </div>
 )}

 {/* Search Results */}
 {searchQuery && searchResults.length > 0 && (
 <div className="card p-0 overflow-hidden">
 <div className="divide-y divide-surface-100 max-h-64 overflow-auto">
 {searchResults.map(product => (
 <button
 key={product._id}
 onClick={() => addToCart(product)}
 className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors text-left"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
 <Package className="w-5 h-5 text-brand-600" />
 </div>
 <div>
 <p className="font-medium text-surface-900">{product.name}</p>
 <p className="text-sm text-surface-500">Kod: {product.code}</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm text-surface-500">{product.quantity} dona</p>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {searchQuery && searchResults.length === 0 && (
 <div className="card text-center py-8 text-surface-500">
 Tovar topilmadi
 </div>
 )}

 {/* Cart */}
 <div className="card">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <ShoppingCart className="w-5 h-5 text-brand-600" />
 <span className="font-semibold text-surface-900">Savat</span>
 {syncing && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
 {hasLocalChanges.current && !syncing && (
 <span className="w-2 h-2 bg-warning-500 rounded-full animate-pulse" />
 )}
 </div>
 <div className="flex items-center gap-2">
 {receiptStatus === 'pending' && (
 <span className="badge bg-warning-100 text-warning-700 text-xs">Yuborilgan</span>
 )}
 <span className="badge-primary">{cart.length} ta</span>
 </div>
 </div>

 {receiptStatus === 'pending' && (
 <div className="bg-warning-50 border border-warning-200 rounded-xl p-3 mb-4">
 <p className="text-warning-700 text-sm text-center">
 ⏳ Chek kassirga yuborilgan. Kassir narx va miqdorni o'zgartirishi mumkin.
 </p>
 </div>
 )}

 {cart.length === 0 ? (
 <div className="text-center py-8">
 <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
 <ShoppingCart className="w-8 h-8 text-surface-300" />
 </div>
 <p className="text-surface-500">Savat bo'sh</p>
 </div>
 ) : (
 <div className="space-y-2 divide-y divide-surface-200">
 {cart.map(item => (
 <div key={item._id} className="bg-surface-50 rounded-lg p-2 hover:bg-surface-100 transition-colors pt-3 first:pt-2">
 {/* Product name and delete - full width */}
 <div className="flex items-start justify-between gap-2 mb-2">
 <div className="flex-1 min-w-0">
 <p className="font-medium text-surface-900 text-sm truncate">{item.name}</p>
 <p className="text-xs text-surface-500">Kod: {item.code}</p>
 </div>
 <button 
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 removeFromCart(item._id);
 }} 
 disabled={receiptStatus === 'pending'}
 className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded transition-colors disabled:opacity-50 flex-shrink-0"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 
 {/* Controls - compact row */}
 <div className="flex items-center gap-1.5 flex-wrap">
 {/* Tag button */}
 <button
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 if (receiptStatus === 'pending') {
 showAlert('Chek yuborilgan, o\'zgartirish mumkin emas', 'Ogohlantirish', 'warning');
 return;
 }
 fillOriginalPrice(item._id);
 }}
 disabled={receiptStatus === 'pending'}
 className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 flex-shrink-0"
 title={`Dona narx: ${item.originalPrice ? formatNumber(item.originalPrice) + ' so\'m' : 'Kiritilmagan'}`}
 >
 <Tag className="w-4 h-4" />
 </button>
 
 {/* Price input - compact */}
 <input
 type="text"
 value={item.price === 0 ? '' : formatNumber(item.price)}
 placeholder="Narx"
 onFocus={(e) => {
 e.target.dataset.prevValue = String(item.price);
 hasLocalChanges.current = true;
 }}
 onChange={(e) => {
 if (receiptStatus === 'pending') return;
 hasLocalChanges.current = true;
 const val = e.target.value.replace(/\s/g, '');
 if (val === '' || /^\d+$/.test(val)) {
 const newPrice = val === '' ? 0 : parseInt(val);
 setCart(prev => prev.map(p => 
 p._id === item._id ? { ...p, price: newPrice } : p
 ));
 }
 }}
 onBlur={() => {
 const currentPrice = item.price;
 if (currentPrice > 0 && item.optom_narx && currentPrice < item.optom_narx) {
 const optomPrice = item.optom_narx;
 setCart(prev => prev.map(p => 
 p._id === item._id ? { ...p, price: optomPrice } : p
 ));
 toast.warning(
 'Narx avtomatik ko\'tarildi',
 `Narx optom narxdan past bo'lgani uchun ${formatNumber(optomPrice)} so'mga ko'tarildi`,
 4000
 );
 }
 }}
 disabled={receiptStatus === 'pending'}
 className="w-20 h-8 text-right text-xs font-medium border border-surface-200 rounded px-2 focus:outline-none focus:border-brand-500 disabled:opacity-50 placeholder:text-surface-300 flex-shrink-0"
 />
 
 <span className="text-surface-400 flex-shrink-0 text-sm">×</span>
 
 {/* Quantity - compact */}
 <div className="flex items-center gap-0.5 bg-white border border-surface-200 rounded flex-shrink-0">
 <button
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 if (receiptStatus === 'pending') return;
 hasLocalChanges.current = true;
 const newQty = Math.max(1, item.cartQuantity - 1);
 setCart(prev => prev.map(p => 
 p._id === item._id ? { ...p, cartQuantity: newQty } : p
 ));
 }}
 disabled={receiptStatus === 'pending' || item.cartQuantity <= 1}
 className="p-1 text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-l transition-colors disabled:opacity-30"
 >
 <Minus className="w-3.5 h-3.5" />
 </button>
 
 <input
 type="text"
 value={item.cartQuantity}
 onFocus={(e) => {
 e.target.dataset.prevValue = String(item.cartQuantity);
 hasLocalChanges.current = true;
 }}
 onChange={(e) => {
 if (receiptStatus === 'pending') return;
 hasLocalChanges.current = true;
 const val = e.target.value;
 if (val === '' || /^\d+$/.test(val)) {
 const newQty = val === '' ? 0 : parseInt(val);
 setCart(prev => prev.map(p => 
 p._id === item._id ? { ...p, cartQuantity: newQty } : p
 ));
 }
 }}
 onBlur={(e) => {
 if (!item.cartQuantity || item.cartQuantity < 1) {
 const prevValue = parseInt(e.target.dataset.prevValue || '1') || 1;
 setCart(prev => prev.map(p => 
 p._id === item._id ? { ...p, cartQuantity: prevValue } : p
 ));
 }
 }}
 disabled={receiptStatus === 'pending'}
 className="w-12 h-8 text-center text-xs font-bold border-0 focus:outline-none focus:ring-0 disabled:opacity-50 bg-transparent"
 />
 
 <button
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 if (receiptStatus === 'pending') return;
 hasLocalChanges.current = true;
 const newQty = item.cartQuantity + 1;
 setCart(prev => prev.map(p => 
 p._id === item._id ? { ...p, cartQuantity: newQty } : p
 ));
 }}
 disabled={receiptStatus === 'pending'}
 className="p-1 text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-r transition-colors disabled:opacity-50"
 >
 <Plus className="w-3.5 h-3.5" />
 </button>
 </div>
 
 {/* Total - compact with smaller font for large numbers */}
 <span className={`ml-auto font-semibold text-surface-900 whitespace-nowrap flex-shrink-0 ${
 ((item.price || 0) * item.cartQuantity) > 999999 ? 'text-xs' : 'text-sm'
 }`}>
 {formatNumber((item.price || 0) * item.cartQuantity)}
 </span>
 </div>
 </div>
 ))}
 </div>
 )}

 {cart.length > 0 && (
 <div className="mt-4 pt-4 border-t border-surface-200">
 <div className="flex items-center justify-between mb-4">
 <span className="text-surface-500">Jami:</span>
 <span className={`font-bold text-surface-900 ${
 total > 9999999 ? 'text-base' : total > 999999 ? 'text-xl' : 'text-2xl'
 }`}>{formatNumber(total)} so'm</span>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={sendToCashier} 
 disabled={sending || syncing} 
 className="btn-primary flex-1 py-3 text-base font-semibold rounded-xl flex items-center justify-center gap-2"
 >
 {sending && !sendToArchive ? (
 <div className="spinner" />
 ) : (
 <>
 <Send className="w-4 h-4" />
 Kassaga
 </>
 )}
 </button>
 <button 
 onClick={sendToArchiveFunc} 
 disabled={sending || syncing} 
 className="bg-blue-500 hover:bg-blue-600 text-white flex-1 py-3 text-base font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
 >
 {sending && sendToArchive ? (
 <div className="spinner" />
 ) : (
 <>
 <Package className="w-4 h-4" />
 Arxivga
 </>
 )}
 </button>
 </div>
 </div>
 )}
 </div>
 
 {/* Customer Modal */}
 {showCustomerModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCustomerModal(false)} />
 <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
 {/* Header */}
 <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
 <h3 className="text-xl font-bold text-neutral-900">Mijozni tanlang</h3>
 <p className="text-sm text-neutral-600 mt-1">
 {sendToArchive ? 'Arxivga saqlash' : 'Kassaga yuborish'}
 </p>
 </div>
 
 {/* Search */}
 <div className="p-4 border-b border-neutral-200">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
 <input
 type="text"
 value={customerSearchQuery}
 onChange={(e) => setCustomerSearchQuery(e.target.value)}
 placeholder="Mijoz qidirish..."
 className="w-full pl-10 pr-3 py-3 text-sm font-semibold bg-neutral-50 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
 />
 </div>
 </div>
 
 {/* Customer List */}
 <div className="max-h-96 overflow-auto p-4">
 {/* Default: Oddiy mijoz */}
 <button
 onClick={() => setSelectedCustomer('')}
 className={`w-full flex items-center gap-3 p-3 mb-2 rounded-xl transition-all border-2 ${
 selectedCustomer === ''
 ? 'bg-blue-500 border-blue-600 text-white'
 : 'bg-white border-neutral-200 hover:border-blue-400'
 }`}
 >
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
 selectedCustomer === '' ? 'bg-white/20' : 'bg-blue-100'
 }`}>
 <ShoppingCart className={`w-5 h-5 ${selectedCustomer === '' ? 'text-white' : 'text-blue-600'}`} />
 </div>
 <div className="flex-1 text-left">
 <p className={`text-sm font-bold ${selectedCustomer === '' ? 'text-white' : 'text-neutral-900'}`}>
 Oddiy mijoz
 </p>
 <p className={`text-xs ${selectedCustomer === '' ? 'text-white/80' : 'text-neutral-500'}`}>
 Doimiy mijoz emas
 </p>
 </div>
 {selectedCustomer === '' && (
 <CheckCircle className="w-5 h-5 text-white" />
 )}
 </button>
 
 {/* Customer list */}
 {customers
 .filter(c => 
 c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
 c.phone.toLowerCase().includes(customerSearchQuery.toLowerCase())
 )
 .map(customer => (
 <button
 key={customer._id}
 onClick={() => setSelectedCustomer(customer._id)}
 className={`w-full flex items-center gap-3 p-3 mb-2 rounded-xl transition-all border-2 ${
 selectedCustomer === customer._id
 ? 'bg-blue-500 border-blue-600 text-white'
 : 'bg-white border-neutral-200 hover:border-blue-400'
 }`}
 >
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
 selectedCustomer === customer._id ? 'bg-white/20' : 'bg-blue-100'
 }`}>
 <ShoppingCart className={`w-5 h-5 ${selectedCustomer === customer._id ? 'text-white' : 'text-blue-600'}`} />
 </div>
 <div className="flex-1 text-left min-w-0">
 <p className={`text-sm font-bold truncate ${selectedCustomer === customer._id ? 'text-white' : 'text-neutral-900'}`}>
 {customer.name}
 </p>
 <p className={`text-xs truncate ${selectedCustomer === customer._id ? 'text-white/80' : 'text-neutral-500'}`}>
 {customer.phone}
 </p>
 </div>
 {selectedCustomer === customer._id && (
 <CheckCircle className="w-5 h-5 text-white" />
 )}
 </button>
 ))}
 </div>
 
 {/* Actions */}
 <div className="p-4 border-t border-neutral-200 flex gap-3">
 <button
 onClick={() => setShowCustomerModal(false)}
 className="flex-1 py-3 bg-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-300 transition-all"
 >
 Bekor qilish
 </button>
 <button
 onClick={handleConfirmSend}
 disabled={sending}
 className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {sending ? (
 <div className="spinner" />
 ) : (
 <>
 <CheckCircle className="w-5 h-5" />
 OK
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 )}
 
 {/* Archive Modal */}
 {showArchive && (
 <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowArchive(false)} />
 <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden h-[95vh] sm:max-h-[90vh] flex flex-col mt-auto sm:mt-0">
 {/* Header */}
 <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 flex-shrink-0">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
 <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
 </div>
 <div>
 <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Arxiv</h3>
 <p className="text-xs sm:text-sm text-neutral-600">{archivedReceipts.length} ta saqlangan xarid</p>
 </div>
 </div>
 <button
 onClick={() => setShowArchive(false)}
 className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-white/50 transition-colors flex-shrink-0"
 >
 <X className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-500" />
 </button>
 </div>
 </div>
 
 {/* Content */}
 <div className="flex-1 overflow-auto p-3 sm:p-4">
 {archivedReceipts.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
 <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
 <Package className="w-10 h-10 opacity-50" />
 </div>
 <p className="text-lg font-medium">Arxiv bo'sh</p>
 <p className="text-sm mt-1 text-center">Chala qolgan xaridlarni bu yerda saqlang</p>
 </div>
 ) : (
 <div className="space-y-3">
 {archivedReceipts.map((receipt: any) => {
 const isExpanded = expandedArchiveId === receipt._id;
 const customerName = receipt.customer?.name || 'Oddiy mijoz';
 const isPending = receipt.status === 'pending';
 const isArchived = receipt.status === 'archived';
 
 return (
 <div 
 key={receipt._id} 
 className={`bg-white border-2 rounded-2xl overflow-hidden transition-all hover:shadow-md ${
 isPending 
 ? 'border-red-300 hover:border-red-400' 
 : 'border-neutral-200 hover:border-blue-400'
 }`}
 >
 {/* Main Card - Clickable */}
 <div
 onClick={() => handleLoadFromArchive(receipt)}
 className={`p-4 cursor-pointer transition-all ${
 isPending ? 'hover:bg-red-50' : 'hover:bg-blue-50'
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3 flex-1 min-w-0">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
 isPending ? 'bg-red-100' : 'bg-blue-100'
 }`}>
 <ShoppingCart className={`w-5 h-5 ${isPending ? 'text-red-600' : 'text-blue-600'}`} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className="font-bold text-neutral-900 truncate">{customerName}</p>
 {isPending && (
 <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full whitespace-nowrap">
 Kassada
 </span>
 )}
 {isArchived && (
 <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full whitespace-nowrap">
 Arxiv
 </span>
 )}
 </div>
 <p className="text-xs text-neutral-500">
 {receipt.items.length} ta mahsulot • {formatNumber(receipt.total)} so'm
 </p>
 </div>
 </div>
 
 {/* Chevron Button */}
 <button
 onClick={(e) => {
 e.stopPropagation();
 setExpandedArchiveId(isExpanded ? null : receipt._id);
 }}
 className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0 ml-2 ${
 isPending ? 'hover:bg-red-100' : 'hover:bg-blue-100'
 }`}
 >
 <svg 
 className={`w-5 h-5 text-neutral-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
 fill="none" 
 stroke="currentColor" 
 viewBox="0 0 24 24"
 >
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </button>
 </div>
 </div>
 
 {/* Expanded Details */}
 {isExpanded && (
 <div className={`px-4 pb-4 pt-2 border-t ${
 isPending ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'
 }`}>
 <div className="space-y-2">
 <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
 <span>Sana: {new Date(receipt.createdAt).toLocaleString('uz-UZ', {
 day: '2-digit',
 month: '2-digit',
 year: 'numeric',
 hour: '2-digit',
 minute: '2-digit'
 })}</span>
 {receipt.customer?.phone && (
 <span>{receipt.customer.phone}</span>
 )}
 </div>
 
 {receipt.items.map((item: any, idx: number) => (
 <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded-lg">
 <span className="font-medium text-neutral-900 flex-1">{item.name}</span>
 <span className="text-neutral-600 ml-2">{item.quantity} × {formatNumber(item.price)}</span>
 <span className="font-bold text-neutral-900 ml-3 min-w-[80px] text-right">
 {formatNumber(item.price * item.quantity)}
 </span>
 </div>
 ))}
 
 <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-200">
 <span className="font-bold text-neutral-900">Jami:</span>
 <span className="text-xl font-black text-neutral-900">
 {formatNumber(receipt.total)} <span className="text-sm font-normal">so'm</span>
 </span>
 </div>
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 
 <div className="p-3 sm:p-4 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
 <p className="text-xs text-neutral-500 text-center">
 💡 Xaridni davom ettirish uchun card'ni bosing
 </p>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
