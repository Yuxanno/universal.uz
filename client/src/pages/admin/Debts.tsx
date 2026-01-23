import { useState, useEffect } from 'react';
import { 
  Plus, AlertTriangle, X, DollarSign, Calendar, User, 
  Clock, CheckCircle2, AlertCircle, Trash2, Wallet, ArrowDownLeft, ArrowUpRight, Phone, UserPlus, Edit, Banknote, Search
} from 'lucide-react';
import { Debt, Customer } from '../../types';
import api from '../../utils/api';
import { formatNumber, formatInputNumber, parseNumber, formatPhone } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { regions, regionNames } from '../../data/regions';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function Debts() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { showConfirm, AlertComponent } = useAlert();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', region: '', district: '' });
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  useEffect(() => {
    fetchDebts();
    fetchCustomers();
    fetchStats();
  }, [debtType]);

  const fetchDebts = async () => {
    try {
      const res = await api.get(`/debts?type=${debtType}`);
      setDebts(res.data);
    } catch (err) { console.error('Error fetching debts:', err); }
    finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) { console.error('Error fetching customers:', err); }
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
    setNewCustomer({ name: '', phone: '', region: '', district: '' });
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
      const res = await api.post('/customers', data);
      await fetchCustomers();
      setFormData({ ...formData, customer: res.data._id });
      setShowNewCustomerForm(false);
      setNewCustomer({ name: '', phone: '', region: '', district: '' });
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
    { label: t('Kutilmoqda'), value: stats.pending, icon: Clock, color: 'warning', filter: 'pending' },
    { label: t("Bugun to'lanadigan"), value: stats.today, icon: Calendar, color: 'brand', filter: 'today' },
    { label: t("To'langan"), value: stats.paid, icon: CheckCircle2, color: 'success', filter: 'paid' },
    { label: t("Muddati o'tgan"), value: stats.overdue, icon: AlertCircle, color: 'danger', filter: 'overdue' },
    { label: t('Jami qarz'), value: `${formatNumber(stats.totalAmount)} ${t("so'm")}`, icon: Wallet, color: 'accent', filter: null },
  ];

  const getDebtorName = (debt: Debt) => {
    if (debt.customer?.name) return debt.customer.name;
    return (debt as any).creditorName || t("Noma'lum mijoz");
  };

  const getDebtorPhone = (debt: Debt) => {
    return debt.customer?.phone || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {AlertComponent}
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            debtType === 'receivable' 
              ? 'bg-success-100 dark:bg-success-900/30' 
              : 'bg-danger-100 dark:bg-danger-900/30'
          }`}>
            <Wallet className={`w-5 h-5 ${
              debtType === 'receivable' ? 'text-success-600' : 'text-danger-600'
            }`} />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100">{t("Qarz daftarcha")}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
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
            <div className="inline-flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-sm">
              <button
                onClick={() => { setDebtType('receivable'); setStatusFilter('all'); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                  debtType === 'receivable' 
                    ? 'bg-white dark:bg-gray-700 text-success-600 shadow-md scale-105' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <ArrowDownLeft className="w-5 h-5" />
                {t("Menga qarzdor")}
              </button>
              <button
                onClick={() => { setDebtType('payable'); setStatusFilter('all'); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                  debtType === 'payable' 
                    ? 'bg-white dark:bg-gray-700 text-danger-600 shadow-md scale-105' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                {t("Men qarzdorman")}
              </button>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Mijoz nomi yoki telefon..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 dark:text-gray-100 transition-all"
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
              className={`relative p-5 bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all hover:shadow-lg ${
                stat.filter ? 'cursor-pointer' : ''
              } ${
                statusFilter === stat.filter 
                  ? 'border-primary-500 shadow-lg scale-105' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                  stat.color === 'warning' ? 'from-warning-100 to-warning-200 dark:from-warning-900/30 dark:to-warning-900/40' :
                  stat.color === 'brand' ? 'from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-900/40' :
                  stat.color === 'success' ? 'from-success-100 to-success-200 dark:from-success-900/30 dark:to-success-900/40' :
                  stat.color === 'danger' ? 'from-danger-100 to-danger-200 dark:from-danger-900/30 dark:to-danger-900/40' :
                  'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'
                }`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === 'warning' ? 'text-warning-600' :
                    stat.color === 'brand' ? 'text-primary-600 dark:text-primary-400' :
                    stat.color === 'success' ? 'text-success-600' :
                    stat.color === 'danger' ? 'text-danger-600' :
                    'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-gray-100 mb-1">{stat.value}</p>
              <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              {statusFilter === stat.filter && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* Debts List */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner text-brand-600 w-8 h-8 mb-4" />
              <p className="text-surface-500">Yuklanmoqda...</p>
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">Qarzlar topilmadi</h3>
              <p className="text-surface-500 text-center max-w-md">
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
                <div className="divide-y divide-surface-100">
                  {filteredDebts.map(debt => (
                    <div key={debt._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-50 transition-colors">
                      <div className="col-span-2 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          debtType === 'receivable' ? 'bg-success-100' : 'bg-danger-100'
                        }`}>
                          <User className={`w-5 h-5 ${debtType === 'receivable' ? 'text-success-600' : 'text-danger-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-surface-900 truncate">{getDebtorName(debt)}</p>
                          {getDebtorPhone(debt) && <p className="text-sm text-surface-500 truncate">{getDebtorPhone(debt)}</p>}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <p className="font-semibold text-surface-900">{formatNumber(debt.amount)}</p>
                        <p className="text-sm text-surface-500">so'm</p>
                      </div>
                      <div className="col-span-2">
                        <p className={`font-semibold ${debtType === 'receivable' ? 'text-success-600' : 'text-danger-600'}`}>
                          {formatNumber(debt.amount - debt.paidAmount)}
                        </p>
                        <p className="text-sm text-surface-500">so'm</p>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-surface-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(debt.dueDate).toLocaleDateString('uz-UZ')}
                      </div>
                      {debtType === 'receivable' && (
                        <div className="col-span-2">
                          {(debt as any).collateral ? (
                            <span className="text-sm text-amber-600 font-medium">{(debt as any).collateral}</span>
                          ) : (
                            <span className="text-sm text-surface-400">-</span>
                          )}
                        </div>
                      )}
                      <div className={debtType === 'receivable' ? 'col-span-1' : 'col-span-2'}>
                        <span className={`badge ${
                          debt.status === 'paid' ? 'badge-success' :
                          debt.status === 'overdue' ? 'badge-danger' : 'badge-warning'
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
                            className="btn-icon-sm hover:bg-success-100 hover:text-success-600"
                            title="To'lov"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => openEditModal(debt)} 
                          className="btn-icon-sm hover:bg-brand-100 hover:text-brand-600"
                          title="Tahrirlash"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(debt._id)} 
                          className="btn-icon-sm hover:bg-danger-100 hover:text-danger-600"
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
                  <div key={debt._id} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4 hover:border-primary-500 transition-all hover:shadow-lg">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${
                        debtType === 'receivable' 
                          ? 'from-success-100 to-success-200 dark:from-success-900/30 dark:to-success-900/40' 
                          : 'from-danger-100 to-danger-200 dark:from-danger-900/30 dark:to-danger-900/40'
                      }`}>
                        <User className={`w-7 h-7 ${debtType === 'receivable' ? 'text-success-600' : 'text-danger-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{getDebtorName(debt)}</h4>
                        {getDebtorPhone(debt) && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {getDebtorPhone(debt)}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                        debt.status === 'paid' ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' :
                        debt.status === 'overdue' ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' : 
                        'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                      }`}>
                        {debt.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> :
                         debt.status === 'overdue' ? <AlertCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {debt.status === 'paid' ? "To'langan" :
                         debt.status === 'overdue' ? "O'tgan" : 'Kutilmoqda'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Qarz summasi</p>
                        <p className="text-lg font-black text-gray-900 dark:text-gray-100">{formatNumber(debt.amount)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">so'm</p>
                      </div>
                      <div className={`rounded-xl p-3 border-2 bg-gradient-to-br ${
                        debtType === 'receivable' 
                          ? 'from-success-50 to-success-100 border-success-200 dark:from-success-900/20 dark:to-success-900/30 dark:border-success-800' 
                          : 'from-danger-50 to-danger-100 border-danger-200 dark:from-danger-900/20 dark:to-danger-900/30 dark:border-danger-800'
                      }`}>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Qoldiq</p>
                        <p className={`text-lg font-black ${debtType === 'receivable' ? 'text-success-600' : 'text-danger-600'}`}>
                          {formatNumber(debt.amount - debt.paidAmount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">so'm</p>
                      </div>
                    </div>
                    
                    {debtType === 'receivable' && (debt as any).collateral && (
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 rounded-xl p-3 mb-3 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Zalog: {(debt as any).collateral}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                        <Calendar className="w-4 h-4" />
                        {new Date(debt.dueDate).toLocaleDateString('uz-UZ')}
                      </div>
                      <div className="flex gap-2">
                        {debt.status !== 'paid' && (
                          <button 
                            onClick={() => { setSelectedDebt(debt); setShowPaymentModal(true); }} 
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-success-100 text-success-600 hover:bg-success-200 dark:bg-success-900/30 dark:hover:bg-success-900/50 transition-all hover:scale-110"
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
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-danger-100 text-danger-600 hover:bg-danger-200 dark:bg-danger-900/30 dark:hover:bg-danger-900/50 transition-all hover:scale-110"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn overflow-hidden border-2 border-surface-100 dark:border-surface-700 max-h-[90vh] overflow-y-auto">
            {/* Gradient Header */}
            <div className={`bg-gradient-to-r ${debtType === 'receivable' ? 'from-success-500 to-success-600' : 'from-danger-500 to-danger-600'} px-6 py-5 sticky top-0 z-10`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    {debtType === 'receivable' ? <ArrowDownLeft className="w-5 h-5 text-white" /> : <ArrowUpRight className="w-5 h-5 text-white" />}
                  </div>
                  <h3 className="text-xl font-black text-white">{editingDebt ? 'Qarzni tahrirlash' : 'Yangi qarz'}</h3>
                </div>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Debt Type Toggle in Modal - only for admin */}
            {isAdmin && (
              <div className="p-6 pb-0">
                <div className="flex p-1 bg-surface-100 dark:bg-surface-700 rounded-2xl mb-5">
                  <button
                    type="button"
                    onClick={() => setDebtType('receivable')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
                      debtType === 'receivable' ? 'bg-white dark:bg-surface-600 text-success-600 shadow-lg scale-105' : 'text-surface-500 dark:text-surface-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Menga qarzdor
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtType('payable')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
                      debtType === 'payable' ? 'bg-white dark:bg-surface-600 text-danger-600 shadow-lg scale-105' : 'text-surface-500 dark:text-surface-400'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Men qarzdorman
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-5">
              {debtType === 'receivable' ? (
                <div>
                  <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Mijoz</label>
                  {showNewCustomerForm ? (
                    <div className="space-y-3 p-4 bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-700 dark:to-surface-800 rounded-2xl border-2 border-surface-200 dark:border-surface-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Yangi mijoz</span>
                        <button type="button" onClick={() => setShowNewCustomerForm(false)} className="text-surface-400 hover:text-surface-600 transition-all hover:scale-110">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Mijoz ismi" 
                        value={newCustomer.name}
                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                      />
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                        <input 
                          type="text" 
                          className="input pl-12" 
                          placeholder="+998 (XX) XXX-XX-XX" 
                          value={newCustomer.phone}
                          onChange={e => setNewCustomer({ ...newCustomer, phone: formatPhone(e.target.value) })} 
                        />
                      </div>
                      <select 
                        className="select text-sm" 
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
                          className="select text-sm" 
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
                        className="btn-primary w-full font-bold shadow-lg hover:shadow-xl"
                      >
                        <UserPlus className="w-4 h-4" />
                        Mijozni yaratish
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select className="select flex-1" value={formData.customer}
                        onChange={e => setFormData({...formData, customer: e.target.value})} required>
                        <option value="">Tanlang</option>
                        {customers.map(c => <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>)}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setShowNewCustomerForm(true)}
                        className="btn-icon bg-brand-100 text-brand-600 hover:bg-brand-200 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 transition-all hover:scale-110"
                        title="Yangi mijoz qo'shish"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Kimga qarzdorman</label>
                  <input type="text" className="input" placeholder="Ism yoki kompaniya nomi" 
                    value={formData.creditorName}
                    onChange={e => setFormData({...formData, creditorName: e.target.value})} required />
                </div>
              )}
              <div>
                <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Summa (so'm)</label>
                <input type="text" className="input text-lg font-bold" placeholder="0" value={formatInputNumber(formData.amount)}
                  onChange={e => setFormData({...formData, amount: parseNumber(e.target.value)})} required />
              </div>
              <div>
                <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Muddat</label>
                <input type="date" className="input" value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Izoh (ixtiyoriy)</label>
                <input type="text" className="input" placeholder="Qarz haqida izoh" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              {debtType === 'receivable' && (
                <div>
                  <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Zalog (ixtiyoriy)</label>
                  <input type="text" className="input" placeholder="Zalogga nima qoldirdi" 
                    value={formData.collateral}
                    onChange={e => setFormData({...formData, collateral: e.target.value})} />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1 font-bold">Bekor qilish</button>
                <button type="submit" className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn overflow-hidden border-2 border-surface-100 dark:border-surface-700">
            {/* Gradient Header */}
            <div className={`bg-gradient-to-r ${debtType === 'receivable' ? 'from-success-500 to-success-600' : 'from-danger-500 to-danger-600'} px-6 py-5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">To'lov qilish</h3>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className={`rounded-2xl p-5 border-2 ${debtType === 'receivable' ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800' : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'}`}>
                <p className="text-sm font-bold text-surface-600 dark:text-surface-400 mb-1">Qoldiq summa</p>
                <p className={`text-3xl font-black ${debtType === 'receivable' ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                  {formatNumber(selectedDebt.amount - selectedDebt.paidAmount)} so'm
                </p>
              </div>
              <form onSubmit={handlePayment} className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-surface-700 dark:text-surface-900s mb-2 block">To'lov summasi</label>
                  <input type="text" className="input text-center text-xl font-bold" placeholder="0" value={formatInputNumber(paymentAmount)}
                    onChange={e => setPaymentAmount(parseNumber(e.target.value))} required />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary flex-1 font-bold">
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn-success flex-1 font-bold shadow-lg hover:shadow-xl">To'lash</button>
                </div>
              </form>
            </div>
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
