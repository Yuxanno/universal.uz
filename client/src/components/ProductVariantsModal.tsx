import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import api from '../utils/api';
import { useAlert } from '../hooks/useAlert';

interface ProductVariantsModalProps {
  product: Product;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProductVariantsModal({ product, onClose, onUpdate }: ProductVariantsModalProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ProductVariant>>({
    name: '',
    description: '',
    price: undefined,
    code: '',
    quantity: 0,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      showAlert('Tur nomini kiriting', 'error');
      return;
    }

    setLoading(true);
    try {
      let updatedVariants: ProductVariant[];
      
      if (editingId) {
        // Update existing variant
        updatedVariants = variants.map(v => 
          v._id === editingId ? { ...v, ...formData } : v
        );
      } else {
        // Add new variant
        const newVariant: ProductVariant = {
          name: formData.name!,
          description: formData.description,
          price: undefined,
          code: undefined,
          quantity: 0,
          isActive: formData.isActive !== false
        };
        updatedVariants = [...variants, newVariant];
      }

      // Update product with new variants
      await api.put(`/products/${product._id}`, {
        variants: updatedVariants
      });

      setVariants(updatedVariants);
      showAlert(editingId ? 'Tur yangilandi' : 'Tur qo\'shildi', 'success');
      resetForm();
      
      // Clear cache to force fresh data load
      sessionStorage.removeItem('products_cache');
      sessionStorage.removeItem('products_cache_time');
      console.log('🗑️ [Variants] Cache cleared after variant update');
      
      onUpdate();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setFormData(variant);
    setEditingId(variant._id || null);
    setIsAdding(true);
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Ushbu turni o\'chirmoqchimisiz?')) return;

    setLoading(true);
    try {
      const updatedVariants = variants.filter(v => v._id !== variantId);
      
      await api.put(`/products/${product._id}`, {
        variants: updatedVariants
      });

      setVariants(updatedVariants);
      showAlert('Tur o\'chirildi', 'success');
      
      // Clear cache to force fresh data load
      sessionStorage.removeItem('products_cache');
      sessionStorage.removeItem('products_cache_time');
      console.log('🗑️ [Variants] Cache cleared after variant delete');
      
      onUpdate();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {product.name}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Mahsulot turlari (xillari)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Yangi tur</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add/Edit Form */}
          {isAdding ? (
            <form onSubmit={handleSubmit} className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {editingId ? 'Turni tahrirlash' : 'Yangi tur qo\'shish'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Tur nomi *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500"
                    placeholder="Masalan: Katta, Kichik, O'rtacha"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Izoh (ixtiyoriy)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Qo'shimcha ma'lumot"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          ) : null}

          {/* Variants List */}
          {variants.length > 0 ? (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={variant._id || index}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden"
                >
                  {/* Variant Header - Clickable */}
                  <div
                    className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => setExpandedVariantId(expandedVariantId === variant._id ? null : variant._id || null)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                            {variant.name}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            variant.isActive 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {variant.isActive ? 'Faol' : 'Nofaol'}
                          </span>
                        </div>
                        
                        {/* Izoh - faqat hover da ko'rinadi */}
                        {variant.description && (
                          <div className="relative group mt-1">
                            <p className="text-xs text-primary-600 dark:text-primary-400 cursor-help inline-flex items-center gap-1">
                              💬 Izoh mavjud
                            </p>
                            <div className="absolute left-0 top-full mt-2 w-72 max-w-sm p-3 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 text-sm rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                              <div className="font-medium text-xs text-neutral-500 dark:text-neutral-400 mb-1">Izoh:</div>
                              <div className="text-sm leading-relaxed">{variant.description}</div>
                              <div className="absolute -top-2 left-4 w-4 h-4 bg-white dark:bg-neutral-800 border-l-2 border-t-2 border-neutral-200 dark:border-neutral-600 transform rotate-45"></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(variant)}
                          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        </button>
                        <button
                          onClick={() => variant._id && handleDelete(variant._id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedVariantId === variant._id && (
                    <div className="px-4 pb-4 border-t border-neutral-200 dark:border-neutral-700 pt-3 bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="space-y-3">
                        {/* Mahsulot ma'lumotlari */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Mahsulot nomi</p>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</p>
                          </div>
                          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Mahsulot kodi</p>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{product.code}</p>
                          </div>
                        </div>

                        {/* Narxlar */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Tan narxi</p>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {(product.costPrice || 0).toLocaleString()} so'm
                            </p>
                          </div>
                          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Optom narxi</p>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {product.price.toLocaleString()} so'm
                            </p>
                          </div>
                          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Dona narxi</p>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {(product.dona_narx || 0).toLocaleString()} so'm
                            </p>
                          </div>
                        </div>

                        {/* Miqdor va ombor */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Miqdor</p>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {product.quantity} dona
                            </p>
                          </div>
                          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Ombor</p>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {product._warehouseName || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Tur izohi */}
                        {variant.description && (
                          <div className="bg-white dark:bg-neutral-900 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Tur izohi</p>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300">
                              {variant.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500 dark:text-neutral-400">
                Hozircha turlar yo'q. Yangi tur qo'shing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
