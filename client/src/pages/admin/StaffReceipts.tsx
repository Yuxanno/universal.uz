import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, User, Package, CheckCircle, Eye, EyeOff, Edit2, Check, X, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { socket } from '../../utils/socket';
import { formatNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useLanguage } from '../../context/LanguageContext';

interface WorkerItem {
 product: string;
 name: string;
 code: string;
 price: number;
 quantity: number;
}

interface WorkerReceipt {
 _id: string;
 items: WorkerItem[];
 total: number;
 status: 'draft' | 'pending' | 'approved' | 'completed' | 'archived';
 createdBy: {
 _id: string;
 name: string;
 };
 customer?: {
 _id: string;
 name: string;
 phone: string;
 };
 createdAt: string;
}

interface Worker {
 _id: string;
 name: string;
 role: string;
}

export default function StaffReceipts() {
 const { t } = useLanguage();
 const { AlertComponent } = useAlert();
 const navigate = useNavigate();
 const [workers, setWorkers] = useState<Worker[]>([]);
 const [receipts, setReceipts] = useState<WorkerReceipt[]>([]);
 const [loading, setLoading] = useState(true);
 const [showPrices, setShowPrices] = useState(true);
 const [editingItem, setEditingItem] = useState<{receiptId: string, itemIndex: number} | null>(null);
 const [editPrice, setEditPrice] = useState('');
 const [editQuantity, setEditQuantity] = useState('');

 const fetchData = useCallback(async () => {
 try {
 const [workersRes, receiptsRes] = await Promise.all([
 api.get('/users/helpers'),
 api.get('/receipts/staff')
 ]);
 // Фильтруем только helpers и убираем дубликаты
 const helpers = workersRes.data.filter((w: Worker) => w.role === 'helper');
 const uniqueHelpers = helpers.filter((w: Worker, index: number, self: Worker[]) => 
 index === self.findIndex((t) => t._id === w._id)
 );
 setWorkers(uniqueHelpers);
 
 // Remove duplicate receipts by _id (defensive filtering)
 // Don't include archived receipts - those are helper's private archive
 const uniqueReceipts = receiptsRes.data.filter((r: WorkerReceipt, index: number, self: WorkerReceipt[]) => 
 index === self.findIndex((t) => t._id === r._id)
 );
 console.log('📊 Fetched receipts:', {
 total: receiptsRes.data.length,
 unique: uniqueReceipts.length,
 duplicates: receiptsRes.data.length - uniqueReceipts.length
 });
 setReceipts(uniqueReceipts);
 } catch (err) {
 console.error('Error fetching data:', err);
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 fetchData();
 
 // Socket listener for real-time updates
 const handleReceiptUpdate = (data: any) => {
 console.log('📡 [StaffReceipts] Receipt updated via socket:', data);
 fetchData(); // Refresh data when receipt is updated
 };
 
 const handleReceiptDeleted = (data: any) => {
 console.log('📡 [StaffReceipts] Receipt deleted via socket:', data);
 fetchData(); // Refresh data when receipt is deleted
 };
 
 if (socket) {
 socket.on('receipt:updated', handleReceiptUpdate);
 socket.on('receipt:deleted', handleReceiptDeleted);
 }
 
 const interval = setInterval(fetchData, 5000); // Обновляем каждые 5 секунд
 
 return () => {
 if (socket) {
 socket.off('receipt:updated', handleReceiptUpdate);
 socket.off('receipt:deleted', handleReceiptDeleted);
 }
 clearInterval(interval);
 };
 }, [fetchData]);

 const getWorkerReceipts = (workerId: string) => {
 // Return draft and pending receipts (NOT archived - those are helper's private)
 const filtered = receipts.filter(r => 
 r.createdBy?._id === workerId && 
 (r.status === 'draft' || r.status === 'pending')
 );
 // Remove duplicates by _id (defensive)
 const unique = filtered.filter((r, index, self) => 
 index === self.findIndex(t => t._id === r._id)
 );
 console.log(`📋 getWorkerReceipts for ${workerId}:`, {
 filtered: filtered.length,
 unique: unique.length,
 ids: unique.map(r => ({ id: r._id, status: r.status, itemsCount: r.items.length }))
 });
 return unique;
 };

 const getReadyReceipts = (workerId: string) => {
 const filtered = receipts.filter(r => r.createdBy?._id === workerId && r.status === 'approved');
 // Remove duplicates by _id (defensive)
 const unique = filtered.filter((r, index, self) => 
 index === self.findIndex(t => t._id === r._id)
 );
 console.log(`✅ getReadyReceipts for ${workerId}:`, {
 filtered: filtered.length,
 unique: unique.length,
 ids: unique.map(r => ({ id: r._id, status: r.status, itemsCount: r.items.length }))
 });
 return unique;
 };

 const handleEditItem = (receiptId: string, itemIndex: number, currentPrice: number, currentQuantity: number) => {
 setEditingItem({ receiptId, itemIndex });
 setEditPrice(currentPrice.toString());
 setEditQuantity(currentQuantity.toString());
 };

 const handleSaveEdit = async () => {
 if (!editingItem) return;
 
 try {
 const price = parseInt(editPrice) || 0;
 const quantity = parseInt(editQuantity) || 0;
 
 if (quantity <= 0) {
 // Remove item if quantity is 0
 await api.delete(`/receipts/${editingItem.receiptId}`);
 } else {
 await api.put(`/receipts/${editingItem.receiptId}/update-item/${editingItem.itemIndex}`, {
 price,
 quantity
 });
 }
 
 setEditingItem(null);
 setEditPrice('');
 setEditQuantity('');
 fetchData();
 } catch (err) {
 console.error('Error updating item:', err);
 }
 };

 const handleCancelEdit = () => {
 setEditingItem(null);
 setEditPrice('');
 setEditQuantity('');
 };

 const handleRemoveItem = async (receiptId: string, itemIndex: number) => {
 try {
 await api.put(`/receipts/${receiptId}/remove-item/${itemIndex}`);
 fetchData();
 } catch (err) {
 console.error('Error removing item:', err);
 }
 };

 // Показываем всех рабочих (helpers)
 const displayWorkers = workers;

 return (
 <div className="min-h-screen bg-surface-50">
 {AlertComponent}
 
 {/* Top Bar */}
 <div className="bg-white border-b border-surface-200 px-6 py-4 shadow-sm">
 <div className="flex items-center justify-between">
 <h1 className="text-xl font-bold text-surface-900">{t("Xodimlar POS")}</h1>
 <div className="flex items-center gap-4">
 <button
 onClick={() => {
 const newValue = !showPrices;
 console.log('🔄 Toggling showPrices:', { from: showPrices, to: newValue });
 setShowPrices(newValue);
 }}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all border-2 shadow-sm ${
 showPrices
 ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-red-200'
 : 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
 }`}
 >
 {showPrices ? (
 <>
 <EyeOff className="w-5 h-5" />
 <span>{t("Narxni yashirish")}</span>
 </>
 ) : (
 <>
 <Eye className="w-5 h-5" />
 <span>{t("Narxni ko'rsatish")}</span>
 </>
 )}
 </button>
 <span className="text-sm text-surface-500">
 {workers.length} {t("ta xodim")} • {receipts.filter(r => r.status === 'pending').length} {t("ta kutilmoqda")}
 </span>
 </div>
 </div>
 </div>

 {/* Workers Grid */}
 <div className="p-6">
 {loading ? (
 <div className="flex justify-center py-20">
 <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
 </div>
 ) : (
 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
 {displayWorkers.flatMap((worker, workerIndex) => {
 const workerReceipts = getWorkerReceipts(worker._id);
 const readyReceipts = getReadyReceipts(worker._id);
 
 // If worker has no receipts, skip
 if (workerReceipts.length === 0 && readyReceipts.length === 0) {
 return [];
 }
 
 // Combine all receipts
 const allReceipts = [...workerReceipts, ...readyReceipts];
 
 // Show each receipt as a separate card
 return allReceipts.map((receipt) => {
 const isReady = receipt.status === 'approved';
 const isPending = receipt.status === 'pending';
 const isArchived = receipt.status === 'archived';
 const customerName = receipt.customer?.name || 'Oddiy mijoz';
 
 const displayItems = receipt.items.map((item, idx) => ({
 ...item,
 receiptId: receipt._id,
 itemIndex: idx
 }));
 
 const total = displayItems.reduce((sum, item) => {
 return sum + item.price * item.quantity;
 }, 0);

 return (
 <div
 key={receipt._id}
 className={`rounded-2xl border-2 overflow-hidden transition-all bg-white shadow-sm ${
 isReady 
 ? 'border-success-500 shadow-lg shadow-success-500/10' 
 : isPending
 ? 'border-warning-500 shadow-lg shadow-warning-500/10'
 : 'border-surface-200'
 }`}
 >
 {/* Header */}
 <div className={`px-5 py-4 ${
 isReady ? 'bg-success-500' : isPending ? 'bg-warning-500' : 'bg-surface-100'
 }`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
 isReady ? 'bg-success-400' : isPending ? 'bg-warning-400' : 'bg-white'
 }`}>
 <User className={`w-6 h-6 ${isReady || isPending ? 'text-white' : 'text-surface-600'}`} />
 </div>
 <div>
 <h3 className={`font-semibold text-lg ${isReady || isPending ? 'text-white' : 'text-surface-900'}`}>
 {worker.name || `Xodim ${workerIndex + 1}`}
 </h3>
 <p className={`text-sm ${isReady || isPending ? 'text-white/80' : 'text-surface-500'}`}>
 {customerName}
 </p>
 </div>
 </div>
 {isReady && <CheckCircle className="w-7 h-7 text-white" />}
 {isArchived && !isPending && !isReady && (
 <div className="w-3 h-3 bg-brand-500 rounded-full animate-pulse" />
 )}
 </div>
 </div>

 {/* Notifications */}
 {isReady && (
 <div className="bg-success-50 border-b border-success-200 px-5 py-3">
 <p className="text-success-700 text-sm font-medium text-center">
 ✓ {t("Xodim barcha tovarlarni yig'di")}
 </p>
 </div>
 )}
 {/* Removed: "Yig'ilayotgan xarid (real-time)" banner */}
 {isPending && !isReady && (
 <div className="bg-warning-50 border-b border-warning-200 px-5 py-3">
 <p className="text-warning-700 text-sm font-medium text-center">
 ⏳ {t("Kassaga yuborilgan - tayyor")}
 </p>
 </div>
 )}

 {/* Items list */}
 <div className="p-4 min-h-[200px] max-h-[400px] overflow-auto">
 {displayItems.length === 0 ? (
 <div className="text-center py-12 text-surface-400">
 <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
 <p className="text-lg">{t("Tovarlar yo'q")}</p>
 </div>
 ) : (
 <div className="space-y-3">
 {displayItems.map((item, index) => {
 const isEditing = editingItem?.receiptId === item.receiptId && editingItem?.itemIndex === item.itemIndex;
 
 return (
 <div key={`${item.receiptId}-${item.itemIndex}`}>
 {/* Separator line between items */}
 {index > 0 && (
 <div className="border-t border-surface-200 -mt-1 mb-3" />
 )}
 
 <div 
 className={`relative flex items-center gap-3 p-4 rounded-xl transition-all ${
 isEditing 
 ? 'bg-brand-50 border-2 border-brand-500 shadow-lg' 
 : 'bg-surface-50 hover:bg-surface-100'
 }`}
 >
 {/* Product Info */}
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-surface-900 truncate text-sm">{item.name}</p>
 <p className="text-xs text-surface-500">Kod: {item.code?.length > 10 ? item.code.slice(-6) : item.code}</p>
 </div>
 
 {isEditing ? (
 /* Edit Mode */
 <div className="flex items-center gap-2 flex-shrink-0">
 {showPrices && (
 <div className="flex items-center gap-1">
 <input
 type="text"
 value={editPrice}
 onChange={(e) => {
 const val = e.target.value.replace(/\s/g, '');
 if (val === '' || /^\d+$/.test(val)) {
 setEditPrice(val);
 }
 }}
 className="w-24 h-10 text-right text-sm font-semibold border-2 border-brand-400 rounded-lg px-2 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
 placeholder="Narx"
 autoFocus
 />
 <span className="text-surface-400 font-bold text-lg">×</span>
 </div>
 )}
 <input
 type="text"
 value={editQuantity}
 onChange={(e) => {
 const val = e.target.value;
 if (val === '' || /^\d+$/.test(val)) {
 setEditQuantity(val);
 }
 }}
 className="w-16 h-10 text-center text-sm font-bold border-2 border-brand-400 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
 placeholder="Soni"
 />
 <div className="flex items-center gap-2 ml-2">
 <button
 onClick={handleSaveEdit}
 className="w-11 h-11 flex items-center justify-center bg-success-500 text-white rounded-xl hover:bg-success-600 transition-all hover:scale-110 shadow-lg active:scale-95"
 title="Saqlash"
 >
 <Check className="w-6 h-6" strokeWidth={3} />
 </button>
 <button
 onClick={handleCancelEdit}
 className="w-11 h-11 flex items-center justify-center bg-surface-500 text-white rounded-xl hover:bg-surface-600 transition-all hover:scale-110 shadow-lg active:scale-95"
 title="Bekor qilish"
 >
 <X className="w-6 h-6" strokeWidth={3} />
 </button>
 </div>
 </div>
 ) : (
 /* View Mode */
 <div className="flex items-center gap-3 flex-shrink-0">
 {showPrices && (
 <div className="flex items-center gap-2 text-sm">
 <span className="font-semibold text-surface-700 min-w-[70px] text-right">
 {formatNumber(item.price)}
 </span>
 <span className="text-surface-400 font-bold text-lg">×</span>
 </div>
 )}
 <span className="font-bold text-surface-900 min-w-[40px] text-center text-sm">
 {item.quantity}
 </span>
 {showPrices && (
 <span className="font-bold text-surface-900 min-w-[80px] text-right text-sm">
 {formatNumber(item.price * item.quantity)}
 </span>
 )}
 <div className="flex items-center gap-1 ml-2">
 <button
 onClick={() => handleEditItem(item.receiptId, item.itemIndex, item.price, item.quantity)}
 className="w-9 h-9 flex items-center justify-center text-brand-600 hover:bg-brand-100 rounded-lg transition-all hover:scale-110"
 title="Tahrirlash"
 >
 <Edit2 className="w-4 h-4" />
 </button>
 <button
 onClick={() => handleRemoveItem(item.receiptId, item.itemIndex)}
 className="w-9 h-9 flex items-center justify-center text-danger-600 hover:bg-danger-100 rounded-lg transition-all hover:scale-110"
 title="O'chirish"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Footer */}
 <div className={`px-5 py-4 border-t ${
 isPending ? 'border-warning-200 bg-warning-50' : 'border-surface-200 bg-surface-50'
 }`}>
 {showPrices && (
 <div className="flex items-center justify-between mb-4">
 <span className="text-surface-500 font-medium">{t("Jami")}:</span>
 <span className="text-3xl font-bold text-surface-900">
 {formatNumber(total)} <span className="text-base font-normal text-surface-500">{t("so'm")}</span>
 </span>
 </div>
 )}
 
 {isPending && (
 <button
 onClick={async () => {
 try {
 // OPTIMIZED: Backend returns complete receipt with product details
 const response = await api.put(`/receipts/${receipt._id}/load-to-kassa`);
 
 console.log('✅ Receipt loaded to kassa successfully');
 
 // Prepare kassa items from receipt data (already have all info)
 const kassaItems = receipt.items.map((item) => ({
 _id: item.product,
 name: item.name,
 code: item.code,
 price: item.price,
 cartQuantity: item.quantity,
 quantity: 0, // Will be updated in kassa
 costPrice: 0,
 tan_narx: 0,
 optom_narx: item.price
 }));
 
 console.log('📦 Loading to kassa:', {
 receiptId: receipt._id,
 itemsCount: kassaItems.length
 });
 
 // Save to localStorage
 localStorage.setItem('kassaItems', JSON.stringify(kassaItems));
 localStorage.setItem('kassaReceiptId', receipt._id);
 
 // Save customer info
 if (receipt.customer) {
 localStorage.setItem('kassaCustomerId', receipt.customer._id);
 } else {
 localStorage.setItem('kassaCustomerId', '');
 }
 
 // Dispatch event for same-tab updates
 window.dispatchEvent(new Event('kassaItemsUpdated'));
 
 // Navigate immediately (don't wait for fetchData)
 navigate('/cashier');
 } catch (err: any) {
 console.error('Error loading to kassa:', err);
 const errorMsg = err.response?.data?.message || 'Xatolik yuz berdi';
 alert(errorMsg);
 }
 }}
 className="w-full flex items-center justify-center gap-2 py-4 text-white rounded-xl font-semibold text-lg transition-colors bg-warning-500 hover:bg-warning-600"
 >
 <Download className="w-5 h-5" />
 {t("Kassaga yuklash")}
 </button>
 )}
 </div>
 </div>
 );
 });
 })}

 {workers.length === 0 && !loading && (
 <div className="col-span-full text-center py-20 text-surface-400">
 <User className="w-20 h-20 mx-auto mb-4 opacity-50" />
 <h3 className="text-xl font-medium mb-2 text-surface-600">{t("Xodimlar yo'q")}</h3>
 <p>{t("Avval xodimlarni qo'shing")}</p>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
