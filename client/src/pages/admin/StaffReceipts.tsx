import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Receipt, Check, X, Clock, User } from 'lucide-react';
import api from '../../utils/api';

interface StaffReceipt {
  _id: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  createdBy: { name: string };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function StaffReceipts() {
  const [receipts, setReceipts] = useState<StaffReceipt[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await api.get('/receipts/staff');
      setReceipts(res.data);
    } catch (err) {
      console.error('Error fetching receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/receipts/${id}/approve`);
      fetchReceipts();
    } catch (err) {
      console.error('Error approving receipt:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.put(`/receipts/${id}/reject`);
      fetchReceipts();
    } catch (err) {
      console.error('Error rejecting receipt:', err);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-600',
    approved: 'bg-green-100 text-green-600',
    rejected: 'bg-red-100 text-red-600',
  };

  const statusLabels = {
    pending: 'Kutilmoqda',
    approved: 'Tasdiqlangan',
    rejected: 'Rad etilgan',
  };

  const filteredReceipts = receipts.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Xodimlar cheklari" showSearch />

      <div className="p-6 space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === status ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200'
              }`}
            >
              {status === 'all' ? 'Barchasi' : statusLabels[status as keyof typeof statusLabels]}
              {status === 'pending' && receipts.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white rounded-full text-xs">
                  {receipts.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Receipts List */}
        <div className="card">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Receipt className="w-16 h-16 mb-4 opacity-30" />
              <p>Xodimlar cheklari topilmadi</p>
              <p className="text-sm mt-2">Yordamchilar tomonidan yuborilgan cheklar shu yerda ko'rinadi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReceipts.map(receipt => (
                <div key={receipt._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Chek #{receipt._id.slice(-6)}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{receipt.createdBy?.name || 'Noma\'lum'}</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{new Date(receipt.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm ${statusColors[receipt.status]}`}>
                      {statusLabels[receipt.status]}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="bg-white rounded-lg p-3 mb-4 border border-gray-100">
                    {receipt.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1 text-sm text-gray-700">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{(item.price * item.quantity).toLocaleString()} so'm</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 mt-2 pt-2 flex items-center justify-between font-medium text-gray-900">
                      <span>Jami:</span>
                      <span>{receipt.total.toLocaleString()} so'm</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {receipt.status === 'pending' && (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleApprove(receipt._id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-400"
                      >
                        <Check className="w-4 h-4" />
                        Tasdiqlash
                      </button>
                      <button 
                        onClick={() => handleReject(receipt._id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                      >
                        <X className="w-4 h-4" />
                        Rad etish
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
