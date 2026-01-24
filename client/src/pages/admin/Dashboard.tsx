import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { 
  DollarSign, TrendingUp, ShoppingCart, Receipt, Package, 
  Clock, RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

export default function Dashboard() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<'today' | 'week'>('today');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalReceipts: 0,
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    peakHour: ''
  });
  const [chartData, setChartData] = useState<{name: string; sales: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [period]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await api.get(`/stats/chart?period=${period}`);
      setChartData(res.data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    }
  };

  const mainStats = [
    { 
      icon: DollarSign, 
      label: t('Umumiy tushum'), 
      value: formatNumber(stats.totalRevenue), 
      suffix: t("so'm"), 
      color: 'bg-success-500',
      bgColor: 'bg-success-50',
      textColor: 'text-success-600',
      trend: '+12%',
      trendUp: true
    },
    { 
      icon: TrendingUp, 
      label: period === 'today' ? t('Bugungi sotuv') : t('Haftalik sotuv'), 
      value: formatNumber(period === 'today' ? stats.todaySales : stats.weekSales), 
      suffix: t("so'm"), 
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-600',
      trend: '+8%',
      trendUp: true
    },
    { 
      icon: ShoppingCart, 
      label: t('Jami cheklar'), 
      value: stats.totalReceipts.toString(), 
      color: 'bg-accent-500',
      bgColor: 'bg-accent-50',
      textColor: 'text-accent-600',
      trend: '+5%',
      trendUp: true
    },
    { 
      icon: Receipt, 
      label: t("Eng faol vaqt"), 
      value: stats.peakHour || '-', 
      color: 'bg-warning-500',
      bgColor: 'bg-warning-50',
      textColor: 'text-warning-600',
      trend: '',
      trendUp: true
    },
  ];

  const inventory = [
    { label: t('Jami mahsulotlar'), value: stats.totalProducts, color: 'bg-gray-500', dotColor: 'bg-gray-400' },
    { label: t('Kam qolgan'), value: stats.lowStock, color: 'bg-warning-500', dotColor: 'bg-warning-500' },
    { label: t('Tugagan'), value: stats.outOfStock, color: 'bg-danger-500', dotColor: 'bg-danger-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title={t("Statistika")} />
      
      <div className="p-4 lg:p-6 space-y-6 pb-24 lg:pb-6">
        {/* Period Toggle - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{t("Umumiy ko'rinish")}</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("Biznesingiz holati")}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-auto">
              <button 
                onClick={() => setPeriod('today')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  period === 'today' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t("Bugun")}
              </button>
              <button 
                onClick={() => setPeriod('week')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  period === 'week' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t("Hafta")}
              </button>
            </div>
            <button 
              onClick={fetchStats} 
              className="btn-icon flex-shrink-0"
              title={t("Yangilash")}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
                <div className="skeleton w-10 h-10 sm:w-12 sm:h-12 rounded-xl mb-3 sm:mb-4" />
                <div className="skeleton-title mb-2" />
                <div className="skeleton-text w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Main Stats - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {mainStats.map((stat, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${stat.bgColor} dark:${stat.bgColor}/20`}>
                      <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor} dark:${stat.textColor.replace('600', '400')}`} />
                    </div>
                    {stat.trend && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        stat.trendUp ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                      }`}>
                        {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {stat.trend}
                      </div>
                    )}
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {stat.value} 
                    {stat.suffix && <span className="text-xs sm:text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">{stat.suffix}</span>}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Inventory Stats - Mobile Optimized */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">{t("Ombor holati")}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("Mahsulotlar statistikasi")}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {inventory.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className={`w-3 h-3 ${item.dotColor} dark:${item.dotColor.replace('400', '500')} rounded-full flex-shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Charts - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {period === 'today' ? t('Bugungi daromad') : t('Haftalik daromad')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {period === 'today' ? t('Soatlik dinamika') : t('Sotuv dinamikasi')}
                </p>
              </div>
            </div>
            <div className="h-48 sm:h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.06)',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#111827', fontWeight: 600 }}
                      formatter={(value: number) => [`${formatNumber(value)} ${t("so'm")}`, t('Sotuv')]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm sm:text-base font-medium">{t("Ma'lumot topilmadi")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-accent-600 dark:text-accent-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{t("Top mahsulotlar")}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("Eng ko'p sotilgan")}</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center h-32 sm:h-48 text-gray-400 dark:text-gray-600">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm sm:text-base font-medium">{t("Ma'lumot topilmadi")}</p>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">{t("Sotuvlar boshlanishi kerak")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
