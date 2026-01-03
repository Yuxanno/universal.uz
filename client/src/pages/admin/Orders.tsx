import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { ShoppingBag, Package } from 'lucide-react';
import { Order } from '../../types';
import api from '../../utils/api';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      fetchOrders();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-600',
    processing: 'bg-yellow-100 text-yellow-600',
    shipped: 'bg-purple-100 text-purple-600',
    delivered: 'bg-green-100 text-green-600',
    cancelled: 'bg-red-100 text-red-600',
  };

  const statusLabels = {
    new: 'Yangi',
    processing: 'Jarayonda',
    shipped: "Yo'lda",
    delivered: 'Yetkazildi',
    cancelled: 'Bekor qilindi',
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Buyurtmalar" showSearch />

      <div className="p-6 space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'new', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === status ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200'
              }`}
            >
              {status === 'all' ? 'Barchasi' : statusLabels[status as keyof typeof statusLabels]}
              {status !== 'all' && orders.filter(o => o.status === status).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {orders.filter(o => o.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="card">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
              <p>Buyurtmalar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div key={order._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Buyurtma #{order._id.slice(-6)}</p>
                        <p className="text-sm text-gray-500">{order.customer?.name || 'Noma\'lum mijoz'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order._id, e.target.value)}
                        className={`px-3 py-1 rounded-lg text-sm border-0 ${statusColors[order.status]}`}
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{order.items.length} ta mahsulot</span>
                    <span className="font-medium text-gray-900">{order.total.toLocaleString()} so'm</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
