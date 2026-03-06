import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { 
  DollarSign, TrendingUp, ShoppingCart, Calendar, User, 
  ArrowLeft, Download, Search, X, CreditCard, Banknote, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

// Helper function to format dates as DD.MM.YYYY or DD.MM
const formatDate = (date: Date | string, includeYear = true): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return includeYear ? `${day}.${month}.${year}` : `${day}.${month}`;
};

// Helper function to format time as HH:MM
const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Helper function to format datetime as DD.MM.YYYY HH:MM
const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date, true)} ${formatTime(date)}`;
};

interface Receipt {
  _id: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
  cashAmount: number;
  cardAmount: number;
  debtAmount: number;
  customer?: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Stats {
  totalSales: number;
  totalReceipts: number;
  averageCheck: number;
  cashTotal: number;
  cardTotal: number;
  debtTotal: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  hourlyData: Array<{
    hour: string;
    sales: number;
    count: number;
  }>;
  paymentBreakdown: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
}

const COLORS = ['#10b981', '#2563eb', '#f59e0b', '#dc2626']; // Green, Blue, Orange, Red

export default function SalesReport() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const period = searchParams.get('period') || 'today';
  
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterSeller, setFilterSeller] = useState<string>('all'); // Seller filter
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // For week period date filter
  const [sellers, setSellers] = useState<Array<{id: string, name: string}>>([]); // List of sellers

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stats/sales-report?period=${period}`);
      setReceipts(res.data.receipts);
      setStats(res.data.stats);
      
      // Extract unique sellers from receipts
      const uniqueSellers = new Map<string, string>();
      res.data.receipts.forEach((receipt: Receipt) => {
        if (receipt.createdBy && receipt.createdBy._id && receipt.createdBy.name) {
          uniqueSellers.set(receipt.createdBy._id, receipt.createdBy.name);
        }
      });
      
      const sellersList = Array.from(uniqueSellers.entries()).map(([id, name]) => ({ id, name }));
      setSellers(sellersList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Error fetching sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = searchTerm === '' || 
      receipt.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (receipt.customer?.name && receipt.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (receipt.createdBy?.name && receipt.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPayment = filterPayment === 'all' || receipt.paymentMethod === filterPayment;
    
    // Seller filter - FIX: Compare as strings
    const matchesSeller = filterSeller === 'all' || (receipt.createdBy?._id && String(receipt.createdBy._id) === String(filterSeller));
    
    // Date filter for week period - FIX: Convert both to same format for comparison
    let matchesDate = true;
    if (period === 'week' && selectedDate) {
      // Convert selectedDate from YYYY-MM-DD to DD.MM.YYYY for comparison
      const [year, month, day] = selectedDate.split('-');
      const formattedSelectedDate = `${day}.${month}.${year}`;
      const receiptDate = formatDate(receipt.createdAt, true);
      matchesDate = receiptDate === formattedSelectedDate;
    }
    
    return matchesSearch && matchesPayment && matchesSeller && matchesDate;
  });

  const exportToExcel = () => {
    if (!stats) return;
    
    const periodTitle = period === 'today' ? 'Bugungi' : period === 'week' ? 'Haftalik' : 'Oylik';
    const dateStr = getPeriodDate();
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Umumiy Statistika
    const statsData = [
      ['📊 ' + periodTitle + ' Sotuv Hisoboti'],
      ['Davr:', dateStr],
      ['Yaratilgan:', formatDateTime(new Date())],
      [],
      ['UMUMIY STATISTIKA'],
      ['Ko\'rsatkich', 'Qiymat'],
      ['💰 Jami Sotuv', formatNumber(stats.totalSales) + ' so\'m'],
      ['🛒 Cheklar Soni', stats.totalReceipts],
      ['📈 O\'rtacha Chek', formatNumber(stats.averageCheck) + ' so\'m'],
      ['⏰ Jami Mahsulotlar', filteredReceipts.reduce((sum, r) => sum + r.items.length, 0)],
      [],
      ['TO\'LOV TURLARI'],
      ['To\'lov Turi', 'Summa', 'Foiz'],
      ...stats.paymentBreakdown.map(p => [
        p.method === 'Naqd' ? '💵 Naqd' : p.method === 'Karta' ? '💳 Karta' : '⚠️ Qarz',
        formatNumber(p.amount) + ' so\'m',
        p.percentage + '%'
      ])
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet(statsData);
    
    // Set column widths
    ws1['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 15 }
    ];
    
    // Merge cells for title
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Statistika');
    
    // Sheet 2: Cheklar Ro'yxati
    const receiptsData = [
      ['CHEKLAR RO\'YXATI'],
      ['№', 'Vaqt', 'Chek #', 'Mijoz', 'Jami (so\'m)', 'To\'lov', 'Sotuvchi'],
      ...filteredReceipts.map((r, i) => [
        i + 1,
        formatDateTime(r.createdAt),
        '#' + r._id.slice(-8),
        r.customer?.name || 'Oddiy mijoz',
        r.total,
        r.paymentMethod === 'cash' ? '💵 Naqd' : 
          r.paymentMethod === 'card' ? '💳 Karta' : 
          r.paymentMethod === 'mixed' ? '🔀 Aralash' : '⚠️ Qarz',
        r.createdBy?.name || 'Noma\'lum'
      ])
    ];
    
    const ws2 = XLSX.utils.aoa_to_sheet(receiptsData);
    
    // Set column widths
    ws2['!cols'] = [
      { wch: 5 },
      { wch: 18 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 }
    ];
    
    // Merge cells for title
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws2, 'Cheklar');
    
    // Sheet 3: Mahsulotlar (if there are items)
    if (filteredReceipts.length > 0) {
      const allItems: any[] = [];
      filteredReceipts.forEach(receipt => {
        receipt.items.forEach(item => {
          allItems.push({
            chek: '#' + receipt._id.slice(-8),
            vaqt: formatDateTime(receipt.createdAt),
            mahsulot: item.name,
            miqdor: item.quantity,
            narx: item.price,
            jami: item.quantity * item.price,
            mijoz: receipt.customer?.name || 'Oddiy mijoz'
          });
        });
      });
      
      const itemsData = [
        ['MAHSULOTLAR RO\'YXATI'],
        ['Chek #', 'Vaqt', 'Mahsulot', 'Miqdor', 'Narx', 'Jami', 'Mijoz'],
        ...allItems.map(item => [
          item.chek,
          item.vaqt,
          item.mahsulot,
          item.miqdor,
          item.narx,
          item.jami,
          item.mijoz
        ])
      ];
      
      const ws3 = XLSX.utils.aoa_to_sheet(itemsData);
      
      // Set column widths
      ws3['!cols'] = [
        { wch: 12 },
        { wch: 18 },
        { wch: 30 },
        { wch: 8 },
        { wch: 12 },
        { wch: 12 },
        { wch: 20 }
      ];
      
      // Merge cells for title
      ws3['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws3, 'Mahsulotlar');
    }
    
    // Download file
    const fileName = `sotuv-hisobot-${period}-${formatDate(new Date(), true)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getPeriodTitle = () => {
    if (period === 'today') return t('Bugungi sotuvlar');
    if (period === 'week') return t('Haftalik sotuvlar');
    return t('Oylik sotuvlar');
  };

  const getPeriodDate = () => {
    const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
    const MONTHS_S = ['yan','fev','mart','apr','may','iyun','iyul','avg','sen','okt','noy','dek'];
    const DAYS = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
    const today = new Date();
    if (period === 'today') {
      return `${today.getDate()} ${MONTHS[today.getMonth()]}, ${DAYS[today.getDay()]}`;
    }
    if (period === 'week') {
      const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return monday.getMonth() === sunday.getMonth()
        ? `${monday.getDate()}-${sunday.getDate()} ${MONTHS_S[monday.getMonth()]}, ${sunday.getFullYear()}`
        : `${monday.getDate()} ${MONTHS_S[monday.getMonth()]} - ${sunday.getDate()} ${MONTHS_S[sunday.getMonth()]}, ${sunday.getFullYear()}`;
    }
    return `${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Header title={getPeriodTitle()} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="spinner text-red-600 w-12 h-12 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">{t("Yuklanmoqda...")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Header title={getPeriodTitle()} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">{t("Ma'lumot yuklanmadi")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header title={getPeriodTitle()} />
      
      <div className="p-4 lg:p-6 space-y-6 pb-24 lg:pb-6">
        {/* Back Button & Export */}
        <div className="flex items-center justify-between gap-2 lg:gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base rounded-xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-500 dark:hover:border-red-500 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="font-semibold">{t("Orqaga")}</span>
          </button>
          
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="font-semibold hidden sm:inline">{t("Excel")}</span>
            <span className="font-semibold sm:hidden">XLSX</span>
          </button>
        </div>

        {/* Period Info */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 lg:gap-3 mb-1 lg:mb-2">
            <Calendar className="w-5 h-5 lg:w-6 lg:h-6" />
            <h2 className="text-lg lg:text-2xl font-black">{getPeriodTitle()}</h2>
          </div>
          <p className="text-white/80 text-xs lg:text-sm">{getPeriodDate()}</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-5 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-lg lg:text-2xl font-black text-neutral-900 dark:text-neutral-50 mb-0.5 lg:mb-1 truncate">
                {formatNumber(stats.totalSales)}
              </p>
              <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400 truncate">{t("Jami sotuv")}</p>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-5 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-lg lg:text-2xl font-black text-neutral-900 dark:text-neutral-50 mb-0.5 lg:mb-1">
                {stats.totalReceipts}
              </p>
              <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400 truncate">{t("Cheklar soni")}</p>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-5 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-lg lg:text-2xl font-black text-neutral-900 dark:text-neutral-50 mb-0.5 lg:mb-1 truncate">
                {formatNumber(stats.averageCheck)}
              </p>
              <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400 truncate">{t("O'rtacha chek")}</p>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-5 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="space-y-1.5 lg:space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">💵 {t("Naqd")}</span>
                  <span className="text-xs lg:text-sm font-bold text-green-600 dark:text-green-400 truncate ml-1">{formatNumber(stats.cashTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">💳 {t("Karta")}</span>
                  <span className="text-xs lg:text-sm font-bold text-blue-600 dark:text-blue-400 truncate ml-1">{formatNumber(stats.cardTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">⚠️ {t("Qarz")}</span>
                  <span className="text-xs lg:text-sm font-bold text-red-600 dark:text-red-400 truncate ml-1">{formatNumber(stats.debtTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Hourly Chart */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 lg:p-6 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-base lg:text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-3 lg:mb-4">
                {period === 'today' ? t('Soatlik dinamika') : t('Kunlik dinamika')}
              </h3>
              <div className="h-48 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.hourlyData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#737373" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#737373" fontSize={10} width={40} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '2px solid #e5e5e5', 
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => formatNumber(value)}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#dc2626" strokeWidth={2} fill="url(#salesGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 lg:p-6 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-base lg:text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-3 lg:mb-4">{t("To'lov turlari")}</h3>
              
              {stats.paymentBreakdown.length === 0 ? (
                <div className="h-48 lg:h-64 flex items-center justify-center">
                  <p className="text-neutral-400 dark:text-neutral-600">{t("Ma'lumot yo'q")}</p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
                  {/* Chart */}
                  <div className="w-full lg:w-1/2 h-48 lg:h-56 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.paymentBreakdown}
                          cx="50%"
          cy="50%"
                          labelLine={false}
                          label={false}
                          innerRadius={0}
                          outerRadius={window.innerWidth < 1024 ? 70 : 90}
                          fill="#8884d8"
                          dataKey="amount"
                          paddingAngle={2}
                        >
                          {stats.paymentBreakdown.map((_item, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatNumber(value)}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #e5e5e5',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend - Right side */}
                  <div className="w-full lg:w-1/2 space-y-2 lg:space-y-3">
                    {stats.paymentBreakdown.map((item, index) => {
                      const getIcon = (method: string) => {
                        if (method === 'Naqd') return '💵';
                        if (method === 'Karta') return '�';
                        if (method === 'Qarz') return '⚠️';
                        return '�💰';
                      };
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 lg:p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors border-2 border-transparent hover:border-neutral-200 dark:hover:border-neutral-600">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0 shadow-md" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm lg:text-base font-bold text-neutral-900 dark:text-neutral-100">
                              {getIcon(item.method)} {item.method}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm lg:text-base font-black text-neutral-900 dark:text-neutral-100">
                              {formatNumber(item.amount)}
                            </span>
                            <span className="text-xs lg:text-sm font-bold px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
          {/* Mobile: 2x2 Grid, Desktop: 4 columns or 3 if no date */}
          <div className={`grid grid-cols-2 gap-3 ${period === 'week' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            {/* Search */}
            <div className="relative flex items-center col-span-2 lg:col-span-1">
              <Search className="absolute left-3 w-4 h-4 lg:w-5 lg:h-5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder={t("Qidirish...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 lg:pl-10 pr-4 py-2 lg:py-2.5 text-sm lg:text-base rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-500 dark:focus:border-red-500 outline-none transition-all"
              />
            </div>
            
            {/* Payment Filter */}
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-500 dark:focus:border-red-500 outline-none transition-all col-span-1"
            >
              <option value="all">{t("To'lov")}</option>
              <option value="cash">{t("Naqd")}</option>
              <option value="card">{t("Karta")}</option>
              <option value="mixed">{t("Aralash")}</option>
              <option value="debt">{t("Qarz")}</option>
            </select>
            
            {/* Seller Filter */}
            <select
              value={filterSeller}
              onChange={(e) => setFilterSeller(e.target.value)}
              className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-500 dark:focus:border-red-500 outline-none transition-all col-span-1"
            >
              <option value="all">{t("Sotuvchi")}</option>
              {sellers.map(seller => (
                <option key={seller.id} value={seller.id}>{seller.name}</option>
              ))}
            </select>
            
            {/* Date Filter - Only for week period */}
            {period === 'week' && (
              <div className="relative flex items-center col-span-2 lg:col-span-1">
                <Calendar className="absolute left-3 w-4 h-4 lg:w-5 lg:h-5 text-neutral-400 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={formatDate(new Date(), true).split('.').reverse().join('-')} // YYYY-MM-DD format
                  min={(() => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return formatDate(weekAgo, true).split('.').reverse().join('-');
                  })()}
                  className="w-full pl-9 lg:pl-10 pr-10 py-2 lg:py-2.5 text-sm lg:text-base rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-500 dark:focus:border-red-500 outline-none transition-all"
                  placeholder={t("Sana tanlang")}
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="absolute right-3 text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b-2 border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
              {t("Cheklar ro'yxati")} ({filteredReceipts.length})
            </h3>
          </div>
          
          {/* Mobile: Cards View */}
          <div className="lg:hidden divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredReceipts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">{t("Cheklar topilmadi")}</p>
              </div>
            ) : (
              filteredReceipts.map((receipt) => (
                <div 
                  key={receipt._id}
                  onClick={() => setSelectedReceipt(receipt)}
                  className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors active:bg-neutral-100 dark:active:bg-neutral-800"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {receipt.customer?.name || t('Oddiy mijoz')}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatTime(receipt.createdAt)} • #{receipt._id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-lg font-black text-red-600 dark:text-red-400">
                        {formatNumber(receipt.total)}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("so'm")}</p>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      receipt.paymentMethod === 'cash' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      receipt.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      receipt.paymentMethod === 'mixed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {receipt.paymentMethod === 'cash' && <Banknote className="w-3 h-3" />}
                      {receipt.paymentMethod === 'card' && <CreditCard className="w-3 h-3" />}
                      {receipt.paymentMethod === 'debt' && <AlertCircle className="w-3 h-3" />}
                      {receipt.paymentMethod === 'cash' ? t('Naqd') : 
                       receipt.paymentMethod === 'card' ? t('Karta') : 
                       receipt.paymentMethod === 'mixed' ? t('Aralash') : t('Qarz')}
                    </span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                      {receipt.createdBy?.name || t('Noma\'lum')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">{t("Vaqt")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">{t("Chek #")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">{t("Mijoz")}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">{t("Jami")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">{t("To'lov")}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">{t("Sotuvchi")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShoppingCart className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400">{t("Cheklar topilmadi")}</p>
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((receipt) => (
                    <tr 
                      key={receipt._id}
                      onClick={() => setSelectedReceipt(receipt)}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100">
                        {formatTime(receipt.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-neutral-600 dark:text-neutral-400">
                        #{receipt._id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100">
                        {receipt.customer?.name || t('Oddiy mijoz')}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-red-600 dark:text-red-400">
                        {formatNumber(receipt.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                          receipt.paymentMethod === 'cash' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          receipt.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          receipt.paymentMethod === 'mixed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {receipt.paymentMethod === 'cash' && <Banknote className="w-3 h-3" />}
                          {receipt.paymentMethod === 'card' && <CreditCard className="w-3 h-3" />}
                          {receipt.paymentMethod === 'debt' && <AlertCircle className="w-3 h-3" />}
                          {receipt.paymentMethod === 'cash' ? t('Naqd') : 
                           receipt.paymentMethod === 'card' ? t('Karta') : 
                           receipt.paymentMethod === 'mixed' ? t('Aralash') : t('Qarz')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                        {receipt.createdBy?.name || t('Noma\'lum')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 lg:p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)} />
          <div className="bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 animate-scaleIn overflow-hidden border-2 border-neutral-200 dark:border-neutral-800 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base lg:text-xl font-black text-white">{t("Chek tafsilotlari")}</h3>
                <p className="text-white/80 text-xs lg:text-sm">#{selectedReceipt._id.slice(-8)}</p>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all">
                <X className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            </div>
            
            <div className="p-4 lg:p-6 overflow-y-auto flex-1">
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between p-2.5 lg:p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">{t("Vaqt")}</span>
                  <span className="text-xs lg:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatDateTime(selectedReceipt.createdAt)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2.5 lg:p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">{t("Mijoz")}</span>
                  <span className="text-xs lg:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {selectedReceipt.customer?.name || t('Oddiy mijoz')}
                  </span>
                </div>
                
                <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-3 lg:pt-4">
                  <h4 className="text-xs lg:text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-2 lg:mb-3">{t("Mahsulotlar")}</h4>
                  <div className="space-y-1.5 lg:space-y-2">
                    {selectedReceipt.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-xs lg:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{item.name}</p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">{item.quantity} × {formatNumber(item.price)}</p>
                        </div>
                        <p className="text-xs lg:text-sm font-bold text-neutral-900 dark:text-neutral-100 flex-shrink-0">
                          {formatNumber(item.quantity * item.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-3 lg:pt-4 space-y-1.5 lg:space-y-2">
                  {selectedReceipt.cashAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">💵 {t("Naqd")}</span>
                      <span className="text-xs lg:text-sm font-semibold text-green-600 dark:text-green-400">{formatNumber(selectedReceipt.cashAmount)}</span>
                    </div>
                  )}
                  {selectedReceipt.cardAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">💳 {t("Karta")}</span>
                      <span className="text-xs lg:text-sm font-semibold text-blue-600 dark:text-blue-400">{formatNumber(selectedReceipt.cardAmount)}</span>
                    </div>
                  )}
                  {selectedReceipt.debtAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">⚠️ {t("Qarz")}</span>
                      <span className="text-xs lg:text-sm font-semibold text-red-600 dark:text-red-400">{formatNumber(selectedReceipt.debtAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t-2 border-neutral-200 dark:border-neutral-800">
                    <span className="text-sm lg:text-base font-bold text-neutral-900 dark:text-neutral-100">{t("Jami")}</span>
                    <span className="text-base lg:text-lg font-black text-red-600 dark:text-red-400">{formatNumber(selectedReceipt.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
