import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Plus, UserPlus, X, Shield, ShoppingCart, Trash2, Phone, Lock, User } from 'lucide-react';
import { User as UserType } from '../../types';
import api from '../../utils/api';

// Format phone number as +998 (XX) XXX-XX-XX
const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  
  let phone = digits;
  if (!phone.startsWith('998') && phone.length > 0) {
    phone = '998' + phone;
  }
  
  phone = phone.slice(0, 12);
  
  if (phone.length === 0) return '';
  if (phone.length <= 3) return '+' + phone;
  if (phone.length <= 5) return '+998 (' + phone.slice(3);
  if (phone.length <= 8) return '+998 (' + phone.slice(3, 5) + ') ' + phone.slice(5);
  if (phone.length <= 10) return '+998 (' + phone.slice(3, 5) + ') ' + phone.slice(5, 8) + '-' + phone.slice(8);
  return '+998 (' + phone.slice(3, 5) + ') ' + phone.slice(5, 8) + '-' + phone.slice(8, 10) + '-' + phone.slice(10);
};

const getRawPhone = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};

const displayPhone = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 12) return phone;
  return '+998 (' + digits.slice(3, 5) + ') ' + digits.slice(5, 8) + '-' + digits.slice(8, 10) + '-' + digits.slice(10);
};

export default function Helpers() {
  const [helpers, setHelpers] = useState<UserType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '', phone: '', password: '', role: 'helper' as 'cashier' | 'helper'
  });

  useEffect(() => { fetchHelpers(); }, []);

  const fetchHelpers = async () => {
    try {
      const res = await api.get('/users/helpers');
      setHelpers(res.data);
    } catch (err) { console.error('Error fetching helpers:', err); }
    finally { setLoading(false); }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({...formData, phone: formatted});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        ...formData,
        phone: getRawPhone(formData.phone)
      });
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
    } catch (err) { console.error('Error deleting helper:', err); }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: '', phone: '', password: '', role: 'helper' });
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
      <Header 
        title="Yordamchilar"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Yangi yordamchi</span>
          </button>
        }
      />

      <div className="p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner text-brand-600 w-8 h-8" />
          </div>
        ) : helpers.length === 0 ? (
          <div className="card flex flex-col items-center py-16">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 mb-2">Yordamchilar yo'q</h3>
            <p className="text-surface-500 mb-6">Birinchi yordamchini qo'shing</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Yordamchi qo'shish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {helpers.map(helper => (
              <div key={helper._id} className="card-hover">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {helper.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-surface-900 truncate">{helper.name}</h3>
                    <p className="text-sm text-surface-500 truncate">{displayPhone(helper.phone)}</p>
                  </div>
                  <button onClick={() => handleDelete(helper._id)} className="btn-icon-sm hover:bg-danger-100 hover:text-danger-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className={`badge ${helper.role === 'cashier' ? 'badge-success' : 'badge-primary'}`}>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="overlay" onClick={closeModal} />
          <div className="modal w-full max-w-md p-6 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-surface-900">Yangi yordamchi</h3>
              <button onClick={closeModal} className="btn-icon-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">Ism</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="text" className="input pl-12" placeholder="Yordamchi ismi" value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">Telefon raqam</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="tel" className="input pl-12" placeholder="+998 (XX) XXX-XX-XX" value={formData.phone}
                    onChange={handlePhoneChange} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">Parol</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="password" className="input pl-12" placeholder="Parol" value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-3 block">Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'cashier'})}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.role === 'cashier' 
                        ? 'border-success-500 bg-success-50' 
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <ShoppingCart className={`w-6 h-6 mx-auto mb-2 ${formData.role === 'cashier' ? 'text-success-600' : 'text-surface-400'}`} />
                    <p className="font-medium text-surface-900">Kassir</p>
                    <p className="text-xs text-surface-500">Kassa, qarzlar</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'helper'})}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.role === 'helper' 
                        ? 'border-brand-500 bg-brand-50' 
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <Shield className={`w-6 h-6 mx-auto mb-2 ${formData.role === 'helper' ? 'text-brand-600' : 'text-surface-400'}`} />
                    <p className="font-medium text-surface-900">Yordamchi</p>
                    <p className="text-xs text-surface-500">QR skaner</p>
                  </button>
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
