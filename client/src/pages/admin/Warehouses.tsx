import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Plus, Warehouse as WarehouseIcon, X, Package, Edit, Trash2, MapPin, RefreshCw } from 'lucide-react';
import { Warehouse } from '../../types';
import api from '../../utils/api';
import { useAlert } from '../../hooks/useAlert';
import { useLanguage } from '../../context/LanguageContext';

export default function Warehouses() {
 const navigate = useNavigate();
 const { t } = useLanguage();
 const { showConfirm, AlertComponent } = useAlert();
 const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
 const [showModal, setShowModal] = useState(false);
 const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
 const [loading, setLoading] = useState(true);
 const [formData, setFormData] = useState({ name: '', address: '' });
 const [refreshing, setRefreshing] = useState(false);

 useEffect(() => { fetchWarehouses(); }, []);

 const fetchWarehouses = async () => {
 try {
 setRefreshing(true);
 const res = await api.get('/warehouses');
 // Filter out "Asosiy ombor"
 const filtered = res.data.filter((w: Warehouse) => w.name !== 'Asosiy ombor');
 
 // Fetch inventory count for each warehouse
 const warehousesWithCount = await Promise.all(
 filtered.map(async (warehouse: Warehouse) => {
 try {
 const inventoryRes = await api.get(`/inventory/warehouse/${warehouse._id}`);
 return {
 ...warehouse,
 productCount: inventoryRes.data.length
 };
 } catch (err) {
 return {
 ...warehouse,
 productCount: 0
 };
 }
 })
 );
 
 setWarehouses(warehousesWithCount);
 } catch (err) { 
 console.error('Error fetching warehouses:', err); 
 } finally { 
 setLoading(false);
 setRefreshing(false);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 if (editingWarehouse) {
 await api.put(`/warehouses/${editingWarehouse._id}`, formData);
 } else {
 await api.post('/warehouses', formData);
 }
 fetchWarehouses();
 closeModal();
 } catch (err) { console.error('Error saving warehouse:', err); }
 };

 const handleDelete = async (id: string) => {
 const confirmed = await showConfirm(t("Omborni o'chirishni tasdiqlaysizmi?"), t("O'chirish"));
 if (!confirmed) return;
 try {
 await api.delete(`/warehouses/${id}`);
 fetchWarehouses();
 } catch (err) { console.error('Error deleting warehouse:', err); }
 };

 const openEditModal = (warehouse: Warehouse) => {
 setEditingWarehouse(warehouse);
 setFormData({ name: warehouse.name, address: warehouse.address || '' });
 setShowModal(true);
 };

 const closeModal = () => {
 setShowModal(false);
 setEditingWarehouse(null);
 setFormData({ name: '', address: '' });
 };

 return (
 <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
 {AlertComponent}
 <Header 
 title={t("Omborlar")}
 actions={
 <div className="flex items-center gap-2">
 <button 
 onClick={fetchWarehouses} 
 disabled={refreshing}
 className={`btn-secondary flex items-center gap-2 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
 title="Yangilash"
 >
 <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
 <span className="hidden sm:inline">{refreshing ? t("Yangilanmoqda...") : t("Yangilash")}</span>
 </button>
 <button onClick={() => setShowModal(true)} className="btn-primary">
 <Plus className="w-4 h-4" />
 <span className="hidden sm:inline">{t("Yangi ombor")}</span>
 </button>
 </div>
 }
 />

 <div className="p-4 lg:p-6">
 {loading ? (
 <div className="flex justify-center py-20">
 <div className="spinner text-brand-600 w-8 h-8" />
 </div>
 ) : warehouses.length === 0 ? (
 <div className="card flex flex-col items-center py-16">
 <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
 <WarehouseIcon className="w-8 h-8 text-surface-400" />
 </div>
 <h3 className="text-lg font-semibold text-surface-900 mb-2">{t("Omborlar yo'q")}</h3>
 <p className="text-surface-500 mb-6">{t("Birinchi omborni qo'shing")}</p>
 <button onClick={() => setShowModal(true)} className="btn-primary">{t("Ombor qo'shish")}</button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {warehouses.map(warehouse => (
 <div 
 key={warehouse._id} 
 className="card-hover cursor-pointer"
 onClick={() => navigate(`/admin/warehouses/${warehouse._id}`)}
 >
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
 <WarehouseIcon className="w-6 h-6 text-brand-600" />
 </div>
 <div>
 <h3 className="font-semibold text-surface-900">{warehouse.name}</h3>
 <div className="flex items-center gap-1 text-sm text-surface-500">
 <MapPin className="w-3 h-3" />
 <span>{warehouse.address || t("Manzil ko'rsatilmagan")}</span>
 </div>
 </div>
 </div>
 <div className="flex gap-1" onClick={e => e.stopPropagation()}>
 <button onClick={() => openEditModal(warehouse)} className="btn-icon-sm hover:bg-brand-100 hover:text-brand-600">
 <Edit className="w-4 h-4" />
 </button>
 <button onClick={() => handleDelete(warehouse._id)} className="btn-icon-sm hover:bg-danger-100 hover:text-danger-600">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 <div className="flex items-center gap-2 text-sm text-surface-500 pt-3 border-t border-surface-100">
 <Package className="w-4 h-4" />
 <span>{warehouse.productCount || 0} {t("ta tovar")}</span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Add/Edit Warehouse Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
 <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn overflow-hidden border-2 border-surface-100 dark:border-surface-700">
 {/* Gradient Header */}
 <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
 <WarehouseIcon className="w-5 h-5 text-white" />
 </div>
 <h3 className="text-xl font-black text-white">
 {editingWarehouse ? 'Omborni tahrirlash' : 'Yangi ombor'}
 </h3>
 </div>
 <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110">
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-5">
 <div>
 <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Ombor nomi</label>
 <input type="text" className="input" placeholder="Ombor nomi" value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})} required />
 </div>
 <div>
 <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Manzil</label>
 <div className="relative flex items-center">
 <MapPin className="absolute left-4 w-5 h-5 text-surface-400 pointer-events-none" />
 <input type="text" className="input pl-12" placeholder="Manzilni kiriting" value={formData.address}
 onChange={e => setFormData({...formData, address: e.target.value})} />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <button type="button" onClick={closeModal} className="btn-secondary flex-1 font-bold">Bekor qilish</button>
 <button type="submit" className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl">Saqlash</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Mobile FAB */}
 <button
 onClick={() => setShowModal(true)}
 className="lg:hidden fixed right-4 bottom-20 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all z-30"
 >
 <Plus className="w-6 h-6" />
 </button>
 </div>
 );
}
