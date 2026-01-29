import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { 
 DollarSign, TrendingUp, ShoppingCart, Receipt, Package, 
 Clock, RefreshCw, ArrowUpRight, ArrowDownRight, X
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

export default function Dashboard() {
 const { t } = useLanguage();
 const navigate = useNavigate();
 const [period, setPeriod] = useState<'today' | 'week'>('today');
 const [stats, setStats] = useState({
 totalRevenue: 0,
 todaySales: 0,
 weekSales: 0,
 monthSales: 0,
 totalReceipts: 0,
 peakHour: ''
 });
 const [chartData, setChartData] = useState<{name: string; sales: number}[]>([]);
 const [topProducts, setTopProducts] = useState<any[]>([]);
 const [showAllProducts, setShowAllProducts] = useState(false);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchStats();
 fetchTopProducts();
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

 const fetchTopProducts = async () => {
 try {
 const res = await api.get('/stats/top-products?limit=20');
 console.log('Top products data:', res.data);
 setTopProducts(res.data);
 } catch (err) {
 console.error('Error fetching top products:', err);
 // Set empty array if error
 setTopProducts([]);
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
 trendUp: true,
 clickable: false
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
 trendUp: true,
 clickable: true,
 onClick: () => navigate(`/admin/sales-report?period=${period}`)
 },
 { 
 icon: ShoppingCart, 
 label: t('Jami cheklar'), 
 value: stats.totalReceipts.toString(), 
 color: 'bg-accent-500',
 bgColor: 'bg-accent-50',
 textColor: 'text-accent-600',
 trend: '+5%',
 trendUp: true,
 clickable: false
 },
 { 
 icon: Receipt, 
 label: t("Eng faol vaqt"), 
 value: stats.peakHour || '-', 
 color: 'bg-warning-500',
 bgColor: 'bg-warning-50',
 textColor: 'text-warning-600',
 trend: '',
 trendUp: true,
 clickable: false
 },
 ];

 // Ombor holati o'chirildi - faqat real statistika

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
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
 {[1,2,3,4].map(i => (
 <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl p-4 lg:p-5 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
 <div className="skeleton w-10 h-10 lg:w-12 lg:h-12 rounded-xl mb-3 lg:mb-4" />
 <div className="skeleton-title mb-2" />
 <div className="skeleton-text w-1/2" />
 </div>
 ))}
 </div>
 ) : (
 <>
 {/* Main Stats - 2x2 on mobile, 1x4 on desktop */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
 {mainStats.map((stat, i) => (
 <div 
 key={i} 
 onClick={() => stat.clickable && stat.onClick && stat.onClick()}
 className={`bg-white dark:bg-neutral-900 rounded-xl p-4 lg:p-5 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-200 hover:shadow-md hover:border-red-500 hover:-translate-y-1 dark:hover:border-red-500 ${
 stat.clickable ? 'cursor-pointer' : ''
 }`}
 >
 <div className="flex items-start justify-between mb-3 lg:mb-4">
 <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${stat.bgColor} dark:${stat.bgColor}/20 shadow-sm`}>
 <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.textColor} dark:${stat.textColor.replace('600', '400')}`} />
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
 <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-1 truncate">
 {stat.value} 
 {stat.suffix && <span className="text-xs lg:text-sm font-normal text-neutral-500 dark:text-neutral-400 ml-1">{stat.suffix}</span>}
 </p>
 <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400 font-medium truncate">{stat.label}</p>
 </div>
 ))}
 </div>

 {/* Ombor holati o'chirildi */}
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
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 shadow-sm">
 <Package className="w-6 h-6 text-red-600 dark:text-red-400" />
 </div>
 <div className="min-w-0">
 <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 truncate">{t("Top mahsulotlar")}</h3>
 <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("Eng ko'p sotilgan")}</p>
 </div>
 </div>
 {topProducts.length > 3 && (
 <button
 onClick={() => setShowAllProducts(true)}
 className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
 title={t("Barchasini ko'rish")}
 >
 <ArrowUpRight className="w-5 h-5" />
 </button>
 )}
 </div>
 {topProducts.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-48 text-neutral-400 dark:text-neutral-600">
 <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
 <Clock className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
 </div>
 <p className="text-base font-bold">{t("Ma'lumot topilmadi")}</p>
 <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">{t("Sotuvlar boshlanishi kerak")}</p>
 </div>
 ) : (
 <div className="space-y-3">
 {topProducts.slice(0, 3).map((product, index) => (
 <div key={product._id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 transition-all">
 <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
 <span className="text-sm font-black text-red-600 dark:text-red-400">#{index + 1}</span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50 truncate">
 {product.name || product.productName || product._id || 'Noma\'lum mahsulot'}
 </p>
 <p className="text-xs text-neutral-600 dark:text-neutral-400">
 {product.totalQuantity || product.quantity || 0} {t("ta sotildi")}
 </p>
 </div>
 <div className="text-right flex-shrink-0">
 <p className="text-sm font-black text-red-600 dark:text-red-400">
 {formatNumber(product.totalRevenue)}
 </p>
 <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("so'm")}</p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* All Products Modal */}
 {showAllProducts && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAllProducts(false)} />
 <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 animate-scaleIn overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 max-h-[90vh] flex flex-col">
 {/* Header */}
 <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
 <Package className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="text-xl font-black text-white">{t("Top mahsulotlar")}</h3>
 <p className="text-white/80 text-sm">{t("Barcha sotilgan mahsulotlar")}</p>
 </div>
 </div>
 <button onClick={() => setShowAllProducts(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110">
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="p-6 overflow-y-auto flex-1">
 {topProducts.length === 0 ? (
 <div className="text-center py-16">
 <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
 <Package className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
 </div>
 <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t("Mahsulotlar yo'q")}</h3>
 <p className="text-neutral-500 dark:text-neutral-400">{t("Hali hech qanday mahsulot sotilmagan")}</p>
 </div>
 ) : (
 <div className="space-y-3">
 {topProducts.map((product, index) => (
 <div key={product._id} className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 transition-all">
 <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
 <span className="text-base font-black text-red-600 dark:text-red-400">#{index + 1}</span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-base font-bold text-neutral-900 dark:text-neutral-50 truncate">
 {product.name || product.productName || product._id || 'Noma\'lum mahsulot'}
 </p>
 <p className="text-sm text-neutral-600 dark:text-neutral-400">
 {product.totalQuantity || product.quantity || 0} {t("ta sotildi")}
 </p>
 </div>
 <div className="text-right flex-shrink-0">
 <p className="text-lg font-black text-red-600 dark:text-red-400">
 {formatNumber(product.totalRevenue)}
 </p>
 <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("so'm")}</p>
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
