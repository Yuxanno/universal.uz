import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Plus, Users, X, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import { Customer } from '../../types';
import api from '../../utils/api';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      fetchCustomers();
      closeModal();
    } catch (err) {
      console.error('Error saving customer:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Mijozni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Mijozlar" 
        showSearch
        onSearch={setSearchQuery}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yangi mijoz
          </button>
        }
      />

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Mijozlar yo'q</h3>
            <p className="text-sm mb-6">Hozircha mijozlar mavjud emas</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Birinchi mijozni qo'shing
            </button>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 text-sm">
                  <th className="pb-3">Ism</th>
                  <th className="pb-3">Telefon</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Xaridlar</th>
                  <th className="pb-3">Qarz</th>
                  <th className="pb-3">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer._id} className="border-b border-gray-100 text-gray-900">
                    <td className="py-3 font-medium">{customer.name}</td>
                    <td className="py-3">{customer.phone}</td>
                    <td className="py-3 text-gray-500">{customer.email || '-'}</td>
                    <td className="py-3">{customer.totalPurchases.toLocaleString()} so'm</td>
                    <td className="py-3">
                      <span className={customer.debt > 0 ? 'text-primary-500 font-medium' : 'text-green-600'}>
                        {customer.debt.toLocaleString()} so'm
                      </span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => openEditModal(customer)} className="text-primary-500 hover:text-primary-600 mr-3">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(customer._id)} className="text-primary-500 hover:text-primary-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCustomer ? 'Mijozni tahrirlash' : 'Yangi mijoz qo\'shish'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Ism</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Mijoz ismi"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" 
                    className="input w-full pl-10" 
                    placeholder="+998 90 123 45 67"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Email (ixtiyoriy)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    className="input w-full pl-10" 
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Manzil (ixtiyoriy)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    className="input w-full pl-10" 
                    placeholder="Manzil"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
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
    </div>
  );
}
