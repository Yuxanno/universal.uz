import { useState } from 'react';
import Header from '../../components/Header';
import { Plus, Users, X, Phone, Edit, Trash2, MapPin, ChevronDown, Package } from 'lucide-react';
import { Customer } from '../../types';
import { formatNumber, formatPhone, displayPhone } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useCustomers } from '../../context/CustomersContext';
import { regions, regionNames } from '../../data/regions';
import { useLanguage } from '../../context/LanguageContext';

export default function Customers() {
 const { t } = useLanguage();
 const { showConfirm, AlertComponent } = useAlert();
 const { customers, loading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
 const [showModal, setShowModal] = useState(false);
 const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const [formData, setFormData] = useState({ name: '', phone: '', region: '', district: '' });
 const [filterRegion, setFilterRegion] = useState('');
 const [filterDistrict, setFilterDistrict] = useState('');
 const [showRegionFilter, setShowRegionFilter] = useState(false);
 const [showDetailsModal, setShowDetailsModal] = useState(false);
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const data = {
 name: formData.name,
 phone: formData.phone,
 address: formData.region && formData.district ? `${formData.region}, ${formData.district}` : ''
 };
 if (editingCustomer) {
 await updateCustomer(editingCustomer._id, data);
 } else {
 await addCustomer(data);
 }
 closeModal();
 } catch (err) { console.error(err); }
 };

 const handleDelete = async (id: string) => {
 const confirmed = await showConfirm(t("Mijozni o'chirishni tasdiqlaysizmi?"), t("O'chirish"));
 if (!confirmed) return;
 try {
 await deleteCustomer(id);
 } catch (err) { console.error(err); }
 };

 const openEditModal = (customer: Customer) => {
 setEditingCustomer(customer);
 // Parse address back to region and district
 const addressParts = (customer.address || '').split(', ');
 setFormData({
 name: customer.name,
 phone: customer.phone,
 region: addressParts[0] || '',
 district: addressParts[1] || ''
 });
 setShowModal(true);
 };

 const openDetailsModal = (customer: Customer) => {
 setSelectedCustomer(customer);
 setShowDetailsModal(true);
 };

 const closeModal = () => {
 setShowModal(false);
 setEditingCustomer(null);
 setFormData({ name: '', phone: '', region: '', district: '' });
 };

 const filteredCustomers = customers.filter(c => {
 // Text search filter
 const matchesSearch = searchQuery.trim() === '' ||
 c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 c.phone.includes(searchQuery);
 
 // Region filter - exact match
 let matchesRegion = true;
 if (filterRegion) {
 const addressParts = (c.address || '').split(', ');
 const customerRegion = addressParts[0] || '';
 const customerDistrict = addressParts[1] || '';
 
 matchesRegion = customerRegion === filterRegion;
 if (matchesRegion && filterDistrict) {
 matchesRegion = customerDistrict === filterDistrict;
 }
 }
 
 return matchesSearch && matchesRegion;
 });

 const getFilterLabel = () => {
 if (!filterRegion) return t('Barcha hududlar');
 if (!filterDistrict) return filterRegion;
 return `${filterRegion}, ${filterDistrict}`;
 };

 const clearFilter = () => {
 setFilterRegion('');
 setFilterDistrict('');
 };

 return (
 <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
 {AlertComponent}
 <Header
 title={t("Mijozlar")}
 showSearch
 onSearch={setSearchQuery}
 actions={
 <div className="flex items-center gap-2">
 {/* Region Filter Button */}
 <div className="relative">
 <button 
 onClick={() => setShowRegionFilter(!showRegionFilter)}
 className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
 filterRegion ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
 }`}
 >
 <MapPin className="w-4 h-4" />
 <span className="hidden sm:inline max-w-32 truncate">{getFilterLabel()}</span>
 <ChevronDown className="w-4 h-4" />
 </button>
 
 {showRegionFilter && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setShowRegionFilter(false)} />
 <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-surface-200 z-50 p-3">
 <div className="flex items-center justify-between mb-3">
 <span className="text-sm font-medium text-surface-700">{t("Hudud bo'yicha filter")}</span>
 {filterRegion && (
 <button onClick={clearFilter} className="text-xs text-brand-600 hover:text-brand-700">
 {t("Tozalash")}
 </button>
 )}
 </div>
 <select 
 className="select text-sm mb-2" 
 value={filterRegion}
 onChange={e => { setFilterRegion(e.target.value); setFilterDistrict(''); }}
 >
 <option value="">{t("Barcha viloyatlar")}</option>
 {regionNames.map(region => (
 <option key={region} value={region}>{region}</option>
 ))}
 </select>
 {filterRegion && (
 <select 
 className="select text-sm" 
 value={filterDistrict}
 onChange={e => setFilterDistrict(e.target.value)}
 >
 <option value="">{t("Barcha tumanlar")}</option>
 {regions[filterRegion]?.map(district => (
 <option key={district} value={district}>{district}</option>
 ))}
 </select>
 )}
 </div>
 </>
 )}
 </div>
 
 <button onClick={() => setShowModal(true)} className="btn-primary">
 <Plus className="w-4 h-4" />
 <span className="hidden sm:inline">{t("Yangi mijoz")}</span>
 </button>
 </div>
 }
 />

 <div className="p-4 lg:p-6">
 {loading ? (
 <div className="flex justify-center py-20">
 <div className="spinner text-brand-600 w-8 h-8" />
 </div>
 ) : filteredCustomers.length === 0 ? (
 <div className="card flex flex-col items-center py-16">
 <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
 <Users className="w-8 h-8 text-surface-400" />
 </div>
 {filterRegion ? (
 <>
 <h3 className="text-lg font-semibold text-surface-900 mb-2">
 {t("Bu hududda mijozlar yo'q")}
 </h3>
 <p className="text-surface-500 mb-2 text-center">
 <span className="font-medium text-brand-600">{filterDistrict ? `${filterRegion}, ${filterDistrict}` : filterRegion}</span> {t("da hech qanday mijoz topilmadi")}
 </p>
 <button 
 onClick={clearFilter} 
 className="btn-primary mt-4"
 >
 <X className="w-4 h-4" />
 {t("Filterni tozalash")}
 </button>
 </>
 ) : (
 <>
 <h3 className="text-lg font-semibold text-surface-900 mb-2">{t("Mijozlar yo'q")}</h3>
 <p className="text-surface-500 mb-6">{t("Birinchi mijozni qo'shing")}</p>
 <button onClick={() => setShowModal(true)} className="btn-primary">
 {t("Mijoz qo'shish")}
 </button>
 </>
 )}
 </div>
 ) : (
 <div className="card p-0 overflow-hidden">
 {/* Desktop Table */}
 <div className="hidden lg:block">
 <div className="table-header">
 <div className="grid grid-cols-12 gap-4 px-6 py-4">
 <span className="table-header-cell col-span-2">{t("Ism")}</span>
 <span className="table-header-cell col-span-2">{t("Telefon")}</span>
 <span className="table-header-cell col-span-3">{t("Manzil")}</span>
 <span className="table-header-cell col-span-2">{t("Xaridlar")}</span>
 <span className="table-header-cell col-span-2">{t("Qarz")}</span>
 <span className="table-header-cell col-span-1 text-center">{t("Amallar")}</span>
 </div>
 </div>
 <div className="divide-y divide-surface-100">
 {filteredCustomers.map(customer => (
 <div key={customer._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-50 transition-colors">
 <div className="col-span-2 flex items-center gap-3">
 <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
 <span className="font-semibold text-brand-600">{customer.name.charAt(0)}</span>
 </div>
 <span className="font-medium text-surface-900 truncate">{customer.name}</span>
 </div>
 <div className="col-span-2 text-surface-600 text-sm">{displayPhone(customer.phone)}</div>
 <div className="col-span-3 text-surface-500 text-sm truncate">
 {customer.address || '-'}
 </div>
 <div className="col-span-2">
 <button 
 onClick={() => openDetailsModal(customer)}
 className="text-left hover:text-brand-600 transition-colors"
 >
 <span className="text-brand-600 font-medium">
 {formatNumber(customer.totalPurchases || 0)} {t("so'm")}
 </span>
 <p className="text-xs text-surface-400">{customer.purchaseCount || 0} {t("ta xarid")}</p>
 </button>
 </div>
 <div className="col-span-2">
 <span className={customer.debt > 0 ? 'text-danger-600 font-medium' : 'text-success-600'}>
 {formatNumber(customer.debt)} {t("so'm")}
 </span>
 </div>
 <div className="col-span-1 flex items-center justify-center gap-2">
 <button onClick={() => openEditModal(customer)} className="btn-icon-sm hover:bg-brand-100 hover:text-brand-600">
 <Edit className="w-4 h-4" />
 </button>
 <button onClick={() => handleDelete(customer._id)} className="btn-icon-sm hover:bg-danger-100 hover:text-danger-600">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Mobile Cards */}
 <div className="lg:hidden divide-y divide-surface-100">
 {filteredCustomers.map(customer => (
 <div key={customer._id} className="p-4">
 <div className="flex items-start gap-3">
 <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
 <span className="font-semibold text-brand-600 text-lg">{customer.name.charAt(0)}</span>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between mb-2">
 <div>
 <h4 className="font-medium text-surface-900">{customer.name}</h4>
 <p className="text-sm text-surface-500">{displayPhone(customer.phone)}</p>
 {customer.address && (
 <p className="text-xs text-surface-400 mt-1">{customer.address}</p>
 )}
 </div>
 <div className="flex gap-1">
 <button onClick={() => openEditModal(customer)} className="btn-icon-sm">
 <Edit className="w-4 h-4" />
 </button>
 <button onClick={() => handleDelete(customer._id)} className="btn-icon-sm text-danger-500">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 <div className="flex gap-2 flex-wrap">
 {customer.totalPurchases > 0 && (
 <button 
 onClick={() => openDetailsModal(customer)}
 className="bg-brand-50 rounded-xl p-2 inline-block hover:bg-brand-100 transition-colors"
 >
 <span className="text-sm font-semibold text-brand-600">
 {t("Xarid")}: {formatNumber(customer.totalPurchases)} {t("so'm")}
 </span>
 </button>
 )}
 {customer.debt > 0 && (
 <div className="bg-danger-50 rounded-xl p-2 inline-block">
 <span className="text-sm font-semibold text-danger-600">
 {t("Qarz")}: {formatNumber(customer.debt)} {t("so'm")}
 </span>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
 <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn overflow-hidden border-2 border-surface-100 dark:border-surface-700">
 {/* Gradient Header */}
 <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
 <Users className="w-5 h-5 text-white" />
 </div>
 <h3 className="text-xl font-black text-white">
 {editingCustomer ? t('Mijozni tahrirlash') : t('Yangi mijoz')}
 </h3>
 </div>
 <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110">
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Form Content */}
 <form onSubmit={handleSubmit} className="p-6 space-y-5">
 <div>
 <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">{t("Ism")}</label>
 <input className="input" placeholder={t("Mijoz ismi")} value={formData.name}
 onChange={e => setFormData({ ...formData, name: e.target.value })} required />
 </div>
 <div>
 <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">{t("Telefon")}</label>
 <div className="relative">
 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
 <input className="input pl-12" placeholder="+998 (XX) XXX-XX-XX" value={formData.phone}
 onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} required />
 </div>
 </div>
 <div>
 <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">{t("Viloyat")}</label>
 <select 
 className="select" 
 value={formData.region}
 onChange={e => setFormData({ ...formData, region: e.target.value, district: '' })}
 >
 <option value="">{t("Viloyatni tanlang")}</option>
 {regionNames.map(region => (
 <option key={region} value={region}>{region}</option>
 ))}
 </select>
 </div>
 {formData.region && (
 <div className="animate-slideDown">
 <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">{t("Tuman")}</label>
 <select 
 className="select" 
 value={formData.district}
 onChange={e => setFormData({ ...formData, district: e.target.value })}
 >
 <option value="">{t("Tumanni tanlang")}</option>
 {regions[formData.region]?.map(district => (
 <option key={district} value={district}>{district}</option>
 ))}
 </select>
 </div>
 )}
 <div className="flex gap-3 pt-4">
 <button type="button" onClick={closeModal} className="btn-secondary flex-1 font-bold">{t("Bekor qilish")}</button>
 <button type="submit" className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl">{t("Saqlash")}</button>
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

 {/* Customer Details Modal */}
 {showDetailsModal && selectedCustomer && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)} />
 <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 animate-scaleIn overflow-hidden border-2 border-surface-100 dark:border-surface-700 max-h-[90vh] flex flex-col">
 {/* Header */}
 <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
 <span className="font-bold text-white text-xl">{selectedCustomer.name.charAt(0)}</span>
 </div>
 <div>
 <h3 className="text-xl font-black text-white">{selectedCustomer.name}</h3>
 <p className="text-white/80 text-sm">{displayPhone(selectedCustomer.phone)}</p>
 </div>
 </div>
 <button onClick={() => setShowDetailsModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110">
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="p-6 overflow-y-auto flex-1">
 {/* Stats */}
 <div className="grid grid-cols-2 gap-4 mb-6">
 <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl p-4">
 <p className="text-sm text-brand-600 dark:text-brand-400 mb-1">{t("Jami xaridlar")}</p>
 <p className="text-2xl font-bold text-brand-700 dark:text-brand-300">
 {formatNumber(selectedCustomer.totalPurchases || 0)} {t("so'm")}
 </p>
 <p className="text-xs text-surface-500 mt-1">{selectedCustomer.purchaseCount || 0} {t("ta xarid")}</p>
 </div>
 <div className={`rounded-2xl p-4 ${selectedCustomer.debt > 0 ? 'bg-danger-50 dark:bg-danger-900/20' : 'bg-success-50 dark:bg-success-900/20'}`}>
 <p className={`text-sm mb-1 ${selectedCustomer.debt > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>{t("Qarz")}</p>
 <p className={`text-2xl font-bold ${selectedCustomer.debt > 0 ? 'text-danger-700 dark:text-danger-300' : 'text-success-700 dark:text-success-300'}`}>
 {formatNumber(selectedCustomer.debt)} {t("so'm")}
 </p>
 </div>
 </div>

 {/* Purchase History */}
 {selectedCustomer.purchaseHistory && selectedCustomer.purchaseHistory.length > 0 && (
 <div>
 <h4 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-4">{t("Xaridlar tarixi")}</h4>
 <div className="space-y-2">
 {selectedCustomer.purchaseHistory
 .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
 .map((purchase, index) => (
 <div key={index} className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors">
 <div>
 <p className="font-medium text-surface-900 dark:text-surface-100">
 {new Date(purchase.date).toLocaleDateString('uz-UZ', { 
 year: 'numeric', 
 month: 'long', 
 day: 'numeric' 
 })}
 </p>
 <p className="text-xs text-surface-500 dark:text-surface-400">
 {new Date(purchase.date).toLocaleDateString('uz-UZ', { weekday: 'long' })}
 </p>
 </div>
 <div className="text-right">
 <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
 {formatNumber(purchase.amount)} {t("so'm")}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {(!selectedCustomer.purchaseHistory || selectedCustomer.purchaseHistory.length === 0) && (
 <div className="text-center py-8">
 <div className="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
 <Package className="w-8 h-8 text-surface-400" />
 </div>
 <p className="text-surface-500 dark:text-surface-400">{t("Xaridlar tarixi yo'q")}</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
