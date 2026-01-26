import { useState, useEffect } from 'react';
import { 
 Plus, AlertTriangle, X, DollarSign, Calendar, User, 
 Clock, CheckCircle2, AlertCircle, Trash2, Wallet, ArrowDownLeft, ArrowUpRight, UserPlus, Edit, Banknote, Search
} from 'lucide-react';
import { Debt } from '../../types';
import api from '../../utils/api';
import { formatNumber, formatInputNumber, parseNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useCustomers } from '../../context/CustomersContext';
import { regions, regionNames } from '../../data/regions';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import PhoneInput from '../../components/PhoneInput';

export default function Debts() {
 const { t } = useLanguage();
 const { user } = useAuth();
 const isAdmin = user?.role === 'admin';
 const { showConfirm, AlertComponent } = useAlert();
 const { customers, addCustomer } = useCustomers();
 const [debts, setDebts] = useState<Debt[]>([]);
 const [stats, setStats] = useState({
 total: 0, pending: 0, today: 0, overdue: 0, paid: 0, blacklist: 0, totalAmount: 0
 });
 const [showModal, setShowModal] = useState(false);
 const [showPaymentModal, setShowPaymentModal] = useState(false);
 const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
 const [loading, setLoading] = useState(true);
 const [debtType, setDebtType] = useState<'receivable' | 'payable'>('receivable');
 const [formData, setFormData] = useState({ 
 customer: '', creditorName: '', amount: '', dueDate: '', description: '', collateral: '' 
 });
 const [paymentAmount, setPaymentAmount] = useState('');
 const [searchQuery, setSearchQuery] = useState('');
 const [statusFilter, setStatusFilter] = useState('all');
 const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
 const [newCustomer, setNewCustomer] = useState({ name: '', phone: '+998', region: '', district: '' });
 const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

 useEffect(() => {
 fetchDebts();
 fetchStats();
 }, [debtType]);

 const fetchDebts = async () => {
 try {
 const res = await api.get(`/debts?type=${debtType}`);
 setDebts(res.data);
 } catch (err) { console.error('Error fetching debts:', err); }
 finally { setLoading(false); }
 };

 const fetchStats = async () => {
 try {
 const res = await api.get(`/debts/stats?type=${debtType}`);
 setStats(res.data);
 } catch (err) { console.error('Error fetching stats:', err); }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const data = {
 type: debtType,
 customer: debtType === 'receivable' ? formData.customer : undefined,
 creditorName: debtType === 'payable' ? formData.creditorName : undefined,
 amount: Number(formData.amount),
 dueDate: formData.dueDate,
 description: formData.description,
 collateral: formData.collateral
 };
 
 if (editingDebt) {
 await api.put(`/debts/${editingDebt._id}`, data);
 } else {
 await api.post('/debts', data);
 }
 fetchDebts();
 fetchStats();
 closeModal();
 } catch (err) { console.error('Error saving debt:', err); }
 };

 const handlePayment = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedDebt) return;
 try {
 await api.post(`/debts/${selectedDebt._id}/payment`, {
 amount: Number(paymentAmount),
 method: 'cash'
 });
 fetchDebts();
 fetchStats();
 setShowPaymentModal(false);
 setSelectedDebt(null);
 setPaymentAmount('');
 } catch (err) { console.error('Error making payment:', err); }
 };

 const handleDelete = async (id: string) => {
 const confirmed = await showConfirm(t("Qarzni o'chirishni tasdiqlaysizmi?"), t("O'chirish"));
 if (!confirmed) return;
 try {
 await api.delete(`/debts/${id}`);
 fetchDebts();
 fetchStats();
 } catch (err) { console.error('Error deleting debt:', err); }
 };

 const closeModal = () => {
 setShowModal(false);
 setEditingDebt(null);
 setFormData({ customer: '', creditorName: '', amount: '', dueDate: '', description: '', collateral: '' });
 setShowNewCustomerForm(false);
 setNewCustomer({ name: '', phone: '+998', region: '', district: '' });
 };

 const openEditModal = (debt: Debt) => {
 setEditingDebt(debt);
 setDebtType((debt as any).type as 'receivable' | 'payable');
 setFormData({
 customer: debt.customer?._id || '',
 creditorName: (debt as any).creditorName || '',
 amount: String(debt.amount),
 dueDate: debt.dueDate.split('T')[0],
 description: (debt as any).description || '',
 collateral: (debt as any).collateral || ''
 });
 setShowModal(true);
 };

 const handleCreateCustomer = async () => {
 if (!newCustomer.name || !newCustomer.phone) return;
 try {
 const data = {
 name: newCustomer.name,
 phone: newCustomer.phone,
 address: newCustomer.region && newCustomer.district ? `${newCustomer.region}, ${newCustomer.district}` : ''
 };
 const customer = await addCustomer(data);
 setFormData({ ...formData, customer: customer._id });
 setShowNewCustomerForm(false);
 setNewCustomer({ name: '', phone: '+998', region: '', district: '' });
 } catch (err) { console.error('Error creating customer:', err); }
 };

 const filteredDebts = debts.filter(debt => {
 const name = debt.customer?.name || (debt as any).creditorName || '';
 const phone = debt.customer?.phone || '';
 const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 phone.includes(searchQuery);
 
 let matchesStatus = true;
 if (statusFilter === 'today') {
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const tomorrow = new Date(today.getTime() + 86400000);
 const dueDate = new Date(debt.dueDate);
 matchesStatus = dueDate >= today && dueDate < tomorrow && debt.status !== 'paid';
 } else if (statusFilter !== 'all') {
 matchesStatus = debt.status === statusFilter;
 }
 
 return matchesSearch && matchesStatus;
 });

 const statItems = [
 { label: t('Kutilmoqda'), value: stats.pending, icon: Clock, color: 'gray', filter: 'pending' },
 { label: t("Bugun to'lanadigan"), value: stats.today, icon: Calendar, color: 'primary', filter: 'today' },
 { label: t("To'langan"), value: stats.paid, icon: CheckCircle2, color: 'primary', filter: 'paid' },
 { label: t("Muddati o'tgan"), value: stats.overdue, icon: AlertCircle, color: 'red', filter: 'overdue' },
 { label: t('Jami qarz'), value: `${formatNumber(stats.totalAmount)} ${t("so'm")}`, icon: Wallet, color: 'gray', filter: null },
 ];

 const getDebtorName = (debt: Debt) => {
 if (debt.customer?.name) return debt.customer.name;
 return (debt as any).creditorName || t("Noma'lum mijoz");
 };

 const getDebtorPhone = (debt: Debt) => {
 return debt.customer?.phone || '';
 };

 return (
 <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-20 lg:pb-0">
 {AlertComponent}
 
 {/* Header */}
 <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-100 dark:bg-primary-900/30">
 <Wallet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
 </div>
 <div>
 <h1 className="text-base lg:text-lg font-bold text-neutral-900 dark:text-neutral-100">{t("Qarz daftarcha")}</h1>
 <p className="text-xs text-neutral-500 dark:text-neutral-400">
 {debtType === 'receivable' ? t("Menga qarzdor") : t("Men qarzdorman")}
 </p>
 </div>
 </div>
 <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all hover:scale-105 shadow-sm font-medium">
 <Plus className="w-4 h-4" />
 <span className="hidden sm:inline">{t("Yangi qarz")}</span>
 </button>
 </header>

 <div className="p-4 lg:p-6 space-y-6 max-w-[1800px] mx-auto">
 {/* Type Toggle & Search - only for admin */}
 {isAdmin && (
 <div className="flex flex-col sm:flex-row gap-4">
 <div className="inline-flex p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl shadow-sm">
 <button
 onClick={() => { setDebtType('receivable'); setStatusFilter('all'); }}
 className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
 debtType === 'receivable' 
 ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-md scale-105' 
 : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
 }`}
 >
 <ArrowDownLeft className="w-5 h-5" />
 {t("Menga qarzdor")}
 </button>
 <button
 onClick={() => { setDebtType('payable'); setStatusFilter('all'); }}
 className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
 debtType === 'payable' 
 ? 'bg-white dark:bg-neutral-700 text-red-600 dark:text-red-400 shadow-md scale-105' 
 : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
 }`}
 >
 <ArrowUpRight className="w-5 h-5" />
 {t("Men qarzdorman")}
 </button>
 </div>
 <div className="flex-1 relative flex items-center">
 <Search className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
 <input
 type="text"
 placeholder="Mijoz nomi yoki telefon..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 dark:text-neutral-100 transition-all"
 />
 </div>
 </div>
 )}

 {/* Stats */}
 <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
 {statItems.map((stat, i) => (
 <div 
 key={i} 
 onClick={() => stat.filter && setStatusFilter(stat.filter)}
 className={`relative p-5 bg-white dark:bg-neutral-800 rounded-2xl border-2 transition-all hover:shadow-lg ${
 stat.filter ? 'cursor-pointer' : ''
 } ${
 statusFilter === stat.filter 
 ? 'border-primary-500 shadow-lg scale-105' 
 : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
 }`}
 >
 <div className="flex items-start justify-between mb-3">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${
 stat.color === 'gray' ? 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800' :
 stat.color === 'primary' ? 'from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-900/40' :
 'from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-900/40'
 }`}>
 <stat.icon className={`w-6 h-6 ${
 stat.color === 'gray' ? 'text-neutral-600 dark:text-neutral-400' :
 stat.color === 'primary' ? 'text-primary-600 dark:text-primary-400' :
 'text-red-600 dark:text-red-400'
 }`} />
 </div>
 </div>
 <p className="text-2xl lg:text-3xl font-black text-neutral-900 dark:text-neutral-100 mb-1">{stat.value}</p>
 <p className="text-xs lg:text-sm text-neutral-500 dark:text-neutral-400 font-medium">{stat.label}</p>
 {statusFilter === stat.filter && (
 <div className="absolute top-2 right-2 w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
 )}
 </div>
 ))}
 </div>

 {/* Debts List */}
 <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 p-0 overflow-hidden">
 {loading ? (
 <div className="flex flex-col items-center justify-center py-20">
 <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
 <p className="text-neutral-500 dark:text-neutral-400">Yuklanmoqda...</p>
 </div>
 ) : filteredDebts.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 px-4">
 <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-2xl flex items-center justify-center mb-4">
 <AlertTriangle className="w-8 h-8 text-neutral-400" />
 </div>
 <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Qarzlar topilmadi</h3>
 <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">
 {searchQuery || statusFilter !== 'all' ? 'Filtr bo\'yicha qarzlar topilmadi' : 'Hozircha qarzlar yo\'q'}
 </p>
 </div>
 ) : (
 <>
 {/* Desktop Table */}
 <div className="hidden lg:block">
 <div className="table-header">
 <div className="grid grid-cols-12 gap-4 px-6 py-4">
 <span className="table-header-cell col-span-2">
 {debtType === 'receivable' ? 'Mijoz' : 'Kimga qarzdorman'}
 </span>
 <span className="table-header-cell col-span-2">Qarz</span>
 <span className="table-header-cell col-span-2">Qoldiq</span>
 <span className="table-header-cell col-span-2">Muddat</span>
 {debtType === 'receivable' && <span className="table-header-cell col-span-2">Zalog</span>}
 <span className={`table-header-cell ${debtType === 'receivable' ? 'col-span-1' : 'col-span-2'}`}>Holat</span>
 <span className="table-header-cell col-span-1 text-center">Amallar</span>
 </div>
 </div>
 <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
 {filteredDebts.map(debt => (
 <div key={debt._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
 <div className="col-span-2 flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-100 dark:bg-primary-900/30">
 <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
 </div>
 <div className="min-w-0">
 <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{getDebtorName(debt)}</p>
 {getDebtorPhone(debt) && <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{getDebtorPhone(debt)}</p>}
 </div>
 </div>
 <div className="col-span-2">
 <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(debt.amount)}</p>
 <p className="text-sm text-neutral-500 dark:text-neutral-400">so'm</p>
 </div>
 <div className="col-span-2">
 <p className="font-semibold text-primary-600 dark:text-primary-400">
 {formatNumber(debt.amount - debt.paidAmount)}
 </p>
 <p className="text-sm text-neutral-500 dark:text-neutral-400">so'm</p>
 </div>
 <div className="col-span-2 flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
 <Calendar className="w-4 h-4" />
 {new Date(debt.dueDate).toLocaleDateString('uz-UZ')}
 </div>
 {debtType === 'receivable' && (
 <div className="col-span-2">
 {(debt as any).collateral ? (
 <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{(debt as any).collateral}</span>
 ) : (
 <span className="text-sm text-neutral-400">-</span>
 )}
 </div>
 )}
 <div className={debtType === 'receivable' ? 'col-span-1' : 'col-span-2'}>
 <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${
 debt.status === 'paid' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
 debt.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
 }`}>
 {debt.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> :
 debt.status === 'overdue' ? <AlertCircle className="w-3 h-3" /> :
 <Clock className="w-3 h-3" />}
 {debt.status === 'paid' ? "To'langan" :
 debt.status === 'overdue' ? "Muddati o'tgan" : 'Kutilmoqda'}
 </span>
 </div>
 <div className="col-span-1 flex items-center justify-center gap-2">
 {debt.status !== 'paid' && (
 <button 
 onClick={() => { setSelectedDebt(debt); setShowPaymentModal(true); }} 
 className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-all"
 title="To'lov"
 >
 <DollarSign className="w-4 h-4" />
 </button>
 )}
 <button 
 onClick={() => openEditModal(debt)} 
 className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-all"
 title="Tahrirlash"
 >
 <Edit className="w-4 h-4" />
 </button>
 <button 
 onClick={() => handleDelete(debt._id)} 
 className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Mobile Cards */}
 <div className="lg:hidden space-y-3 p-4">
 {filteredDebts.map(debt => (
 <div key={debt._id} className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 p-4 hover:border-primary-500 transition-all hover:shadow-lg">
 <div className="flex items-start gap-3 mb-4">
 <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-900/40">
 <User className="w-7 h-7 text-primary-600 dark:text-primary-400" />
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">{getDebtorName(debt)}</h4>
 {getDebtorPhone(debt) && (
 <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
 <Phone className="w-3 h-3" />
 {getDebtorPhone(debt)}
 </p>
 )}
 </div>
 <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
 debt.status === 'paid' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
 debt.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
 }`}>
 {debt.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> :
 debt.status === 'overdue' ? <AlertCircle className="w-3 h-3" /> :
 <Clock className="w-3 h-3" />}
 {debt.status === 'paid' ? "To'langan" :
 debt.status === 'overdue' ? "O'tgan" : 'Kutilmoqda'}
 </span>
 </div>
 
 <div className="grid grid-cols-2 gap-3 mb-3">
 <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-600">
 <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Qarz summasi</p>
 <p className="text-lg font-black text-neutral-900 dark:text-neutral-100">{formatNumber(debt.amount)}</p>
 <p className="text-xs text-neutral-500 dark:text-neutral-400">so'm</p>
 </div>
 <div className="rounded-xl p-3 border-2 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 dark:from-primary-900/20 dark:to-primary-900/30 dark:border-primary-800">
 <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Qoldiq</p>
 <p className="text-lg font-black text-primary-600 dark:text-primary-400">
 {formatNumber(debt.amount - debt.paidAmount)}
 </p>
 <p className="text-xs text-neutral-500 dark:text-neutral-400">so'm</p>
 </div>
 </div>
 
 {debtType === 'receivable' && (debt as any).collateral && (
 <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 mb-3 border border-neutral-200 dark:border-neutral-600">
 <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4" />
 Zalog: {(debt as any).collateral}
 </p>
 </div>
 )}
 
 <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-700">
 <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
 <Calendar className="w-4 h-4" />
 {new Date(debt.dueDate).toLocaleDateString('uz-UZ')}
 </div>
 <div className="flex gap-2">
 {debt.status !== 'paid' && (
 <button 
 onClick={() => { setSelectedDebt(debt); setShowPaymentModal(true); }} 
 className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 transition-all hover:scale-110"
 >
 <DollarSign className="w-5 h-5" />
 </button>
 )}
 <button 
 onClick={() => openEditModal(debt)} 
 className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 transition-all hover:scale-110"
 >
 <Edit className="w-5 h-5" />
 </button>
 <button 
 onClick={() => handleDelete(debt._id)} 
 className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-all hover:scale-110"
 >
 <Trash2 className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </>
 )}
 </div>
 </div>

 {/* Add Debt Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
 <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 max-h-[90vh] flex flex-col">
 {/* Header - Sticky */}
 <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5 flex-shrink-0">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
 <Wallet className="w-6 h-6 text-white" />
 </div>
 <h3 className="text-2xl font-black text-white">{editingDebt ? 'Qarzni tahrirlash' : 'Yangi qarz'}</h3>
 </div>
 <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 active:scale-95">
 <X className="w-6 h-6" />
 </button>
 </div>
 </div>
 
 {/* Scrollable Content */}
 <div className="flex-1 overflow-y-auto overscroll-contain">
 <div className="p-6 space-y-5">
 {/* Debt Type Toggle - only for admin */}
 {isAdmin && (
 <div className="flex p-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-2xl">
 <button
 type="button"
 onClick={() => setDebtType('receivable')}
 className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
 debtType === 'receivable' ? 'bg-white dark:bg-neutral-600 text-primary-600 dark:text-primary-400 shadow-md scale-105' : 'text-neutral-500 dark:text-neutral-400'
 }`}
 >
 <ArrowDownLeft className="w-5 h-5" />
 Menga qarzdor
 </button>
 <button
 type="button"
 onClick={() => setDebtType('payable')}
 className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
 debtType === 'payable' ? 'bg-white dark:bg-neutral-600 text-red-600 dark:text-red-400 shadow-md scale-105' : 'text-neutral-500 dark:text-neutral-400'
 }`}
 >
 <ArrowUpRight className="w-5 h-5" />
 Men qarzdorman
 </button>
 </div>
 )}

 <form id="debt-form" onSubmit={handleSubmit} className="space-y-5">
 {debtType === 'receivable' ? (
 <div>
 <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 block">Mijoz</label>
 {showNewCustomerForm ? (
 <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl border-2 border-neutral-200 dark:border-neutral-600">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-bold text-primary-600 dark:text-primary-400">Yangi mijoz</span>
 <button type="button" onClick={() => setShowNewCustomerForm(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all hover:scale-110">
 <X className="w-5 h-5" />
 </button>
 </div>
 <input 
 type="text" 
 className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-gray-500 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all" 
 placeholder="Mijoz ismi" 
 value={newCustomer.name}
 onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
 />
 <PhoneInput
 value={newCustomer.phone}
 onChange={(phone) => setNewCustomer({ ...newCustomer, phone })}
 />
 <select 
 className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all text-sm" 
 value={newCustomer.region}
 onChange={e => setNewCustomer({ ...newCustomer, region: e.target.value, district: '' })}
 >
 <option value="">Viloyatni tanlang</option>
 {regionNames.map(region => (
 <option key={region} value={region}>{region}</option>
 ))}
 </select>
 {newCustomer.region && (
 <select 
 className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all text-sm" 
 value={newCustomer.district}
 onChange={e => setNewCustomer({ ...newCustomer, district: e.target.value })}
 >
 <option value="">Tumanni tanlang</option>
 {regions[newCustomer.region]?.map(district => (
 <option key={district} value={district}>{district}</option>
 ))}
 </select>
 )}
 <button 
 type="button" 
 onClick={handleCreateCustomer}
 disabled={!newCustomer.name || !newCustomer.phone}
 className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-md hover:shadow-lg active:scale-95"
 >
 <UserPlus className="w-5 h-5" />
 Mijozni yaratish
 </button>
 </div>
 ) : (
 <div className="flex gap-2">
 <select className="flex-1 px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all" value={formData.customer}
 onChange={e => setFormData({...formData, customer: e.target.value})} required>
 <option value="">Tanlang</option>
 {customers.map(c => <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>)}
 </select>
 <button 
 type="button" 
 onClick={() => setShowNewCustomerForm(true)}
 className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 transition-all hover:scale-110 active:scale-95"
 title="Yangi mijoz qo'shish"
 >
 <Plus className="w-6 h-6" />
 </button>
 </div>
 )}
 </div>
 ) : (
 <div>
 <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 block">Kimga qarzdorman</label>
 <input type="text" className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-gray-500 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all" placeholder="Ism yoki kompaniya nomi" 
 value={formData.creditorName}
 onChange={e => setFormData({...formData, creditorName: e.target.value})} required />
 </div>
 )}
 <div>
 <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 block">Summa (so'm)</label>
 <input type="text" className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-gray-500 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all text-lg font-bold" placeholder="0" value={formatInputNumber(formData.amount)}
 onChange={e => setFormData({...formData, amount: parseNumber(e.target.value)})} required />
 </div>
 <div>
 <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 block">Muddat</label>
 <input type="date" className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all" value={formData.dueDate}
 onChange={e => setFormData({...formData, dueDate: e.target.value})} required />
 </div>
 <div>
 <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 block">Izoh (ixtiyoriy)</label>
 <textarea className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-gray-500 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all resize-none" rows={3} placeholder="Qarz haqida izoh" 
 value={formData.description}
 onChange={e => setFormData({...formData, description: e.target.value})} />
 </div>
 {debtType === 'receivable' && (
 <div>
 <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 block">Zalog (ixtiyoriy)</label>
 <input type="text" className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-gray-500 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all" placeholder="Zalogga nima qoldirdi" 
 value={formData.collateral}
 onChange={e => setFormData({...formData, collateral: e.target.value})} />
 </div>
 )}
 </form>
 </div>
 </div>

 {/* Footer - Sticky */}
 <div className="flex-shrink-0 p-6 pt-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
 <div className="flex gap-3">
 <button type="button" onClick={closeModal} className="flex-1 px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all font-bold active:scale-95">
 Bekor qilish
 </button>
 <button type="submit" form="debt-form" className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all font-bold shadow-lg hover:shadow-xl active:scale-95">
 Saqlash
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Payment Modal */}
 {showPaymentModal && selectedDebt && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
 <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border-2 border-neutral-200 dark:border-neutral-700">
 {/* Header */}
 <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
 <Banknote className="w-5 h-5 text-white" />
 </div>
 <h3 className="text-xl font-black text-white">To'lov qilish</h3>
 </div>
 <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 active:scale-95">
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 <div className="p-6 space-y-5">
 <div className="rounded-2xl p-5 border-2 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 dark:from-primary-900/20 dark:to-primary-900/30 dark:border-primary-800">
 <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 mb-1">Qoldiq summa</p>
 <p className="text-3xl font-black text-primary-600 dark:text-primary-400">
 {formatNumber(selectedDebt.amount - selectedDebt.paidAmount)} so'm
 </p>
 </div>
 <form onSubmit={handlePayment} className="space-y-5">
 <div>
 <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 block">To'lov summasi</label>
 <input type="text" className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-gray-500 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all text-center text-xl font-bold" placeholder="0" value={formatInputNumber(paymentAmount)}
 onChange={e => setPaymentAmount(parseNumber(e.target.value))} required />
 </div>
 <div className="flex gap-3 pt-2">
 <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all font-bold active:scale-95">
 Bekor qilish
 </button>
 <button type="submit" className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all font-bold shadow-lg hover:shadow-xl active:scale-95">To'lash</button>
 </div>
 </form>
 </div>
 </div>
 </div>
 )}

 {/* Mobile FAB */}
 <button
 onClick={() => setShowModal(true)}
 className="lg:hidden fixed right-4 bottom-20 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-all z-30"
 >
 <Plus className="w-6 h-6" />
 </button>
 </div>
 );
}
