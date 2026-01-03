import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { 
  DollarSign, TrendingUp, ShoppingCart, Receipt, Package, 
  Brain, Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

export default function Dashboard() {
  const [period, setPeriod] = useState<'today' | 'week'>('today');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalReceipts: 0,
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [chartData, setChartData] = useState<{name: string; sales: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchChartData();
  }, []);

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
      const res = await api.get('/stats/chart?period=week');
      setChartData(res.data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    }
  };

  const mainStats = [
    { icon: <DollarSign className="w-5 h-5 text-white" />, label: 'Umumiy tushum', value: stats.totalRevenue.toLocaleString(), suffix: "so'm", color: 'bg-yellow-500' },
    { icon: <TrendingUp className="w-5 h-5 text-white" />, label: period === 'today' ? 'Bugungi sotuv' : 'Haftalik sotuv', value: (period === 'today' ? stats.todaySales : stats.weekSales).toLocaleString(), suffix: "so'm", color: 'bg-blue-500' },
    { icon: <ShoppingCart className="w-5 h-5 text-white" />, label: 'Jami cheklar', value: stats.totalReceipts.toString(), color: 'bg-purple-500' },
    { icon: <Receipt className="w-5 h-5 text-white" />, label: "O'rtacha chek", value: stats.totalReceipts > 0 ? Math.round(stats.totalRevenue / stats.totalReceipts).toLocaleString() : '0', suffix: "so'm", color: 'bg-green-500' },
  ];

  const inventory = [
    { label: 'Jami mahsulotlar', value: stats.totalProducts, color: 'bg-gray-400', textColor: 'text-gray-700' },
    { label: 'Kam qolgan', value: stats.lowStock, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { label: 'Tugagan', value: stats.outOfStock, color: 'bg-primary-500', textColor: 'text-primary-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Statistika" />
      
      <div className="p-6 space-y-6">
        {/* Stats Header */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-500" />
              <span className="font-semibold text-gray-900">Statistika</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPeriod('today')}
                className={`px-4 py-1.5 rounded-lg text-sm ${period === 'today' ? 'bg-gray-200 text-gray-900' : 'text-gray-500'}`}
              >
                Bugun
              </button>
              <button 
                onClick={() => setPeriod('week')}
                className={`px-4 py-1.5 rounded-lg text-sm ${period === 'week' ? 'bg-gray-200 text-gray-900' : 'text-gray-500'}`}
              >
                Hafta
              </button>
              <button onClick={fetchStats} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Main Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {mainStats.map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value} <span className="text-sm text-gray-500">{stat.suffix}</span></p>
                    <p className="text-gray-500 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Inventory Stats */}
              <div className="grid grid-cols-3 gap-4">
                {inventory.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className={`w-3 h-3 ${item.color} rounded-full`} />
                    <div>
                      <p className="text-gray-500 text-sm">{item.label}</p>
                      <p className={`text-xl font-bold ${item.textColor}`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* AI Predictions */}
        <div className="card bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-500" />
              <div>
                <span className="font-semibold text-gray-900">AI Prognozlar</span>
                <p className="text-xs text-gray-500">Sun'iy intellekt tahlili</p>
              </div>
            </div>
            <button className="p-2 bg-primary-500 rounded-lg text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-900">Ertangi prognoz</span>
              </div>
              <p className="text-gray-500 text-sm">
                {stats.totalReceipts >= 3 
                  ? `Taxminan ${Math.round(stats.weekSales / 7 * 1.1).toLocaleString()} so'm`
                  : 'Prognoz uchun ma\'lumot yetarli emas'}
              </p>
              {stats.totalReceipts < 3 && (
                <p className="text-xs text-primary-500 mt-1">Kamida 3 kun savdo ma'lumoti kerak</p>
              )}
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-900">Eng yaxshi vaqt</span>
              </div>
              <p className="text-gray-500 text-sm">
                {stats.totalReceipts >= 10 
                  ? '14:00 - 18:00'
                  : 'Tahlil uchun ma\'lumot yetarli emas'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">Diqqat</span>
              </div>
              <p className="text-2xl font-bold text-primary-500">{stats.lowStock + stats.outOfStock}</p>
              <p className="text-gray-500 text-sm">tovar kam qolgan</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Daily Revenue Chart */}
          <div className="col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <span className="font-semibold text-gray-900">Haftalik daromad dinamikasi</span>
              </div>
            </div>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      labelStyle={{ color: '#111827' }}
                      formatter={(value: number) => [`${value.toLocaleString()} so'm`, 'Sotuv']}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Ma'lumot topilmadi</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                <span className="font-semibold text-gray-900">Top mahsulotlar</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Clock className="w-12 h-12 mb-2 opacity-50" />
              <p>Ma'lumot topilmadi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
