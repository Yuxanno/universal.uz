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
 { label: t('Jami mahsulotlar'), value: stats.totalProducts, color: 'bg-neutral-500', dotColor: 'bg-neutral-400' },
 { label: t('Kam qolgan'), value: stats.lowStock, color: 'bg-warning-500', dotColor: 'bg-warning-500' },
 { label: t('Tugagan'), value: stats.outOfStock, color: 'bg-danger-500', dotColor: 'bg-danger-500' },
 ];

 return (
 <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
 <Header title={t("Statistika")} />
 
 <div className="p-4 lg:p-6 space-y-6 pb-24 lg:pb-6">
 {/* Period Toggle - Mobile Optimized */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">{t("Umumiy ko'rinish")}</h2>
 <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{t("Biznesingiz holati")}</p>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex p-1 bg-white dark:bg-neutral-900 rounded-xl w-full sm:w-auto border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
 <button 
 onClick={() => setPeriod('today')}
 className={`flex-1 sm:flex-none px-5 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
 period === 'today' 
 ? 'bg-red-600 text-white shadow-sm' 
 : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
 }`}
 >
 {t("Bugun")}
 </button>
 <button 
 onClick={() => setPeriod('week')}
 className={`flex-1 sm:flex-none px-5 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
 period === 'week' 
 ? 'bg-red-600 text-white shadow-sm' 
 : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
 }`}
 >
 {t("Hafta")}
 </button>
 </div>
 <button 
 onClick={fetchStats} 
 className="p-3 rounded-lg bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500 transition-all shadow-sm flex-shrink-0"
 title={t("Yangilash")}
 >
 <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
 </button>
 </div>
 </div>

 {loading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {[1,2,3,4].map(i => (
 <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl p-5 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
 <div className="skeleton w-12 h-12 rounded-xl mb-4" />
 <div className="skeleton-title mb-2" />
 <div className="skeleton-text w-1/2" />
 </div>
 ))}
 </div>
 ) : (
 <>
 {/* Main Stats - Mobile Optimized */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {mainStats.map((stat, i) => (
 <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl p-5 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-200 hover:shadow-md hover:border-red-500 hover:-translate-y-1 dark:hover:border-red-500">
 <div className="flex items-start justify-between mb-4">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor} dark:${stat.bgColor}/20 shadow-sm`}>
 <stat.icon className={`w-6 h-6 ${stat.textColor} dark:${stat.textColor.replace('600', '400')}`} />
 </div>
 {stat.trend && (
 <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
 stat.trendUp ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
 }`}>
 {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
 {stat.trend}
 </div>
 )}
 </div>
 <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">
 {stat.value} 
 {stat.suffix && <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400 ml-1">{stat.suffix}</span>}
 </p>
 <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">{stat.label}</p>
 </div>
 ))}
 </div>

 {/* Inventory Stats - Mobile Optimized */}
 <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shadow-sm">
 <Package className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
 </div>
 <div>
 <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50">{t("Ombor holati")}</h3>
 <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("Mahsulotlar statistikasi")}</p>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {inventory.map((item, i) => (
 <div key={i} className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border-2 border-neutral-200 dark:border-neutral-700">
 <div className={`w-3 h-3 ${item.dotColor} dark:${item.dotColor.replace('400', '500')} rounded-full flex-shrink-0 shadow-sm`} />
 <div className="min-w-0">
 <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{item.value}</p>
 <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{item.label}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </>
 )}

 {/* Charts - Mobile Optimized */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Revenue Chart */}
 <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 shadow-sm">
 <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />
 </div>
 <div className="min-w-0">
 <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 truncate">
 {period === 'today' ? t('Bugungi daromad') : t('Haftalik daromad')}
 </h3>
 <p className="text-sm text-neutral-600 dark:text-neutral-400">
 {period === 'today' ? t('Soatlik dinamika') : t('Sotuv dinamikasi')}
 </p>
 </div>
 </div>
 <div className="h-64">
 {chartData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData}>
 <defs>
 <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
 <XAxis 
 dataKey="date" 
 stroke="#737373" 
 fontSize={11} 
 tickLine={false} 
 axisLine={false}
 angle={-45}
 textAnchor="end"
 height={60}
 />
 <YAxis 
 stroke="#737373" 
 fontSize={11} 
 tickLine={false} 
 axisLine={false}
 width={50}
 />
 <Tooltip 
 contentStyle={{ 
 backgroundColor: '#fff', 
 border: '2px solid #e5e5e5', 
 borderRadius: '12px',
 boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.08)',
 fontSize: '13px',
 fontWeight: 600
 }}
 labelStyle={{ color: '#171717', fontWeight: 700 }}
 formatter={(value: number) => [`${formatNumber(value)} ${t("so'm")}`, t('Sotuv')]}
 />
 <Area 
 type="monotone" 
 dataKey="sales" 
 stroke="#dc2626" 
 strokeWidth={3} 
 fill="url(#colorSales)" 
 />
 </AreaChart>
 </ResponsiveContainer>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600">
 <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
 <TrendingUp className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
 </div>
 <p className="text-base font-bold">{t("Ma'lumot topilmadi")}</p>
 </div>
 )}
 </div>
 </div>

 {/* Top Products */}
 <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 shadow-sm">
 <Package className="w-6 h-6 text-red-600 dark:text-red-400" />
 </div>
 <div className="min-w-0">
 <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 truncate">{t("Top mahsulotlar")}</h3>
 <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("Eng ko'p sotilgan")}</p>
 </div>
 </div>
 <div className="flex flex-col items-center justify-center h-48 text-neutral-400 dark:text-neutral-600">
 <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
 <Clock className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
 </div>
 <p className="text-base font-bold">{t("Ma'lumot topilmadi")}</p>
 <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">{t("Sotuvlar boshlanishi kerak")}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
