import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Plus, Warehouse as WarehouseIcon, X, Package, Edit, Trash2, MapPin, Search, QrCode, Download, Printer, RefreshCw } from 'lucide-react';
import { Warehouse, Product } from '../../types';
import api from '../../utils/api';
import { formatNumber, formatInputNumber, parseNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../context/LanguageContext';
import { searchProducts } from '../../utils/productSearch';

export default function Warehouses() {
  const { t } = useLanguage();
  const { showAlert, showConfirm, AlertComponent } = useAlert();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouseProducts, setWarehouseProducts] = useState<Product[]>([]);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [printQuantity, setPrintQuantity] = useState('1');
  const [printCodePrefix, setPrintCodePrefix] = useState('');
  const [printing, setPrinting] = useState(false);
  const [showPriceOnLabel, setShowPriceOnLabel] = useState(() => {
    const saved = localStorage.getItem('showPriceOnLabel');
    return saved ? JSON.parse(saved) : true;
  });
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [productFormData, setProductFormData] = useState({
    code: '', name: '', costPrice: '', wholesalePrice: '', quantity: ''
  });
  const [packageData, setPackageData] = useState({
    packageCount: '', unitsPerPackage: '', totalCost: ''
  });
  const [codeError, setCodeError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchWarehouses(); }, []);

  const fetchWarehouses = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/warehouses');
      // Filter out "Asosiy ombor"
      const filtered = res.data.filter((w: Warehouse) => w.name !== 'Asosiy ombor');
      
      // Fetch inventory count for each warehouse
      const warehousesWithCount = await Promise.all(
        filtered.map(async (warehouse: Warehouse) => {
          try {
            const inventoryRes = await api.get(`/inventory/warehouse/${warehouse._id}`);
            return {
              ...warehouse,
              productCount: inventoryRes.data.length
            };
          } catch (err) {
            return {
              ...warehouse,
              productCount: 0
            };
          }
        })
      );
      
      setWarehouses(warehousesWithCount);
    } catch (err) { 
      console.error('Error fetching warehouses:', err); 
    } finally { 
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWarehouseProducts = async (warehouseId: string) => {
    setProductsLoading(true);
    try {
      // Fetch from inventory system instead of products
      const res = await api.get(`/inventory/warehouse/${warehouseId}`);
      // Map inventory items to products format
      const products = res.data.map((inv: any) => ({
        ...inv.product,
        quantity: inv.quantity,
        minStock: inv.minStock
      }));
      setWarehouseProducts(products);
    } catch (err) { 
      console.error('Error fetching products:', err); 
    } finally { 
      setProductsLoading(false); 
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
    } catch (err) { console.error('Error saving warehouse:', err); }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse) return;
    
    let finalQuantity = 0;
    let finalCostPrice = Number(productFormData.costPrice) || 0;
    
    // Calculate from package data
    if (packageData.packageCount && packageData.unitsPerPackage) {
      const totalUnits = Number(packageData.packageCount) * Number(packageData.unitsPerPackage);
      finalQuantity = editingProduct ? editingProduct.quantity + totalUnits : totalUnits;
    } else if (editingProduct) {
      finalQuantity = editingProduct.quantity;
    }
    
    try {
      const data = {
        code: productFormData.code,
        name: productFormData.name,
        costPrice: finalCostPrice,
        price: Number(productFormData.wholesalePrice),
        quantity: finalQuantity,
        warehouse: selectedWarehouse._id
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, data);
      } else {
        await api.post('/products', data);
      }
      fetchWarehouseProducts(selectedWarehouse._id);
      closeAddProductModal();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const confirmed = await showConfirm(t("Tovarni o'chirishni tasdiqlaysizmi?"), t("O'chirish"));
    if (!confirmed) return;
    if (!selectedWarehouse) return;
    try {
      await api.delete(`/products/${id}`);
      fetchWarehouseProducts(selectedWarehouse._id);
    } catch (err) { console.error('Error deleting product:', err); }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(t("Omborni o'chirishni tasdiqlaysizmi?"), t("O'chirish"));
    if (!confirmed) return;
    try {
      await api.delete(`/warehouses/${id}`);
      fetchWarehouses();
    } catch (err) { console.error('Error deleting warehouse:', err); }
  };

  const openWarehouseProducts = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    fetchWarehouseProducts(warehouse._id);
    setShowProductsModal(true);
  };

  const openEditModal = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({ name: warehouse.name, address: warehouse.address || '' });
    setShowModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      code: product.code,
      name: product.name,
      costPrice: String((product as any).costPrice || 0),
      wholesalePrice: String(product.price),
      quantity: String(product.quantity)
    });
    setCodeError('');
    setShowAddProductModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWarehouse(null);
    setFormData({ name: '', address: '' });
  };

  const closeProductsModal = () => {
    setShowProductsModal(false);
    setSelectedWarehouse(null);
    setWarehouseProducts([]);
    setWarehouseSearchQuery('');
  };

  const closeAddProductModal = () => {
    setShowAddProductModal(false);
    setEditingProduct(null);
    setProductFormData({ code: '', name: '', costPrice: '', wholesalePrice: '', quantity: '' });
    setPackageData({ packageCount: '', unitsPerPackage: '', totalCost: '' });
    setCodeError('');
  };

  const openAddProductModal = async () => {
    try {
      const warehouseParam = selectedWarehouse?._id ? `?warehouseId=${selectedWarehouse._id}` : '';
      const res = await api.get(`/products/next-code${warehouseParam}`);
      setProductFormData({ ...productFormData, code: res.data.code, name: '', costPrice: '', wholesalePrice: '', quantity: '' });
    } catch (err) {
      console.error('Error getting next code:', err);
    }
    setPackageData({ packageCount: '', unitsPerPackage: '', totalCost: '' });
    setCodeError('');
    setShowAddProductModal(true);
  };

  const checkCodeExists = async (code: string) => {
    if (!code) return;
    // При редактировании проверяем дубликаты
    if (editingProduct) {
      try {
        const excludeId = editingProduct._id;
        const res = await api.get(`/products/check-code/${code}?excludeId=${excludeId}`);
        if (res.data.exists) {
          setCodeError(`Kod "${code}" allaqachon mavjud`);
        } else {
          setCodeError('');
        }
      } catch (err) {
        console.error('Error checking code:', err);
      }
    } else {
      // При добавлении нового товара автоматически выбираем свободный код
      try {
        const res = await api.get(`/products/check-code/${code}`);
        if (res.data.exists) {
          // Код занят - автоматически получаем следующий свободный
          try {
            const nextCodeRes = await api.get('/products/next-code');
            setProductFormData(prev => ({ ...prev, code: nextCodeRes.data.code }));
            setCodeError('');
            // Тихо меняем код без уведомления
            console.log(`Kod "${code}" band edi. Avtomatik yangi kod tanlandi: ${nextCodeRes.data.code}`);
          } catch (err) {
            console.error('Error getting next code:', err);
            setCodeError(`Kod "${code}" band`);
          }
        } else {
          setCodeError('');
        }
      } catch (err) {
        console.error('Error checking code:', err);
      }
    }
  };

  const openQRModal = (product: Product) => {
    setQrProduct(product);
    setShowQRModal(true);
  };

  const openPrintModal = (product: Product) => {
    setPrintProduct(product);
    setPrintQuantity('1');
    setPrintCodePrefix('');
    setPrinting(false);
    setShowPrintModal(true);
  };

  // Печать ценника через браузер
  const handlePrint = () => {
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
  };

  const downloadQR = () => {
    if (!qrProduct) return;
    const svg = document.getElementById('qr-code-svg-warehouse');
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
      downloadLink.download = `QR-${qrProduct.code}-${qrProduct.name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
      {AlertComponent}
      <Header 
        title={t("Omborlar")}
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchWarehouses} 
              disabled={refreshing}
              className={`btn-secondary flex items-center gap-2 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? t("Yangilanmoqda...") : t("Yangilash")}</span>
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("Yangi ombor")}</span>
            </button>
          </div>
        }
      />

      <div className="p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner text-brand-600 w-8 h-8" />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="card flex flex-col items-center py-16">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
              <WarehouseIcon className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 mb-2">{t("Omborlar yo'q")}</h3>
            <p className="text-surface-500 mb-6">{t("Birinchi omborni qo'shing")}</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">{t("Ombor qo'shish")}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map(warehouse => (
              <div 
                key={warehouse._id} 
                className="card-hover cursor-pointer"
                onClick={() => openWarehouseProducts(warehouse)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                      <WarehouseIcon className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900">{warehouse.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-surface-500">
                        <MapPin className="w-3 h-3" />
                        <span>{warehouse.address || t("Manzil ko'rsatilmagan")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEditModal(warehouse)} className="btn-icon-sm hover:bg-brand-100 hover:text-brand-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(warehouse._id)} className="btn-icon-sm hover:bg-danger-100 hover:text-danger-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-surface-500 pt-3 border-t border-surface-100">
                  <Package className="w-4 h-4" />
                  <span>{warehouse.productCount || 0} {t("ta tovar")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn overflow-hidden border-2 border-surface-100 dark:border-surface-700">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <WarehouseIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {editingWarehouse ? 'Omborni tahrirlash' : 'Yangi ombor'}
                  </h3>
                </div>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Ombor nomi</label>
                <input type="text" className="input" placeholder="Ombor nomi" value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Manzil</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input type="text" className="input pl-12" placeholder="Manzilni kiriting" value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1 font-bold">Bekor qilish</button>
                <button type="submit" className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouse Products Modal */}
      {showProductsModal && selectedWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 lg:p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeProductsModal} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full h-full max-w-full max-h-full lg:max-w-6xl lg:max-h-[90vh] relative z-10 animate-scaleIn overflow-hidden flex flex-col border-2 border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 lg:px-6 py-4 lg:py-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <WarehouseIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-xl font-black text-white">{selectedWarehouse.name}</h3>
                    <p className="text-xs lg:text-sm text-white/80">Ombordagi tovarlar</p>
                  </div>
                </div>
                <button onClick={closeProductsModal} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search and Add Button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Mahsulot nomi yoki kodi..."
                    value={warehouseSearchQuery}
                    onChange={(e) => setWarehouseSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white text-black font-medium placeholder-gray-400 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                    style={{ color: '#000000' }}
                  />
                </div>
                <button 
                  onClick={openAddProductModal} 
                  className="bg-white text-red-600 hover:bg-red-50 px-3 lg:px-4 py-2.5 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Tovar qo'shish</span>
                  <span className="sm:hidden">Qo'shish</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 lg:p-6">
              {productsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="spinner text-red-600 w-8 h-8" />
                </div>
              ) : warehouseProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">Bu omborga tovarlar yo'q</p>
                  <button onClick={openAddProductModal} className="btn-primary mt-4">
                    Tovar qo'shish
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchProducts(warehouseProducts, warehouseSearchQuery)
                    .map(product => (
                    <div key={product._id} className="bg-white dark:bg-surface-700 rounded-2xl p-4 border border-surface-100 dark:border-surface-600 hover:shadow-md transition-shadow">
                      {/* Desktop Layout */}
                      <div className="hidden lg:flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-surface-900 dark:text-white truncate">{product.name}</p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Kod: {product.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-surface-500 dark:text-surface-400">Tan narxi: {formatNumber((product as any).costPrice || 0)} so'm</p>
                            <p className="font-semibold text-surface-900 dark:text-white">Optom: {formatNumber(product.price)} so'm</p>
                            <p className={`text-sm font-medium ${product.quantity === 0 ? 'text-red-600' : 'text-surface-600 dark:text-surface-400'}`}>
                              {product.quantity} dona
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => openQRModal(product)} className="btn-icon-sm hover:bg-gray-100 dark:hover:bg-surface-600" title="QR kod">
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button onClick={() => openPrintModal(product)} className="btn-icon-sm hover:bg-gray-100 dark:hover:bg-surface-600" title="Ценник чоп этиш">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEditProductModal(product)} className="btn-icon-sm hover:bg-red-100 hover:text-red-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteProduct(product._id)} className="btn-icon-sm hover:bg-red-100 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="lg:hidden">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-surface-900 dark:text-white mb-1">{product.name}</p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Kod: {product.code}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                          <div className="bg-surface-50 dark:bg-surface-600 rounded-lg p-2">
                            <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Tan narxi</p>
                            <p className="font-semibold text-surface-900 dark:text-white text-xs">{formatNumber((product as any).costPrice || 0)}</p>
                          </div>
                          <div className="bg-surface-50 dark:bg-surface-600 rounded-lg p-2">
                            <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Optom</p>
                            <p className="font-semibold text-surface-900 dark:text-white text-xs">{formatNumber(product.price)}</p>
                          </div>
                          <div className={`rounded-lg p-2 ${product.quantity === 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-surface-50 dark:bg-surface-600'}`}>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Miqdor</p>
                            <p className={`font-semibold text-xs ${product.quantity === 0 ? 'text-red-600' : 'text-surface-900 dark:text-white'}`}>{product.quantity}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openQRModal(product)} className="flex-1 btn-secondary text-sm py-2" title="QR kod">
                            <QrCode className="w-4 h-4" />
                            <span>QR</span>
                          </button>
                          <button onClick={() => openPrintModal(product)} className="flex-1 btn-secondary text-sm py-2" title="Print">
                            <Printer className="w-4 h-4" />
                            <span>Print</span>
                          </button>
                          <button onClick={() => openEditProductModal(product)} className="flex-1 btn-secondary text-sm py-2 hover:bg-red-100 hover:text-red-600">
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleDeleteProduct(product._id)} className="flex-1 btn-secondary text-sm py-2 hover:bg-red-100 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddProductModal && selectedWarehouse && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeAddProductModal} />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingProduct ? 'Tovarni tahrirlash' : 'Yangi tovar'}
                    </h3>
                    <p className="text-xs text-white/80">{selectedWarehouse.name}</p>
                  </div>
                </div>
                <button onClick={closeAddProductModal} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Kod</label>
                <input 
                  type="text" 
                  className={`input ${codeError && editingProduct ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : codeError ? 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500/20' : ''}`}
                  placeholder="000001" 
                  value={productFormData.code}
                  onChange={e => setProductFormData({...productFormData, code: e.target.value})}
                  onBlur={e => checkCodeExists(e.target.value)}
                  required 
                  style={{ color: '#000000' }}
                />
                {codeError && (
                  <p className={`text-xs mt-1 font-medium ${editingProduct ? 'text-red-600' : 'text-yellow-600'}`}>
                    {codeError}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Nomi</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Tovar nomi" 
                  value={productFormData.name}
                  onChange={e => setProductFormData({...productFormData, name: e.target.value})} 
                  required 
                  style={{ color: '#000000' }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Tan narxi</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="0" 
                    value={formatInputNumber(productFormData.costPrice)}
                    onChange={e => setProductFormData({...productFormData, costPrice: parseNumber(e.target.value)})} 
                    style={{ color: '#000000' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Optom narxi</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="0" 
                    value={formatInputNumber(productFormData.wholesalePrice)}
                    onChange={e => setProductFormData({...productFormData, wholesalePrice: parseNumber(e.target.value)})} 
                    required 
                    style={{ color: '#000000' }}
                  />
                </div>
              </div>
              
              {/* Package Information */}
              <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Qop ma'lumotlari</label>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Qoplar</label>
                      <input
                        type="number"
                        className="input text-sm"
                        placeholder="5"
                        value={packageData.packageCount}
                        onChange={e => setPackageData({...packageData, packageCount: e.target.value})}
                        style={{ color: '#000000' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Har qopda</label>
                      <input
                        type="number"
                        className="input text-sm"
                        placeholder="20"
                        value={packageData.unitsPerPackage}
                        onChange={e => setPackageData({...packageData, unitsPerPackage: e.target.value})}
                        style={{ color: '#000000' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Jami</label>
                      <input
                        type="text"
                        className="input text-sm bg-gray-100 dark:bg-gray-600 font-bold"
                        placeholder="0"
                        value={packageData.packageCount && packageData.unitsPerPackage ? formatNumber(Number(packageData.packageCount) * Number(packageData.unitsPerPackage)) : ''}
                        readOnly
                        style={{ color: '#000000' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeAddProductModal} className="btn-secondary flex-1 font-semibold">Bekor qilish</button>
                <button type="submit" className="btn-primary flex-1 font-semibold" disabled={!!(editingProduct && codeError)}>
                  {!editingProduct && codeError ? "Bo'sh kod bilan saqlash" : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQRModal && qrProduct && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQRModal(false)} />
          <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 animate-scaleIn overflow-hidden border-2 border-surface-100 dark:border-surface-700">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">QR Kod</h3>
                </div>
                <button onClick={() => setShowQRModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl border border-surface-200 mb-4">
                <QRCodeSVG
                  id="qr-code-svg-warehouse"
                  value={JSON.stringify({
                    id: qrProduct._id,
                    code: qrProduct.code,
                    name: qrProduct.name,
                    price: qrProduct.price
                  })}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-center mb-4">
                <p className="font-semibold text-surface-900">{qrProduct.name}</p>
                <p className="text-sm text-surface-500">Kod: {qrProduct.code}</p>
                <p className="text-sm text-surface-500">Tan narxi: {formatNumber((qrProduct as any).costPrice || 0)} so'm</p>
                <p className="text-sm text-surface-500">Optom: {formatNumber(qrProduct.price)} so'm</p>
              </div>
              <button onClick={downloadQR} className="btn-primary w-full">
                <Download className="w-4 h-4" />
                Yuklab olish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && printProduct && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="overlay" onClick={() => !printing && setShowPrintModal(false)} />
          <div className="modal w-full max-w-md p-6 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-surface-900">Ценник чоп этиш</h3>
              <button onClick={() => !printing && setShowPrintModal(false)} className="btn-icon-sm" disabled={printing}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Product info with QR code */}
              <div className="bg-surface-50 rounded-xl p-3 flex items-center justify-center gap-6">
                <div>
                  <p className="font-semibold text-surface-900">{printProduct.name}</p>
                  <p className="text-sm text-surface-500">Код: {printProduct.code}</p>
                  <p className="text-sm font-semibold text-surface-700 mt-1">
                    Narx: {printProduct.price.toLocaleString()} so'm
                  </p>
                </div>
                <div className="bg-white p-1 rounded-lg border border-surface-200">
                  <QRCodeSVG
                    value={JSON.stringify({
                      id: printProduct._id,
                      code: printProduct.code,
                      name: printProduct.name,
                      price: printProduct.price
                    })}
                    size={80}
                    level="H"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">Kod prefiksi (ixtiyoriy)</label>
                <input 
                  type="number" 
                  className="input text-center" 
                  placeholder="Masalan: 1, 2, 3..."
                  value={printCodePrefix}
                  onChange={e => setPrintCodePrefix(e.target.value)}
                  disabled={printing}
                />
                <p className="text-xs text-surface-500 mt-1 text-center">
                  {printCodePrefix.trim() 
                    ? `Ценникда: ${printCodePrefix.trim()} ${printProduct.price.toLocaleString()} so'm` 
                    : `Ценникда: ${printProduct.price.toLocaleString()} so'm`}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">Сони</label>
                <input 
                  type="number" 
                  className="input text-center" 
                  min="1"
                  max="50"
                  value={printQuantity}
                  onChange={e => setPrintQuantity(e.target.value)}
                  disabled={printing}
                />
              </div>
              
              {/* Checkbox для отображения цены */}
              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-200">
                <input
                  type="checkbox"
                  id="showPriceWarehouse"
                  checked={showPriceOnLabel}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowPriceOnLabel(checked);
                    localStorage.setItem('showPriceOnLabel', JSON.stringify(checked));
                  }}
                  className="w-4 h-4 rounded border-2 border-surface-300 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  disabled={printing}
                />
                <label htmlFor="showPriceWarehouse" className="flex-1 text-sm font-medium text-surface-700 cursor-pointer select-none">
                  Narxni ko'rsatish
                </label>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPrintModal(false)} 
                  className="btn-secondary flex-1"
                  disabled={printing}
                >
                  Бекор қилиш
                </button>
                <button 
                  type="button" 
                  onClick={handlePrint} 
                  className="btn-primary flex-1"
                  disabled={printing}
                >
                  {printing ? (
                    <>
                      <div className="spinner w-4 h-4" />
                      Юборилмоқда...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Чоп этиш
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="lg:hidden fixed right-4 bottom-20 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all z-30"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
