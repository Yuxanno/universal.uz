import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Search, Plus, Edit2, Trash2, Package, Image as ImageIcon, X } from 'lucide-react';
import api from '../../utils/api';
import { useAlert } from '../../hooks/useAlert';
import { useDebounce } from '../../hooks/useDebounce';
import { Product } from '../../types';
import { IMAGE_BASE_URL } from '../../config/env';

// Memoized Product Card Component
const ProductCard = memo(({ 
  product, 
  onEdit, 
  onDelete 
}: { 
  product: Product; 
  onEdit: (product: Product) => void; 
  onDelete: (id: string) => void;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
    {/* Image */}
    <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
      {(product as any).image ? (
        <img
          src={`http://localhost:5000${(product as any).image}`}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <Package className="w-16 h-16 text-gray-400" />
      )}
    </div>

    {/* Content */}
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">{product.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Kod: {product.code}</p>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400">Narx</p>
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {product.price.toLocaleString()} so'm
          </p>
        </div>
        {(product as any).costPrice && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Tan narx</p>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {((product as any).costPrice || 0).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          <Edit2 className="w-4 h-4" />
          Tahrirlash
        </button>
        <button
          onClick={() => onDelete(product._id)}
          className="px-3 py-2 bg-danger-100 dark:bg-danger-900/30 text-danger-600 rounded-lg hover:bg-danger-200 dark:hover:bg-danger-900/50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
));

ProductCard.displayName = 'ProductCard';

export default function CashierProducts() {
  const { showAlert, AlertComponent } = useAlert();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    price: '',
    costPrice: '',
    image: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string>('');

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products?warehouse=Asosiy ombor');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      showAlert('Mahsulotlarni yuklashda xatolik', 'Xatolik', 'danger');
    }
  }, [showAlert]);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchQuery) return products;
    const query = debouncedSearchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query)
    );
  }, [products, debouncedSearchQuery]);

  const openAddModal = useCallback(() => {
    setEditingProduct(null);
    setFormData({ name: '', code: '', price: '', costPrice: '', image: null });
    setImagePreview('');
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      price: product.price.toString(),
      costPrice: ((product as any).costPrice || 0).toString(),
      image: null
    });
    setImagePreview((product as any).image || '');
    setShowModal(true);
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('code', formData.code);
      data.append('price', formData.price);
      data.append('costPrice', formData.costPrice);
      data.append('warehouse', 'Asosiy ombor');
      data.append('quantity', '0');
      
      if (formData.image) {
        data.append('image', formData.image);
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showAlert('Mahsulot yangilandi', 'Muvaffaqiyat', 'success');
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showAlert('Mahsulot qo\'shildi', 'Muvaffaqiyat', 'success');
      }
      
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
    }
  }, [formData, editingProduct, showAlert, fetchProducts]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Mahsulotni o\'chirmoqchimisiz?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      showAlert('Mahsulot o\'chirildi', 'Muvaffaqiyat', 'success');
      fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
    }
  }, [showAlert, fetchProducts]);

  const closeModal = useCallback(() => setShowModal(false), []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">Mahsulotlar</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Qo'shish</span>
        </button>
      </header>

      {/* Content */}
      <div className="p-4 lg:p-6">
        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Mahsulot nomi yoki kodi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Mahsulot topilmadi' : 'Mahsulotlar yo\'q'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rasm
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center text-sm font-medium">
                      Rasm tanlash
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nomi *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:text-gray-100"
                  required
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kod *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:text-gray-100"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sotish narxi *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:text-gray-100"
                  required
                />
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tan narxi
                </label>
                <input
                  type="number"
                  value={formData.costPrice}
                  onChange={e => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:text-gray-100"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  {editingProduct ? 'Saqlash' : 'Qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {AlertComponent}
    </div>
  );
}
