import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Plus, AlertTriangle, 
  Clock, AlertCircle, Wallet, ArrowDownLeft, ArrowUpRight, Search,
  Eye, Trash2
} from 'lucide-react';
import { Debt } from '../../types';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/ToastContainer';
import DebtDetailsModal from '../../components/debts/DebtDetailsModal';
import AddDebtModal from '../../components/debts/AddDebtModal';
import { getSocket } from '../../utils/socket';

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
  latestUpdate: string;
  latestDebt: string;
  oldestDueDate: string | null;
  status: 'pending' | 'overdue' | 'paid';
}

// Memoized row component for better performance
const DebtRow = memo(({ 
  group, 
  onOpenDetails, 
  onDelete, 
  isAdmin,
  t 
}: { 
  group: GroupedDebt; 
  onOpenDetails: (group: GroupedDebt) => void;
  onDelete: (debtId: string) => void;
  isAdmin: boolean;
  t: (key: string) => string;
}) => {
  if (!group.customer || !group.customer.name) {
    return null;
  }

  return (
    <div 
      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
    >
      <div 
        className="col-span-3 flex items-center gap-3 cursor-pointer"
        onClick={() => onOpenDetails(group)}
      >
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
          <span className="font-semibold text-primary-600 dark:text-primary-400">{group.customer.name.charAt(0)}</span>
        </div>
        <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{group.customer.name}</span>
      </div>
      <div 
        className="col-span-2 text-neutral-600 dark:text-neutral-400 text-sm cursor-pointer"
        onClick={() => onOpenDetails(group)}
      >
        {group.customer.phone || '-'}
      </div>
      <div 
        className="col-span-2 cursor-pointer"
        onClick={() => onOpenDetails(group)}
      >
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
          {formatNumber(group.totalAmount)} {t("so'm")}
        </span>
      </div>
      <div 
        className="col-span-2 cursor-pointer"
        onClick={() => onOpenDetails(group)}
      >
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {formatNumber(group.totalPaid)} {t("so'm")}
        </span>
      </div>
      <div 
        className="col-span-2 cursor-pointer"
        onClick={() => onOpenDetails(group)}
      >
        <span className={`font-medium ${group.remainingAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {formatNumber(group.remainingAmount)} {t("so'm")}
        </span>
      </div>
      <div className="col-span-1 flex items-center justify-center gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(group);
          }} 
          className="btn-icon-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Eye className="w-4 h-4" />
        </button>
        {isAdmin && group.debts.length === 1 && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(group.debts[0]._id);
            }} 
            className="btn-icon-sm hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

DebtRow.displayName = 'DebtRow';

// Memoized mobile card component
const DebtMobileCard = memo(({ 
  group, 
  onOpenDetails, 
  onDelete, 
  isAdmin,
  t 
}: { 
  group: GroupedDebt; 
  onOpenDetails: (group: GroupedDebt) => void;
  onDelete: (debtId: string) => void;
  isAdmin: boolean;
  t: (key: string) => string;
}) => {
  if (!group.customer || !group.customer.name) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="font-semibold text-primary-600 dark:text-primary-400 text-lg">{group.customer.name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div 
              onClick={() => onOpenDetails(group)}
              className="cursor-pointer flex-1"
            >
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{group.customer.name}</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{group.customer.phone || '-'}</p>
            </div>
            {isAdmin && group.debts.length === 1 && (
              <button 
                onClick={() => onDelete(group.debts[0]._id)} 
                className="btn-icon-sm ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div 
            onClick={() => onOpenDetails(group)}
            className="flex gap-2 flex-wrap cursor-pointer"
          >
            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-2 inline-block">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t("Jami")}: {formatNumber(group.totalAmount)} {t("so'm")}
              </span>
            </div>
            {group.totalPaid > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2 inline-block">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {t("To'langan")}: {formatNumber(group.totalPaid)} {t("so'm")}
                </span>
              </div>
            )}
            {group.remainingAmount > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2 inline-block">
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {t("Qoldiq")}: {formatNumber(group.remainingAmount)} {t("so'm")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

DebtMobileCard.displayName = 'DebtMobileCard';

export default function Debts() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { AlertComponent } = useAlert();
  const { toasts, success, error, removeToast } = useToast();
  const [groupedDebts, setGroupedDebts] = useState<GroupedDebt[]>([]);
  const [stats, setStats] = useState({
    total: 0, pending: 0, today: 0, overdue: 0, paid: 0, totalAmount: 0
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDebtForDetails, setSelectedDebtForDetails] = useState<Debt | null>(null);
  const [selectedGroupForDetails, setSelectedGroupForDetails] = useState<GroupedDebt | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [debtType, setDebtType] = useState<'receivable' | 'payable'>('receivable');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Debounced search for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized debt type change handler
  const handleDebtTypeChange = useCallback((newType: 'receivable' | 'payable') => {
    if (newType !== debtType) {
      setDebtType(newType);
      setStatusFilter('all');
      setSearchQuery('');
    }
  }, [debtType]);

  useEffect(() => {
    // Reset state when debtType changes to prevent stale data
    setGroupedDebts([]);
    setLoading(true);
    
    // Parallel yuklash - tezroq ishlaydi
    Promise.all([
      fetchGroupedDebts(),
      fetchStats()
    ]);
  }, [debtType]);

  // Socket listener for real-time debt updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    const handleDebtUpdated = async () => {
      await fetchGroupedDebts();
      await fetchStats();
    };

    socket.on('debt:updated', handleDebtUpdated);

    return () => {
      socket.off('debt:updated', handleDebtUpdated);
    };
  }, [debtType]);

  // Update selected debt when grouped debts change (for real-time updates in modal)
  useEffect(() => {
    if (showDetailsModal && selectedDebtForDetails && selectedGroupForDetails) {
      const updatedGroup = groupedDebts.find(g => g.customer._id === selectedGroupForDetails.customer._id);
      if (updatedGroup) {
        const updatedDebt = updatedGroup.debts.find(d => d._id === selectedDebtForDetails._id);
        if (updatedDebt) {
          setSelectedDebtForDetails(updatedDebt);
          setSelectedGroupForDetails(updatedGroup);
        }
      }
    }
  }, [groupedDebts, showDetailsModal, selectedDebtForDetails, selectedGroupForDetails]);

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
      console.log(`📊 Stats for ${debtType}:`, res.data);
      setStats(res.data);
    } catch (err) { 
      console.error('Error fetching stats:', err); 
    }
  };

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false);
    setSelectedDebtForDetails(null);
    setSelectedGroupForDetails(null);
  };

  const handleDetailsModalUpdate = async () => {
    await fetchGroupedDebts();
    await fetchStats();
  };
  
  // Function to open modal instantly with current data, then refresh in background
  const openDebtDetailsModal = useCallback((group: GroupedDebt) => {
    // INSTANT: Open modal with current data immediately
    if (group.debts.length > 0) {
      // Find the oldest unpaid debt (same order as payment - oldest first)
      const oldestUnpaidDebt = group.debts
        .filter((d: Debt) => d.status !== 'paid')
        .sort((a: Debt, b: Debt) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      
      // If no unpaid debt, show the first debt (newest)
      const debtToShow = oldestUnpaidDebt || group.debts[0];
      
      setSelectedDebtForDetails(debtToShow);
      setSelectedGroupForDetails(group);
      setShowDetailsModal(true);
      
      // BACKGROUND: Refresh data silently
      (async () => {
        try {
          const updatedGroups = await api.get(`/debts/grouped?type=${debtType}`);
          const updatedGroup = updatedGroups.data.find((g: GroupedDebt) => g.customer._id === group.customer._id);
          
          if (updatedGroup && updatedGroup.debts.length > 0) {
            const oldestUnpaidDebt = updatedGroup.debts
              .filter((d: Debt) => d.status !== 'paid')
              .sort((a: Debt, b: Debt) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
            
            const debtToShow = oldestUnpaidDebt || updatedGroup.debts[0];
            
            // Update modal data silently if still open
            setSelectedDebtForDetails(debtToShow);
            setSelectedGroupForDetails(updatedGroup);
          }
        } catch (err) {
          console.error('Background refresh failed:', err);
        }
      })();
    }
  }, [debtType]);

  const handleDeleteDebt = useCallback(async (debtId: string) => {
    if (!window.confirm(t("Qarzni o'chirmoqchimisiz? Bu amal qaytarilmaydi!"))) return;
    
    try {
      await api.delete(`/debts/${debtId}`);
      await fetchGroupedDebts();
      await fetchStats();
      success(t("Qarz o'chirildi"));
    } catch (err) {
      console.error('Error deleting debt:', err);
      error(t('Xatolik yuz berdi!'));
    }
  }, [t, success, error]);

  const handleToggleBlacklist = useCallback(async (group: GroupedDebt) => {
    const isCurrentlyBlacklisted = group.status === 'blacklist';
    const confirmMessage = isCurrentlyBlacklisted 
      ? t("Mijozni qora ro'yxatdan chiqarmoqchimisiz?")
      : t("Mijozni qora ro'yxatga qo'shmoqchimisiz? Qora ro'yxatdagi mijozlarga qarzga sotish mumkin emas!");
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      // Use the first debt ID to toggle blacklist for all customer debts
      if (group.debts.length > 0) {
        await api.put(`/debts/${group.debts[0]._id}/blacklist`, {
          blacklist: !isCurrentlyBlacklisted
        });
        await fetchGroupedDebts();
        await fetchStats();
        success(isCurrentlyBlacklisted ? t("Qora ro'yxatdan chiqarildi") : t("Qora ro'yxatga qo'shildi"));
      }
    } catch (err) {
      console.error('Error toggling blacklist:', err);
      error(t('Xatolik yuz berdi!'));
    }
  }, [t, success, error]);

  // Memoized filtered debts with debounced search
  const filteredGroupedDebts = useMemo(() => {
    return groupedDebts.filter(group => {
      // Skip groups without customer data
      if (!group.customer || !group.customer.name) {
        return false;
      }
      
      const name = group.customer.name || '';
      const phone = group.customer.phone || '';
      const matchesSearch = name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        phone.includes(debouncedSearchQuery);
      
      let matchesStatus = true;
      if (statusFilter === 'blacklist') {
        matchesStatus = group.status === 'blacklist';
      } else if (statusFilter === 'overdue') {
        matchesStatus = group.status === 'overdue';
      } else if (statusFilter === 'paid') {
        matchesStatus = group.status === 'paid';
      } else if (statusFilter === 'today') {
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
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [groupedDebts, debouncedSearchQuery, statusFilter]);

  const statItems = [
    { 
      label: t('Barchasi'), 
      value: filteredGroupedDebts.length, // Mijozlar soni (grouped)
      icon: Wallet, 
      color: 'blue', 
      filter: 'all',
      isNumber: true 
    },
    { 
      label: t('Qora ro\'yxat'), 
      value: filteredGroupedDebts.filter(g => g.status === 'blacklist').length, // Blacklist mijozlar soni
      icon: AlertTriangle, 
      color: 'black', 
      filter: 'blacklist',
      isNumber: true 
    },
    { 
      label: t("Muddati o'tgan"), 
      value: filteredGroupedDebts.filter(g => g.status === 'overdue').length, // Overdue mijozlar soni
      icon: AlertCircle, 
      color: 'red', 
      filter: 'overdue',
      isNumber: true 
    },
    ...(isAdmin ? [{ 
      label: t('Jami qarz'), 
      value: formatNumber(stats.totalAmount), 
      suffix: t("so'm"),
      icon: Wallet, 
      color: 'primary', 
      filter: null,
      isNumber: false 
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-20 lg:pb-0">
      {AlertComponent}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
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
        
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold shadow-lg hover:shadow-xl active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t("Yangi qarz")}</span>
          </button>
        )}
      </header>

      <div className="p-4 lg:p-6 space-y-6 max-w-[1800px] mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
          {isAdmin && (
            <div className="inline-flex p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl shadow-sm">
              <button
                onClick={() => handleDebtTypeChange('receivable')}
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
                onClick={() => handleDebtTypeChange('payable')}
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

        <div className={`grid gap-4 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {statItems.map((stat, i) => (
            <button
              key={i} 
              onClick={() => {
                if (stat.filter) {
                  setStatusFilter(statusFilter === stat.filter ? 'all' : stat.filter);
                }
              }}
              disabled={!stat.filter}
              className={`relative p-6 bg-white dark:bg-neutral-800 rounded-2xl border-2 transition-all hover:shadow-xl text-left ${
                stat.filter ? 'cursor-pointer' : 'cursor-default'
              } ${
                statusFilter === stat.filter 
                  ? 'border-primary-500 shadow-xl scale-[1.02] ring-4 ring-primary-500/20' 
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg ${
                  stat.color === 'blue' ? 'from-blue-400 to-blue-600' :
                  stat.color === 'black' ? 'from-gray-700 to-gray-900' :
                  stat.color === 'primary' ? 'from-primary-500 to-primary-700' :
                  'from-red-500 to-red-700'
                }`}>
                  <stat.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                {statusFilter === stat.filter && (
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse shadow-lg" />
                )}
              </div>
              <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100 mb-2 whitespace-nowrap">
                {stat.value}
                {stat.suffix && <span className="ml-2">{stat.suffix}</span>}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-semibold">{stat.label}</p>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-0 overflow-hidden">
            {/* Loading skeleton */}
            <div className="hidden lg:block">
              <div className="table-header">
                <div className="grid grid-cols-12 gap-4 px-6 py-4">
                  <span className="table-header-cell col-span-3">{t("Mijoz")}</span>
                  <span className="table-header-cell col-span-2">{t("Telefon")}</span>
                  <span className="table-header-cell col-span-2">{t("Jami qarz")}</span>
                  <span className="table-header-cell col-span-2">{t("To'langan")}</span>
                  <span className="table-header-cell col-span-2">{t("Qoldiq")}</span>
                  <span className="table-header-cell col-span-1 text-center">{t("Amallar")}</span>
                </div>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center animate-pulse">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32" />
                    </div>
                    <div className="col-span-2">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24" />
                    </div>
                    <div className="col-span-2">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-28" />
                    </div>
                    <div className="col-span-2">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-28" />
                    </div>
                    <div className="col-span-2">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-28" />
                    </div>
                    <div className="col-span-1 flex justify-center gap-2">
                      <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Mobile skeleton */}
            <div className="lg:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32" />
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-24" />
                      <div className="flex gap-2">
                        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded-xl w-32" />
                        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded-xl w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredGroupedDebts.length === 0 ? (
          <div className="card flex flex-col items-center py-16">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {t("Mijozlar topilmadi")}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-center">
              {searchQuery || statusFilter !== 'all' ? t('Filtr bo\'yicha mijozlar topilmadi') : t('Hozircha qarzlar yo\'q')}
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="table-header">
                <div className="grid grid-cols-12 gap-4 px-6 py-4">
                  <span className="table-header-cell col-span-3">{t("Mijoz")}</span>
                  <span className="table-header-cell col-span-2">{t("Telefon")}</span>
                  <span className="table-header-cell col-span-2">{t("Jami qarz")}</span>
                  <span className="table-header-cell col-span-2">{t("To'langan")}</span>
                  <span className="table-header-cell col-span-2">{t("Qoldiq")}</span>
                  <span className="table-header-cell col-span-1 text-center">{t("Amallar")}</span>
                </div>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {filteredGroupedDebts.map(group => (
                  <DebtRow
                    key={group.customer?._id || Math.random()}
                    group={group}
                    onOpenDetails={openDebtDetailsModal}
                    onDelete={handleDeleteDebt}
                    isAdmin={isAdmin}
                    t={t}
                  />
                ))}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
              {filteredGroupedDebts.map(group => (
                <DebtMobileCard
                  key={group.customer?._id || Math.random()}
                  group={group}
                  onOpenDetails={openDebtDetailsModal}
                  onDelete={handleDeleteDebt}
                  isAdmin={isAdmin}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showDetailsModal && selectedDebtForDetails && selectedGroupForDetails && (
        <DebtDetailsModal
          debt={selectedDebtForDetails}
          group={selectedGroupForDetails}
          onClose={handleDetailsModalClose}
          onUpdate={handleDetailsModalUpdate}
          onAddDebt={() => {
            setSelectedCustomerId(selectedGroupForDetails.customer._id);
            setShowDetailsModal(false);
            setShowAddModal(true);
          }}
        />
      )}

      {showAddModal && (
        <AddDebtModal
          customerId={selectedCustomerId}
          debtType={debtType}
          onClose={() => {
            setShowAddModal(false);
            setSelectedCustomerId(undefined);
          }}
          onSuccess={() => {
            fetchGroupedDebts();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
