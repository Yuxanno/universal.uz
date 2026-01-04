import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { 
  Receipt, Check, X, Clock, User, CheckCircle2, XCircle, Package, FileText
} from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReceipts(); }, []);

  const fetchReceipts = async () => {
    try {
      const res = await api.get('/receipts/staff');
      setReceipts(res.data);
    } catch (err) { console.error('Error fetching receipts:', err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/receipts/${id}/approve`);
      fetchReceipts();
    } catch (err) { console.error('Error approving receipt:', err); }
  };

  const handleReject = async (id: string) => {
    try {
      await api.put(`/receipts/${id}/reject`);
      fetchReceipts();
    } catch (err) { console.error('Error rejecting receipt:', err); }
  };

  const statusConfig = {
    pending: { color: 'warning', label: 'Kutilmoqda', icon: Clock },
    approved: { color: 'success', label: 'Tasdiqlangan', icon: CheckCircle2 },
    rejected: { color: 'danger', label: 'Rad etilgan', icon: XCircle },
  };

  const filteredReceipts = receipts.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r._id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
      <Header 
        title="Xodimlar cheklari"
        showSearch
        onSearch={setSearchQuery}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Filters */}
        <div className="card">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Barchasi', icon: FileText },
              { key: 'pending', label: 'Kutilmoqda', icon: Clock },
              { key: 'approved', label: 'Tasdiqlangan', icon: CheckCircle2 },
              { key: 'rejected', label: 'Rad etilgan', icon: XCircle }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`btn-sm ${filter === item.key ? 'btn-primary' : 'btn-secondary'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.key === 'pending' && receipts.filter(r => r.status === 'pending').length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    filter === item.key ? 'bg-white/20' : 'bg-warning-100 text-warning-700'
                  }`}>
                    {receipts.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Receipts List */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner text-brand-600 w-8 h-8" />
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">Cheklar topilmadi</h3>
              <p className="text-surface-500">Hozircha cheklar yo'q</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-100">
              {filteredReceipts.map(receipt => {
                const config = statusConfig[receipt.status];
                const StatusIcon = config.icon;
                return (
                  <div key={receipt._id} className="p-4 lg:p-6 hover:bg-surface-50 transition-colors">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-6 h-6 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-surface-900">Chek #{receipt._id.slice(-6)}</h4>
                            <div className="flex items-center gap-3 text-sm text-surface-500 mt-1">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{receipt.createdBy?.name || 'Noma\'lum'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(receipt.createdAt).toLocaleString('uz-UZ')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-xl font-bold text-surface-900">{receipt.total.toLocaleString()} <span className="text-sm font-normal text-surface-500">so'm</span></p>
                            <span className={`badge badge-${config.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {config.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-surface-50 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-surface-700">
                        <Package className="w-4 h-4" />
                        Mahsulotlar ({receipt.items.length} ta)
                      </div>
                      <div className="space-y-2">
                        {receipt.items.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-surface-900">{item.name}</span>
                              <span className="text-surface-500">× {item.quantity}</span>
                            </div>
                            <span className="font-semibold text-surface-900">{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        {receipt.items.length > 3 && (
                          <p className="text-sm text-surface-500 text-center py-2">
                            +{receipt.items.length - 3} ta mahsulot
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {receipt.status === 'pending' && (
                      <div className="flex gap-3">
                        <button onClick={() => handleApprove(receipt._id)} className="btn-success flex-1">
                          <Check className="w-4 h-4" />
                          Tasdiqlash
                        </button>
                        <button onClick={() => handleReject(receipt._id)} className="btn-danger flex-1">
                          <X className="w-4 h-4" />
                          Rad etish
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
