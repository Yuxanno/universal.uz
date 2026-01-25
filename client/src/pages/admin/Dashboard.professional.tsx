/**
 * 🎨 Professional Dashboard
 * Modern analytics and insights interface
 */

import { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Receipt, Package, 
  Clock, RefreshCw, ArrowUpRight, ArrowDownRight, AlertTriangle,
  Users, CreditCard
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/ui/Button.professional';

export default function DashboardProfessional() {
  useLanguage(); // Keep context active
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalReceipts: 0,
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    peakHour: '',
    customersCount: 0,
    averageCheck: 0,
  });
  const [chartData, setChartData] = useState<{name: string; sales: number; orders: number}[]>([]);
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

  const periodLabels = {
    today: 'Сегодня',
    week: 'Неделя',
    month: 'Месяц',
  };

  const mainMetrics = [
    {
      label: 'Общая выручка',
      value: formatNumber(stats.totalRevenue),
      suffix: 'сум',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: <DollarSign />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: period === 'today' ? 'Продажи сегодня' : period === 'week' ? 'Продажи за неделю' : 'Продажи за месяц',
      value: formatNumber(period === 'today' ? stats.todaySales : period === 'week' ? stats.weekSales : stats.monthSales),
      suffix: 'сум',
      change: '+8.3%',
      changeType: 'positive' as const,
      icon: <TrendingUp />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Количество чеков',
      value: stats.totalReceipts.toString(),
      change: '+5.2%',
      changeType: 'positive' as const,
      icon: <Receipt />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Средний чек',
      value: formatNumber(stats.averageCheck || 0),
      suffix: 'сум',
      change: '+3.1%',
      changeType: 'positive' as const,
      icon: <CreditCard />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const secondaryMetrics = [
    {
      label: 'Всего товаров',
      value: stats.totalProducts,
      icon: <Package />,
      color: 'text-gray-600',
    },
    {
      label: 'Низкий остаток',
      value: stats.lowStock,
      icon: <AlertTriangle />,
      color: 'text-yellow-600',
    },
    {
      label: 'Нет в наличии',
      value: stats.outOfStock,
      icon: <AlertTriangle />,
      color: 'text-red-600',
    },
    {
      label: 'Клиентов',
      value: stats.customersCount || 0,
      icon: <Users />,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
              <p className="text-sm text-gray-600 mt-1">Обзор вашего бизнеса</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <div className="inline-flex bg-white border-2 border-gray-200 rounded-lg p-1">
                {(['today', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`
                      px-4 py-2 text-sm font-semibold rounded-md transition-all
                      ${period === p 
                        ? 'bg-red-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="md"
                icon={<RefreshCw className={loading ? 'animate-spin' : ''} />}
                onClick={fetchStats}
                disabled={loading}
              >
                Обновить
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          /* Loading Skeletons */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="skeleton h-12 w-12 rounded-lg mb-4" />
                  <div className="skeleton h-4 w-24 mb-2" />
                  <div className="skeleton h-8 w-32" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mainMetrics.map((metric, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                      <span className={`w-6 h-6 ${metric.color}`}>{metric.icon}</span>
                    </div>
                    {metric.change && (
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full
                        ${metric.changeType === 'positive' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                        }
                      `}>
                        {metric.changeType === 'positive' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {metric.change}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {metric.value}
                    {metric.suffix && <span className="text-sm font-normal text-gray-500 ml-1">{metric.suffix}</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">График продаж</h3>
                    <p className="text-sm text-gray-600">Динамика за выбранный период</p>
                  </div>
                </div>
                <div className="h-80">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#737373" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#737373" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e5e5', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                          formatter={(value: number) => [`${formatNumber(value)} сум`, 'Продажи']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#dc2626" 
                          strokeWidth={2} 
                          fill="url(#colorSales)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Нет данных для отображения</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Состояние склада</h3>
                <div className="space-y-4">
                  {secondaryMetrics.map((metric, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                          <span className={`w-5 h-5 ${metric.color}`}>{metric.icon}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alerts */}
              {(stats.lowStock > 0 || stats.outOfStock > 0) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-yellow-900 mb-2">Требуется внимание</h4>
                      <ul className="space-y-1 text-sm text-yellow-800">
                        {stats.lowStock > 0 && (
                          <li>• {stats.lowStock} товаров с низким остатком</li>
                        )}
                        {stats.outOfStock > 0 && (
                          <li>• {stats.outOfStock} товаров нет в наличии</li>
                        )}
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => window.location.href = '/admin/products'}
                      >
                        Перейти к товарам
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Peak Hour */}
              {stats.peakHour && (
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-blue-900 mb-1">Пиковое время</h4>
                      <p className="text-sm text-blue-800">
                        Наибольшая активность: <strong>{stats.peakHour}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
