import { useState, useEffect } from 'react';
import { 
  AlertTriangle, Calendar, User, 
  Clock, CheckCircle2, AlertCircle, Wallet, ArrowDownLeft, ArrowUpRight, Search, Phone
} from 'lucide-react';
import { Debt } from '../../types';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import DebtDetailsModal from '../../components/debts/DebtDetailsModal';

interface GroupedDebt {
  customer: {
    _id: string;
    name: string;
    phone: string;
    address?: string;
  };
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  debtCount: number;
  debts: Debt[];
  latestDebt: string;
  oldestDueDate: string | null;
  status: 'pending' | 'overdue' | 'paid';
}

export default function Debts() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { AlertComponent } = useAlert();
  const [groupedDebts, setGroupedDebts] = useState<GroupedDebt[]>([]);
  const [stats, setStats] = useState({
    total: 0, pending: 0, today: 0, overdue: 0, paid: 0, totalAmount: 0
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDebtForDetails, setSelectedDebtForDetails] = useState<Debt | null>(null);
  const [loading, setLoading] = useState(true);
  const [debtType, setDebtType] = useState<'receivable' | 'payable'>('receivable');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchGroupedDebts();
    fetchStats();
  }, [debtType]);

  const fetchGroupedDebts = async () => {
    try {
      const res = await api.get(`/debts/grouped?type=${debtType}`);
      setGroupedDebts(res.data);
    } catch (err) { 
      console.error('Error fetching grouped debts:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get(`/debts/stats?type=${debtType}`);
      setStats(res.data);
    } catch (err) { 
      console.error('Error fetching stats:', err); 
    }
  };

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false);
    setSelectedDebtForDetails(null);
  };

  const handleDetailsModalUpdate = () => {
    fetchGroupedDebts();
    fetchStats();
  };

  const filteredGroupedDebts = groupedDebts.filter(group => {
    const name = group.customer?.name || '';
    const phone = group.customer?.phone || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery);
    
    let matchesStatus = true;
    if (statusFilter === 'today') {
      matchesStatus = group.debts.some(debt => {
        if (debt.dueDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today.getTime() + 86400000);
          const dueDate = new Date(debt.dueDate);
          return dueDate >= today && dueDate < tomorrow && debt.status !== 'paid';
        }
        return false;
      });
    } else if (statusFilter !== 'all') {
      matchesStatus = group.status === statusFilter;
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-20 lg:pb-0">
      {AlertComponent}
      
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
      </header>

      <div className="p-4 lg:p-6 space-y-6 max-w-[1800px] mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
          {isAdmin && (
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
          )}
          
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

        <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 p-0 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400">Yuklanmoqda...</p>
            </div>
          ) : filteredGroupedDebts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Mijozlar topilmadi</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">
                {searchQuery || statusFilter !== 'all' ? 'Filtr bo\'yicha mijozlar topilmadi' : 'Hozircha qarzlar yo\'q'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <div className="table-header">
                  <div className="grid grid-cols-12 gap-4 px-6 py-4">
                    <span className="table-header-cell col-span-3">{t("Mijoz")}</span>
                    <span className="table-header-cell col-span-2">{t("Telefon")}</span>
                    <span className="table-header-cell col-span-2">{t("Jami qarz")}</span>
                    <span className="table-header-cell col-span-2">{t("To'langan")}</span>
                    <span className="table-header-cell col-span-2">{t("Qoldiq")}</span>
                    <span className="table-header-cell col-span-1 text-center">{t("Holat")}</span>
                  </div>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {filteredGroupedDebts.map(group => (
                    <div 
                      key={group.customer._id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (group.debts.length > 0) {
                          setSelectedDebtForDetails(group.debts[0]);
                          setShowDetailsModal(true);
                        }
                      }}
                    >
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                          <span className="font-semibold text-primary-600 dark:text-primary-400">{group.customer.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{group.customer.name}</span>
                      </div>
                      <div className="col-span-2 text-neutral-600 dark:text-neutral-400 text-sm">
                        {group.customer.phone || '-'}
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(group.totalAmount)}</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("so'm")}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatNumber(group.totalPaid)}</span>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">{t("so'm")}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold text-primary-600 dark:text-primary-400">{formatNumber(group.remainingAmount)}</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("so'm")}</p>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                          group.status === 'paid' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
                          group.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                          'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                        }`}>
                          {group.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> :
                          group.status === 'overdue' ? <AlertCircle className="w-3 h-3" /> :
                          <Clock className="w-3 h-3" />}
                          {group.status === 'paid' ? t("To'langan") :
                          group.status === 'overdue' ? t("O'tgan") : t('Kutilmoqda')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:hidden space-y-3 p-4">
                {filteredGroupedDebts.map(group => (
                  <div 
                    key={group.customer._id}
                    onClick={() => {
                      if (group.debts.length > 0) {
                        setSelectedDebtForDetails(group.debts[0]);
                        setShowDetailsModal(true);
                      }
                    }}
                    className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:border-primary-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 mb-1">{group.customer.name}</h4>
                        {group.customer.phone && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {group.customer.phone}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        group.status === 'paid' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
                        group.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                        'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                      }`}>
                        {group.status === 'paid' ? t("To'langan") :
                        group.status === 'overdue' ? t("O'tgan") : t('Kutilmoqda')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-2">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t("Jami")}</p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(group.totalAmount)}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-0.5">{t("To'langan")}</p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(group.totalPaid)}</p>
                      </div>
                      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2">
                        <p className="text-xs text-primary-600 dark:text-primary-400 mb-0.5">{t("Qoldiq")}</p>
                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatNumber(group.remainingAmount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showDetailsModal && selectedDebtForDetails && (
        <DebtDetailsModal
          debt={selectedDebtForDetails}
          onClose={handleDetailsModalClose}
          onUpdate={handleDetailsModalUpdate}
        />
      )}
    </div>
  );
}
