import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Plus, Package, X, Camera, Edit, Trash2 } from 'lucide-react';
import { Product, Warehouse } from '../../types';
import api from '../../utils/api';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    price: '',
    quantity: '',
    warehouse: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity)
      };
      
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, data);
      } else {
        await api.post('/products', data);
      }
      
      fetchProducts();
      closeModal();
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tovarni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      price: String(product.price),
      quantity: String(product.quantity),
      warehouse: product.warehouse || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ code: '', name: '', price: '', quantity: '', warehouse: '' });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Tovarlar" 
        showSearch 
        onSearch={setSearchQuery}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yangi tovar
          </button>
        }
      />

      <div className="p-6">
        <div className="card">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Package className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tovarlar yo'q</h3>
              <p className="text-sm mb-6">Tovarlar yo'q</p>
              <button onClick={() => setShowModal(true)} className="btn-primary">
                Birinchi tovarni qo'shing
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500 text-sm">
                    <th className="pb-3">Kod</th>
                    <th className="pb-3">Nomi</th>
                    <th className="pb-3">Narxi</th>
                    <th className="pb-3">Miqdori</th>
                    <th className="pb-3">Ombor</th>
                    <th className="pb-3">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product._id} className="border-b border-gray-100 text-gray-900">
                      <td className="py-3 font-mono text-sm">{product.code}</td>
                      <td className="py-3">{product.name}</td>
                      <td className="py-3">{product.price.toLocaleString()} so'm</td>
                      <td className="py-3">
                        <span className={product.quantity <= 5 ? 'text-primary-500 font-medium' : ''}>
                          {product.quantity}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">
                        {warehouses.find(w => w._id === product.warehouse)?.name || '-'}
                      </td>
                      <td className="py-3">
                        <button onClick={() => openEditModal(product)} className="text-primary-500 hover:text-primary-600 mr-3">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="text-primary-500 hover:text-primary-600">
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
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? 'Tovarni tahrirlash' : 'Yangi tovar qo\'shish'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Tovar kodi</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Masalan: 001"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Tovar nomi</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Tovar nomini kiriting"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Narxi</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Miqdori</label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="0"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Ombor</label>
                <select 
                  className="input w-full"
                  value={formData.warehouse}
                  onChange={e => setFormData({...formData, warehouse: e.target.value})}
                >
                  <option value="">Omborni tanlang</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                  Bekor qilish
                </button>
                <button type="submit" className="btn-primary">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 text-white">
        <Camera className="w-6 h-6" />
      </button>
    </div>
  );
}
