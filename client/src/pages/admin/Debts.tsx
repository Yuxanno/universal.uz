import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Plus, AlertTriangle, X, DollarSign } from 'lucide-react';
import { Debt, Customer } from '../../types';
import api from '../../utils/api';

export default function Debts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState({
    total: 0, pending: 0, today: 0, overdue: 0, paid: 0, blacklist: 0, totalAmount: 0
  });
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ customer: '', amount: '', dueDate: '' });
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchDebts();
    fetchCustomers();
    fetchStats();
  }, []);

  const fetchDebts = async () => {
    try {
      const res = await api.get('/debts');
      setDebts(res.data);
    } catch (err) {
      console.error('Error fetching debts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/debts/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/debts', {
        customer: formData.customer,
        amount: Number(formData.amount),
        dueDate: formData.dueDate
      });
      fetchDebts();
      fetchStats();
      closeModal();
    } catch (err) {
      console.error('Error creating debt:', err);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    try {
      await api.post(`/debts/${selectedDebt._id}/payment`, {
        amount: Number(paymentAmount),
        method: 'cash'
      });
      fetchDebts();
      fetchStats();
      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentAmount('');
    } catch (err) {
      console.error('Error making payment:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Qarzni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/debts/${id}`);
      fetchDebts();
      fetchStats();
    } catch (err) {
      console.error('Error deleting debt:', err);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ customer: '', amount: '', dueDate: '' });
  };

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowPaymentModal(true);
  };

  const statItems = [
    { label: 'Jami', value: stats.total, color: 'bg-gray-100 border border-gray-200' },
    { label: 'Kutilmoqda', value: stats.pending, color: 'bg-yellow-50 border border-yellow-200' },
    { label: 'Bugun', value: stats.today, color: 'bg-gray-50 border border-gray-200' },
    { label: "Muddati o'tgan", value: stats.overdue, color: 'bg-red-50 border border-red-200' },
    { label: "To'langan", value: stats.paid, color: 'bg-green-50 border border-green-200' },
    { label: "Qora ro'yxat", value: stats.blacklist, color: 'bg-gray-50 border border-gray-200' },
    { label: 'Jami summa', value: stats.totalAmount.toLocaleString(), color: 'bg-primary-500 text-white' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Qarz daftarcha" 
        showSearch
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Qo'shish
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-7 gap-4">
          {statItems.map((stat, i) => (
            <div key={i} className={`${stat.color} rounded-xl p-4`}>
              <p className={`text-sm mb-1 ${stat.color.includes('primary') ? 'text-white/80' : 'text-gray-500'}`}>{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color.includes('primary') ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Debts List */}
        <div className="card">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : debts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <AlertTriangle className="w-16 h-16 mb-4 opacity-30" />
              <p>Qarzlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500 text-sm">
                    <th className="pb-3">Mijoz</th>
                    <th className="pb-3">Qarz summasi</th>
                    <th className="pb-3">To'langan</th>
                    <th className="pb-3">Qoldiq</th>
                    <th className="pb-3">Muddat</th>
                    <th className="pb-3">Holat</th>
                    <th className="pb-3">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map(debt => (
                    <tr key={debt._id} className="border-b border-gray-100 text-gray-900">
                      <td className="py-3 font-medium">{debt.customer?.name || 'Noma\'lum'}</td>
                      <td className="py-3">{debt.amount.toLocaleString()} so'm</td>
                      <td className="py-3 text-green-600">{debt.paidAmount.toLocaleString()} so'm</td>
                      <td className="py-3 text-primary-500 font-medium">{(debt.amount - debt.paidAmount).toLocaleString()} so'm</td>
                      <td className="py-3">{new Date(debt.dueDate).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          debt.status === 'paid' ? 'bg-green-100 text-green-600' :
                          debt.status === 'overdue' ? 'bg-red-100 text-red-600' :
                          debt.status === 'blacklist' ? 'bg-gray-100 text-gray-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {debt.status === 'paid' ? "To'langan" :
                           debt.status === 'overdue' ? "Muddati o'tgan" :
                           debt.status === 'blacklist' ? "Qora ro'yxat" : 'Kutilmoqda'}
                        </span>
                      </td>
                      <td className="py-3">
                        {debt.status !== 'paid' && (
                          <button onClick={() => openPaymentModal(debt)} className="text-green-600 hover:text-green-700 mr-3">
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(debt._id)} className="text-primary-500 hover:text-primary-600">
                          O'chirish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Debt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Yangi qarz qo'shish</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Mijoz</label>
                <select 
                  className="input w-full"
                  value={formData.customer}
                  onChange={e => setFormData({...formData, customer: e.target.value})}
                  required
                >
                  <option value="">Mijozni tanlang</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Qarz summasi</label>
                <input 
                  type="number" 
                  className="input w-full" 
                  placeholder="0"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">To'lov muddati</label>
                <input 
                  type="date" 
                  className="input w-full"
                  value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                  Bekor qilish
                </button>
                <button type="submit" className="btn-primary">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">To'lov qilish</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">Qoldiq summa</p>
              <p className="text-2xl font-bold text-primary-500">
                {(selectedDebt.amount - selectedDebt.paidAmount).toLocaleString()} so'm
              </p>
            </div>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">To'lov summasi</label>
                <input 
                  type="number" 
                  className="input w-full" 
                  placeholder="0"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  max={selectedDebt.amount - selectedDebt.paidAmount}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                  Bekor qilish
                </button>
                <button type="submit" className="btn-primary">To'lash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
