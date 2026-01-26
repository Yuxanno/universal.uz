import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { ArrowRight, Package, Warehouse as WarehouseIcon, CheckCircle, History, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Plus, X, Search, AlertTriangle, TrendingUp, TrendingDown, Sparkles, Zap, Clock, User, Building2, MessageSquare, Undo2 } from 'lucide-react';
import { Warehouse, Product } from '../../types';
import api from '../../utils/api';
import { useAlert } from '../../hooks/useAlert';
import { useLanguage } from '../../context/LanguageContext';

interface InventoryItem {
 _id: string;
 product: Product;
 warehouse: Warehouse;
 quantity: number;
 minStock: number;
}

interface Transfer {
 _id: string;
 product: Product;
 fromWarehouse: Warehouse;
 toWarehouse: Warehouse;
 quantity: number;
 type: 'export' | 'import' | 'internal';
 transferredBy: { name: string; username: string };
 createdAt: string;
 notes?: string;
}

interface SelectedProduct {
 product: Product;
 quantity: number;
 availableQuantity: number;
}

export default function WarehouseTransfer() {
 const { t } = useLanguage();
 const { showAlert, showConfirm, AlertComponent } = useAlert();
 
 const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
 const [transfers, setTransfers] = useState<Transfer[]>([]);
 
 const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
 const [fromWarehouse, setFromWarehouse] = useState<string>('');
 const [toWarehouse, setToWarehouse] = useState<string>('');
 const [notes, setNotes] = useState('');
 
 const [loading, setLoading] = useState(false);
 const [showHistory, setShowHistory] = useState(false);
 const [transferType, setTransferType] = useState<'export' | 'import' | 'internal' | null>(null);
 
 const [productSearch, setProductSearch] = useState('');
 const [showProductModal, setShowProductModal] = useState(false);
 const [warehouseInventory, setWarehouseInventory] = useState<InventoryItem[]>([]);
 const [migrating, setMigrating] = useState(false);
 const [categoryFilter, setCategoryFilter] = useState<string>('all');
 const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock'>('all');
 const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'code'>('name');

 useEffect(() => {
 fetchWarehouses();
 fetchTransfers();
 }, []);

 useEffect(() => {
 // Determine transfer type
 if (fromWarehouse && toWarehouse) {
 const fromWh = warehouses.find(w => w._id === fromWarehouse);
 const toWh = warehouses.find(w => w._id === toWarehouse);
 
 if (fromWh && toWh) {
 if ((fromWh as any).isMain && !(toWh as any).isMain) {
 setTransferType('export'); // EXPORT: Main → Sub
 } else if (!(fromWh as any).isMain && (toWh as any).isMain) {
 setTransferType('import'); // IMPORT: Sub → Main
 } else {
 setTransferType('internal'); // Internal transfer
 }
 }
 } else {
 setTransferType(null);
 }
 }, [fromWarehouse, toWarehouse, warehouses]);

 useEffect(() => {
 if (fromWarehouse) {
 fetchWarehouseInventory();
 } else {
 setWarehouseInventory([]);
 }
 }, [fromWarehouse]);

 // Keyboard shortcuts
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape' && showProductModal) {
 setShowProductModal(false);
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [showProductModal]);

 const fetchWarehouses = async () => {
 try {
 const res = await api.get('/warehouses');
 setWarehouses(res.data);
 } catch (err) {
 console.error('Error fetching warehouses:', err);
 }
 };

 const fetchTransfers = async () => {
 try {
 const res = await api.get('/inventory/transfers?limit=20');
 setTransfers(res.data);
 } catch (err) {
 console.error('Error fetching transfers:', err);
 }
 };

 const fetchWarehouseInventory = async () => {
 try {
 const res = await api.get(`/inventory/warehouse/${fromWarehouse}`);
 setWarehouseInventory(res.data);
 } catch (err) {
 console.error('Error fetching inventory:', err);
 setWarehouseInventory([]);
 }
 };

 const handleMigration = async () => {
 const confirmed = await showConfirm(
 'Barcha mahsulotlarni inventar tizimiga ko\'chirish uchun tasdiqlang. Bu jarayon bir necha daqiqa davom etishi mumkin.',
 'Migration tasdiqlash'
 );
 
 if (!confirmed) return;

 setMigrating(true);
 try {
 const res = await api.post('/inventory/migrate');
 showAlert(
 `Migration muvaffaqiyatli! Yaratildi: ${res.data.stats.created}, Yangilandi: ${res.data.stats.updated}, O'tkazildi: ${res.data.stats.skipped}`,
 'Muvaffaqiyat',
 'success'
 );
 
 // Refresh data
 fetchWarehouses();
 if (fromWarehouse) {
 fetchWarehouseInventory();
 }
 } catch (err: any) {
 const errorMsg = err.response?.data?.message || 'Migration xatosi';
 showAlert(errorMsg, 'Xatolik', 'danger');
 } finally {
 setMigrating(false);
 }
 };

 const handleUndoTransfer = async (transfer: Transfer) => {
 // Check if transfer is recent (within 30 minutes)
 const transferTime = new Date(transfer.createdAt).getTime();
 const now = new Date().getTime();
 const diffMinutes = (now - transferTime) / (1000 * 60);
 
 if (diffMinutes > 30) {
 showAlert(
 'Bu transfer 30 daqiqadan ko\'proq vaqt o\'tgan. Xavfsizlik uchun eski transferlarni bekor qilib bo\'lmaydi.\n\nAgar kerak bo\'lsa, yangi transfer yarating.',
 'Bekor qilib bo\'lmaydi',
 'warning'
 );
 return;
 }
 
 const confirmed = await showConfirm(
 `Bu transferni BUTUNLAY BEKOR qilmoqchimisiz?\n\n` +
 `${transfer.product.name} (${transfer.quantity} dona)\n` +
 `${transfer.fromWarehouse.name} → ${transfer.toWarehouse.name}\n\n` +
 `✓ Mahsulot "${transfer.fromWarehouse.name}" omboriga qaytariladi\n` +
 `✓ Transfer tarixdan o'chiriladi`,
 'Transferni bekor qilish'
 );
 
 if (!confirmed) return;

 setLoading(true);
 try {
 // Call undo endpoint - this will reverse inventory and delete transfer
 const res = await api.post(`/inventory/transfers/${transfer._id}/undo`);

 showAlert(
 res.data.message || 'Transfer bekor qilindi!',
 'Muvaffaqiyat',
 'success'
 );
 
 // Refresh data
 fetchTransfers();
 if (fromWarehouse) {
 fetchWarehouseInventory();
 }
 } catch (err: any) {
 const errorMsg = err.response?.data?.message || 'Bekor qilish xatosi';
 showAlert(errorMsg, 'Xatolik', 'danger');
 } finally {
 setLoading(false);
 }
 };

 const openProductModal = () => {
 if (!fromWarehouse) {
 showAlert('Avval "Qayerdan" omborni tanlang', 'Ogohlantirish', 'warning');
 return;
 }
 setProductSearch('');
 setCategoryFilter('all');
 setStockFilter('all');
 setShowProductModal(true);
 };

 const addProduct = (product: Product) => {
 // Check if already added
 if (selectedProducts.find(p => p.product._id === product._id)) {
 showAlert('Bu mahsulot allaqachon qo\'shilgan', 'Ogohlantirish', 'warning');
 return;
 }

 // Get available quantity
 const inventoryItem = warehouseInventory.find(inv => inv.product._id === product._id);
 const availableQuantity = inventoryItem ? inventoryItem.quantity : 0;

 if (availableQuantity === 0) {
 showAlert('Bu mahsulot tanlangan omborida mavjud emas', 'Xatolik', 'danger');
 return;
 }

 setSelectedProducts([...selectedProducts, {
 product,
 quantity: 1,
 availableQuantity
 }]);
 setShowProductModal(false);
 };

 const removeProduct = (productId: string) => {
 setSelectedProducts(selectedProducts.filter(p => p.product._id !== productId));
 };

 const updateProductQuantity = (productId: string, quantity: number) => {
 setSelectedProducts(selectedProducts.map(p => 
 p.product._id === productId ? { ...p, quantity: Math.max(1, Math.min(quantity, p.availableQuantity)) } : p
 ));
 };

 const handleTransfer = async (e: React.FormEvent) => {
 e.preventDefault();
 
 if (selectedProducts.length === 0) {
 showAlert('Kamida bitta mahsulot qo\'shing', 'Xatolik', 'danger');
 return;
 }

 if (!fromWarehouse || !toWarehouse) {
 showAlert('Omborlarni tanlang', 'Xatolik', 'danger');
 return;
 }

 // Validate all quantities
 const invalidProducts = selectedProducts.filter(p => p.quantity > p.availableQuantity);
 if (invalidProducts.length > 0) {
 showAlert(
 `Ba'zi mahsulotlarda yetarli miqdor yo'q: ${invalidProducts.map(p => p.product.name).join(', ')}`,
 'Xatolik',
 'danger'
 );
 return;
 }

 const typeInfo = getTransferTypeInfo(transferType || 'internal');
 const totalItems = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
 const confirmed = await showConfirm(
 `${typeInfo.label}: ${selectedProducts.length} xil mahsulot (jami ${totalItems} dona) o'tkazishni tasdiqlaysizmi?`,
 'Transfer tasdiqlash'
 );
 
 if (!confirmed) return;

 setLoading(true);
 try {
 // Transfer each product
 const transferPromises = selectedProducts.map(item =>
 api.post('/inventory/transfer', {
 productId: item.product._id,
 fromWarehouseId: fromWarehouse,
 toWarehouseId: toWarehouse,
 quantity: item.quantity,
 notes: notes || `Batch transfer: ${selectedProducts.length} mahsulot`
 })
 );

 await Promise.all(transferPromises);

 const fromName = fromWarehouseData?.name || 'Ombor';
 const toName = toWarehouseData?.name || 'Ombor';
 
 showAlert(
 `${typeInfo.label} muvaffaqiyatli!\n\n` +
 `${selectedProducts.length} xil mahsulot (${totalItems} dona)\n` +
 `${fromName} → ${toName}\n\n` +
 `Yangi omborni ko'rish uchun "Ombor inventarizatsiyasi" sahifasiga o'ting.`,
 'Muvaffaqiyat',
 'success'
 );
 
 // Reset form but keep warehouses selected for easy next transfer
 setSelectedProducts([]);
 setNotes('');
 
 // Refresh data
 fetchTransfers();
 
 // Refresh warehouse inventory to show updated quantities
 if (fromWarehouse) {
 fetchWarehouseInventory();
 }
 } catch (err: any) {
 const errorMsg = err.response?.data?.message || 'Transfer xatosi';
 showAlert(errorMsg, 'Xatolik', 'danger');
 } finally {
 setLoading(false);
 }
 };

 const filteredProducts = warehouseInventory.filter(inv => {
 // MUHIM: Product null bo'lmasligi kerak
 if (!inv.product) {
 console.warn('⚠️ Inventory item without product:', inv);
 return false;
 }
 
 // MUHIM: Faqat miqdori 0 dan katta mahsulotlarni ko'rsatish
 if (inv.quantity <= 0) {
 return false;
 }
 
 // Search filter
 const matchesSearch = inv.product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
 inv.product.code.toLowerCase().includes(productSearch.toLowerCase());
 
 // Category filter
 const matchesCategory = categoryFilter === 'all' || inv.product.category === categoryFilter;
 
 // Stock filter
 let matchesStock = true;
 if (stockFilter === 'in-stock') {
 matchesStock = inv.quantity > inv.minStock;
 } else if (stockFilter === 'low-stock') {
 matchesStock = inv.quantity > 0 && inv.quantity <= inv.minStock;
 }
 
 return matchesSearch && matchesCategory && matchesStock;
 }).sort((a, b) => {
 // Sort logic
 if (sortBy === 'name') {
 return a.product.name.localeCompare(b.product.name);
 } else if (sortBy === 'quantity') {
 return b.quantity - a.quantity; // Descending
 } else if (sortBy === 'code') {
 return a.product.code.localeCompare(b.product.code);
 }
 return 0;
 });

 // Get unique categories
 const categories = Array.from(new Set(
 warehouseInventory
 .filter(inv => inv.product && inv.product.category)
 .map(inv => inv.product.category)
 ));

 const fromWarehouseData = warehouses.find(w => w._id === fromWarehouse);
 const toWarehouseData = warehouses.find(w => w._id === toWarehouse);

 // Helper function to get transfer type icon and color
 const getTransferTypeInfo = (type: string) => {
 switch (type) {
 case 'export':
 return {
 icon: ArrowUpCircle,
 label: 'EXPORT',
 color: 'text-blue-600',
 bgColor: 'bg-blue-50',
 borderColor: 'border-blue-200',
 gradientFrom: 'from-blue-500',
 gradientTo: 'to-blue-600'
 };
 case 'import':
 return {
 icon: ArrowDownCircle,
 label: 'IMPORT',
 color: 'text-green-600',
 bgColor: 'bg-green-50',
 borderColor: 'border-green-200',
 gradientFrom: 'from-green-500',
 gradientTo: 'to-green-600'
 };
 case 'internal':
 return {
 icon: ArrowLeftRight,
 label: 'INTERNAL',
 color: 'text-purple-600',
 bgColor: 'bg-purple-50',
 borderColor: 'border-purple-200',
 gradientFrom: 'from-purple-500',
 gradientTo: 'to-purple-600'
 };
 default:
 return {
 icon: ArrowRight,
 label: 'TRANSFER',
 color: 'text-surface-600',
 bgColor: 'bg-surface-50',
 borderColor: 'border-surface-200',
 gradientFrom: 'from-surface-500',
 gradientTo: 'to-surface-600'
 };
 }
 };

 const totalQuantity = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 pb-20 lg:pb-0">
 {AlertComponent}
 <Header title={t("Mahsulot o'tkazish")} />

 <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">

 {/* Modern Hero Section */}
 <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMTAgNjAgTSAwIDEwIEwgNjAgMTAgTSAyMCAwIEwgMjAgNjAgTSAwIDIwIEwgNjAgMjAgTSAzMCAwIEwgMzAgNjAgTSAwIDMwIEwgNjAgMzAgTSA0MCAwIEwgNDAgNjAgTSAwIDQwIEwgNjAgNDAgTSA1MCAwIEwgNTAgNjAgTSAwIDUwIEwgNjAgNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
 <div className="relative flex items-center justify-between flex-wrap gap-6">
 <div className="flex items-center gap-5">
 <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-white/30">
 <Sparkles className="w-10 h-10 text-white" strokeWidth={2} />
 </div>
 <div>
 <h1 className="text-3xl lg:text-4xl font-black text-white mb-2 tracking-tight">
 Mahsulot o'tkazish
 </h1>
 <p className="text-white/90 text-lg font-medium">
 Omborlar orasida mahsulotlarni tez va oson o'tkazing
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <button
 onClick={handleMigration}
 disabled={migrating}
 className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center gap-2 shadow-xl ${
 migrating
 ? 'bg-white/20 text-white/50 cursor-not-allowed'
 : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-xl border-2 border-white/30 hover:scale-105'
 }`}
 title="Mahsulotlarni inventar tizimiga ko'chirish"
 >
 {migrating ? (
 <div className="spinner w-5 h-5" />
 ) : (
 <Zap className="w-5 h-5" />
 )}
 <span>Migration</span>
 </button>
 <button
 onClick={() => setShowHistory(!showHistory)}
 className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center gap-2 shadow-xl ${
 showHistory 
 ? 'bg-white text-purple-600 hover:scale-105' 
 : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-xl border-2 border-white/30 hover:scale-105'
 }`}
 >
 <History className="w-5 h-5" />
 <span>{showHistory ? 'Forma' : 'Tarix'}</span>
 </button>
 </div>
 </div>
 </div>

 {!showHistory ? (
 /* Modern Transfer Form */
 <form onSubmit={handleTransfer} className="space-y-6">
 {/* Warehouse Selection Cards */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* From Warehouse */}
 <div className="group relative">
 <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
 <div className="relative bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-100 hover:border-blue-300 transition-all">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
 <WarehouseIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-lg font-black text-surface-900">Qayerdan</h3>
 <p className="text-sm text-surface-500">Manba ombor</p>
 </div>
 </div>
 <select
 value={fromWarehouse}
 onChange={(e) => {
 setFromWarehouse(e.target.value);
 setSelectedProducts([]);
 }}
 className="w-full px-4 py-3.5 border-2 border-surface-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all text-surface-900 font-semibold bg-surface-50 hover:bg-white"
 required
 >
 <option value="">Omborni tanlang...</option>
 {warehouses.map(warehouse => (
 <option key={warehouse._id} value={warehouse._id}>
 {warehouse.name}
 {(warehouse as any).isMain && ' (Asosiy)'}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* To Warehouse */}
 <div className="group relative">
 <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
 <div className="relative bg-white rounded-3xl p-6 shadow-xl border-2 border-green-100 hover:border-green-300 transition-all">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
 <WarehouseIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-lg font-black text-surface-900">Qayerga</h3>
 <p className="text-sm text-surface-500">Maqsad ombor</p>
 </div>
 </div>
 <select
 value={toWarehouse}
 onChange={(e) => setToWarehouse(e.target.value)}
 className="w-full px-4 py-3.5 border-2 border-surface-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all text-surface-900 font-semibold bg-surface-50 hover:bg-white"
 required
 >
 <option value="">Omborni tanlang...</option>
 {warehouses
 .filter(w => w._id !== fromWarehouse)
 .map(warehouse => (
 <option key={warehouse._id} value={warehouse._id}>
 {warehouse.name}
 {(warehouse as any).isMain && ' (Asosiy)'}
 </option>
 ))}
 </select>
 </div>
 </div>
 </div>

 {/* Transfer Type Badge */}
 {transferType && (
 <div className={`relative overflow-hidden rounded-3xl p-6 shadow-xl border-2 ${getTransferTypeInfo(transferType).borderColor}`}>
 <div className={`absolute inset-0 bg-gradient-to-br ${getTransferTypeInfo(transferType).bgColor} opacity-50`} />
 <div className="relative flex items-center gap-5">
 <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl bg-gradient-to-br ${getTransferTypeInfo(transferType).gradientFrom} ${getTransferTypeInfo(transferType).gradientTo}`}>
 {(() => {
 const TypeIcon = getTransferTypeInfo(transferType).icon;
 return <TypeIcon className="w-8 h-8 text-white" strokeWidth={2.5} />;
 })()}
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <span className={`text-2xl font-black ${getTransferTypeInfo(transferType).color}`}>
 {getTransferTypeInfo(transferType).label}
 </span>
 <span className="px-3 py-1 bg-white/80 rounded-full text-sm font-bold text-surface-700 shadow-sm">
 Transfer turi
 </span>
 </div>
 <p className="text-surface-700 font-medium text-lg flex items-center gap-2">
 {transferType === 'export' && (
 <>
 <ArrowUpCircle className="w-5 h-5" />
 Asosiy ombordan qo'shimcha omborga mahsulot yuborish
 </>
 )}
 {transferType === 'import' && (
 <>
 <ArrowDownCircle className="w-5 h-5" />
 Qo'shimcha ombordan asosiy omborga mahsulot qaytarish
 </>
 )}
 {transferType === 'internal' && (
 <>
 <ArrowLeftRight className="w-5 h-5" />
 Omborlar orasida ichki transfer
 </>
 )}
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Products Section */}
 <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-surface-100">
 <div className="flex items-center justify-between mb-5">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
 <Package className="w-6 h-6 text-white" strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-lg font-black text-surface-900">
 Mahsulotlar
 {selectedProducts.length > 0 && (
 <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
 {selectedProducts.length}
 </span>
 )}
 </h3>
 <p className="text-sm text-surface-500">Transfer qilinadigan mahsulotlar</p>
 </div>
 </div>
 <button
 type="button"
 onClick={openProductModal}
 className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center gap-2 shadow-lg ${
 !fromWarehouse
 ? 'bg-surface-200 text-surface-400 cursor-not-allowed'
 : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:scale-105 hover:shadow-xl'
 }`}
 disabled={!fromWarehouse}
 title={!fromWarehouse ? 'Avval omborni tanlang' : 'Mahsulot qo\'shish'}
 >
 <Plus className="w-5 h-5" strokeWidth={3} />
 <span>Qo'shish</span>
 </button>
 </div>

 {selectedProducts.length === 0 ? (
 <div className={`relative overflow-hidden rounded-2xl p-12 text-center transition-all duration-300 ${
 !fromWarehouse 
 ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200' 
 : 'bg-gradient-to-br from-surface-50 to-slate-50 border-2 border-dashed border-surface-300'
 }`}>
 <div className="relative z-10">
 <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl ${
 !fromWarehouse
 ? 'bg-gradient-to-br from-amber-400 to-orange-500'
 : 'bg-gradient-to-br from-surface-200 to-slate-300'
 }`}>
 {!fromWarehouse ? (
 <AlertTriangle className="w-10 h-10 text-white" strokeWidth={2.5} />
 ) : (
 <Package className="w-10 h-10 text-surface-400" strokeWidth={2} />
 )}
 </div>
 <h4 className={`text-xl font-black mb-2 flex items-center gap-2 ${
 !fromWarehouse ? 'text-amber-900' : 'text-surface-700'
 }`}>
 {!fromWarehouse ? (
 <>
 <AlertTriangle className="w-6 h-6" />
 Ombor tanlanmagan
 </>
 ) : (
 'Mahsulotlar qo\'shilmagan'
 )}
 </h4>
 <p className="text-surface-600 mb-4">
 {!fromWarehouse 
 ? 'Mahsulot qo\'shish uchun avval "Qayerdan" omborni tanlang' 
 : 'Yuqoridagi "Qo\'shish" tugmasini bosib mahsulot tanlang'}
 </p>
 </div>
 </div>
 ) : (
 <div className="space-y-3">
 {selectedProducts.map((item, index) => (
 <div
 key={item.product._id}
 className="group relative bg-gradient-to-r from-white to-purple-50/30 border-2 border-surface-200 rounded-2xl p-5 hover:border-purple-300 hover:shadow-lg transition-all duration-200"
 style={{ animationDelay: `${index * 50}ms` }}
 >
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform">
 <Package className="w-7 h-7 text-white" strokeWidth={2.5} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <h4 className="font-bold text-surface-900 text-lg mb-1">{item.product.name}</h4>
 <span className="text-xs font-mono bg-surface-100 px-3 py-1 rounded-lg text-surface-600 border border-surface-200">
 #{item.product.code}
 </span>
 </div>
 <button
 type="button"
 onClick={() => removeProduct(item.product._id)}
 className="w-9 h-9 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-100 hover:scale-110 transition-all"
 >
 <X className="w-5 h-5" strokeWidth={2.5} />
 </button>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex-1">
 <label className="text-xs text-surface-600 mb-2 block font-bold">Miqdor</label>
 <input
 type="number"
 value={item.quantity}
 onChange={(e) => updateProductQuantity(item.product._id, Number(e.target.value))}
 className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold text-lg"
 min="1"
 max={item.availableQuantity}
 />
 </div>
 <div className="text-right">
 <p className="text-xs text-surface-600 font-bold mb-2">Mavjud</p>
 <div className={`px-4 py-2.5 rounded-xl font-black text-lg ${
 item.quantity <= item.availableQuantity 
 ? 'bg-green-100 text-green-700 border-2 border-green-300' 
 : 'bg-red-100 text-red-700 border-2 border-red-300'
 }`}>
 {item.availableQuantity}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Notes */}
 <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-surface-100">
 <label className="text-sm font-bold text-surface-700 mb-3 block flex items-center gap-2">
 <MessageSquare className="w-4 h-4 text-surface-600" />
 Izoh (ixtiyoriy)
 </label>
 <textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="w-full px-4 py-3 border-2 border-surface-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all resize-none"
 rows={3}
 placeholder="Transfer haqida qo'shimcha ma'lumot yozing..."
 />
 </div>

 {/* Transfer Summary */}
 {selectedProducts.length > 0 && fromWarehouse && toWarehouse && transferType && (
 <div className={`relative overflow-hidden rounded-3xl p-6 shadow-2xl border-2 ${getTransferTypeInfo(transferType).borderColor}`}>
 <div className={`absolute inset-0 bg-gradient-to-br ${getTransferTypeInfo(transferType).bgColor}`} />
 <div className="relative">
 <div className="flex items-center gap-3 mb-5">
 {(() => {
 const TypeIcon = getTransferTypeInfo(transferType).icon;
 return <TypeIcon className={`w-7 h-7 ${getTransferTypeInfo(transferType).color}`} strokeWidth={2.5} />;
 })()}
 <h3 className={`font-black text-2xl ${getTransferTypeInfo(transferType).color}`}>
 Transfer xulosasi
 </h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
 <div className="flex items-center gap-3 mb-2">
 <Package className="w-5 h-5 text-surface-600" />
 <span className="text-surface-700 font-semibold">Mahsulotlar</span>
 </div>
 <p className="text-3xl font-black text-surface-900">
 {selectedProducts.length} <span className="text-lg font-semibold text-surface-600">xil</span>
 </p>
 </div>
 <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
 <div className="flex items-center gap-3 mb-2">
 <Sparkles className="w-5 h-5 text-surface-600" />
 <span className="text-surface-700 font-semibold">Jami miqdor</span>
 </div>
 <p className={`text-3xl font-black ${getTransferTypeInfo(transferType).color}`}>
 {totalQuantity} <span className="text-lg font-semibold">dona</span>
 </p>
 </div>
 <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
 <div className="flex items-center gap-3 mb-2">
 <WarehouseIcon className="w-5 h-5 text-surface-600" />
 <span className="text-surface-700 font-semibold">Qayerdan</span>
 </div>
 <p className="text-lg font-black text-surface-900 truncate flex items-center gap-2">
 {fromWarehouseData?.name}
 {(fromWarehouseData as any)?.isMain && <Building2 className="w-5 h-5 text-brand-600" />}
 </p>
 </div>
 <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
 <div className="flex items-center gap-3 mb-2">
 <ArrowRight className="w-5 h-5 text-surface-600" />
 <span className="text-surface-700 font-semibold">Qayerga</span>
 </div>
 <p className="text-lg font-black text-surface-900 truncate flex items-center gap-2">
 {toWarehouseData?.name}
 {(toWarehouseData as any)?.isMain && <Building2 className="w-5 h-5 text-success-600" />}
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Submit Button */}
 <button
 type="submit"
 disabled={loading || selectedProducts.length === 0 || !fromWarehouse || !toWarehouse}
 className={`w-full py-5 rounded-3xl font-black text-xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 ${
 loading || selectedProducts.length === 0 || !fromWarehouse || !toWarehouse
 ? 'bg-surface-200 text-surface-400 cursor-not-allowed'
 : transferType === 'export'
 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98]'
 : transferType === 'import'
 ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98]'
 : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]'
 }`}
 >
 {loading ? (
 <div className="spinner w-7 h-7" />
 ) : (
 <>
 {transferType && (() => {
 const TypeIcon = getTransferTypeInfo(transferType).icon;
 return <TypeIcon className="w-7 h-7" strokeWidth={2.5} />;
 })()}
 <span>
 {transferType ? `${getTransferTypeInfo(transferType).label} qilish` : 'Transfer qilish'}
 {selectedProducts.length > 0 && ` (${selectedProducts.length})`}
 </span>
 <Zap className="w-6 h-6" />
 </>
 )}
 </button>
 </form>
 ) : (
 /* Modern Transfer History */
 <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-surface-100">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
 <History className="w-6 h-6 text-white" strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-xl font-black text-surface-900">Transfer tarixi</h3>
 <p className="text-sm text-surface-500">So'nggi 20 ta transfer</p>
 </div>
 </div>

 {transfers.length === 0 ? (
 <div className="text-center py-16">
 <div className="w-24 h-24 bg-gradient-to-br from-surface-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
 <History className="w-12 h-12 text-surface-400" strokeWidth={2} />
 </div>
 <h4 className="text-xl font-bold text-surface-900 mb-2">Transfer tarixi yo'q</h4>
 <p className="text-surface-500">Hozircha hech qanday transfer amalga oshirilmagan</p>
 </div>
 ) : (
 <div className="space-y-4">
 {transfers.map((transfer, index) => {
 const typeInfo = getTransferTypeInfo(transfer.type);
 const TypeIcon = typeInfo.icon;
 
 // Check if transfer is recent (within 30 minutes)
 const transferTime = new Date(transfer.createdAt).getTime();
 const now = new Date().getTime();
 const diffMinutes = (now - transferTime) / (1000 * 60);
 const canUndo = diffMinutes <= 30;
 
 return (
 <div
 key={transfer._id}
 className={`group relative overflow-hidden rounded-2xl border-2 ${typeInfo.borderColor} hover:shadow-xl transition-all duration-300`}
 style={{ animationDelay: `${index * 50}ms` }}
 >
 <div className={`absolute inset-0 bg-gradient-to-r ${typeInfo.bgColor} opacity-50`} />
 <div className="relative p-5">
 <div className="flex items-start gap-4">
 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform bg-gradient-to-br ${typeInfo.gradientFrom} ${typeInfo.gradientTo}`}>
 <TypeIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <span className={`text-xs font-black px-3 py-1.5 rounded-lg shadow-md ${
 transfer.type === 'export' ? 'bg-blue-500 text-white' :
 transfer.type === 'import' ? 'bg-green-500 text-white' :
 'bg-purple-500 text-white'
 }`}>
 {typeInfo.label}
 </span>
 </div>
 <h4 className="font-bold text-surface-900 text-lg mb-1">
 {transfer.product.name}
 </h4>
 <span className="text-xs font-mono bg-white/80 px-3 py-1 rounded-lg text-surface-600 border border-surface-200">
 #{transfer.product.code}
 </span>
 </div>
 <div className="text-right">
 <div className={`px-4 py-2 rounded-xl font-black text-2xl ${typeInfo.color} bg-white/80 shadow-md`}>
 {transfer.quantity}
 </div>
 <p className="text-xs text-surface-500 font-semibold mt-1">dona</p>
 </div>
 </div>
 
 <div className="flex items-center gap-2 text-sm mb-3 p-3 bg-white/80 rounded-xl shadow-sm">
 <WarehouseIcon className="w-4 h-4 text-surface-600" />
 <span className="font-semibold text-surface-700">{transfer.fromWarehouse.name}</span>
 <ArrowRight className={`w-4 h-4 ${typeInfo.color}`} strokeWidth={2.5} />
 <span className="font-semibold text-surface-700">{transfer.toWarehouse.name}</span>
 </div>
 
 <div className="flex items-center justify-between text-xs pt-3 border-t border-surface-200/50">
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2 text-surface-600">
 <User className="w-4 h-4" />
 <span className="font-semibold">{transfer.transferredBy.name}</span>
 </div>
 <div className="flex items-center gap-2 text-surface-600">
 <Clock className="w-4 h-4" />
 <span className="font-semibold">
 {new Date(transfer.createdAt).toLocaleString('uz-UZ', {
 day: '2-digit',
 month: '2-digit',
 year: 'numeric',
 hour: '2-digit',
 minute: '2-digit'
 })}
 </span>
 </div>
 </div>
 
 {/* Undo Button - only for recent transfers */}
 {canUndo && (
 <button
 onClick={() => handleUndoTransfer(transfer)}
 disabled={loading}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
 title="Transferni bekor qilish (30 daqiqa ichida)"
 >
 <Undo2 className="w-4 h-4" />
 <span>Orqaga</span>
 </button>
 )}
 </div>
 
 {transfer.notes && (
 <div className="mt-3 text-sm text-surface-700 bg-white/80 rounded-xl p-3 border border-surface-200 shadow-sm flex items-start gap-2">
 <MessageSquare className="w-4 h-4 text-surface-600 flex-shrink-0 mt-0.5" />
 <div>
 <span className="font-bold">Izoh:</span> {transfer.notes}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}
 </div>



 {/* Product Selection Modal - Clean Design */}
 {showProductModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div 
 className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
 onClick={() => setShowProductModal(false)} 
 />
 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 max-h-[85vh] overflow-hidden flex flex-col">
 {/* Header */}
 <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
 <Package className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-white">Mahsulot tanlash</h3>
 <p className="text-sm text-white/80">{fromWarehouseData?.name} • {warehouseInventory.length} mahsulot</p>
 </div>
 </div>
 <button
 onClick={() => setShowProductModal(false)}
 className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Search & Filters */}
 <div className="p-4 border-b bg-gray-50 space-y-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 <input
 type="text"
 placeholder="Mahsulot nomi yoki kodi..."
 value={productSearch}
 onChange={(e) => setProductSearch(e.target.value)}
 className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 text-gray-900 bg-white"
 autoFocus
 />
 {productSearch && (
 <button
 onClick={() => setProductSearch('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300"
 >
 <X className="w-4 h-4" />
 </button>
 )}
 </div>

 <div className="flex items-center gap-2 flex-wrap text-sm">
 <span className="text-xs font-semibold text-gray-600">Filtrlar:</span>
 
 <div className="flex gap-1 bg-white rounded-lg p-1 border">
 <button
 onClick={() => setStockFilter('all')}
 className={`px-3 py-1 rounded text-xs font-semibold ${
 stockFilter === 'all' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
 }`}
 >
 Barchasi
 </button>
 <button
 onClick={() => setStockFilter('in-stock')}
 className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
 stockFilter === 'in-stock' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'
 }`}
 >
 <TrendingUp className="w-3 h-3" />
 Yetarli
 </button>
 <button
 onClick={() => setStockFilter('low-stock')}
 className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
 stockFilter === 'low-stock' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
 }`}
 >
 <TrendingDown className="w-3 h-3" />
 Kam
 </button>
 </div>

 <select
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value as 'name' | 'quantity' | 'code')}
 className="px-2 py-1 rounded-lg text-xs font-semibold border bg-white"
 >
 <option value="name">Nom</option>
 <option value="quantity">Miqdor</option>
 <option value="code">Kod</option>
 </select>

 {categories.length > 0 && (
 <select
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 className="px-2 py-1 rounded-lg text-xs font-semibold border bg-white"
 >
 <option value="all">Barcha kategoriyalar</option>
 {categories.map(cat => (
 <option key={cat} value={cat}>{cat}</option>
 ))}
 </select>
 )}

 <div className="ml-auto px-2 py-1 bg-blue-100 rounded-lg">
 <span className="text-xs font-bold text-blue-700">{filteredProducts.length} ta</span>
 </div>
 </div>
 </div>

 {/* Products */}
 <div className="flex-1 overflow-y-auto p-4">
 {filteredProducts.length === 0 ? (
 <div className="text-center py-12">
 <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
 <p className="text-gray-600 font-medium">
 {productSearch ? 'Mahsulot topilmadi' : 'Mahsulotlar yo\'q'}
 </p>
 </div>
 ) : (
 <div className="space-y-2">
 {filteredProducts.map((inv) => {
 const isAdded = selectedProducts.find(p => p.product._id === inv.product._id);
 const stockStatus = inv.quantity === 0 ? 'empty' : inv.quantity <= inv.minStock ? 'low' : 'good';
 const hasImage = inv.product.images && inv.product.images.length > 0;
 
 return (
 <button
 key={inv.product._id}
 onClick={() => addProduct(inv.product)}
 disabled={!!isAdded || inv.quantity === 0}
 className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
 isAdded
 ? 'border-green-300 bg-green-50'
 : inv.quantity === 0
 ? 'border-gray-200 bg-gray-50 opacity-60'
 : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow'
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
 isAdded ? 'bg-green-500' : inv.quantity === 0 ? 'bg-gray-300' : 'bg-gradient-to-br from-blue-500 to-purple-600'
 }`}>
 {hasImage ? (
 <img 
 src={`http://localhost:5050${inv.product.images![0]}`}
 alt={inv.product.name}
 className="w-full h-full object-cover"
 onError={(e) => {
 e.currentTarget.style.display = 'none';
 e.currentTarget.nextElementSibling?.classList.remove('hidden');
 }}
 />
 ) : null}
 <div className={hasImage ? 'hidden' : ''}>
 {isAdded ? (
 <CheckCircle className="w-6 h-6 text-white" />
 ) : (
 <Package className="w-6 h-6 text-white" />
 )}
 </div>
 </div>

 <div className="flex-1 min-w-0">
 <h4 className="font-bold text-gray-900 mb-1 truncate text-sm">
 {inv.product.name}
 </h4>
 <div className="flex items-center gap-2">
 <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
 #{inv.product.code}
 </span>
 {inv.product.category && (
 <span className="text-xs bg-purple-100 px-2 py-0.5 rounded text-purple-700">
 {inv.product.category}
 </span>
 )}
 </div>
 </div>

 <div className="text-right">
 <div className={`px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1 ${
 stockStatus === 'empty' ? 'bg-gray-100 text-gray-600' :
 stockStatus === 'low' ? 'bg-orange-500 text-white' :
 'bg-green-500 text-white'
 }`}>
 {stockStatus === 'low' && <TrendingDown className="w-3 h-3" />}
 {stockStatus === 'good' && <TrendingUp className="w-3 h-3" />}
 {inv.quantity}
 </div>
 <p className="text-xs text-gray-500 mt-1">Min: {inv.minStock}</p>
 </div>

 {isAdded && (
 <CheckCircle className="w-5 h-5 text-green-500 absolute top-2 right-2" />
 )}
 </div>
 </button>
 );
 })}
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="p-4 border-t bg-gray-50">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="px-3 py-1.5 bg-blue-100 rounded-lg">
 <span className="text-sm font-bold text-blue-700">
 {selectedProducts.length} tanlandi
 </span>
 </div>
 <span className="text-xs text-gray-500">
 <kbd className="px-2 py-1 bg-white rounded border text-gray-700">Esc</kbd> yopish
 </span>
 </div>
 <button
 onClick={() => setShowProductModal(false)}
 className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold"
 >
 Tayyor
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
