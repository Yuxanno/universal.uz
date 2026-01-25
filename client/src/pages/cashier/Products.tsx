import { useState, useMemo, useCallback, memo } from 'react';
import { Search, Plus, Edit2, Trash2, Package, Image as ImageIcon, X, Printer, QrCode } from 'lucide-react';
import api from '../../utils/api';
import { useAlert } from '../../hooks/useAlert';
import { useDebounce } from '../../hooks/useDebounce';
import { useProducts } from '../../context/ProductsContext';
import { Product } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { searchProducts } from '../../utils/productSearch';

// Memoized Product Card Component
const ProductCard = memo(({ 
  product, 
  onEdit, 
  onDelete,
  onQR,
  onPrint
}: { 
  product: Product; 
  onEdit: (product: Product) => void; 
  onDelete: (id: string) => void;
  onQR: (product: Product) => void;
  onPrint: (product: Product) => void;
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
          onClick={() => onQR(product)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
          <QrCode className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPrint(product)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
          <Printer className="w-4 h-4" />
        </button>
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
  const { displayedProducts, loading, refreshProducts } = useProducts();
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
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [printQuantity, setPrintQuantity] = useState('1');
  const [printCodePrefix, setPrintCodePrefix] = useState('');
  const [showPriceOnLabel, setShowPriceOnLabel] = useState(() => {
    const saved = localStorage.getItem('showPriceOnLabel');
    return saved ? JSON.parse(saved) : true;
  });

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized filtered products - limit results
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchQuery) return displayedProducts.slice(0, 100);
    // Используем универсальную функцию поиска с поддержкой латиницы/кириллицы
    return searchProducts(displayedProducts, debouncedSearchQuery).slice(0, 50); // Limit to 50 results
  }, [displayedProducts, debouncedSearchQuery]);

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
      refreshProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
    }
  }, [formData, editingProduct, showAlert, refreshProducts]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Mahsulotni o\'chirmoqchimisiz?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      showAlert('Mahsulot o\'chirildi', 'Muvaffaqiyat', 'success');
      refreshProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
    }
  }, [showAlert, refreshProducts]);

  const closeModal = useCallback(() => setShowModal(false), []);

  const openQRModal = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowQRModal(true);
  }, []);

  const openPrintModal = useCallback((product: Product) => {
    setPrintProduct(product);
    setPrintQuantity('1');
    setPrintCodePrefix('');
    setShowPrintModal(true);
  }, []);

  const handlePrint = useCallback(() => {
    if (!printProduct) return;
    
    const qty = Number(printQuantity) || 1;
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      showAlert('Popup bloklangan. Ruxsat bering.', 'Xatolik', 'danger');
      return;
    }
    
    const qrData = JSON.stringify({ id: printProduct._id, code: printProduct.code, name: printProduct.name });
    const price = printProduct.price;
    
    // Формируем цену с кодом если он введен
    const displayPrice = printCodePrefix.trim() 
      ? `${printCodePrefix.trim()} ${price.toLocaleString()}` 
      : price.toLocaleString();
    
    const labelsHtml = Array(qty).fill(`
      <div class="label">
        ${showPriceOnLabel ? `<div class="price-row"><div class="price">${displayPrice} so'm</div></div>` : ''}
        <div class="content-row">
          <div class="left-section">
            <div class="name">${printProduct.name}</div>
            <div class="code">Kod: ${printProduct.code}</div>
          </div>
          <div class="right-section">
            <div class="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}" alt="QR" />
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    const printHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ценник - ${printProduct.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: 58mm 40mm; margin: 0; }
    @media print {
      body { width: 58mm; }
      .label { page-break-after: always; }
      .label:last-child { page-break-after: auto; }
    }
    body { font-family: Arial, sans-serif; background: white; }
    .label { 
      width: 58mm; 
      height: 40mm; 
      padding: 2mm;
      display: flex; 
      flex-direction: column;
      justify-content: center;
    }
    .price-row {
      width: 100%;
      text-align: center;
      margin-bottom: 2mm;
    }
    .price { 
      font-size: 22pt; 
      font-weight: bold; 
      color: #000;
      line-height: 1;
      white-space: nowrap;
      display: inline-block;
    }
    .content-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2mm;
    }
    .left-section { 
      flex: 0 0 28mm;
      max-width: 28mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .right-section {
      flex: 0 0 24mm;
    }
    .name { 
      font-size: 15pt; 
      font-weight: bold; 
      margin-bottom: 1.5mm; 
      line-height: 1.1;
      color: #000;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .code { 
      font-size: 13pt; 
      color: #333;
      font-weight: 600;
    }
    .qr-container { 
      width: 24mm; 
      height: 24mm; 
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-container img { 
      width: 100%; 
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>
  ${labelsHtml}
  <script>
    window.onload = function() {
      var imgs = document.querySelectorAll('img');
      var loaded = 0;
      imgs.forEach(function(img) {
        if (img.complete) {
          loaded++;
          if (loaded === imgs.length) setTimeout(function() { window.print(); }, 100);
        } else {
          img.onload = function() {
            loaded++;
            if (loaded === imgs.length) setTimeout(function() { window.print(); }, 100);
          };
          img.onerror = function() {
            loaded++;
            if (loaded === imgs.length) setTimeout(function() { window.print(); }, 100);
          };
        }
      });
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;
    
    printWindow.document.write(printHtml);
    printWindow.document.close();
    setShowPrintModal(false);
  }, [printProduct, printQuantity, printCodePrefix, showAlert, showPriceOnLabel]);

  const downloadQR = useCallback(() => {
    if (!selectedProduct) return;
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${selectedProduct.code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [selectedProduct]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">Mahsulotlar</h1>
          {loading && <span className="text-xs text-primary-500">Yuklanmoqda...</span>}
        </div>
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
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Mahsulot nomi yoki kodi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:text-gray-100"
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredProducts.length} / {displayedProducts.length} mahsulot
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="col-span-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">RASM</div>
            <div className="col-span-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">KOD</div>
            <div className="col-span-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">NOMI</div>
            <div className="col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">TAN NARXI</div>
            <div className="col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">OPTOM NARXI</div>
            <div className="col-span-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">MIQDORI</div>
            <div className="col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">AMALLAR</div>
          </div>

          {/* Table Body - Desktop */}
          <div className="hidden lg:block divide-y divide-gray-100 dark:divide-gray-700">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Mahsulot topilmadi' : 'Mahsulotlar yo\'q'}
                </p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div key={product._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="col-span-1">
                    {(product as any).image ? (
                      <img 
                        src={`http://localhost:5000${(product as any).image}`} 
                        alt={product.name} 
                        className="w-10 h-10 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="col-span-1">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{product.code}</span>
                  </div>
                  <div className="col-span-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{((product as any).costPrice || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">so'm</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{product.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">so'm</p>
                  </div>
                  <div className="col-span-1">
                    <span className={`font-semibold ${
                      product.quantity === 0 ? 'text-red-600 dark:text-red-400' :
                      product.quantity <= 5 ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'
                    }`}>{product.quantity}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => openQRModal(product)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                      title="QR kod"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openPrintModal(product)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                      title="Ценник чоп этиш"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Mahsulot topilmadi' : 'Mahsulotlar yo\'q'}
                </p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onQR={openQRModal}
                  onPrint={openPrintModal}
                />
              ))
            )}
          </div>
        </div>
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

      {/* QR Modal */}
      {showQRModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowQRModal(false)} />
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl relative z-10">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">QR Kod</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{selectedProduct.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kod: {selectedProduct.code}</p>
              </div>
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={JSON.stringify({
                      id: selectedProduct._id,
                      code: selectedProduct.code,
                      name: selectedProduct.name
                    })}
                    size={200}
                    level="H"
                  />
                </div>
              </div>
              <button
                onClick={downloadQR}
                className="w-full px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                QR kodni yuklash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && printProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPrintModal(false)} />
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl relative z-10">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ценник чоп этиш</h3>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{printProduct.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kod: {printProduct.code}</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
                  Narx: {printProduct.price.toLocaleString()} so'm
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kod prefiksi (ixtiyoriy)
                </label>
                <input
                  type="number"
                  placeholder="Masalan: 1, 2, 3..."
                  value={printCodePrefix}
                  onChange={e => setPrintCodePrefix(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {printCodePrefix.trim() 
                    ? `Ценникда: ${printCodePrefix.trim()} ${printProduct.price.toLocaleString()} so'm` 
                    : `Ценникda: ${printProduct.price.toLocaleString()} so'm`}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nechta ценник чоп этасиз?
                </label>
                <input
                  type="number"
                  min="1"
                  value={printQuantity}
                  onChange={e => setPrintQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:text-gray-100"
                />
              </div>
              
              {/* Checkbox для отображения цены */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                <input
                  type="checkbox"
                  id="showPriceCashier"
                  checked={showPriceOnLabel}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowPriceOnLabel(checked);
                    localStorage.setItem('showPriceOnLabel', JSON.stringify(checked));
                  }}
                  className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-500 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="showPriceCashier" className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  Narxni ko'rsatish ({printProduct.price.toLocaleString()} so'm)
                </label>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Чоп этиш
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {AlertComponent}
    </div>
  );
}
