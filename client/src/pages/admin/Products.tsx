import { useState, useEffect, useRef, useMemo } from 'react';
import Header from '../../components/Header';
import { Plus, Minus, Package, X, Edit, Trash2, AlertTriangle, DollarSign, QrCode, Download, Image, Upload, Printer, ArrowRightLeft } from 'lucide-react';
import { Product, Warehouse } from '../../types';
import api from '../../utils/api';
import { formatNumber, formatInputNumber, parseNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useDebounce } from '../../hooks/useDebounce';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../context/LanguageContext';

const API_URL = 'https://pos.universalbozor.uz';

export default function Products() {
  const { tKey, uz } = useLanguage();
  const { showAlert, showConfirm, AlertComponent } = useAlert();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [mainWarehouse, setMainWarehouse] = useState<Warehouse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [printQuantity, setPrintQuantity] = useState('1');
  const [printing, setPrinting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [stockFilter, setStockFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    code: '', name: '', costPrice: '', wholesalePrice: '', quantity: ''
  });
  const [packageData, setPackageData] = useState({
    packageCount: '', unitsPerPackage: '', totalCost: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [codeError, setCodeError] = useState('');
  const [nameError, setNameError] = useState('');
  const [showPackageInput, setShowPackageInput] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityMode, setQuantityMode] = useState<'add' | 'subtract'>('add');
  const [quantityInput, setQuantityInput] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferToWarehouse, setTransferToWarehouse] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('');
  const [transferring, setTransferring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMainWarehouse();
  }, []);

  useEffect(() => {
    if (selectedWarehouse && selectedWarehouse !== 'all') {
      fetchProducts();
    } else if (selectedWarehouse === 'all') {
      fetchAllProducts();
    }
  }, [selectedWarehouse]);

  const fetchMainWarehouse = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data);
      const main = res.data.find((w: Warehouse) => w.name === 'Asosiy ombor');
      if (main) {
        setMainWarehouse(main);
        setSelectedWarehouse(main._id);
      } else {
        const newMain = await api.post('/warehouses', { name: 'Asosiy ombor', address: '' });
        setMainWarehouse(newMain.data);
        setSelectedWarehouse(newMain.data._id);
        setWarehouses([...res.data, newMain.data]);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!selectedWarehouse || selectedWarehouse === 'all') return;
    
    try {
      setLoading(true);
      // Fetch from WarehouseInventory system instead of old Product model
      const res = await api.get(`/inventory/warehouse/${selectedWarehouse}`);
      // Map inventory items to products format
      const productsData = res.data.map((inv: any) => ({
        ...inv.product,
        quantity: inv.quantity,
        minStock: inv.minStock,
        _inventoryId: inv._id, // Keep inventory ID for updates
        _warehouseName: inv.warehouse?.name || 'Noma\'lum'
      }));
      setProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      // Fetch products directly from /products endpoint
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching all products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 8 - images.length;
    if (remainingSlots <= 0) {
      showAlert(tKey('Maksimum 8 ta rasm yuklash mumkin'), tKey('Ogohlantirish'), 'warning');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const formData = new FormData();
    filesToUpload.forEach(file => formData.append('images', file));

    setUploading(true);
    try {
      const res = await api.post('/products/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages([...images, ...res.data.images]);
    } catch (err) {
      console.error('Error uploading images:', err);
      showAlert(tKey('Rasmlarni yuklashda xatolik'), tKey('Xatolik'), 'danger');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = async (imagePath: string) => {
    try {
      await api.delete('/products/delete-image', { data: { imagePath } });
      setImages(images.filter(img => img !== imagePath));
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim the name and code before validation
    const trimmedName = formData.name.trim();
    const trimmedCode = formData.code.trim();
    
    if (!trimmedName) {
      showAlert('Mahsulot nomini kiriting', 'Xatolik', 'danger');
      return;
    }
    
    if (!trimmedCode) {
      showAlert('Mahsulot kodini kiriting', 'Xatolik', 'danger');
      return;
    }
    
    // Check for errors before submitting
    if (nameError) {
      showAlert('Bu nomli mahsulot allaqachon mavjud. Iltimos, boshqa nom kiriting.', 'Dublikat xatolik', 'danger');
      return;
    }
    
    if (editingProduct && codeError) {
      showAlert('Bu kod allaqachon band. Iltimos, boshqa kod kiriting.', 'Dublikat xatolik', 'danger');
      return;
    }
    
    let finalQuantity = Number(formData.quantity);
    let finalCostPrice = Number(formData.costPrice);
    let packageInfo = null;
    
    // If package data is provided, calculate totals
    if (showPackageInput && packageData.packageCount && packageData.unitsPerPackage) {
      const totalUnits = Number(packageData.packageCount) * Number(packageData.unitsPerPackage);
      
      finalQuantity = editingProduct ? Number(formData.quantity) + totalUnits : totalUnits;
      
      packageInfo = {
        packageCount: Number(packageData.packageCount),
        unitsPerPackage: Number(packageData.unitsPerPackage),
        totalUnits: totalUnits
      };
    }
    
    try {
      const data = {
        code: trimmedCode,
        name: trimmedName,
        costPrice: finalCostPrice,
        price: Number(formData.wholesalePrice),
        quantity: finalQuantity,
        warehouse: mainWarehouse?._id,
        images,
        packageInfo
      };
      
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, data);
        showAlert('Mahsulot muvaffaqiyatli yangilandi', 'Muvaffaqiyat', 'success');
      } else {
        await api.post('/products', data);
        showAlert('Mahsulot muvaffaqiyatli qo\'shildi', 'Muvaffaqiyat', 'success');
      }
      
      fetchProducts();
      closeModal();
    } catch (err: any) {
      console.error('Submit error:', err);
      
      // Handle specific error cases
      if (err.response?.status === 409) {
        // Conflict - duplicate entry
        const errorData = err.response.data;
        const existingProduct = errorData.existingProduct;
        
        // Check if it's an exact duplicate (same name, price, costPrice)
        if (errorData.isDuplicateProduct) {
          let message = 'Aynan bir xil mahsulot allaqachon mavjud!\n\n';
          message += `Nom: ${existingProduct.name}\n`;
          message += `Narx: ${existingProduct.price.toLocaleString()} so'm\n`;
          message += `Tan narxi: ${existingProduct.costPrice.toLocaleString()} so'm\n`;
          message += `Miqdor: ${existingProduct.quantity} dona\n`;
          message += `Kod: ${existingProduct.code}\n\n`;
          message += 'Agar narx yoki tan narxi boshqa bo\'lsa, ularni o\'zgartiring.';
          
          showAlert(message, 'Dublikat Mahsulot!', 'warning');
        } else {
          // Code or name duplicate (but different price)
          let message = errorData.message || 'Bu mahsulot allaqachon mavjud!';
          
          if (existingProduct) {
            message += `\n\nMavjud mahsulot:`;
            message += `\n   Nom: ${existingProduct.name}`;
            message += `\n   Kod: ${existingProduct.code}`;
            if (existingProduct.price) {
              message += `\n   Narx: ${existingProduct.price.toLocaleString()} so'm`;
            }
            if (existingProduct.costPrice) {
              message += `\n   Tan narxi: ${existingProduct.costPrice.toLocaleString()} so'm`;
            }
            message += `\n   Miqdor: ${existingProduct.quantity} dona`;
          }
          
          showAlert(message, 'Dublikat!', 'warning');
        }
      } else {
        const errorMsg = err.response?.data?.message || 'Xatolik yuz berdi';
        showAlert(errorMsg, 'Xatolik', 'danger');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(tKey("Tovarni o'chirishni tasdiqlaysizmi?"), tKey("O'chirish"));
    if (!confirmed) return;
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
      costPrice: String((product as any).costPrice || 0),
      wholesalePrice: String(product.price),
      quantity: String(product.quantity)
    });
    setImages((product as any).images || []);
    setPackageData({ packageCount: '', unitsPerPackage: '', totalCost: '' });
    setCodeError('');
    setNameError('');
    setShowPackageInput(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ code: '', name: '', costPrice: '', wholesalePrice: '', quantity: '' });
    setPackageData({ packageCount: '', unitsPerPackage: '', totalCost: '' });
    setImages([]);
    setCodeError('');
    setNameError('');
    setShowPackageInput(false);
  };

  // ✅ TRANSFER FUNCTIONS
  const openTransferModal = (product: Product) => {
    setTransferProduct(product);
    setTransferToWarehouse('');
    setTransferQuantity('1');
    setShowTransferModal(true);
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setTransferProduct(null);
    setTransferToWarehouse('');
    setTransferQuantity('');
  };

  const handleTransfer = async () => {
    if (!transferProduct || !transferToWarehouse || !transferQuantity) {
      showAlert('Barcha maydonlarni to\'ldiring', 'Xatolik', 'danger');
      return;
    }

    const quantity = Number(transferQuantity);
    if (quantity <= 0) {
      showAlert('Miqdor 0 dan katta bo\'lishi kerak', 'Xatolik', 'danger');
      return;
    }

    if (quantity > transferProduct.quantity) {
      showAlert(`Maksimal miqdor: ${transferProduct.quantity}`, 'Xatolik', 'danger');
      return;
    }

    // Get current warehouse from product
    const currentWarehouseId = (transferProduct as any)._warehouseId || selectedWarehouse;
    
    if (currentWarehouseId === transferToWarehouse) {
      showAlert('Bir xil omborga o\'tkazish mumkin emas', 'Xatolik', 'danger');
      return;
    }

    const confirmed = await showConfirm(
      `${transferProduct.name}\n${quantity} dona\n${warehouses.find(w => w._id === currentWarehouseId)?.name} → ${warehouses.find(w => w._id === transferToWarehouse)?.name}`,
      'Transferni tasdiqlaysizmi?'
    );

    if (!confirmed) return;

    setTransferring(true);
    try {
      await api.post('/inventory/transfer', {
        productId: transferProduct._id,
        fromWarehouseId: currentWarehouseId,
        toWarehouseId: transferToWarehouse,
        quantity: quantity,
        notes: `Transfer from Products page`
      });

      showAlert('Transfer muvaffaqiyatli!', 'Muvaffaqiyat', 'success');
      closeTransferModal();
      
      // Refresh products
      if (selectedWarehouse && selectedWarehouse !== 'all') {
        fetchProducts();
      } else if (selectedWarehouse === 'all') {
        fetchAllProducts();
      }
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Transfer xatosi', 'Xatolik', 'danger');
    } finally {
      setTransferring(false);
    }
  };

  const openQuantityModal = (mode: 'add' | 'subtract') => {
    setQuantityMode(mode);
    setQuantityInput('');
    setShowQuantityModal(true);
  };

  const applyQuantityChange = () => {
    const change = Number(quantityInput) || 0;
    if (change <= 0) return;
    
    const currentQty = Number(formData.quantity) || 0;
    let newQty = quantityMode === 'add' ? currentQty + change : currentQty - change;
    if (newQty < 0) newQty = 0;
    
    setFormData({ ...formData, quantity: String(newQty) });
    setShowQuantityModal(false);
    setQuantityInput('');
  };

  const openAddModal = async () => {
    try {
      const warehouseParam = mainWarehouse?._id ? `?warehouseId=${mainWarehouse._id}` : '';
      const res = await api.get(`/products/next-code${warehouseParam}`);
      setFormData({ code: res.data.code, name: '', costPrice: '', wholesalePrice: '', quantity: '' });
    } catch (err) {
      console.error('Error getting next code:', err);
    }
    setPackageData({ packageCount: '', unitsPerPackage: '', totalCost: '' });
    setImages([]);
    setCodeError('');
    setNameError('');
    setShowPackageInput(false);
    setShowModal(true);
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
      // При добавлении нового товара просто показываем предупреждение, но не блокируем
      try {
        const res = await api.get(`/products/check-code/${code}`);
        if (res.data.exists) {
          setCodeError(`Kod "${code}" band. Saqlashda avtomatik bo'sh kod tanlanadi.`);
        } else {
          setCodeError('');
        }
      } catch (err) {
        console.error('Error checking code:', err);
      }
    }
  };

  const checkNameExists = async (name: string) => {
    if (!name || name.trim().length < 2) {
      setNameError('');
      return;
    }
    
    const trimmedName = name.trim();
    
    try {
      const excludeId = editingProduct?._id;
      const url = excludeId 
        ? `/products/check-name/${encodeURIComponent(trimmedName)}?excludeId=${excludeId}`
        : `/products/check-name/${encodeURIComponent(trimmedName)}`;
      
      const res = await api.get(url);
      if (res.data.exists) {
        const existingProduct = res.data.product;
        setNameError(
          `"${trimmedName}" nomli mahsulot allaqachon mavjud` + 
          (existingProduct ? ` (Kod: ${existingProduct.code})` : '')
        );
      } else {
        setNameError('');
      }
    } catch (err) {
      console.error('Error checking name:', err);
    }
  };

  const openQRModal = (product: Product) => {
    setSelectedProduct(product);
    setShowQRModal(true);
  };

  const openPrintModal = (product: Product) => {
    setPrintProduct(product);
    setPrintQuantity('1');
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
    
    const labelsHtml = Array(qty).fill(`
      <div class="label">
        <div class="info">
          <div class="name">${printProduct.name}</div>
          <div class="code">Kod: ${printProduct.code}</div>
        </div>
        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" alt="QR" />
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
      width: 58mm; height: 40mm; padding: 2mm;
      display: flex; align-items: center; justify-content: space-between;
    }
    .info { flex: 1; }
    .name { font-size: 14pt; font-weight: bold; margin-bottom: 2mm; line-height: 1.1; }
    .code { font-size: 12pt; color: #333; }
    .qr-container { width: 22mm; height: 22mm; flex-shrink: 0; }
    .qr-container img { width: 100%; height: 100%; }
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
    if (!selectedProduct) return;
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${selectedProduct.code}-${selectedProduct.name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Memoize stats calculation
  const stats = useMemo(() => ({
    total: products.length,
    lowStock: products.filter(p => p.quantity <= (p.minStock || 5) && p.quantity > 0).length,
    outOfStock: products.filter(p => p.quantity === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  }), [products]);

  // Memoize filtered products with debounced search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           p.code.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesStock = stockFilter === 'all' || 
                          (stockFilter === 'low' && p.quantity <= (p.minStock || 5) && p.quantity > 0) ||
                          (stockFilter === 'out' && p.quantity === 0);
      return matchesSearch && matchesStock;
    });
  }, [products, debouncedSearchQuery, stockFilter]);

  const statItems = [
    { label: tKey('Jami tovarlar'), value: stats.total, icon: Package, color: 'brand', filter: 'all' },
    { label: tKey('Kam qolgan'), value: stats.lowStock, icon: AlertTriangle, color: 'warning', filter: 'low' },
    { label: tKey('Tugagan'), value: stats.outOfStock, icon: X, color: 'danger', filter: 'out' },
    { label: tKey('Jami qiymat'), value: `${formatNumber(stats.totalValue)} ${tKey("so'm")}`, icon: DollarSign, color: 'success', filter: null },
  ];

  const getProductImage = (product: any) => {
    if (product.images && product.images.length > 0) {
      return `${API_URL}${product.images[0]}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
      {AlertComponent}
      <Header 
        title={tKey("Tovarlar")}
        showSearch 
        onSearch={setSearchQuery}
        filterOptions={[
          { value: 'all', label: tKey('Barcha omborlar') },
          ...warehouses.map(w => ({ value: w._id, label: w.name }))
        ]}
        filterValue={selectedWarehouse}
        onFilterChange={setSelectedWarehouse}
        actions={
          <button onClick={openAddModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{tKey("Yangi tovar")}</span>
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-6 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {statItems.map((stat, i) => (
            <div 
              key={i} 
              onClick={() => stat.filter && setStockFilter(stat.filter)}
              className={`stat-card ${stat.filter ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${
                stockFilter === stat.filter ? 'ring-2 ring-brand-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2 lg:mb-3">
                <div className={`stat-icon bg-${stat.color}-50`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-surface-900">{stat.value}</p>
              <p className="text-xs lg:text-sm text-surface-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner text-brand-600 w-8 h-8 mb-4" />
              <p className="text-surface-500">Yuklanmoqda...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">Tovarlar topilmadi</h3>
              <p className="text-surface-500 text-center max-w-md mb-6">
                {searchQuery ? 'Qidiruv bo\'yicha tovarlar topilmadi' : 'Birinchi tovarni qo\'shing'}
              </p>
              <button onClick={openAddModal} className="btn-primary">Tovar qo'shish</button>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <div className="table-header">
                  <div className="grid grid-cols-12 gap-4 px-6 py-4">
                    <span className="table-header-cell col-span-1">Rasm</span>
                    <span className="table-header-cell col-span-1">Kod</span>
                    <span className="table-header-cell col-span-2">Nomi</span>
                    <span className="table-header-cell col-span-1">Ombor</span>
                    <span className="table-header-cell col-span-1">Tan narxi</span>
                    <span className="table-header-cell col-span-2">Optom narxi</span>
                    <span className="table-header-cell col-span-1">Miqdori</span>
                    <span className="table-header-cell col-span-3 text-center">Amallar</span>
                  </div>
                </div>
                <div className="divide-y divide-surface-100">
                  {filteredProducts.map(product => (
                    <div key={product._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-50 transition-colors">
                      <div className="col-span-1">
                        {getProductImage(product) ? (
                          <img src={getProductImage(product)!} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
                            <Image className="w-5 h-5 text-surface-400" />
                          </div>
                        )}
                      </div>
                      <div className="col-span-1">
                        <span className="font-mono text-sm bg-surface-100 px-2 py-1 rounded-lg">{product.code}</span>
                      </div>
                      <div className="col-span-2">
                        <p className="font-medium text-surface-900">{uz(product.name)}</p>
                      </div>
                      <div className="col-span-1">
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                          {(product as any)._warehouseName}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <p className="font-semibold text-surface-900">{formatNumber((product as any).costPrice || 0)}</p>
                        <p className="text-sm text-surface-500">so'm</p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-semibold text-surface-900">{formatNumber(product.price)}</p>
                        <p className="text-sm text-surface-500">so'm</p>
                      </div>
                      <div className="col-span-1">
                        <span className={`font-semibold ${
                          product.quantity === 0 ? 'text-danger-600' :
                          product.quantity <= (product.minStock || 5) ? 'text-warning-600' : 'text-success-600'
                        }`}>{product.quantity}</span>
                      </div>
                      <div className="col-span-3 flex items-center justify-center gap-2">
                        <button onClick={() => openTransferModal(product)} className="btn-icon-sm hover:bg-red-100 hover:text-red-600" title="Omborga o'tkazish">
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => openQRModal(product)} className="btn-icon-sm hover:bg-surface-200" title="QR kod">
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button onClick={() => openPrintModal(product)} className="btn-icon-sm hover:bg-surface-200" title="Ценник чоп этиш">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(product)} className="btn-icon-sm hover:bg-brand-100 hover:text-brand-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="btn-icon-sm hover:bg-danger-100 hover:text-danger-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:hidden divide-y divide-surface-100">
                {filteredProducts.map(product => (
                  <div key={product._id} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {getProductImage(product) ? (
                        <img src={getProductImage(product)!} alt={product.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border-2 border-surface-200" />
                      ) : (
                        <div className="w-16 h-16 bg-surface-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Image className="w-8 h-8 text-surface-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-surface-900 mb-1">{uz(product.name)}</h4>
                        <p className="text-sm text-surface-500 mb-2">Kod: <span className="font-mono font-semibold">{product.code}</span></p>
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                          {(product as any)._warehouseName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={() => openTransferModal(product)} className="btn-icon hover:bg-red-100 hover:text-red-600" title="Omborga o'tkazish">
                        <ArrowRightLeft className="w-5 h-5" />
                      </button>
                      <button onClick={() => openQRModal(product)} className="btn-icon hover:bg-surface-200" title="QR kod">
                        <QrCode className="w-5 h-5" />
                      </button>
                      <button onClick={() => openPrintModal(product)} className="btn-icon hover:bg-surface-200" title="Ценник чоп этиш">
                        <Printer className="w-5 h-5" />
                      </button>
                      <button onClick={() => openEditModal(product)} className="btn-icon hover:bg-brand-100 hover:text-brand-600">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(product._id)} className="btn-icon hover:bg-danger-100 hover:text-danger-600">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-surface-50 rounded-xl p-3">
                        <p className="text-xs text-surface-500 mb-1">Tan narxi</p>
                        <p className="font-semibold text-surface-900">{formatNumber((product as any).costPrice || 0)}</p>
                      </div>
                      <div className="bg-surface-50 rounded-xl p-3">
                        <p className="text-xs text-surface-500 mb-1">Optom narxi</p>
                        <p className="font-semibold text-surface-900">{formatNumber(product.price)}</p>
                      </div>
                      <div className={`rounded-xl p-3 ${product.quantity === 0 ? 'bg-danger-50' : product.quantity <= (product.minStock || 5) ? 'bg-warning-50' : 'bg-success-50'}`}>
                        <p className="text-xs text-surface-500 mb-1">Miqdori</p>
                        <p className={`font-semibold ${product.quantity === 0 ? 'text-danger-600' : product.quantity <= (product.minStock || 5) ? 'text-warning-600' : 'text-success-600'}`}>{product.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 animate-scaleIn max-h-[90vh] overflow-y-auto border-2 border-surface-100 dark:border-surface-700">
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5 sticky top-0 z-10 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{editingProduct ? 'Tovarni tahrirlash' : 'Yangi tovar'}</h3>
                    <p className="text-sm text-white/80">{editingProduct ? 'Ma\'lumotlarni yangilang' : 'Yangi tovar qo\'shing'}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200" title="Yopish">
                  <X className="w-6 h-6" strokeWidth={3} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Enhanced Image Upload */}
              <div>
                <label className="text-sm font-bold text-surface-700 mb-3 flex items-center gap-2">
                  <Image className="w-4 h-4 text-brand-600" />
                  Rasmlar (maksimal 8 ta)
                </label>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square group">
                      <img src={`${API_URL}${img}`} alt="" className="w-full h-full object-cover rounded-xl border-2 border-surface-200 shadow-md" />
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-danger-500 to-danger-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                      >
                        <X className="w-4 h-4" strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  {images.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="aspect-square border-2 border-dashed border-surface-300 rounded-xl flex flex-col items-center justify-center hover:border-brand-500 hover:bg-brand-50 transition-all hover:scale-105 bg-gradient-to-br from-surface-50 to-surface-100"
                    >
                      {uploading ? (
                        <div className="spinner w-6 h-6 text-brand-600" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-surface-400 mb-1" />
                          <span className="text-xs text-surface-500 font-semibold">Yuklash</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-surface-500 font-medium">📸 JPG, PNG, WEBP formatlarida, har biri 5MB gacha</p>
              </div>

              {/* Enhanced Code and Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-surface-700 mb-2 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-brand-600" />
                    Kod
                  </label>
                  <input 
                    type="text" 
                    className={`input font-mono text-base font-bold ${codeError && editingProduct ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : codeError ? 'border-warning-500 focus:border-warning-500 focus:ring-warning-500/20' : 'border-2 focus:ring-4'}`}
                    placeholder="1" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    onBlur={e => checkCodeExists(e.target.value)}
                    required 
                  />
                  {codeError && (
                    <p className={`text-sm mt-1 ${editingProduct ? 'text-danger-600' : 'text-warning-600'}`}>
                      {codeError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-2 block">Miqdori</label>
                  {editingProduct ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 bg-surface-100 rounded-xl text-center font-semibold text-surface-900">
                        {formatNumber(formData.quantity || 0)}
                      </div>
                      <button type="button" onClick={() => openQuantityModal('add')} className="btn-icon bg-success-100 text-success-600 hover:bg-success-200">
                        <Plus className="w-5 h-5" />
                      </button>
                      <button type="button" onClick={() => openQuantityModal('subtract')} className="btn-icon bg-danger-100 text-danger-600 hover:bg-danger-200">
                        <Minus className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <input type="text" className="input" placeholder="0" value={formatInputNumber(formData.quantity)} onChange={e => setFormData({...formData, quantity: parseNumber(e.target.value)})} required />
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">
                  Nomi <span className="text-danger-500">*</span>
                </label>
                <input 
                  type="text" 
                  className={`input ${nameError ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
                  placeholder="Tovar nomi" 
                  value={formData.name} 
                  onChange={e => {
                    setFormData({...formData, name: e.target.value});
                    // Clear error when user starts typing
                    if (nameError) setNameError('');
                  }}
                  onBlur={e => checkNameExists(e.target.value)}
                  required 
                />
                {nameError && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-danger-50 border border-danger-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-danger-600">{nameError}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-2 block">Tan narxi (so'm)</label>
                  <input type="text" className="input" placeholder="0" value={formatInputNumber(formData.costPrice)} onChange={e => setFormData({...formData, costPrice: parseNumber(e.target.value)})} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-2 block">Optom narxi (so'm)</label>
                  <input type="text" className="input" placeholder="0" value={formatInputNumber(formData.wholesalePrice)} onChange={e => setFormData({...formData, wholesalePrice: parseNumber(e.target.value)})} required />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1 font-bold">Bekor qilish</button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl" 
                  disabled={!!(nameError || (editingProduct && codeError))}
                >
                  {!editingProduct && codeError ? "Bo'sh kod bilan saqlash" : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQRModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
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
                <button onClick={() => setShowQRModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200" title="Yopish">
                  <X className="w-6 h-6" strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl border border-surface-200 mb-4">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={JSON.stringify({
                    id: selectedProduct._id,
                    code: selectedProduct.code,
                    name: selectedProduct.name,
                    price: selectedProduct.price
                  })}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-center mb-4">
                <p className="font-semibold text-surface-900">{uz(selectedProduct.name)}</p>
                <p className="text-sm text-surface-500">Kod: {selectedProduct.code}</p>
                <p className="text-sm text-surface-500">Tan narxi: {formatNumber((selectedProduct as any).costPrice || 0)} so'm</p>
                <p className="text-sm text-surface-500">Optom: {formatNumber(selectedProduct.price)} so'm</p>
              </div>
              <button onClick={downloadQR} className="btn-primary w-full">
                <Download className="w-4 h-4" />
                Yuklab olish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Adjustment Modal */}
      {showQuantityModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="overlay" onClick={() => setShowQuantityModal(false)} />
          <div className="modal w-full max-w-sm p-6 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-surface-900">
                {quantityMode === 'add' ? "Miqdor qo'shish" : "Miqdor ayirish"}
              </h3>
              <button onClick={() => setShowQuantityModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 transition-all hover:scale-110 hover:rotate-90 duration-200" title="Yopish">
                <X className="w-6 h-6" strokeWidth={3} />
              </button>
            </div>
            
            <div className={`rounded-xl p-4 mb-6 ${quantityMode === 'add' ? 'bg-success-50' : 'bg-danger-50'}`}>
              <p className="text-sm text-surface-600 mb-1">Hozirgi miqdor</p>
              <p className={`text-2xl font-bold ${quantityMode === 'add' ? 'text-success-600' : 'text-danger-600'}`}>
                {formatNumber(formData.quantity || 0)} dona
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">
                  {quantityMode === 'add' ? "Qo'shiladigan miqdor" : "Ayiriladigan miqdor"}
                </label>
                <input 
                  type="text" 
                  className="input text-center text-lg font-semibold" 
                  placeholder="0" 
                  value={formatInputNumber(quantityInput)}
                  onChange={e => setQuantityInput(parseNumber(e.target.value))}
                  autoFocus
                />
              </div>

              {quantityInput && Number(quantityInput) > 0 && (
                <div className="bg-surface-50 rounded-xl p-4">
                  <p className="text-sm text-surface-600 mb-1">Yangi miqdor</p>
                  <p className="text-xl font-bold text-surface-900">
                    {formatNumber(
                      quantityMode === 'add' 
                        ? (Number(formData.quantity) || 0) + Number(quantityInput)
                        : Math.max(0, (Number(formData.quantity) || 0) - Number(quantityInput))
                    )} dona
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowQuantityModal(false)} className="btn-secondary flex-1">
                  Bekor qilish
                </button>
                <button 
                  type="button" 
                  onClick={applyQuantityChange} 
                  className={`flex-1 ${quantityMode === 'add' ? 'btn-success' : 'btn-danger'}`}
                  disabled={!quantityInput || Number(quantityInput) <= 0}
                >
                  {quantityMode === 'add' ? "Qo'shish" : "Ayirish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && printProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="overlay" onClick={() => !printing && setShowPrintModal(false)} />
          <div className="modal w-full max-w-md p-6 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-surface-900">Ценник чоп этиш</h3>
              <button onClick={() => !printing && setShowPrintModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 transition-all hover:scale-110 hover:rotate-90 duration-200" disabled={printing} title="Yopish">
                <X className="w-6 h-6" strokeWidth={3} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Product info with QR code */}
              <div className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-700 dark:to-surface-800 rounded-2xl p-4 flex items-center justify-center gap-20 border-2 border-surface-200 dark:border-surface-600">
                <div>
                  <p className="font-bold text-lg text-surface-900 dark:text-white">{uz(printProduct.name)}</p>
                  <p className="font-semibold text-surface-600 dark:text-surface-400">Code: {printProduct.code}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border-2 border-surface-200 shadow-lg">
                  <QRCodeSVG
                    value={JSON.stringify({
                      code: printProduct.code,
                      name: printProduct.name,
                    })}
                    size={80}
                    level="H"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">Сони</label>
                <input 
                  type="number" 
                  className="input text-center font-bold text-lg" 
                  min="1"
                  max="50"
                  value={printQuantity}
                  onChange={e => setPrintQuantity(e.target.value)}
                  disabled={printing}
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPrintModal(false)} 
                  className="btn-secondary flex-1 font-bold"
                  disabled={printing}
                >
                  Бекор қилиш
                </button>
                <button 
                  type="button" 
                  onClick={handlePrint} 
                  className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl"
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

      {/* Transfer Modal */}
      {showTransferModal && transferProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeTransferModal} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn border-2 border-red-100">
            {/* Header - Red Gradient */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <ArrowRightLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-black text-white">Omborga o'tkazish</h3>
                </div>
                <button onClick={closeTransferModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200" title="Yopish">
                  <X className="w-6 h-6" strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Product Info - Red/White Theme */}
              <div className="bg-white rounded-2xl p-4 border-2 border-red-500 shadow-md">
                <div className="flex items-start gap-4">
                  {getProductImage(transferProduct) ? (
                    <img src={getProductImage(transferProduct)!} alt={transferProduct.name} className="w-20 h-20 rounded-xl object-cover border-2 border-red-300 shadow-md flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 bg-red-50 rounded-xl flex items-center justify-center border-2 border-red-300 shadow-md flex-shrink-0">
                      <Package className="w-10 h-10 text-red-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xl text-slate-900 mb-2 leading-tight">{uz(transferProduct.name)}</p>
                    <div className="bg-slate-100 inline-block px-3 py-1 rounded-lg mb-3">
                      <p className="text-sm text-slate-900 font-black">Kod: {transferProduct.code}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl px-4 py-3 border-2 border-red-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900">Mavjud:</span>
                        <span className="font-black text-2xl text-red-600">{transferProduct.quantity} dona</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Warehouse */}
              <div>
                <label className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-600" />
                  Hozirgi ombor
                </label>
                <div className="bg-slate-100 rounded-xl px-4 py-3.5 font-bold text-slate-900 border-2 border-slate-200">
                  {(transferProduct as any)._warehouseName || warehouses.find(w => w._id === selectedWarehouse)?.name || 'Noma\'lum'}
                </div>
              </div>

              {/* Target Warehouse */}
              <div>
                <label className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-red-600" />
                  Qayerga o'tkazish
                </label>
                <select 
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                  value={transferToWarehouse}
                  onChange={e => setTransferToWarehouse(e.target.value)}
                  required
                >
                  <option value="">Omborni tanlang</option>
                  {warehouses
                    .filter(w => w._id !== selectedWarehouse && w._id !== (transferProduct as any)._warehouseId)
                    .map(w => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))
                  }
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm font-black text-slate-900 mb-2 block">
                  Miqdor (maksimal: {transferProduct.quantity})
                </label>
                <input 
                  type="number"
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 font-bold text-xl text-center focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                  min="1"
                  max={transferProduct.quantity}
                  value={transferQuantity}
                  onChange={e => setTransferQuantity(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={closeTransferModal} 
                  className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-xl transition-all border-2 border-slate-200"
                  disabled={transferring}
                >
                  Bekor qilish
                </button>
                <button 
                  type="button" 
                  onClick={handleTransfer} 
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={transferring || !transferToWarehouse || !transferQuantity}
                >
                  {transferring ? (
                    <>
                      <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
                      O'tkazilmoqda...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-5 h-5" strokeWidth={2.5} />
                      O'tkazish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      {/* Enhanced Mobile FAB */}
      <button
        onClick={openAddModal}
        className="lg:hidden fixed right-4 bottom-24 w-16 h-16 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:from-brand-600 hover:to-brand-700 active:scale-95 transition-all z-50 animate-bounce"
        style={{ animationDuration: '2s', animationIterationCount: '3' }}
      >
        <Plus className="w-8 h-8" strokeWidth={3} />
      </button>
    </div>
  );
}
