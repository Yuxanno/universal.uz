import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { Plus, Users, X, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import { Customer } from '../../types';
import api from '../../utils/api';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Mijozni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) { console.error(err); }
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
    searchQuery.trim() === '' ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
      <Header
        title="Mijozlar"
        showSearch
        onSearch={setSearchQuery}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Yangi mijoz</span>
          </button>
        }
      />

      <div className="p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner text-brand-600 w-8 h-8" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="card flex flex-col items-center py-16">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 mb-2">Mijozlar yo'q</h3>
            <p className="text-surface-500 mb-6">Birinchi mijozni qo'shing</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Mijoz qo'shish
            </button>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="table-header">
                <div className="grid grid-cols-12 gap-4 px-6 py-4">
                  <span className="table-header-cell col-span-3">Ism</span>
                  <span className="table-header-cell col-span-2">Telefon</span>
                  <span className="table-header-cell col-span-2">Email</span>
                  <span className="table-header-cell col-span-2">Xaridlar</span>
                  <span className="table-header-cell col-span-2">Qarz</span>
                  <span className="table-header-cell col-span-1 text-center">Amallar</span>
                </div>
              </div>
              <div className="divide-y divide-surface-100">
                {filteredCustomers.map(customer => (
                  <div key={customer._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-50 transition-colors">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                        <span className="font-semibold text-brand-600">{customer.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-surface-900">{customer.name}</span>
                    </div>
                    <div className="col-span-2 text-surface-600">{customer.phone}</div>
                    <div className="col-span-2 text-surface-600">{customer.email || '-'}</div>
                    <div className="col-span-2 font-medium text-surface-900">
                      {customer.totalPurchases?.toLocaleString() || 0} so'm
                    </div>
                    <div className="col-span-2">
                      <span className={customer.debt > 0 ? 'text-danger-600 font-medium' : 'text-success-600'}>
                        {customer.debt.toLocaleString()} so'm
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(customer)} className="btn-icon-sm hover:bg-brand-100 hover:text-brand-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(customer._id)} className="btn-icon-sm hover:bg-danger-100 hover:text-danger-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-surface-100">
              {filteredCustomers.map(customer => (
                <div key={customer._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="font-semibold text-brand-600 text-lg">{customer.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-surface-900">{customer.name}</h4>
                          <p className="text-sm text-surface-500">{customer.phone}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEditModal(customer)} className="btn-icon-sm">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(customer._id)} className="btn-icon-sm text-danger-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface-50 rounded-xl p-3">
                          <p className="text-xs text-surface-500 mb-1">Xaridlar</p>
                          <p className="font-semibold text-surface-900">{customer.totalPurchases?.toLocaleString() || 0}</p>
                        </div>
                        <div className={`rounded-xl p-3 ${customer.debt > 0 ? 'bg-danger-50' : 'bg-success-50'}`}>
                          <p className="text-xs text-surface-500 mb-1">Qarz</p>
                          <p className={`font-semibold ${customer.debt > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                            {customer.debt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="overlay" onClick={closeModal} />
          <div className="modal w-full max-w-md p-6 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-surface-900">
                {editingCustomer ? 'Mijozni tahrirlash' : 'Yangi mijoz'}
              </h3>
              <button onClick={closeModal} className="btn-icon-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">Ism</label>
                <input className="input" placeholder="Mijoz ismi" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input className="input pl-12" placeholder="+998 90 123 45 67" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input className="input pl-12" placeholder="email@example.com" value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">Manzil</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input className="input pl-12" placeholder="Manzil" value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Bekor qilish</button>
                <button type="submit" className="btn-primary flex-1">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
