import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { 
 DollarSign, TrendingUp, ShoppingCart, Receipt, Package, 
 Clock, RefreshCw, ArrowUpRight, ArrowDownRight, X, User
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

export default function Dashboard() {
 const { t } = useLanguage();
 const [period, setPeriod] = useState<'today' | 'week'>('today');
 const [showTodaySalesModal, setShowTodaySalesModal] = useState(false);
 const [todayReceipts, setTodayReceipts] = useState<any[]>([]);
 const [loadingReceipts, setLoadingReceipts] = useState(false);
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

 const fetchTodayReceipts = async () => {
 setLoadingReceipts(true);
 try {
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const tomorrow = new Date(today);
 tomorrow.setDate(tomorrow.getDate() + 1);
 
 const res = await api.get('/receipts', {
 params: {
 startDate: today.toISOString(),
 endDate: tomorrow.toISOString(),
 status: 'completed'
 }
 });
 setTodayReceipts(res.data);
 } catch (err) {
 console.error('Error fetching today receipts:', err);
 } finally {
 setLoadingReceipts(false);
 }
 };

 const openTodaySalesModal = () => {
 setShowTodaySalesModal(true);
 fetchTodayReceipts();
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
 <div 
 key={i} 
 onClick={() => {
 if (stat.label.includes('Bugungi sotuv') || stat.label.includes('Haftalik sotuv')) {
 if (period === 'today') openTodaySalesModal();
 }
 }}
 className={`bg-white dark:bg-neutral-900 rounded-xl p-5 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-200 hover:shadow-md hover:border-red-500 hover:-translate-y-1 dark:hover:border-red-500 ${
 (stat.label.includes('Bugungi sotuv') && period === 'today') ? 'cursor-pointer' : ''
 }`}
 >
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

 {/* Today's Sales Modal */}
 {showTodaySalesModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTodaySalesModal(false)} />
 <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-4xl relative z-10 animate-scaleIn overflow-hidden border-2 border-surface-100 dark:border-surface-700 max-h-[90vh] flex flex-col">
 {/* Header */}
 <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
 <TrendingUp className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="text-xl font-black text-white">{t("Bugungi sotuvlar")}</h3>
 <p className="text-white/80 text-sm">{new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
 </div>
 </div>
 <button onClick={() => setShowTodaySalesModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110">
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="p-6 overflow-y-auto flex-1">
 {loadingReceipts ? (
 <div className="flex justify-center py-20">
 <div className="spinner text-brand-600 w-8 h-8" />
 </div>
 ) : todayReceipts.length === 0 ? (
 <div className="text-center py-16">
 <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
 <ShoppingCart className="w-8 h-8 text-surface-400" />
 </div>
 <h3 className="text-lg font-semibold text-surface-900 mb-2">{t("Bugun sotuvlar yo'q")}</h3>
 <p className="text-surface-500">{t("Hali hech qanday sotuv amalga oshirilmagan")}</p>
 </div>
 ) : (
 <div className="space-y-3">
 {todayReceipts.map((receipt: any) => (
 <div key={receipt._id} className="rounded-xl p-3 border bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
 {receipt.customer && receipt.customer.name ? (
 <span className="font-bold text-brand-600 text-lg">{receipt.customer.name.charAt(0).toUpperCase()}</span>
 ) : (
 <User className="w-5 h-5 text-brand-600" />
 )}
 </div>
 <div>
 <p className="text-sm font-bold text-surface-900 dark:text-surface-100">
 {receipt.customer && receipt.customer.name ? receipt.customer.name : t("Oddiy mijoz")}
 </p>
 <p className="text-xs text-surface-500 dark:text-surface-400">
 {new Date(receipt.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • Chek #{receipt._id.toString().slice(-8)}
 </p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-lg font-black text-brand-600 dark:text-brand-400">
 {formatNumber(receipt.total)} {t("so'm")}
 </p>
 </div>
 </div>
 
 {/* Items - with max height and scroll */}
 <div className="max-h-32 overflow-y-auto space-y-1 mb-2 pr-1">
 {receipt.items.map((item: any, idx: number) => (
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
 {receipt.cashAmount > 0 && (
 <div className="flex justify-between text-xs">
 <span className="text-surface-600 dark:text-surface-400">💵 Naqd:</span>
 <span className="font-semibold text-emerald-600 dark:text-emerald-400">
 {formatNumber(receipt.cashAmount)}
 </span>
 </div>
 )}
 {receipt.cardAmount > 0 && (
 <div className="flex justify-between text-xs">
 <span className="text-surface-600 dark:text-surface-400">💳 Karta:</span>
 <span className="font-semibold text-blue-600 dark:text-blue-400">
 {formatNumber(receipt.cardAmount)}
 </span>
 </div>
 )}
 {receipt.debtAmount > 0 && receipt.customer && receipt.customer.name && (
 <div className="flex justify-between text-xs">
 <span className="text-surface-600 dark:text-surface-400">⚠️ Qarz:</span>
 <span className="font-semibold text-danger-600 dark:text-danger-400">
 {formatNumber(receipt.debtAmount)}
 </span>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
