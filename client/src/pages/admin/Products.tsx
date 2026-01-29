import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Header from '../../components/Header';
import { Plus, Package, X, Edit, Trash2, AlertTriangle, DollarSign, QrCode, Download, Image, Upload, Printer, ArrowRightLeft } from 'lucide-react';
import { Product, Warehouse } from '../../types';
import api from '../../utils/api';
import { formatNumber, formatInputNumber, parseNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useDebounce } from '../../hooks/useDebounce';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../context/LanguageContext';
import { searchProducts } from '../../utils/productSearch';
import { initSocket } from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://pos.universalbozor.uz';

// Memoized Product Row Component for Desktop
const ProductRow = memo(({ 
 product, 
 onTransfer, 
 onQR, 
 onPrint, 
 onEdit, 
 onDelete,
 getProductImage,
 uz,
 formatNumber,
 isCashier,
 selectionMode,
 isSelected,
 onToggleSelect
}: any) => {
 return (
 <div 
 id={`product-${product._id}`}
 className={`grid gap-4 px-6 py-4 items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors ${selectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
 style={{gridTemplateColumns: selectionMode ? (isCashier ? 'auto auto 80px 1fr 110px 110px 110px 90px 140px' : 'auto auto 80px 1fr 110px 110px 110px 110px 90px 140px') : (isCashier ? 'auto 80px 1fr 110px 110px 110px 90px 140px' : 'auto 80px 1fr 110px 110px 110px 110px 90px 140px')}}
 onClick={() => selectionMode && onToggleSelect(product._id)}
 >
 {selectionMode && (
 <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
 <input
 type="checkbox"
 checked={isSelected}
 onChange={() => onToggleSelect(product._id)}
 className="w-5 h-5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
 />
 </div>
 )}
 <div>
 {getProductImage(product) ? (
 <img 
 src={getProductImage(product)!} 
 alt={product.name} 
 className="w-10 h-10 rounded-lg object-cover"
 loading="lazy"
 />
 ) : (
 <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
 <Image className="w-5 h-5 text-neutral-400" />
 </div>
 )}
 </div>
 <div>
 <span className="font-mono text-sm bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-lg">{product.code}</span>
 </div>
 <div className="min-w-0">
 <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{uz(product.name)}</p>
 </div>
 {!isCashier && (
 <div>
 <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-lg whitespace-nowrap">
 {product._warehouseName || 'N/A'}
 </span>
 </div>
 )}
 <div className="text-right">
 <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(product.costPrice || 0)}</p>
 <p className="text-sm text-neutral-500 dark:text-neutral-400">so'm</p>
 </div>
 <div className="text-right">
 <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(product.price)}</p>
 <p className="text-sm text-neutral-500 dark:text-neutral-400">so'm</p>
 </div>
 <div className="text-right">
 <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(product.dona_narx || 0)}</p>
 <p className="text-sm text-neutral-500 dark:text-neutral-400">so'm</p>
 </div>
 <div className="text-center">
 <span className={`font-semibold ${
 product.quantity === 0 ? 'text-red-600 dark:text-red-400' :
 product.quantity <= (product.minStock || 5) ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'
 }`}>{product.quantity}</span>
 </div>
 <div className="flex items-center justify-center gap-2">
 {!isCashier && (
 <button onClick={(e) => { e.stopPropagation(); onTransfer(product); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all" title="Omborga o'tkazish">
 <ArrowRightLeft className="w-4 h-4" />
 </button>
 )}
 <button onClick={(e) => { e.stopPropagation(); onQR(product); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all" title="QR kod">
 <QrCode className="w-4 h-4" />
 </button>
 <button onClick={(e) => { e.stopPropagation(); onPrint(product); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all" title="Ценник чоп этиш">
 <Printer className="w-4 h-4" />
 </button>
 <button onClick={(e) => { e.stopPropagation(); onEdit(product); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-all">
 <Edit className="w-4 h-4" />
 </button>
 <button onClick={(e) => { e.stopPropagation(); onDelete(product._id); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
});

ProductRow.displayName = 'ProductRow';

// Memoized Product Card Component for Mobile
const ProductCard = memo(({ 
 product, 
 onTransfer, 
 onQR, 
 onPrint, 
 onEdit, 
 onDelete,
 getProductImage,
 uz,
 formatNumber,
 isCashier
}: any) => {
 return (
 <div id={`product-${product._id}`} className="p-4">
 <div className="flex items-start gap-3 mb-3">
 {getProductImage(product) ? (
 <img 
 src={getProductImage(product)!} 
 alt={product.name} 
 className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
 loading="lazy"
 />
 ) : (
 <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-xl flex items-center justify-center flex-shrink-0">
 <Package className="w-8 h-8 text-neutral-400" />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">{uz(product.name)}</h4>
 <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">Kod: {product.code}</p>
 {!isCashier && (
 <span className="inline-block mt-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-lg">
 {(product as any)._warehouseName}
 </span>
 )}
 </div>
 </div>
 <div className="grid grid-cols-4 gap-2 mb-3">
 <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2">
 <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Tan narxi</p>
 <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatNumber((product as any).costPrice || 0)}</p>
 </div>
 <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2">
 <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Optom</p>
 <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(product.price)}</p>
 </div>
 <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2">
 <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Dona</p>
 <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatNumber((product as any).dona_narx || 0)}</p>
 </div>
 <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2">
 <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Miqdor</p>
 <p className={`text-sm font-bold ${
 product.quantity === 0 ? 'text-red-600 dark:text-red-400' :
 product.quantity <= (product.minStock || 5) ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'
 }`}>{product.quantity}</p>
 </div>
 </div>
 <div className="flex gap-2">
 {!isCashier && (
 <button onClick={() => onTransfer(product)} className="flex-1 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-all font-medium text-sm">
 <ArrowRightLeft className="w-4 h-4 inline mr-1" />
 Transfer
 </button>
 )}
 <button onClick={() => onQR(product)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all">
 <QrCode className="w-4 h-4" />
 </button>
 <button onClick={() => onPrint(product)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all">
 <Printer className="w-4 h-4" />
 </button>
 <button onClick={() => onEdit(product)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all">
 <Edit className="w-4 h-4" />
 </button>
 <button onClick={() => onDelete(product._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
});

ProductCard.displayName = 'ProductCard';

export default function Products() {
 const { tKey, uz } = useLanguage();
 const { showAlert, showConfirm, AlertComponent } = useAlert();
 const { user } = useAuth();
 const isCashier = user?.role === 'cashier';
 const [products, setProducts] = useState<Product[]>([]);
 const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
 const [mainWarehouse, setMainWarehouse] = useState<Warehouse | null>(null);
 const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
 void selectedWarehouse; // Used in fetchMainWarehouse
 const [showModal, setShowModal] = useState(false);
 const [showQRModal, setShowQRModal] = useState(false);
 const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
 const [showPrintModal, setShowPrintModal] = useState(false);
 const [printProduct, setPrintProduct] = useState<Product | null>(null);
 const [printQuantity, setPrintQuantity] = useState('1');
 const [printCodePrefix, setPrintCodePrefix] = useState('');
 const [printing, setPrinting] = useState(false);
 const [showPriceOnLabel, setShowPriceOnLabel] = useState(() => {
 // Load from localStorage
 const saved = localStorage.getItem('showPriceOnLabel');
 return saved ? JSON.parse(saved) : true; // Default: показывать цену
 });
 const [editingProduct, setEditingProduct] = useState<Product | null>(null);
 const [scrollToProductId, setScrollToProductId] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const debouncedSearchQuery = useDebounce(searchQuery, 300);
 const [stockFilter, setStockFilter] = useState('all');
 const [loading, setLoading] = useState(true);
 const [currentPage, setCurrentPage] = useState(1);
 const ITEMS_PER_PAGE = 50; // Har safar 50 ta mahsulot ko'rsatish
 const [uploading, setUploading] = useState(false);
 const [formData, setFormData] = useState({
 code: '', name: '', costPrice: '', wholesalePrice: '', donaNarx: '', quantity: ''
 });
 const [packageData, setPackageData] = useState({
 packageCount: '', unitsPerPackage: '', totalCost: ''
 });
 const [images, setImages] = useState<string[]>([]);
 const [codeError, setCodeError] = useState('');
 const [nameError, setNameError] = useState('');
 const [showPackageInput, setShowPackageInput] = useState(false);
 const [showQuantityModal, setShowQuantityModal] = useState(false);
 const [quantityInput, setQuantityInput] = useState('');
 const [showTransferModal, setShowTransferModal] = useState(false);
 const [transferProduct, setTransferProduct] = useState<Product | null>(null);
 const [transferToWarehouse, setTransferToWarehouse] = useState('');
 const [transferQuantity, setTransferQuantity] = useState('');
 const [transferring, setTransferring] = useState(false);
 const [loadingCode, setLoadingCode] = useState(false);
 void loadingCode; // Used in openAddModal
 const fileInputRef = useRef<HTMLInputElement>(null);
 
 // Bulk selection state
 const [selectionMode, setSelectionMode] = useState(false);
 const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
 const [showBulkPrintModal, setShowBulkPrintModal] = useState(false);
 const [bulkPrintQuantity, setBulkPrintQuantity] = useState('1');

 // Prevent double fetch with ref
 const hasFetchedRef = useRef(false);

 useEffect(() => {
 fetchMainWarehouse();
 }, []);

 useEffect(() => {
 if (mainWarehouse && !hasFetchedRef.current) {
 hasFetchedRef.current = true;
 fetchProducts();
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [mainWarehouse]);

 // Auto-refresh removed - using Socket.IO for real-time updates instead

 // Socket.IO real-time updates - OPTIMIZED: Prevent duplicate listeners
 useEffect(() => {
 if (!mainWarehouse) {
 console.log('⚠️ [Admin Products] mainWarehouse not set, skipping socket initialization');
 return;
 }
 
 console.log('🔌 [Admin Products] Initializing socket...');
 const socket = initSocket();

 const handleInventoryUpdate = () => {
 console.log('📦 [Admin Products] Inventory update received, refreshing...');
 // Reset fetch ref to allow refresh
 hasFetchedRef.current = false;
 fetchProducts();
 };

 const handleCacheCleared = () => {
 console.log('🗑️  [Admin Products] Cache cleared, refreshing...');
 // Reset fetch ref to allow refresh
 hasFetchedRef.current = false;
 fetchProducts();
 };

 // Remove any existing listeners first
 socket.off('inventory:updated', handleInventoryUpdate);
 socket.off('inventory:cache-cleared', handleCacheCleared);
 
 // Add new listeners
 socket.on('inventory:updated', handleInventoryUpdate);
 socket.on('inventory:cache-cleared', handleCacheCleared);
 console.log('🔌 [Admin Products] Socket listeners attached');

 return () => {
 console.log('🔌 [Admin Products] Cleaning up socket listeners');
 socket.off('inventory:updated', handleInventoryUpdate);
 socket.off('inventory:cache-cleared', handleCacheCleared);
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [mainWarehouse]);

 const fetchMainWarehouse = async () => {
 try {
 const res = await api.get('/warehouses');
 
 // Kassir uchun faqat asosiy ombor
 if (isCashier) {
 const main = res.data.find((w: Warehouse) => w.name === 'Asosiy ombor');
 if (main) {
 setWarehouses([main]);
 setMainWarehouse(main);
 setSelectedWarehouse(main._id);
 } else {
 const newMain = await api.post('/warehouses', { name: 'Asosiy ombor', address: '' });
 setWarehouses([newMain.data]);
 setMainWarehouse(newMain.data);
 setSelectedWarehouse(newMain.data._id);
 }
 } else {
 // Admin uchun barcha omborlar
 setWarehouses(res.data);
 const main = res.data.find((w: Warehouse) => w.name === 'Asosiy ombor');
 if (main) {
 setMainWarehouse(main);
 } else {
 const newMain = await api.post('/warehouses', { name: 'Asosiy ombor', address: '' });
 setMainWarehouse(newMain.data);
 setWarehouses([...res.data, newMain.data]);
 }
 }
 } catch (err) {
 console.error('Error fetching warehouses:', err);
 setLoading(false);
 }
 };

 const fetchProducts = useCallback(async () => {
 if (!mainWarehouse) return;
 
 try {
 setLoading(true);
 console.log('🔄 [FRONTEND] Starting fetch...');
 const fetchStart = performance.now();
 
 // Fetch from WarehouseInventory system for main warehouse
 const res = await api.get(`/inventory/warehouse/${mainWarehouse._id}`);
 const fetchEnd = performance.now();
 console.log(`✅ [FRONTEND] API fetch took: ${(fetchEnd - fetchStart).toFixed(0)}ms`);
 
 const mapStart = performance.now();
 // Map inventory items to products format
 const productsData = res.data.map((inv: any) => ({
 ...inv.product,
 quantity: inv.quantity,
 minStock: inv.minStock,
 _inventoryId: inv._id,
 _warehouseName: inv.warehouse?.name || 'Asosiy ombor',
 _warehouseId: mainWarehouse._id
 }));
 
 const mapEnd = performance.now();
 console.log(`✅ [FRONTEND] Mapping took: ${(mapEnd - mapStart).toFixed(0)}ms`);
 console.log(`✅ [FRONTEND] Total products: ${productsData.length}`);
 
 // Use setTimeout to defer state update and allow UI to breathe
 setTimeout(() => {
 const renderStart = performance.now();
 setProducts(productsData);
 setLoading(false);
 
 requestAnimationFrame(() => {
 const renderEnd = performance.now();
 console.log(`✅ [FRONTEND] Render took: ${(renderEnd - renderStart).toFixed(0)}ms`);
 console.log(`🎯 [FRONTEND] TOTAL TIME: ${(renderEnd - fetchStart).toFixed(0)}ms`);
 });
 }, 0);
 } catch (err) {
 console.error('Error fetching products:', err);
 setLoading(false);
 }
 }, [mainWarehouse]);

 // Optimized input handlers with useCallback
 const handleCodeChange = useCallback((value: string) => {
 setFormData(prev => ({ ...prev, code: value }));
 setCodeError(''); // Clear error immediately for better UX
 }, []);

 const handleNameChange = useCallback((value: string) => {
 setFormData(prev => ({ ...prev, name: value }));
 setNameError(''); // Clear error immediately for better UX
 }, []);

 const handleQuantityChange = useCallback((value: string) => {
 const cleaned = value.replace(/[^0-9]/g, '');
 setFormData(prev => ({ ...prev, quantity: cleaned }));
 }, []);

 const handleCostPriceChange = useCallback((value: string) => {
 // Remove spaces and format
 const formatted = formatInputNumber(value);
 setFormData(prev => ({ ...prev, costPrice: formatted }));
 }, []);

 const handleWholesalePriceChange = useCallback((value: string) => {
 // Remove spaces and format
 const formatted = formatInputNumber(value);
 setFormData(prev => ({ ...prev, wholesalePrice: formatted }));
 }, []);

 const handleDonaNarxChange = useCallback((value: string) => {
 // Remove spaces and format
 const formatted = formatInputNumber(value);
 setFormData(prev => ({ ...prev, donaNarx: formatted }));
 }, []);

 const applyQuantityChange = useCallback(() => {
 if (!quantityInput || Number(quantityInput) <= 0) return;
 
 const currentQty = Number(formData.quantity) || 0;
 const changeQty = Number(quantityInput);
 const newQty = currentQty + changeQty;
 
 setFormData(prev => ({ ...prev, quantity: String(Math.max(0, newQty)) }));
 setQuantityInput('');
 setShowQuantityModal(false);
 }, [quantityInput, formData.quantity]);

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files;
 if (!files || files.length === 0) return;
 
 const remainingSlots = 8 - images.length;
 if (remainingSlots <= 0) {
 showAlert(tKey('Maksimum 8 ta rasm yuklash mumkin'), tKey('Ogohlantirish'), 'warning');
 return;
 }

 const filesToUpload = Array.from(files).slice(0, remainingSlots);
 const formData = new FormData();
 filesToUpload.forEach(file => formData.append('images', file));

 setUploading(true);
 try {
 const res = await api.post('/products/upload-images', formData, {
 headers: { 'Content-Type': 'multipart/form-data' }
 });
 setImages([...images, ...res.data.images]);
 } catch (err) {
 console.error('Error uploading images:', err);
 showAlert(tKey('Rasmlarni yuklashda xatolik'), tKey('Xatolik'), 'danger');
 } finally {
 setUploading(false);
 if (fileInputRef.current) fileInputRef.current.value = '';
 }
 };

 const removeImage = useCallback(async (imagePath: string) => {
 try {
 await api.delete('/products/delete-image', { data: { imagePath } });
 setImages(prev => prev.filter(img => img !== imagePath));
 } catch (err) {
 console.error('Error deleting image:', err);
 }
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 
 // Trim the name and code before validation
 const trimmedName = formData.name.trim();
 const trimmedCode = formData.code.trim();
 
 if (!trimmedName) {
 showAlert('Mahsulot nomini kiriting', 'Xatolik', 'danger');
 return;
 }
 
 if (!trimmedCode) {
 showAlert('Mahsulot kodini kiriting', 'Xatolik', 'danger');
 return;
 }
 
 // Check for errors before submitting
 if (nameError) {
 showAlert('Bu nomli mahsulot allaqachon mavjud. Iltimos, boshqa nom kiriting.', 'Dublikat xatolik', 'danger');
 return;
 }
 
 if (editingProduct && codeError) {
 showAlert('Bu kod allaqachon band. Iltimos, boshqa kod kiriting.', 'Dublikat xatolik', 'danger');
 return;
 }
 
 // Ensure mainWarehouse is available
 if (!mainWarehouse) {
 showAlert('Asosiy ombor topilmadi. Iltimos, sahifani yangilang.', 'Xatolik', 'danger');
 return;
 }
 
 let finalQuantity = Number(formData.quantity);
 let finalCostPrice = Number(formData.costPrice);
 let packageInfo = null;
 
 // If package data is provided, calculate totals
 if (showPackageInput && packageData.packageCount && packageData.unitsPerPackage) {
 const totalUnits = Number(packageData.packageCount) * Number(packageData.unitsPerPackage);
 
 finalQuantity = editingProduct ? Number(formData.quantity) + totalUnits : totalUnits;
 
 packageInfo = {
 packageCount: Number(packageData.packageCount),
 unitsPerPackage: Number(packageData.unitsPerPackage),
 totalUnits: totalUnits
 };
 }
 
 // Helper function to parse formatted numbers (removes spaces)
 const parseFormattedNumber = (value: string | number): number => {
 if (typeof value === 'number') return value;
 const cleaned = String(value).replace(/\s/g, '');
 return cleaned ? Number(cleaned) : 0;
 };
 
 try {
 const data = {
 code: trimmedCode,
 name: trimmedName,
 costPrice: finalCostPrice,
 price: parseFormattedNumber(formData.wholesalePrice),
 dona_narx: formData.donaNarx ? parseFormattedNumber(formData.donaNarx) : undefined,
 quantity: finalQuantity,
 warehouse: mainWarehouse._id,
 images,
 packageInfo
 };
 
 let productId = editingProduct?._id;
 let isNewProduct = false;
 
 if (editingProduct) {
 await api.put(`/products/${editingProduct._id}`, data);
 showAlert('Mahsulot muvaffaqiyatli yangilandi', 'Muvaffaqiyat', 'success');
 } else {
 const res = await api.post('/products', data);
 productId = res.data._id;
 isNewProduct = true;
 showAlert('Mahsulot muvaffaqiyatli qo\'shildi', 'Muvaffaqiyat', 'success');
 }
 
 // Close modal immediately for better UX
 closeModal();
 
 // Fetch products and scroll when ready
 if (productId) {
 console.log(`💾 [SAVE] ${isNewProduct ? 'New' : 'Updated'} product ID:`, productId);
 
 // Fetch new products
 await fetchProducts();
 console.log('💾 [SAVE] fetchProducts completed');
 
 // Small delay to ensure state is updated
 setTimeout(() => {
 console.log('💾 [SAVE] Setting scroll target:', productId);
 setScrollToProductId(productId);
 }, 200);
 }
 } catch (err: any) {
 console.error('Submit error:', err);
 
 // Handle specific error cases
 if (err.response?.status === 409) {
 // Conflict - duplicate entry
 const errorData = err.response.data;
 const existingProduct = errorData.existingProduct;
 
 // Check if it's an exact duplicate (same name, price, costPrice)
 if (errorData.isDuplicateProduct) {
 let message = 'Aynan bir xil mahsulot allaqachon mavjud!\n\n';
 message += `Nom: ${existingProduct.name}\n`;
 message += `Narx: ${existingProduct.price.toLocaleString()} so'm\n`;
 message += `Tan narxi: ${existingProduct.costPrice.toLocaleString()} so'm\n`;
 message += `Miqdor: ${existingProduct.quantity} dona\n`;
 message += `Kod: ${existingProduct.code}\n\n`;
 message += 'Agar narx yoki tan narxi boshqa bo\'lsa, ularni o\'zgartiring.';
 
 showAlert(message, 'Dublikat Mahsulot!', 'warning');
 } else {
 // Code or name duplicate (but different price)
 let message = errorData.message || 'Bu mahsulot allaqachon mavjud!';
 
 if (existingProduct) {
 message += `\n\nMavjud mahsulot:`;
 message += `\n Nom: ${existingProduct.name}`;
 message += `\n Kod: ${existingProduct.code}`;
 if (existingProduct.price) {
 message += `\n Narx: ${existingProduct.price.toLocaleString()} so'm`;
 }
 if (existingProduct.costPrice) {
 message += `\n Tan narxi: ${existingProduct.costPrice.toLocaleString()} so'm`;
 }
 message += `\n Miqdor: ${existingProduct.quantity} dona`;
 }
 
 showAlert(message, 'Dublikat!', 'warning');
 }
 } else {
 const errorMsg = err.response?.data?.message || 'Xatolik yuz berdi';
 showAlert(errorMsg, 'Xatolik', 'danger');
 }
 }
 };

 const handleDelete = useCallback(async (id: string) => {
 const confirmed = await showConfirm(tKey("Tovarni o'chirishni tasdiqlaysizmi?"), tKey("O'chirish"));
 if (!confirmed) return;
 
 // Get current filtered products at the time of deletion
 const currentFilteredProducts = products.filter(p => 
   searchProducts([p], debouncedSearchQuery).length > 0
 );
 
 // Save the code of the product being deleted
 const deletedProduct = currentFilteredProducts.find(p => p._id === id);
 const deletedCode = deletedProduct?.code;
 
 console.log('🗑️ [DELETE] Starting deletion...');
 console.log('🗑️ [DELETE] Deleted product:', deletedProduct?.name, 'Code:', deletedCode);
 
 try {
 await api.delete(`/products/${id}`);
 console.log('🗑️ [DELETE] API delete successful');
 
 // Fetch new products
 await fetchProducts();
 console.log('🗑️ [DELETE] fetchProducts completed');
 
 // Now find nearest product from UPDATED products list
 if (deletedCode) {
 console.log('🗑️ [DELETE] Looking for nearest product to code:', deletedCode);
 
 // Small delay to ensure state is updated
 setTimeout(() => {
 // Get fresh products from state via callback
 setProducts(freshProducts => {
 const sortedProducts = [...freshProducts].sort((a, b) => {
 const codeA = parseInt(a.code) || 0;
 const codeB = parseInt(b.code) || 0;
 return codeB - codeA;
 });
 
 console.log('🗑️ [DELETE] Fresh products count:', sortedProducts.length);
 
 const deletedCodeNum = parseInt(deletedCode) || 0;
 
 // Find next product (smaller code)
 let targetProduct = sortedProducts.find(p => {
 const pCode = parseInt(p.code) || 0;
 return pCode < deletedCodeNum;
 });
 
 // If no next, find previous (larger code)
 if (!targetProduct) {
 targetProduct = sortedProducts.find(p => {
 const pCode = parseInt(p.code) || 0;
 return pCode > deletedCodeNum;
 });
 }
 
 if (targetProduct) {
 console.log('🗑️ [DELETE] ✅ Scrolling to:', targetProduct.code, targetProduct.name);
 setScrollToProductId(targetProduct._id);
 } else {
 console.log('🗑️ [DELETE] ❌ No target found');
 }
 
 return freshProducts; // Don't modify state
 });
 }, 200);
 }
 } catch (err) {
 console.error('🗑️ [DELETE] ❌ Error:', err);
 }
 }, [showConfirm, tKey, fetchProducts, setScrollToProductId, products, debouncedSearchQuery]);

 const openEditModal = useCallback((product: Product) => {
 // Close other modals first
 setShowQRModal(false);
 setShowPrintModal(false);
 setShowQuantityModal(false);
 setShowTransferModal(false);
 
 // Open edit modal
 setEditingProduct(product);
 setFormData({
 code: product.code,
 name: product.name,
 costPrice: String((product as any).costPrice || 0),
 wholesalePrice: String(product.price),
 donaNarx: String((product as any).dona_narx || ''),
 quantity: String(product.quantity)
 });
 
 setImages((product as any).images || []);
 setPackageData({ packageCount: '', unitsPerPackage: '', totalCost: '' });
 setCodeError('');
 setNameError('');
 setShowPackageInput(false);
 setShowModal(true);
 }, []);

 const closeModal = () => {
 setShowModal(false);
 setEditingProduct(null);
 setFormData({ code: '', name: '', costPrice: '', wholesalePrice: '', donaNarx: '', quantity: '' });
 setPackageData({ packageCount: '', unitsPerPackage: '', totalCost: '' });
 setImages([]);
 setCodeError('');
 setNameError('');
 setShowPackageInput(false);
 };

 const openTransferModal = useCallback((product: Product) => {
 // Close other modals first
 setShowQRModal(false);
 setShowPrintModal(false);
 setShowModal(false);
 setShowQuantityModal(false);
 
 // Open transfer modal
 setTransferProduct(product);
 setTransferToWarehouse('');
 setTransferQuantity('1');
 setShowTransferModal(true);
 }, []);

 const closeTransferModal = () => {
 setShowTransferModal(false);
 setTransferProduct(null);
 setTransferToWarehouse('');
 setTransferQuantity('');
 };

 const handleTransfer = async () => {
 if (!transferProduct || !transferToWarehouse || !transferQuantity) {
 showAlert('Barcha maydonlarni to\'ldiring', 'Xatolik', 'danger');
 return;
 }

 const quantity = Number(transferQuantity);
 if (quantity <= 0) {
 showAlert('Miqdor 0 dan katta bo\'lishi kerak', 'Xatolik', 'danger');
 return;
 }

 if (quantity > transferProduct.quantity) {
 showAlert(`Maksimal miqdor: ${transferProduct.quantity}`, 'Xatolik', 'danger');
 return;
 }

 // Get current warehouse from product (should be main warehouse)
 const currentWarehouseId = (transferProduct as any)._warehouseId || mainWarehouse?._id;
 
 if (currentWarehouseId === transferToWarehouse) {
 showAlert('Bir xil omborga o\'tkazish mumkin emas', 'Xatolik', 'danger');
 return;
 }

 const confirmed = await showConfirm(
 `${transferProduct.name}\n${quantity} dona\n${warehouses.find(w => w._id === currentWarehouseId)?.name} → ${warehouses.find(w => w._id === transferToWarehouse)?.name}`,
 'Transferni tasdiqlaysizmi?'
 );

 if (!confirmed) return;

 setTransferring(true);
 try {
 await api.post('/inventory/transfer', {
 productId: transferProduct._id,
 fromWarehouseId: currentWarehouseId,
 toWarehouseId: transferToWarehouse,
 quantity: quantity,
 notes: `Transfer from Products page`
 });

 showAlert('Transfer muvaffaqiyatli!', 'Muvaffaqiyat', 'success');
 closeTransferModal();
 
 // Refresh products from main warehouse
 fetchProducts();
 } catch (err: any) {
 showAlert(err.response?.data?.message || 'Transfer xatosi', 'Xatolik', 'danger');
 } finally {
 setTransferring(false);
 }
 };

 const openAddModal = async () => {
 // Close other modals first
 setShowQRModal(false);
 setShowPrintModal(false);
 setShowQuantityModal(false);
 setShowTransferModal(false);
 
 // OPTIMIZED: Open modal immediately with loading placeholder
 setFormData({ code: '...', name: '', costPrice: '', wholesalePrice: '', donaNarx: '', quantity: '' });
 setPackageData({ packageCount: '', unitsPerPackage: '', totalCost: '' });
 setImages([]);
 setCodeError('');
 setNameError('');
 setShowPackageInput(false);
 setLoadingCode(true);
 setShowModal(true); // Modal opens instantly!
 
 // Fetch next code in background
 try {
 const warehouseParam = mainWarehouse?._id ? `?warehouseId=${mainWarehouse._id}` : '';
 const res = await api.get(`/products/next-code${warehouseParam}`);
 setFormData(prev => ({ ...prev, code: res.data.code }));
 } catch (err) {
 console.error('Error getting next code:', err);
 setFormData(prev => ({ ...prev, code: '1' })); // Fallback
 } finally {
 setLoadingCode(false);
 }
 };

 const checkCodeExists = async (code: string) => {
 if (!code) return;
 // При редактировании проверяем дубликаты
 if (editingProduct) {
 try {
 const excludeId = editingProduct._id;
 const res = await api.get(`/products/check-code/${code}?excludeId=${excludeId}`);
 if (res.data.exists) {
 setCodeError(`Kod "${code}" allaqachon mavjud`);
 } else {
 setCodeError('');
 }
 } catch (err) {
 console.error('Error checking code:', err);
 }
 } else {
 // При добавлении нового товара автоматически выбираем свободный код
 try {
 const res = await api.get(`/products/check-code/${code}`);
 if (res.data.exists) {
 // Код занят - автоматически получаем следующий свободный
 try {
 const warehouseParam = mainWarehouse?._id ? `?warehouseId=${mainWarehouse._id}` : '';
 const nextCodeRes = await api.get(`/products/next-code${warehouseParam}`);
 setFormData(prev => ({ ...prev, code: nextCodeRes.data.code }));
 setCodeError('');
 // Тихо меняем код без уведомления
 console.log(`Kod "${code}" band edi. Avtomatik yangi kod tanlandi: ${nextCodeRes.data.code}`);
 } catch (err) {
 console.error('Error getting next code:', err);
 setCodeError(`Kod "${code}" band`);
 }
 } else {
 setCodeError('');
 }
 } catch (err) {
 console.error('Error checking code:', err);
 }
 }
 };

 const checkNameExists = async (name: string) => {
 if (!name || name.trim().length < 2) {
 setNameError('');
 return;
 }
 
 const trimmedName = name.trim();
 
 try {
 const excludeId = editingProduct?._id;
 const url = excludeId 
 ? `/products/check-name/${encodeURIComponent(trimmedName)}?excludeId=${excludeId}`
 : `/products/check-name/${encodeURIComponent(trimmedName)}`;
 
 const res = await api.get(url);
 if (res.data.exists) {
 const existingProduct = res.data.product;
 setNameError(
 `"${trimmedName}" nomli mahsulot allaqachon mavjud` + 
 (existingProduct ? ` (Kod: ${existingProduct.code})` : '')
 );
 } else {
 setNameError('');
 }
 } catch (err) {
 console.error('Error checking name:', err);
 }
 };

 const openQRModal = useCallback((product: Product) => {
 // Close other modals first
 setShowPrintModal(false);
 setShowModal(false);
 setShowQuantityModal(false);
 setShowTransferModal(false);
 
 // Open QR modal
 setSelectedProduct(product);
 setShowQRModal(true);
 }, []);

 const openPrintModal = useCallback((product: Product) => {
 // Close other modals first
 setShowQRModal(false);
 setShowModal(false);
 setShowQuantityModal(false);
 setShowTransferModal(false);
 
 // Open print modal
 setPrintProduct(product);
 setPrintQuantity('1');
 setPrintCodePrefix('');
 setPrinting(false);
 setShowPrintModal(true);
 }, []);

 // Печать ценника через браузер
 const handlePrint = () => {
 if (!printProduct) return;
 
 const qty = Number(printQuantity) || 1;
 
 const printWindow = window.open('', '_blank', 'width=400,height=600');
 if (!printWindow) {
 showAlert('Popup bloklangan. Ruxsat bering.', 'Xatolik', 'danger');
 return;
 }
 
 const qrData = JSON.stringify({ id: printProduct._id, code: printProduct.code, name: printProduct.name });
 const price = printProduct.price;
 
 // Формируем цену с кодом если он введен
 const displayPrice = printCodePrefix.trim() 
 ? `${printCodePrefix.trim()},${price.toString().replace(/\s/g, '')}` 
 : price.toLocaleString();
 
 const labelsHtml = Array(qty).fill(`
 <div class="label">
 ${showPriceOnLabel ? `<div class="price-row"><div class="price">${displayPrice} so'm</div></div>` : ''}
 <div class="content-row">
 <div class="left-section">
 <div class="name">${uz(printProduct.name)}</div>
 <div class="code">Kod: ${printProduct.code}</div>
 </div>
 <div class="right-section">
 <div class="qr-container">
 <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}" alt="QR" />
 </div>
 </div>
 </div>
 </div>
 `).join('');
 
 const printHtml = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="UTF-8">
 <title>Ценник - ${uz(printProduct.name)}</title>
 <style>
 * { margin: 0; padding: 0; box-sizing: border-box; }
 @page { size: 58mm 40mm; margin: 0; }
 @media print {
 body { width: 58mm; }
 .label { page-break-after: always; }
 .label:last-child { page-break-after: auto; }
 }
 body { font-family: Arial, sans-serif; background: white; }
 .label { 
 width: 58mm; 
 height: 40mm; 
 padding: 2mm;
 display: flex; 
 flex-direction: column;
 justify-content: center;
 }
 .price-row {
 width: 100%;
 text-align: center;
 margin-bottom: 2mm;
 }
 .price { 
 font-size: 22pt; 
 font-weight: bold; 
 color: #000;
 line-height: 1;
 white-space: nowrap;
 display: inline-block;
 }
 .content-row {
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 2mm;
 }
 .left-section { 
 flex: 0 0 28mm;
 max-width: 28mm;
 display: flex;
 flex-direction: column;
 justify-content: center;
 }
 .right-section {
 flex: 0 0 24mm;
 }
 .name { 
 font-size: 11pt; 
 font-weight: bold; 
 margin-bottom: 1mm; 
 line-height: 1.1;
 color: #000;
 word-wrap: break-word;
 overflow-wrap: break-word;
 }
 .code { 
 font-size: 12pt; 
 color: #000;
 font-weight: 700;
 }
 .qr-container { 
 width: 24mm; 
 height: 24mm; 
 flex-shrink: 0;
 display: flex;
 align-items: center;
 justify-content: center;
 }
 .qr-container img { 
 width: 100%; 
 height: 100%;
 display: block;
 }
 </style>
</head>
<body>
 ${labelsHtml}
 <script>
 window.onload = function() {
 var imgs = document.querySelectorAll('img');
 var loaded = 0;
 imgs.forEach(function(img) {
 if (img.complete) {
 loaded++;
 if (loaded === imgs.length) setTimeout(function() { window.print(); }, 100);
 } else {
 img.onload = function() {
 loaded++;
 if (loaded === imgs.length) setTimeout(function() { window.print(); }, 100);
 };
 img.onerror = function() {
 loaded++;
 if (loaded === imgs.length) setTimeout(function() { window.print(); }, 100);
 };
 }
 });
 window.onafterprint = function() { window.close(); };
 };
 </script>
</body>
</html>`;
 
 printWindow.document.write(printHtml);
 printWindow.document.close();
 setShowPrintModal(false);
 };

 // Bulk selection functions
 const toggleSelectionMode = () => {
 setSelectionMode(!selectionMode);
 setSelectedProducts([]);
 };

 const toggleProductSelection = (productId: string) => {
 setSelectedProducts(prev => 
 prev.includes(productId) 
 ? prev.filter(id => id !== productId)
 : [...prev, productId]
 );
 };

 const selectAllProducts = () => {
 if (selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0) {
 setSelectedProducts([]);
 } else {
 setSelectedProducts(paginatedProducts.map(p => p._id));
 }
 };

 const handleBulkPrint = () => {
 if (selectedProducts.length === 0) {
 showAlert('Mahsulot tanlanmagan', 'Ogohlantirish', 'warning');
 return;
 }
 setShowBulkPrintModal(true);
 };

 const executeBulkPrint = () => {
 const qty = Number(bulkPrintQuantity) || 1;
 if (qty < 1 || qty > 100) {
 showAlert('Miqdor 1 dan 100 gacha bo\'lishi kerak', 'Xatolik', 'warning');
 return;
 }

 const selectedProductsData = products.filter(p => selectedProducts.includes(p._id));
 
 const printWindow = window.open('', '_blank', 'width=400,height=600');
 if (!printWindow) {
 showAlert('Popup bloklangan. Ruxsat bering.', 'Xatolik', 'danger');
 return;
 }

 let allLabelsHtml = '';
 
 selectedProductsData.forEach(product => {
 const qrData = JSON.stringify({ id: product._id, code: product.code, name: product.name });
 const optomPrice = product.price;
 const donaPrice = (product as any).dona_narx || 0;
 
 // Format: dona narxining birinchi 2 xonasi, vergul, optom narxi
 // Masalan: dona=7000, optom=5000 -> "7,5000"
 // dona=27000, optom=25000 -> "27,25000"
 // dona=520000, optom=500000 -> "52,500000"
 let displayPrice = '';
 if (donaPrice > 0) {
 const donaStr = String(donaPrice);
 const firstTwoDigits = donaStr.substring(0, 2);
 displayPrice = `${firstTwoDigits},${optomPrice}`;
 } else {
 displayPrice = optomPrice.toLocaleString();
 }
 
 const labelsHtml = Array(qty).fill(`
 <div class="label">
 ${showPriceOnLabel ? `<div class="price-row"><div class="price">${displayPrice}</div></div>` : ''}
 <div class="content-row">
 <div class="left-section">
 <div class="name">${uz(product.name)}</div>
 <div class="code">Kod: ${product.code}</div>
 </div>
 <div class="right-section">
 <div class="qr-container">
 <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}" alt="QR" />
 </div>
 </div>
 </div>
 </div>
 `).join('');
 
 allLabelsHtml += labelsHtml;
 });

 const printHtml = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="UTF-8">
 <title>Ценники - ${selectedProducts.length} ta mahsulot</title>
 <style>
 * { margin: 0; padding: 0; box-sizing: border-box; }
 @page { size: 58mm 40mm; margin: 0; }
 @media print {
 body { width: 58mm; }
 .label { page-break-after: always; }
 .label:last-child { page-break-after: auto; }
 }
 body { font-family: Arial, sans-serif; background: white; }
 .label { 
 width: 58mm; 
 height: 40mm; 
 padding: 2mm;
 display: flex; 
 flex-direction: column;
 justify-content: center;
 }
 .price-row {
 width: 100%;
 text-align: center;
 margin-bottom: 2mm;
 }
 .price { 
 font-size: 22pt; 
 font-weight: bold; 
 color: #000;
 line-height: 1;
 white-space: nowrap;
 display: inline-block;
 }
 .content-row {
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 2mm;
 }
 .left-section { 
 flex: 0 0 28mm;
 max-width: 28mm;
 display: flex;
 flex-direction: column;
 justify-content: center;
 }
 .right-section {
 flex: 0 0 24mm;
 }
 .name { 
 font-size: 11pt; 
 font-weight: bold; 
 margin-bottom: 1mm; 
 line-height: 1.1;
 color: #000;
 word-wrap: break-word;
 overflow-wrap: break-word;
 }
 .code { 
 font-size: 12pt; 
 color: #000;
 font-weight: 700;
 }
 .qr-container { 
 width: 24mm; 
 height: 24mm; 
 flex-shrink: 0;
 display: flex;
 align-items: center;
 justify-content: center;
 }
 .qr-container img { 
 width: 100%; 
 height: 100%;
 display: block;
 }
 </style>
</head>
<body>
${allLabelsHtml}
<script>
 window.onload = function() {
 var imgs = document.querySelectorAll('img');
 var loaded = 0;
 imgs.forEach(function(img) {
 if (img.complete) {
 loaded++;
 if (loaded === imgs.length) setTimeout(function() { window.print(); }, 100);
 } else {
 img.onload = function() {
 loaded++;
 if (loaded === imgs.length) setTimeout(function() { window.print(); }, 100);
 };
 img.onerror = function() {
 loaded++;
 if (loaded === imgs.length) setTimeout(function() { window.print(); }, 100);
 };
 }
 });
 window.onafterprint = function() { window.close(); };
 };
</script>
</body>
</html>`;

 printWindow.document.write(printHtml);
 printWindow.document.close();
 setShowBulkPrintModal(false);
 setSelectionMode(false);
 setSelectedProducts([]);
 };

 const downloadQR = () => {
 if (!selectedProduct) return;
 const svg = document.getElementById('qr-code-svg');
 if (!svg) return;
 
 const svgData = new XMLSerializer().serializeToString(svg);
 const canvas = document.createElement('canvas');
 const ctx = canvas.getContext('2d');
 const img = new window.Image();
 
 img.onload = () => {
 canvas.width = img.width;
 canvas.height = img.height;
 ctx?.drawImage(img, 0, 0);
 const pngFile = canvas.toDataURL('image/png');
 const downloadLink = document.createElement('a');
 downloadLink.download = `QR-${selectedProduct.code}-${selectedProduct.name}.png`;
 downloadLink.href = pngFile;
 downloadLink.click();
 };
 
 img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
 };

 // Memoize stats calculation
 const stats = useMemo(() => ({
 total: products.length,
 lowStock: products.filter(p => p.quantity <= (p.minStock || 5) && p.quantity > 0).length,
 outOfStock: products.filter(p => p.quantity === 0).length,
 totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
 }), [products]);

 // Memoize filtered products with debounced search
 const filteredProducts = useMemo(() => {
 // Используем универсальную функцию поиска с поддержкой латиницы/кириллицы
 const searchFiltered = searchProducts(products, debouncedSearchQuery);
 
 // Применяем фильтр по остаткам
 const filtered = searchFiltered.filter(p => {
 const matchesStock = stockFilter === 'all' || 
 (stockFilter === 'low' && p.quantity <= (p.minStock || 5) && p.quantity > 0) ||
 (stockFilter === 'out' && p.quantity === 0);
 return matchesStock;
 });
 
 // Reset to page 1 when filter changes
 setCurrentPage(1);
 
 return filtered;
 }, [products, debouncedSearchQuery, stockFilter]);

 // Scroll to product after edit/add
 useEffect(() => {
 if (scrollToProductId && filteredProducts.length > 0) {
 // Find the product index in filtered products
 const productIndex = filteredProducts.findIndex(p => p._id === scrollToProductId);
 
 if (productIndex !== -1) {
 // Calculate which page the product is on
 const productPage = Math.floor(productIndex / ITEMS_PER_PAGE) + 1;
 
 // If product is on a different page, navigate to that page first
 if (productPage !== currentPage) {
 setCurrentPage(productPage);
 // Wait for page change to render
 setTimeout(() => {
 const element = document.getElementById(`product-${scrollToProductId}`);
 if (element) {
 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
 element.classList.add('bg-primary-50', 'dark:bg-primary-900/20');
 setTimeout(() => {
 element.classList.remove('bg-primary-50', 'dark:bg-primary-900/20');
 setScrollToProductId(null);
 }, 2000);
 }
 }, 300);
 } else {
 // Product is on current page, scroll immediately
 const element = document.getElementById(`product-${scrollToProductId}`);
 if (element) {
 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
 element.classList.add('bg-primary-50', 'dark:bg-primary-900/20');
 setTimeout(() => {
 element.classList.remove('bg-primary-50', 'dark:bg-primary-900/20');
 setScrollToProductId(null);
 }, 2000);
 } else {
 // Retry after a short delay
 setTimeout(() => {
 const retryElement = document.getElementById(`product-${scrollToProductId}`);
 if (retryElement) {
 retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
 retryElement.classList.add('bg-primary-50', 'dark:bg-primary-900/20');
 setTimeout(() => {
 retryElement.classList.remove('bg-primary-50', 'dark:bg-primary-900/20');
 setScrollToProductId(null);
 }, 2000);
 } else {
 setScrollToProductId(null);
 }
 }, 500);
 }
 }
 } else {
 setScrollToProductId(null);
 }
 }
 }, [scrollToProductId, filteredProducts, currentPage]);
 
 // Paginated products for rendering
 const paginatedProducts = useMemo(() => {
 const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
 const endIndex = startIndex + ITEMS_PER_PAGE;
 return filteredProducts.slice(startIndex, endIndex);
 }, [filteredProducts, currentPage]);
 
 const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

 const statItems = [
 { label: tKey('Jami tovarlar'), value: stats.total, icon: Package, color: 'brand', filter: 'all' },
 { label: tKey('Kam qolgan'), value: stats.lowStock, icon: AlertTriangle, color: 'warning', filter: 'low' },
 { label: tKey('Tugagan'), value: stats.outOfStock, icon: X, color: 'danger', filter: 'out' },
 { label: tKey('Jami qiymat'), value: `${formatNumber(stats.totalValue)} ${tKey("so'm")}`, icon: DollarSign, color: 'success', filter: null },
 ];

 const getProductImage = useCallback((product: any) => {
 if (product.images && product.images.length > 0) {
 return `${API_URL}${product.images[0]}`;
 }
 return null;
 }, []);

 return (
 <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
 {AlertComponent}
 <Header 
 title={tKey("Tovarlar")}
 showSearch 
 onSearch={setSearchQuery}
 pagination={{
 currentPage,
 totalPages,
 onPageChange: setCurrentPage,
 totalItems: filteredProducts.length,
 itemsPerPage: ITEMS_PER_PAGE
 }}
 actions={
 <div className="flex gap-2">
 {selectionMode && (
 <>
 <button 
 onClick={handleBulkPrint} 
 className="btn-primary text-sm"
 disabled={selectedProducts.length === 0}
 >
 <Printer className="w-4 h-4" />
 Chop etish ({selectedProducts.length})
 </button>
 <button 
 onClick={toggleSelectionMode} 
 className="btn-secondary text-sm"
 >
 <X className="w-4 h-4" />
 Yopish
 </button>
 </>
 )}
 {!selectionMode && (
 <>
 <button 
 onClick={toggleSelectionMode} 
 className="btn-secondary"
 >
 <Package className="w-4 h-4" />
 <span className="hidden sm:inline">Tanlash</span>
 </button>
 <button onClick={openAddModal} className="btn-primary">
 <Plus className="w-4 h-4" />
 <span className="hidden sm:inline">{tKey("Yangi tovar")}</span>
 </button>
 </>
 )}
 </div>
 }
 />

 <div className="p-4 lg:p-6 space-y-6 max-w-[1800px] mx-auto">
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
 {statItems.map((stat, i) => (
 <div 
 key={i} 
 onClick={() => stat.filter && setStockFilter(stat.filter)}
 className={`stat-card ${stat.filter ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${
 stockFilter === stat.filter ? 'ring-2 ring-brand-500' : ''
 }`}
 >
 <div className="flex items-start justify-between mb-2 lg:mb-3">
 <div className={`stat-icon bg-${stat.color}-50`}>
 <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
 </div>
 </div>
 <p className="text-lg lg:text-2xl font-bold text-surface-900">{stat.value}</p>
 <p className="text-xs lg:text-sm text-surface-500">{stat.label}</p>
 </div>
 ))}
 </div>

 <div className="card p-0 overflow-hidden">
 {loading ? (
 <div className="flex flex-col items-center justify-center py-20">
 <div className="spinner text-brand-600 w-8 h-8 mb-4" />
 <p className="text-surface-500">Yuklanmoqda...</p>
 </div>
 ) : filteredProducts.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 px-4">
 <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
 <Package className="w-8 h-8 text-surface-400" />
 </div>
 <h3 className="text-lg font-semibold text-surface-900 mb-2">Tovarlar topilmadi</h3>
 <p className="text-surface-500 text-center max-w-md mb-6">
 {searchQuery ? 'Qidiruv bo\'yicha tovarlar topilmadi' : 'Birinchi tovarni qo\'shing'}
 </p>
 <button onClick={openAddModal} className="btn-primary">Tovar qo'shish</button>
 </div>
 ) : (
 <>
 {/* DESKTOP TABLE */}
 <div className="hidden lg:block">
 <div className="table-header">
 <div className="grid gap-4 px-6 py-4" style={{gridTemplateColumns: selectionMode ? (isCashier ? 'auto auto 80px 1fr 110px 110px 110px 90px 140px' : 'auto auto 80px 1fr 110px 110px 110px 110px 90px 140px') : (isCashier ? 'auto 80px 1fr 110px 110px 110px 90px 140px' : 'auto 80px 1fr 110px 110px 110px 110px 90px 140px')}}>
 {selectionMode && (
 <div className="flex items-center justify-center">
 <input
 type="checkbox"
 checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
 onChange={selectAllProducts}
 className="w-5 h-5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
 title="Hammasini tanlash"
 />
 </div>
 )}
 <span className="table-header-cell">Rasm</span>
 <span className="table-header-cell">Kod</span>
 <span className="table-header-cell">Nomi</span>
 {!isCashier && <span className="table-header-cell">Ombor</span>}
 <span className="table-header-cell text-right">Tan narxi</span>
 <span className="table-header-cell text-right">Optom narxi</span>
 <span className="table-header-cell text-right">Dona narxi</span>
 <span className="table-header-cell text-center">Miqdori</span>
 <span className="table-header-cell text-center">Amallar</span>
 </div>
 </div>
 <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
 {paginatedProducts.map(product => (
 <ProductRow
 key={product._id}
 product={product}
 onTransfer={openTransferModal}
 onQR={openQRModal}
 onPrint={openPrintModal}
 onEdit={openEditModal}
 onDelete={handleDelete}
 getProductImage={getProductImage}
 uz={uz}
 formatNumber={formatNumber}
 isCashier={isCashier}
 selectionMode={selectionMode}
 isSelected={selectedProducts.includes(product._id)}
 onToggleSelect={toggleProductSelection}
 />
 ))}
 </div>
 </div>
 
 {/* MOBILE CARDS */}
 <div className="lg:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
 {paginatedProducts.map(product => (
 <ProductCard
 key={product._id}
 product={product}
 onTransfer={openTransferModal}
 onQR={openQRModal}
 onPrint={openPrintModal}
 onEdit={openEditModal}
 onDelete={handleDelete}
 getProductImage={getProductImage}
 uz={uz}
 formatNumber={formatNumber}
 isCashier={isCashier}
 />
 ))}
 
 {/* Mobile Pagination */}
 {totalPages > 1 && (
 <div className="p-4 border-t border-neutral-100 dark:border-neutral-700">
 <div className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-3">
 {filteredProducts.length} ta mahsulotdan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
 >
 Oldingi
 </button>
 <div className="px-4 py-2 bg-brand-500 text-white rounded-lg font-semibold">
 {currentPage} / {totalPages}
 </div>
 <button
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
 >
 Keyingi
 </button>
 </div>
 </div>
 )}
 </div>
 </>
 )}
 </div>
 </div>

 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
 <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 animate-scaleIn max-h-[90vh] overflow-y-auto border-2 border-surface-100 dark:border-surface-700">
 {/* Enhanced Gradient Header */}
 <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5 sticky top-0 z-10 shadow-lg">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
 <Package className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="text-xl font-black text-white">{editingProduct ? 'Tovarni tahrirlash' : 'Yangi tovar'}</h3>
 <p className="text-sm text-white/80">{editingProduct ? 'Ma\'lumotlarni yangilang' : 'Yangi tovar qo\'shing'}</p>
 </div>
 </div>
 <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200" title="Yopish">
 <X className="w-6 h-6" strokeWidth={3} />
 </button>
 </div>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-6">
 {/* Enhanced Image Upload */}
 <div>
 <label className="text-sm font-bold text-surface-700 mb-3 flex items-center gap-2">
 <Image className="w-4 h-4 text-brand-600" />
 Rasmlar (maksimal 8 ta)
 </label>
 <div className="grid grid-cols-4 gap-3 mb-3">
 {images.map((img) => (
 <div key={img} className="relative aspect-square group">
 <img src={`${API_URL}${img}`} alt="" className="w-full h-full object-cover rounded-xl border-2 border-surface-200 shadow-md" />
 <button
 type="button"
 onClick={() => removeImage(img)}
 className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-danger-500 to-danger-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
 >
 <X className="w-4 h-4" strokeWidth={3} />
 </button>
 </div>
 ))}
 {images.length < 8 && (
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 disabled={uploading}
 className="aspect-square border-2 border-dashed border-surface-300 rounded-xl flex flex-col items-center justify-center hover:border-brand-500 hover:bg-brand-50 transition-all hover:scale-105 bg-gradient-to-br from-surface-50 to-surface-100"
 >
 {uploading ? (
 <div className="spinner w-6 h-6 text-brand-600" />
 ) : (
 <>
 <Upload className="w-6 h-6 text-surface-400 mb-1" />
 <span className="text-xs text-surface-500 font-semibold">Yuklash</span>
 </>
 )}
 </button>
 )}
 </div>
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*"
 multiple
 onChange={handleImageUpload}
 className="hidden"
 />
 <p className="text-xs text-surface-500 font-medium">📸 JPG, PNG, WEBP formatlarida, har biri 5MB gacha</p>
 </div>

 {/* Enhanced Code and Name */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-sm font-bold text-surface-700 mb-2 flex items-center gap-2">
 <QrCode className="w-4 h-4 text-brand-600" />
 Kod
 </label>
 <input 
 type="text" 
 className={`input font-mono text-base font-bold ${codeError && editingProduct ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : codeError ? 'border-warning-500 focus:border-warning-500 focus:ring-warning-500/20' : 'border-2 focus:ring-4'}`}
 placeholder="1" 
 value={formData.code} 
 onChange={e => handleCodeChange(e.target.value)}
 onBlur={e => checkCodeExists(e.target.value)}
 required 
 />
 {codeError && (
 <p className={`text-sm mt-1 ${editingProduct ? 'text-danger-600' : 'text-warning-600'}`}>
 {codeError}
 </p>
 )}
 </div>
 <div>
 <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2 block">Miqdori</label>
 <input 
 type="text" 
 className="input text-center font-semibold" 
 placeholder="0" 
 value={formData.quantity} 
 onChange={e => handleQuantityChange(e.target.value)} 
 required 
 />
 </div>
 </div>
 <div>
 <label className="text-sm font-medium text-surface-700 mb-2 block">
 Nomi <span className="text-danger-500">*</span>
 </label>
 <input 
 type="text" 
 className={`input ${nameError ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
 placeholder="Tovar nomi" 
 value={formData.name} 
 onChange={e => handleNameChange(e.target.value)}
 onBlur={e => checkNameExists(e.target.value)}
 required 
 />
 {nameError && (
 <div className="flex items-start gap-2 mt-2 p-2 bg-danger-50 border border-danger-200 rounded-lg">
 <AlertTriangle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
 <p className="text-sm text-danger-600">{nameError}</p>
 </div>
 )}
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-sm font-medium text-surface-700 mb-2 block">Tan narxi (so'm)</label>
 <input type="text" className="input" placeholder="0" value={formData.costPrice} onChange={e => handleCostPriceChange(e.target.value)} required />
 </div>
 <div>
 <label className="text-sm font-medium text-surface-700 mb-2 block">Optom narxi (so'm)</label>
 <input type="text" className="input" placeholder="0" value={formData.wholesalePrice} onChange={e => handleWholesalePriceChange(e.target.value)} required />
 </div>
 </div>
 <div>
 <label className="text-sm font-medium text-surface-700 mb-2 block">Dona narxi (ixtiyoriy)</label>
 <input type="text" className="input" placeholder="0" value={formData.donaNarx} onChange={e => handleDonaNarxChange(e.target.value)} />
 </div>
 
 <div className="flex gap-3 pt-4">
 <button type="button" onClick={closeModal} className="btn-secondary flex-1 font-bold">Bekor qilish</button>
 <button 
 type="submit" 
 className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl" 
 disabled={!!(nameError || (editingProduct && codeError))}
 >
 {!editingProduct && codeError ? "Bo'sh kod bilan saqlash" : "Saqlash"}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {showQRModal && selectedProduct && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQRModal(false)} />
 <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 animate-scaleIn overflow-hidden border-2 border-surface-100 dark:border-surface-700">
 {/* Gradient Header */}
 <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
 <QrCode className="w-5 h-5 text-white" />
 </div>
 <h3 className="text-xl font-black text-white">QR Kod</h3>
 </div>
 <button onClick={() => setShowQRModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200" title="Yopish">
 <X className="w-6 h-6" strokeWidth={3} />
 </button>
 </div>
 </div>

 <div className="p-6 flex flex-col items-center">
 <div className="bg-white p-4 rounded-xl border border-surface-200 mb-4">
 <QRCodeSVG
 id="qr-code-svg"
 value={JSON.stringify({
 id: selectedProduct._id,
 code: selectedProduct.code,
 name: selectedProduct.name,
 price: selectedProduct.price
 })}
 size={200}
 level="H"
 includeMargin
 />
 </div>
 <div className="text-center mb-4">
 <p className="font-semibold text-surface-900">{uz(selectedProduct.name)}</p>
 <p className="text-sm text-surface-500">Kod: {selectedProduct.code}</p>
 <p className="text-sm text-surface-500">Tan narxi: {formatNumber((selectedProduct as any).costPrice || 0)} so'm</p>
 <p className="text-sm text-surface-500">Optom: {formatNumber(selectedProduct.price)} so'm</p>
 </div>
 <button onClick={downloadQR} className="btn-primary w-full">
 <Download className="w-4 h-4" />
 Yuklab olish
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Quantity Adjustment Modal */}
 {showQuantityModal && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQuantityModal(false)} />
 <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 animate-scaleIn p-6 border-2 border-surface-100 dark:border-surface-700">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
 Miqdor qo'shish
 </h3>
 <button onClick={() => setShowQuantityModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 transition-all hover:scale-110 hover:rotate-90 duration-200" title="Yopish">
 <X className="w-6 h-6" strokeWidth={3} />
 </button>
 </div>
 
 <div className="rounded-xl p-4 mb-6 bg-success-50">
 <p className="text-sm text-surface-600 mb-1">Hozirgi miqdor</p>
 <p className="text-2xl font-bold text-success-600">
 {formatNumber(formData.quantity || 0)} dona
 </p>
 </div>

 <div className="space-y-4">
 <div>
 <label className="text-sm font-medium text-surface-700 mb-2 block">
 Qo'shiladigan miqdor
 </label>
 <input 
 type="text" 
 className="input text-center text-lg font-semibold" 
 placeholder="0" 
 value={formatInputNumber(quantityInput)}
 onChange={e => setQuantityInput(parseNumber(e.target.value))}
 autoFocus
 />
 </div>

 {quantityInput && Number(quantityInput) > 0 && (
 <div className="bg-surface-50 rounded-xl p-4">
 <p className="text-sm text-surface-600 mb-1">Yangi miqdor</p>
 <p className="text-xl font-bold text-surface-900">
 {formatNumber((Number(formData.quantity) || 0) + Number(quantityInput))} dona
 </p>
 </div>
 )}

 <div className="flex gap-3 pt-2">
 <button type="button" onClick={() => setShowQuantityModal(false)} className="btn-secondary flex-1">
 Bekor qilish
 </button>
 <button 
 type="button" 
 onClick={applyQuantityChange} 
 className="flex-1 btn-success"
 disabled={!quantityInput || Number(quantityInput) <= 0}
 >
 Qo'shish
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Print Modal */}
 {showPrintModal && printProduct && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !printing && setShowPrintModal(false)} />
 <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn p-6 border-2 border-surface-100 dark:border-surface-700">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Ценник чоп этиш</h3>
 <button onClick={() => !printing && setShowPrintModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 transition-all hover:scale-110 hover:rotate-90 duration-200" disabled={printing} title="Yopish">
 <X className="w-6 h-6" strokeWidth={3} />
 </button>
 </div>
 
 <div className="space-y-4">
 {/* Product info with QR code */}
 <div className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-700 dark:to-surface-800 rounded-2xl p-4 flex items-center justify-center gap-20 border-2 border-surface-200 dark:border-surface-600">
 <div>
 <p className="font-bold text-lg text-surface-900 dark:text-white">{uz(printProduct.name)}</p>
 <p className="font-semibold text-surface-600 dark:text-surface-400">Code: {printProduct.code}</p>
 <p className="text-sm font-semibold text-surface-700 dark:text-surface-300 mt-1">
 Narx: {printProduct.price.toLocaleString()} so'm
 </p>
 </div>
 <div className="bg-white p-2 rounded-xl border-2 border-surface-200 shadow-lg">
 <QRCodeSVG
 value={JSON.stringify({
 code: printProduct.code,
 name: printProduct.name,
 })}
 size={80}
 level="H"
 />
 </div>
 </div>
 
 <div>
 <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Kod prefiksi (ixtiyoriy)</label>
 <input 
 type="number" 
 className="input text-center font-bold text-lg" 
 placeholder="Masalan: 1, 2, 3..."
 value={printCodePrefix}
 onChange={e => setPrintCodePrefix(e.target.value)}
 disabled={printing}
 />
 <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 text-center">
 {printCodePrefix.trim() 
 ? `Ценникда: ${printCodePrefix.trim()},${printProduct.price.toString().replace(/\s/g, '')} so'm` 
 : `Ценникда: ${printProduct.price.toLocaleString()} so'm`}
 </p>
 </div>
 
 <div>
 <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Сони</label>
 <input 
 type="number" 
 className="input text-center font-bold text-lg" 
 min="1"
 max="50"
 value={printQuantity}
 onChange={e => setPrintQuantity(e.target.value)}
 disabled={printing}
 />
 </div>
 
 {/* Checkbox для отображения цены */}
 <div className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-700 rounded-xl border-2 border-surface-200 dark:border-surface-600">
 <input
 type="checkbox"
 id="showPrice"
 checked={showPriceOnLabel}
 onChange={(e) => {
 const checked = e.target.checked;
 setShowPriceOnLabel(checked);
 localStorage.setItem('showPriceOnLabel', JSON.stringify(checked));
 }}
 className="w-5 h-5 rounded border-2 border-surface-300 dark:border-surface-500 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
 disabled={printing}
 />
 <label htmlFor="showPrice" className="flex-1 text-sm font-bold text-surface-700 dark:text-surface-300 cursor-pointer select-none">
 Narxni ko'rsatish
 </label>
 </div>
 
 <div className="flex gap-3 pt-2">
 <button 
 type="button" 
 onClick={() => setShowPrintModal(false)} 
 className="btn-secondary flex-1 font-bold"
 disabled={printing}
 >
 Бекор қилиш
 </button>
 <button 
 type="button" 
 onClick={handlePrint} 
 className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl"
 disabled={printing}
 >
 {printing ? (
 <>
 <div className="spinner w-4 h-4" />
 Юборилмоқда...
 </>
 ) : (
 <>
 <Printer className="w-4 h-4" />
 Чоп этиш
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Bulk Print Modal */}
 {showBulkPrintModal && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBulkPrintModal(false)} />
 <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn p-6 border-2 border-surface-100 dark:border-surface-700">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
 QR kodlarni chop etish
 </h3>
 <button 
 onClick={() => setShowBulkPrintModal(false)} 
 className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 transition-all hover:scale-110 hover:rotate-90 duration-200"
 >
 <X className="w-6 h-6" strokeWidth={3} />
 </button>
 </div>
 
 <div className="space-y-4">
 <div className="bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 rounded-2xl p-4 border-2 border-brand-200 dark:border-brand-700">
 <p className="text-center font-bold text-brand-900 dark:text-brand-100">
 {selectedProducts.length} ta mahsulot tanlandi
 </p>
 </div>
 
 <div>
 <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">
 Har bir mahsulotdan nechta chop etilsin?
 </label>
 <input 
 type="number" 
 className="input text-center font-bold text-lg" 
 min="1"
 max="100"
 value={bulkPrintQuantity}
 onChange={e => setBulkPrintQuantity(e.target.value)}
 placeholder="Miqdor"
 />
 <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 text-center">
 Jami: {selectedProducts.length} × {bulkPrintQuantity} = {selectedProducts.length * (Number(bulkPrintQuantity) || 0)} ta QR kod
 </p>
 </div>
 
 <div className="flex gap-3 pt-2">
 <button 
 onClick={() => setShowBulkPrintModal(false)} 
 className="btn-secondary flex-1 font-bold"
 >
 Bekor qilish
 </button>
 <button 
 onClick={executeBulkPrint} 
 className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl"
 >
 <Printer className="w-4 h-4" />
 Chop etish
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Transfer Modal */}
 {showTransferModal && transferProduct && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeTransferModal} />
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn border-2 border-red-100">
 {/* Header - Red Gradient */}
 <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
 <ArrowRightLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
 </div>
 <h3 className="text-xl font-black text-white">Omborga o'tkazish</h3>
 </div>
 <button onClick={closeTransferModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200" title="Yopish">
 <X className="w-6 h-6" strokeWidth={3} />
 </button>
 </div>
 </div>

 <div className="p-6 space-y-5">
 {/* Product Info - Red/White Theme */}
 <div className="bg-white rounded-2xl p-4 border-2 border-red-500 shadow-md">
 <div className="flex items-start gap-4">
 {getProductImage(transferProduct) ? (
 <img src={getProductImage(transferProduct)!} alt={transferProduct.name} className="w-20 h-20 rounded-xl object-cover border-2 border-red-300 shadow-md flex-shrink-0" />
 ) : (
 <div className="w-20 h-20 bg-red-50 rounded-xl flex items-center justify-center border-2 border-red-300 shadow-md flex-shrink-0">
 <Package className="w-10 h-10 text-red-500" />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <p className="font-black text-xl text-slate-900 mb-2 leading-tight">{uz(transferProduct.name)}</p>
 <div className="bg-slate-100 inline-block px-3 py-1 rounded-lg mb-3">
 <p className="text-sm text-slate-900 font-black">Kod: {transferProduct.code}</p>
 </div>
 <div className="bg-red-50 rounded-xl px-4 py-3 border-2 border-red-300">
 <div className="flex items-center justify-between">
 <span className="text-sm font-black text-slate-900">Mavjud:</span>
 <span className="font-black text-2xl text-red-600">{transferProduct.quantity} dona</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Current Warehouse */}
 <div>
 <label className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
 <Package className="w-4 h-4 text-red-600" />
 Hozirgi ombor
 </label>
 <div className="bg-slate-100 rounded-xl px-4 py-3.5 font-bold text-slate-900 border-2 border-slate-200">
 {(transferProduct as any)._warehouseName || mainWarehouse?.name || 'Asosiy ombor'}
 </div>
 </div>

 {/* Target Warehouse */}
 <div>
 <label className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
 <ArrowRightLeft className="w-4 h-4 text-red-600" />
 Qayerga o'tkazish
 </label>
 <select 
 className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
 value={transferToWarehouse}
 onChange={e => setTransferToWarehouse(e.target.value)}
 required
 >
 <option value="">Omborni tanlang</option>
 {warehouses
 .filter(w => w._id !== mainWarehouse?._id && w._id !== (transferProduct as any)._warehouseId)
 .map(w => (
 <option key={w._id} value={w._id}>{w.name}</option>
 ))
 }
 </select>
 </div>

 {/* Quantity */}
 <div>
 <label className="text-sm font-black text-slate-900 mb-2 block">
 Miqdor (maksimal: {transferProduct.quantity})
 </label>
 <input 
 type="number"
 className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 font-bold text-xl text-center focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
 min="1"
 max={transferProduct.quantity}
 value={transferQuantity}
 onChange={e => setTransferQuantity(e.target.value)}
 placeholder="0"
 required
 />
 </div>

 {/* Actions */}
 <div className="flex gap-3 pt-2">
 <button 
 type="button" 
 onClick={closeTransferModal} 
 className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-xl transition-all border-2 border-slate-200"
 disabled={transferring}
 >
 Bekor qilish
 </button>
 <button 
 type="button" 
 onClick={handleTransfer} 
 className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 disabled={transferring || !transferToWarehouse || !transferQuantity}
 >
 {transferring ? (
 <>
 <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
 O'tkazilmoqda...
 </>
 ) : (
 <>
 <ArrowRightLeft className="w-5 h-5" strokeWidth={2.5} />
 O'tkazish
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Mobile FAB */}
 {/* Enhanced Mobile FAB */}
 <button
 onClick={openAddModal}
 className="lg:hidden fixed right-4 bottom-24 w-16 h-16 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:from-brand-600 hover:to-brand-700 active:scale-95 transition-all z-50 animate-bounce"
 style={{ animationDuration: '2s', animationIterationCount: '3' }}
 >
 <Plus className="w-8 h-8" strokeWidth={3} />
 </button>
 </div>
 );
}
