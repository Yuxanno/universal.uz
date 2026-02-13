import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Plus, Users, X, Edit, Trash2, MapPin, ChevronDown, Package } from 'lucide-react';
import { Customer } from '../../types';
import { formatNumber, displayPhone } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useCustomers } from '../../context/CustomersContext';
import { regions, regionNames } from '../../data/regions';
import { useLanguage } from '../../context/LanguageContext';
import PhoneInput from '../../components/PhoneInput';
import ReturnModal from '../../components/customers/ReturnModal';
import api from '../../utils/api';

export default function Customers() {
 const { t } = useLanguage();
 const { showConfirm, AlertComponent } = useAlert();
 const { customers, loading, addCustomer, updateCustomer, deleteCustomer, fetchCustomers } = useCustomers();
 const [showModal, setShowModal] = useState(false);
 const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const [formData, setFormData] = useState({ name: '', phone: '+998', region: '', district: '' });
 const [filterRegion, setFilterRegion] = useState('');
 const [filterDistrict, setFilterDistrict] = useState('');
 const [showRegionFilter, setShowRegionFilter] = useState(false);
 const [showDetailsModal, setShowDetailsModal] = useState(false);
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
 const [customerModalKey, setCustomerModalKey] = useState(0); // Force re-render key
 // SENIOR SOLUTION: Inline error messages for form fields
 const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
 // Return functionality
 const [showReturnModal, setShowReturnModal] = useState(false);
 const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
 const [processingReturn, setProcessingReturn] = useState(false);

 // Fetch customers when component mounts
 useEffect(() => {
 fetchCustomers();
 }, [fetchCustomers]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 // Clear previous errors
 setFormErrors({});
 
 try {
 const data = {
 name: formData.name.trim(),
 phone: formData.phone.trim(),
 address: formData.region && formData.district ? `${formData.region}, ${formData.district}` : ''
 };
 if (editingCustomer) {
 await updateCustomer(editingCustomer._id, data);
 } else {
 await addCustomer(data);
 }
 closeModal();
 } catch (err: any) {
 console.error('Error submitting customer:', err);
 // SENIOR SOLUTION: Show inline error messages below inputs
 const errorMessage = err.response?.data?.message || 'Xatolik yuz berdi';
 const errorField = err.response?.data?.field;
 
 if (errorField === 'name') {
 setFormErrors({ name: errorMessage });
 } else if (errorField === 'phone') {
 setFormErrors({ phone: errorMessage });
 } else {
 // Generic error - show as alert
 showConfirm(errorMessage, 'Xatolik', 'danger');
 }
 }
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

 const openDetailsModal = async (customer: Customer) => {
 try {
 // Fetch detailed customer data with purchase history
 const res = await api.get(`/customers/${customer._id}`);
 setSelectedCustomer(res.data);
 setShowDetailsModal(true);
 } catch (err) {
 console.error('Error fetching customer details:', err);
 setSelectedCustomer(customer);
 setShowDetailsModal(true);
 }
 };

 // Open return modal
 const openReturnModal = (purchase: any) => {
 setSelectedPurchase(purchase);
 setShowReturnModal(true);
 };

 // Process return
 const processReturn = async (itemsToReturn: { product: string; quantity: number }[]) => {
 if (!selectedPurchase || !selectedCustomer) return;
 
 if (itemsToReturn.length === 0) {
 showConfirm('Qaytariladigan mahsulot tanlanmagan', 'Ogohlantirish', 'warning');
 return;
 }
 
 setProcessingReturn(true);
 
 try {
 // Get full item details
 const fullItems = itemsToReturn.map(returnItem => {
 const originalItem = selectedPurchase.items.find((item: any) => 
 (item.product || item._id) === returnItem.product
 );
 return {
 product: returnItem.product,
 name: originalItem.name,
 code: originalItem.code,
 price: originalItem.price,
 quantity: returnItem.quantity
 };
 });
 
 // Calculate return total
 const returnTotal = fullItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
 
 // Call backend API
 const response = await api.post('/receipts/return', {
 customerId: selectedCustomer._id,
 receiptId: selectedPurchase.receiptId,
 items: fullItems,
 returnTotal,
 originalPurchase: {
 total: selectedPurchase.total,
 cashAmount: selectedPurchase.cashAmount || 0,
 cardAmount: selectedPurchase.cardAmount || 0,
 debtAmount: selectedPurchase.debtAmount || 0
 }
 });
 
 console.log('✅ Return response:', response.data);
 
 // Show detailed success message with refund breakdown
 const { refundBreakdown, customerUpdate, receiptUpdate } = response.data;
 let successMessage = 'Mahsulotlar muvaffaqiyatli qaytarildi!\n\n';
 
 if (receiptUpdate?.isFullReturn) {
 successMessage += '🔄 To\'liq qaytarildi - xarid ro\'yxatdan o\'chirildi\n\n';
 } else if (receiptUpdate) {
 successMessage += `📦 Qisman qaytarildi\n`;
 successMessage += `Qolgan summa: ${formatNumber(receiptUpdate.remainingTotal)} so'm\n\n`;
 }
 
 if (refundBreakdown.debtReduced > 0) {
 successMessage += `💰 Qarzdan ayrildi: ${formatNumber(refundBreakdown.debtReduced)} so'm\n`;
 }
 if (refundBreakdown.cardRefund > 0) {
 successMessage += `💳 Kartaga qaytarildi: ${formatNumber(refundBreakdown.cardRefund)} so'm\n`;
 }
 if (refundBreakdown.cashRefund > 0) {
 successMessage += `💵 Naqd qaytarildi: ${formatNumber(refundBreakdown.cashRefund)} so'm\n`;
 }
 
 if (customerUpdate) {
 successMessage += `\n📊 Yangi qarz: ${formatNumber(customerUpdate.debt)} so'm`;
 successMessage += `\n📊 Jami xaridlar: ${formatNumber(customerUpdate.totalPurchases)} so'm`;
 }
 
 console.log('📊 Customer update:', customerUpdate);
 console.log('📊 Receipt update:', receiptUpdate);
 
 // Close return modal first
 setShowReturnModal(false);
 setSelectedPurchase(null);
 
 // Refresh customers list to get updated totals (force refresh, bypass cache)
 await fetchCustomers(true);
 console.log('✅ Customers list refreshed (forced)');
 
 // Refresh customer details modal with fresh data from server
 try {
 const res = await api.get(`/customers/${selectedCustomer._id}`);
 const freshCustomerData = res.data;
 
 console.log('✅ Customer data refreshed:', {
 debt: freshCustomerData.debt,
 totalPurchases: freshCustomerData.totalPurchases,
 purchaseHistoryCount: freshCustomerData.detailedPurchaseHistory?.length,
 oldDebt: selectedCustomer.debt,
 oldTotalPurchases: selectedCustomer.totalPurchases
 });
 
 // Force update by creating new object reference
 setSelectedCustomer({...freshCustomerData});
 
 // Force modal re-render by updating key
 setCustomerModalKey(prev => prev + 1);
 
 console.log('🔄 State updated, component should re-render');
 } catch (err) {
 console.error('Error refreshing customer details:', err);
 }
 
 showConfirm(successMessage, 'Muvaffaqiyat', 'success');
 } catch (err: any) {
 console.error('Error processing return:', err);
 const errorMsg = err.response?.data?.message || 'Qaytarishda xatolik yuz berdi';
 showConfirm(errorMsg, 'Xatolik', 'danger');
 } finally {
 setProcessingReturn(false);
 }
 };

 const closeModal = () => {
 setShowModal(false);
 setEditingCustomer(null);
 setFormData({ name: '', phone: '+998', region: '', district: '' });
 setFormErrors({}); // Clear errors when closing modal
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
 <div key={customer._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-50 transition-colors cursor-pointer" onClick={() => openDetailsModal(customer)}>
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
 <span className="text-brand-600 font-medium">
 {formatNumber(customer.totalPurchases || 0)} {t("so'm")}
 </span>
 <p className="text-xs text-surface-400">{customer.purchaseCount || 0} {t("ta xarid")}</p>
 </div>
 <div className="col-span-2">
 <span className={customer.debt > 0 ? 'text-danger-600 font-medium' : 'text-success-600'}>
 {formatNumber(customer.debt)} {t("so'm")}
 </span>
 </div>
 <div className="col-span-1 flex items-center justify-center gap-2">
 <button onClick={(e) => { e.stopPropagation(); openEditModal(customer); }} className="btn-icon-sm hover:bg-brand-100 hover:text-brand-600">
 <Edit className="w-4 h-4" />
 </button>
 <button onClick={(e) => { e.stopPropagation(); handleDelete(customer._id); }} className="btn-icon-sm hover:bg-danger-100 hover:text-danger-600">
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
 <input 
 className={`input ${formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
 placeholder={t("Mijoz ismi")} 
 value={formData.name}
 onChange={e => {
 setFormData({ ...formData, name: e.target.value });
 // Clear error when user starts typing
 if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
 }} 
 required 
 />
 {formErrors.name && (
 <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1.5 animate-slideDown">
 <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
 </svg>
 {formErrors.name}
 </p>
 )}
 </div>
 <div>
 <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">{t("Telefon")}</label>
 <PhoneInput
 value={formData.phone}
 onChange={(phone) => {
 setFormData({ ...formData, phone });
 // Clear error when user starts typing
 if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
 }}
 required
 className={formErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
 />
 {formErrors.phone && (
 <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1.5 animate-slideDown">
 <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
 </svg>
 {formErrors.phone}
 </p>
 )}
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
 <div key={`customer-modal-${customerModalKey}`} className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
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
 <div className="grid grid-cols-3 gap-3 mb-6">
 <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl p-3">
 <p className="text-xs text-brand-600 dark:text-brand-400 mb-1">{t("Jami xaridlar")}</p>
 <p className="text-lg font-bold text-brand-700 dark:text-brand-300">
 {formatNumber(selectedCustomer.totalPurchases || 0)}
 </p>
 <p className="text-xs text-surface-500 mt-1">{selectedCustomer.purchaseCount || 0} {t("ta xarid")}</p>
 </div>
 <div className="bg-success-50 dark:bg-success-900/20 rounded-2xl p-3">
 <p className="text-xs text-success-600 dark:text-success-400 mb-1">{t("To'langan")}</p>
 <p className="text-lg font-bold text-success-700 dark:text-success-300">
 {formatNumber((selectedCustomer.totalPurchases || 0) - (selectedCustomer.debt || 0))}
 </p>
 </div>
 <div className={`rounded-2xl p-3 ${selectedCustomer.debt > 0 ? 'bg-danger-50 dark:bg-danger-900/20' : 'bg-success-50 dark:bg-success-900/20'}`}>
 <p className={`text-xs mb-1 ${selectedCustomer.debt > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>{t("Qarz")}</p>
 <p className={`text-lg font-bold ${selectedCustomer.debt > 0 ? 'text-danger-700 dark:text-danger-300' : 'text-success-700 dark:text-success-300'}`}>
 {formatNumber(selectedCustomer.debt)}
 </p>
 </div>
 </div>

 {/* Purchase History */}
 {(selectedCustomer as any).detailedPurchaseHistory && (selectedCustomer as any).detailedPurchaseHistory.length > 0 && (
 <>
 {/* Purchases */}
 {(selectedCustomer as any).detailedPurchaseHistory.filter((p: any) => p.type !== 'debt_payment').length > 0 && (
 <div>
 <h4 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-4">{t("Xaridlar")}</h4>
 <div className="space-y-3">
 {(selectedCustomer as any).detailedPurchaseHistory
 .filter((purchase: any) => purchase.type !== 'debt_payment')
 .map((purchase: any, index: number) => (
 <div key={index} className="rounded-xl p-3 border bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600">
 <div className="flex items-center justify-between mb-2">
 <div className="flex-1">
 <p className="text-sm font-bold text-surface-900 dark:text-surface-100">
 {new Date(purchase.date).toLocaleDateString('en-GB').replace(/\//g, '.')} {new Date(purchase.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
 </p>
 <p className="text-xs text-surface-500 dark:text-surface-400">
 Chek #{purchase.receiptId.toString().slice(-8)}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <div className="text-right">
 <p className="text-lg font-black text-brand-600 dark:text-brand-400">
 {formatNumber(purchase.total)} {t("so'm")}
 </p>
 </div>
 {/* Qaytarish tugmasi */}
 <button
 onClick={(e) => {
 e.stopPropagation();
 openReturnModal(purchase);
 }}
 className="w-9 h-9 flex items-center justify-center rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-600 transition-all hover:scale-110 active:scale-95"
 title="Mahsulotni qaytarish"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
 </svg>
 </button>
 </div>
 </div>
 
 {/* Items - with max height and scroll */}
 <div className="max-h-40 overflow-y-auto space-y-1 mb-2 pr-1">
 {purchase.items.map((item: any, idx: number) => (
 <div key={idx} className="flex justify-between text-xs bg-white dark:bg-surface-800 rounded-lg p-2">
 <span className="text-surface-700 dark:text-surface-300 flex-1 truncate">
 {item.name} <span className="text-surface-500">×{item.quantity}</span>
 </span>
 <span className="font-semibold text-surface-900 dark:text-surface-100 ml-2">
 {formatNumber(item.price * item.quantity)}
 </span>
 </div>
 ))}
 </div>
 
 {/* Payment breakdown - compact */}
 <div className="border-t border-surface-200 dark:border-surface-600 pt-2 space-y-1">
 {purchase.cashAmount > 0 && (
 <div className="flex justify-between text-xs">
 <span className="text-surface-600 dark:text-surface-400">💵 Naqd:</span>
 <span className="font-semibold text-emerald-600 dark:text-emerald-400">
 {formatNumber(purchase.cashAmount)}
 </span>
 </div>
 )}
 {purchase.cardAmount > 0 && (
 <div className="flex justify-between text-xs">
 <span className="text-surface-600 dark:text-surface-400">💳 Karta:</span>
 <span className="font-semibold text-blue-600 dark:text-blue-400">
 {formatNumber(purchase.cardAmount)}
 </span>
 </div>
 )}
 {purchase.debtAmount > 0 && (
 <div className="flex justify-between text-xs">
 <span className="text-surface-600 dark:text-surface-400">⚠️ Qarz:</span>
 <span className="font-semibold text-danger-600 dark:text-danger-400">
 {formatNumber(purchase.debtAmount)}
 </span>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 
 {/* Debt Payments */}
 {(selectedCustomer as any).detailedPurchaseHistory.filter((p: any) => p.type === 'debt_payment').length > 0 && (
 <div className="mt-6">
 <h4 className="text-base font-bold text-emerald-700 dark:text-emerald-300 mb-3">{t("Qarz to'lovlari")}</h4>
 <div className="space-y-2">
 {(selectedCustomer as any).detailedPurchaseHistory
 .filter((purchase: any) => purchase.type === 'debt_payment')
 .map((purchase: any, index: number) => (
 <div key={index} className="rounded-lg p-3 border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
 <span className="text-white text-sm">💰</span>
 </div>
 <div>
 <p className="text-xs text-emerald-600 dark:text-emerald-400">
 {new Date(purchase.date).toLocaleDateString('en-GB').replace(/\//g, '.')} {new Date(purchase.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
 </p>
 <p className="text-xs text-emerald-600 dark:text-emerald-400">
 {purchase.paymentMethod === 'cash' ? '💵 Naqd' : '💳 Karta'}
 </p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
 +{formatNumber(purchase.amount)} {t("so'm")}
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </>
 )}

 {(!(selectedCustomer as any).detailedPurchaseHistory || (selectedCustomer as any).detailedPurchaseHistory.length === 0) && (
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
 
 {/* Return Modal */}
 <ReturnModal
 isOpen={showReturnModal}
 onClose={() => {
 setShowReturnModal(false);
 setSelectedPurchase(null);
 }}
 purchase={selectedPurchase}
 customerName={selectedCustomer?.name || ''}
 onConfirm={processReturn}
 processing={processingReturn}
 />
 </div>
 );
}
