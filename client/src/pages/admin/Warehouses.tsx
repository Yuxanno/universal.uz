import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Plus, Warehouse as WarehouseIcon, X, Package, Edit, Trash2 } from 'lucide-react';
import { Warehouse } from '../../types';
import api from '../../utils/api';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', address: '' });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await api.put(`/warehouses/${editingWarehouse._id}`, formData);
      } else {
        await api.post('/warehouses', formData);
      }
      fetchWarehouses();
      closeModal();
    } catch (err) {
      console.error('Error saving warehouse:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Omborni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/warehouses/${id}`);
      fetchWarehouses();
    } catch (err) {
      console.error('Error deleting warehouse:', err);
    }
  };

  const openEditModal = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({ name: warehouse.name, address: warehouse.address || '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWarehouse(null);
    setFormData({ name: '', address: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Omborlar" 
        showSearch
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yangi ombor
          </button>
        }
      />

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <WarehouseIcon className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Omborlar yo'q</h3>
            <p className="text-sm mb-6">Hozircha omborlar mavjud emas</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Birinchi omborni qo'shing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {warehouses.map(warehouse => (
              <div key={warehouse._id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                      <WarehouseIcon className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                      <p className="text-sm text-gray-500">{warehouse.address || 'Manzil ko\'rsatilmagan'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(warehouse)} className="text-gray-400 hover:text-primary-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(warehouse._id)} className="text-gray-400 hover:text-primary-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Package className="w-4 h-4" />
                  <span>{(warehouse as any).productCount || 0} ta tovar</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingWarehouse ? 'Omborni tahrirlash' : 'Yangi ombor qo\'shish'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Ombor nomi</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Masalan: Asosiy ombor"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Manzil</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Manzilni kiriting"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
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
    </div>
  );
}
