import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Plus, UserPlus, X, Shield, ShoppingCart, Trash2 } from 'lucide-react';
import { User } from '../../types';
import api from '../../utils/api';

export default function Helpers() {
  const [helpers, setHelpers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'helper' as 'cashier' | 'helper'
  });

  useEffect(() => {
    fetchHelpers();
  }, []);

  const fetchHelpers = async () => {
    try {
      const res = await api.get('/users/helpers');
      setHelpers(res.data);
    } catch (err) {
      console.error('Error fetching helpers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      fetchHelpers();
      closeModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yordamchini o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchHelpers();
    } catch (err) {
      console.error('Error deleting helper:', err);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: '', email: '', password: '', role: 'helper' });
  };

  const roleColors = {
    cashier: 'bg-green-100 text-green-600',
    helper: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Yordamchilar" 
        showSearch
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yangi yordamchi
          </button>
        }
      />

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : helpers.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <UserPlus className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Yordamchilar yo'q</h3>
            <p className="text-sm mb-6">Hozircha yordamchilar mavjud emas</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Birinchi yordamchini qo'shing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {helpers.map(helper => (
              <div key={helper._id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-lg font-bold text-white">
                    {helper.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{helper.name}</h3>
                    <p className="text-sm text-gray-500">{helper.email}</p>
                  </div>
                  <button onClick={() => handleDelete(helper._id)} className="text-gray-400 hover:text-primary-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${roleColors[helper.role as keyof typeof roleColors]}`}>
                  {helper.role === 'cashier' ? (
                    <><ShoppingCart className="w-3 h-3" /> Kassir</>
                  ) : (
                    <><Shield className="w-3 h-3" /> Yordamchi</>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Helper Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Yangi yordamchi qo'shish</h3>
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
                  placeholder="Yordamchi ismi"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Email</label>
                <input 
                  type="email" 
                  className="input w-full" 
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Parol</label>
                <input 
                  type="password" 
                  className="input w-full" 
                  placeholder="Parol"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'cashier'})}
                    className={`p-4 rounded-xl border-2 transition-colors ${
                      formData.role === 'cashier' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ShoppingCart className={`w-6 h-6 mx-auto mb-2 ${formData.role === 'cashier' ? 'text-green-500' : 'text-gray-400'}`} />
                    <p className="font-medium text-gray-900">Kassir</p>
                    <p className="text-xs text-gray-500">Kassa, qarzlar, cheklar</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'helper'})}
                    className={`p-4 rounded-xl border-2 transition-colors ${
                      formData.role === 'helper' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Shield className={`w-6 h-6 mx-auto mb-2 ${formData.role === 'helper' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="font-medium text-gray-900">Yordamchi</p>
                    <p className="text-xs text-gray-500">QR skaner, qidirish</p>
                  </button>
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
