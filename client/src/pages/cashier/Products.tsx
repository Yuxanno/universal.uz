import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Header from '../../components/Header';
import { Plus, Package, X, Edit, Trash2, QrCode, Download, Image, Upload, Printer } from 'lucide-react';
import { Product, Warehouse } from '../../types';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useDebounce } from '../../hooks/useDebounce';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../context/LanguageContext';
import { searchProducts } from '../../utils/productSearch';
import { initSocket } from '../../utils/socket';
const API_URL = 'https://pos.universalbozor.uz';

// ProductRow Component - Desktop (8 columns, no warehouse)
const ProductRow = memo(({ 
  product, 
  onQR, 
  onPrint, 
  onEdit, 
  onDelete,
  getProductImage,
  uz,
  formatNumber
}: any) => (
  <div className="grid gap-4 px-6 py-4 items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors" style={{gridTemplateColumns: 'auto 80px 1fr 110px 110px 110px 90px 140px'}}>
    <div>
      {getProductImage(product) ? (
        <img src={getProductImage(product)!} alt={product.name} className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
      ) : (
        <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
          <Image className="w-5 h-5 text-neutral-400" />
        </div>
      )}
    </div>
    <div>
      <span className="font-mono text-sm bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-lg">{product.code}</span>
    </div>
    <div className="min-w-0">
      <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{uz(product.name)}</p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(product.costPrice || 0)}</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">so'm</p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(product.price)}</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">so'm</p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(product.dona_narx || 0)}</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">so'm</p>
    </div>
    <div className="text-center">
      <span className={`font-semibold ${
        product.quantity === 0 ? 'text-red-600 dark:text-red-400' :
        product.quantity <= (product.minStock || 5) ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'
      }`}>{product.quantity}</span>
    </div>
    <div className="flex items-center justify-center gap-1">
      <button onClick={() => onQR(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all" title="QR kod">
        <QrCode className="w-4 h-4" />
      </button>
      <button onClick={() => onPrint(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all" title="Ценник чоп этиш">
        <Printer className="w-4 h-4" />
      </button>
      <button onClick={() => onEdit(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-all">
        <Edit className="w-4 h-4" />
      </button>
      <button onClick={() => onDelete(product._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
));

ProductRow.displayName = 'ProductRow';

// ProductCard Component - Mobile
const ProductCard = memo(({ 
  product, 
  onQR, 
  onPrint, 
  onEdit, 
  onDelete,
  getProductImage,
  uz,
  formatNumber
}: any) => (
  <div className="p-4">
    <div className="flex items-start gap-3 mb-3">
      {getProductImage(product) ? (
        <img src={getProductImage(product)!} alt={product.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" loading="lazy" />
      ) : (
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <Package className="w-8 h-8 text-neutral-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">{uz(product.name)}</h4>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">Kod: {product.code}</p>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-2 mb-3">
      <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Tan narxi</p>
        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(product.costPrice || 0)}</p>
      </div>
      <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Optom</p>
        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(product.price)}</p>
      </div>
      <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Dona</p>
        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(product.dona_narx || 0)}</p>
      </div>
      <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Miqdor</p>
        <p className={`text-sm font-bold ${
          product.quantity === 0 ? 'text-red-600 dark:text-red-400' :
          product.quantity <= (product.minStock || 5) ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'
        }`}>{product.quantity}</p>
      </div>
    </div>
    <div className="flex gap-2">
      <button onClick={() => onQR(product)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all">
        <QrCode className="w-4 h-4" />
      </button>
      <button onClick={() => onPrint(product)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all">
        <Printer className="w-4 h-4" />
      </button>
      <button onClick={() => onEdit(product)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all">
        <Edit className="w-4 h-4" />
      </button>
      <button onClick={() => onDelete(product._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
));

ProductCard.displayName = 'ProductCard';

export default function Products() {
  const { tKey, uz } = useLanguage();
  const { showAlert, showConfirm, AlertComponent } = useAlert();
  const [products, setProducts] = useState<Product[]>([]);
  const [mainWarehouse, setMainWarehouse] = useState<Warehouse | null>(null);
  const [showModal, setShowModal] = useState(false);
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    code: '', name: '', costPrice: '', wholesalePrice: '', donaNarx: '', quantity: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [codeError, setCodeError] = useState('');
  const [nameError, setNameError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMainWarehouse();
  }, []);

  useEffect(() => {
    if (mainWarehouse) {
      fetchProducts();
    }
  }, [mainWarehouse]);

  // Auto-refresh removed - using Socket.IO for real-time updates instead

  // Socket.IO real-time updates
  useEffect(() => {
    if (!mainWarehouse) {
      console.log('⚠️ [Products] mainWarehouse not set, skipping socket initialization');
      return;
    }
    
    console.log('� [Products] Initializing socket for Products page...');
    console.log('🔌 [Products] mainWarehouse:', mainWarehouse);
    const socket = initSocket();

    const handleInventoryUpdate = (data: any) => {
      console.log('📦 [Products] ===== INVENTORY UPDATE RECEIVED =====');
      console.log('📦 [Products] Event data:', data);
      console.log('📦 [Products] Current mainWarehouse ID:', mainWarehouse._id);
      
      // Fetch products directly without dependency on fetchProducts function
      console.log('📦 [Products] Fetching updated products...');
      api.get(`/inventory/warehouse/${mainWarehouse._id}`)
        .then(res => {
          console.log('📦 [Products] API response:', res.data.length, 'items');
          const productsData = res.data.map((inv: any) => ({
            ...inv.product,
            quantity: inv.quantity,
            minStock: inv.minStock,
            _inventoryId: inv._id,
            _warehouseId: mainWarehouse._id
          }));
          
          productsData.sort((a: any, b: any) => {
            const codeA = parseInt(a.code) || 0;
            const codeB = parseInt(b.code) || 0;
            return codeB - codeA;
          });
          
          setProducts(productsData);
          console.log('✅ [Products] Products updated via socket, total:', productsData.length);
        })
        .catch(err => {
          console.error('❌ [Products] Error fetching products via socket:', err);
        });
    };

    socket.on('inventory:updated', handleInventoryUpdate);
    console.log('🔌 [Products] Socket listener attached');

    return () => {
      console.log('🔌 [Products] Cleaning up socket listener');
      socket.off('inventory:updated', handleInventoryUpdate);
    };
  }, [mainWarehouse]);

  const fetchMainWarehouse = async () => {
    try {
      const res = await api.get('/warehouses');
      const main = res.data.find((w: Warehouse) => w.name === 'Asosiy ombor');
      if (main) {
        setMainWarehouse(main);
      } else {
        const newMain = await api.post('/warehouses', { name: 'Asosiy ombor', address: '' });
        setMainWarehouse(newMain.data);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setLoading(false);
    }
  };

  const fetchProducts = useCallback(async () => {
    if (!mainWarehouse) return;
    
    try {
      setLoading(true);
      const res = await api.get(`/inventory/warehouse/${mainWarehouse._id}`);
      const productsData = res.data.map((inv: any) => ({
        ...inv.product,
        quantity: inv.quantity,
        minStock: inv.minStock,
        _inventoryId: inv._id,
        _warehouseId: mainWarehouse._id
      }));
      
      productsData.sort((a: any, b: any) => {
        const codeA = parseInt(a.code) || 0;
        const codeB = parseInt(b.code) || 0;
        return codeB - codeA;
      });
      
      setProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [mainWarehouse]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 8 - images.length;
    if (remainingSlots <= 0) {
      showAlert('Maksimum 8 ta rasm yuklash mumkin', 'Ogohlantirish', 'warning');
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
      showAlert('Rasmlarni yuklashda xatolik', 'Xatolik', 'danger');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = useCallback(async (imagePath: string) => {
    try {
      await api.delete('/products/delete-image', { data: { imagePath } });
      setImages(prev => prev.filter(img => img !== imagePath));
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    if (nameError) {
      showAlert('Bu nomli mahsulot allaqachon mavjud', 'Dublikat xatolik', 'danger');
      return;
    }
    
    if (editingProduct && codeError) {
      showAlert('Bu kod allaqachon band', 'Dublikat xatolik', 'danger');
      return;
    }
    
    if (!mainWarehouse) {
      showAlert('Asosiy ombor topilmadi', 'Xatolik', 'danger');
      return;
    }
    
    try {
      const data = {
        code: trimmedCode,
        name: trimmedName,
        costPrice: Number(formData.costPrice),
        price: Number(formData.wholesalePrice),
        dona_narx: formData.donaNarx ? Number(formData.donaNarx) : undefined,
        quantity: Number(formData.quantity),
        warehouse: mainWarehouse._id,
        images
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
      const errorMsg = err.response?.data?.message || 'Xatolik yuz berdi';
      showAlert(errorMsg, 'Xatolik', 'danger');
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
    setShowQRModal(false);
    setShowPrintModal(false);
    
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      costPrice: String((product as any).costPrice || 0),
      wholesalePrice: String(product.price),
      donaNarx: String((product as any).dona_narx || ''),
      quantity: String(product.quantity)
    });
    
    setImages((product as any).images || []);
    setCodeError('');
    setNameError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ code: '', name: '', costPrice: '', wholesalePrice: '', donaNarx: '', quantity: '' });
    setImages([]);
    setCodeError('');
    setNameError('');
  };

  const openAddModal = async () => {
    setShowQRModal(false);
    setShowPrintModal(false);
    
    try {
      const warehouseParam = mainWarehouse?._id ? `?warehouseId=${mainWarehouse._id}` : '';
      const res = await api.get(`/products/next-code${warehouseParam}`);
      setFormData({ code: res.data.code, name: '', costPrice: '', wholesalePrice: '', donaNarx: '', quantity: '' });
    } catch (err) {
      console.error('Error getting next code:', err);
    }
    setImages([]);
    setCodeError('');
    setNameError('');
    setShowModal(true);
  };

  const checkCodeExists = async (code: string) => {
    if (!code) return;
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
      try {
        const res = await api.get(`/products/check-code/${code}`);
        if (res.data.exists) {
          try {
            const warehouseParam = mainWarehouse?._id ? `?warehouseId=${mainWarehouse._id}` : '';
            const nextCodeRes = await api.get(`/products/next-code${warehouseParam}`);
            setFormData(prev => ({ ...prev, code: nextCodeRes.data.code }));
            setCodeError('');
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
    setShowPrintModal(false);
    setShowModal(false);
    setSelectedProduct(product);
    setShowQRModal(true);
  };

  const openPrintModal = (product: Product) => {
    setShowQRModal(false);
    setShowModal(false);
    setPrintProduct(product);
    setPrintQuantity('1');
    setPrintCodePrefix('');
    setShowPrintModal(true);
  };

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
    const displayPrice = printCodePrefix.trim() 
      ? `${printCodePrefix.trim()},${price.toString().replace(/\s/g, '')}` 
      : price.toLocaleString();
    
    const labelsHtml = Array(qty).fill(`
      <div class="label">
        ${showPriceOnLabel ? `<div class="price-row"><div class="price">${displayPrice} so'm</div></div>` : ''}
        <div class="content-row">
          <div class="left-section">
            <div class="name">${uz(printProduct.name)}</div>
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
  <title>Ценник - ${uz(printProduct.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: 58mm 40mm; margin: 0; }
    @media print {
      body { width: 58mm; }
      .label { page-break-after: always; }
      .label:last-child { page-break-after: auto; }
    }
    body { font-family: Arial, sans-serif; background: white; }
    .label { width: 58mm; height: 40mm; padding: 2mm; display: flex; flex-direction: column; justify-content: center; }
    .price-row { width: 100%; text-align: center; margin-bottom: 2mm; }
    .price { font-size: 22pt; font-weight: bold; color: #000; line-height: 1; white-space: nowrap; display: inline-block; }
    .content-row { display: flex; align-items: center; justify-content: space-between; gap: 2mm; }
    .left-section { flex: 0 0 28mm; max-width: 28mm; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .right-section { flex: 0 0 24mm; flex-shrink: 0; }
    .name { 
      font-size: 11pt; 
      font-weight: bold; 
      margin-bottom: 1mm; 
      line-height: 1.2; 
      color: #000; 
      word-wrap: break-word; 
      overflow-wrap: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: 13mm;
    }
    .code { font-size: 11pt; color: #333; font-weight: 600; }
    .qr-container { width: 24mm; height: 24mm; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .qr-container img { width: 100%; height: 100%; display: block; }
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

  const filteredProducts = useMemo(() => {
    return searchProducts(products, debouncedSearchQuery);
  }, [products, debouncedSearchQuery]);

  const getProductImage = useCallback((product: any) => {
    if (product.images && product.images.length > 0) {
      return `${API_URL}${product.images[0]}`;
    }
    return null;
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
      {AlertComponent}
      <Header 
        title={tKey("Tovarlar")}
        showSearch 
        onSearch={setSearchQuery}
        actions={
          <button onClick={openAddModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{tKey("Yangi tovar")}</span>
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-6 max-w-[1800px] mx-auto">
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner text-brand-600 w-8 h-8 mb-4" />
              <p className="text-surface-500">{tKey("Yuklanmoqda...")}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">{tKey("Tovarlar topilmadi")}</h3>
              <p className="text-surface-500 text-center max-w-md mb-6">
                {searchQuery ? tKey('Qidiruv bo\'yicha tovarlar topilmadi') : tKey('Birinchi tovarni qo\'shing')}
              </p>
              <button onClick={openAddModal} className="btn-primary">{tKey("Tovar qo'shish")}</button>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <div className="table-header">
                  <div className="grid gap-4 px-6 py-4" style={{gridTemplateColumns: 'auto 80px 1fr 110px 110px 110px 90px 140px'}}>
                    <span className="table-header-cell">Rasm</span>
                    <span className="table-header-cell">Kod</span>
                    <span className="table-header-cell">Nomi</span>
                    <span className="table-header-cell text-right">Tan narxi</span>
                    <span className="table-header-cell text-right">Optom narxi</span>
                    <span className="table-header-cell text-right">Dona narxi</span>
                    <span className="table-header-cell text-center">Miqdori</span>
                    <span className="table-header-cell text-center">Amallar</span>
                  </div>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {filteredProducts.map(product => (
                    <ProductRow
                      key={product._id}
                      product={product}
                      onQR={openQRModal}
                      onPrint={openPrintModal}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                      getProductImage={getProductImage}
                      uz={uz}
                      formatNumber={formatNumber}
                    />
                  ))}
                </div>
              </div>
              <div className="lg:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onQR={openQRModal}
                    onPrint={openPrintModal}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    getProductImage={getProductImage}
                    uz={uz}
                    formatNumber={formatNumber}
                  />
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
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5 sticky top-0 z-10 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{editingProduct ? tKey('Tovarni tahrirlash') : tKey('Yangi tovar')}</h3>
                    <p className="text-sm text-white/80">{editingProduct ? tKey('Ma\'lumotlarni yangilang') : tKey('Yangi tovar qo\'shing')}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200" title={tKey("Yopish")}>
                  <X className="w-6 h-6" strokeWidth={3} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="text-sm font-bold text-surface-700 mb-3 flex items-center gap-2">
                  <Image className="w-4 h-4 text-brand-600" />
                  {tKey("Rasmlar (maksimal 8 ta)")}
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
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
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
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2 block">{tKey("Miqdori")}</label>
                  <input 
                    type="text" 
                    className="input text-center font-semibold" 
                    placeholder="0" 
                    value={formData.quantity} 
                    onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value.replace(/[^0-9]/g, '') }))} 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">
                  {tKey("Nomi")} <span className="text-danger-500">*</span>
                </label>
                <input 
                  type="text" 
                  className={`input ${nameError ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
                  placeholder={tKey("Tovar nomi")} 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  onBlur={e => checkNameExists(e.target.value)}
                  required 
                />
                {nameError && (
                  <p className="text-sm text-danger-600 mt-1">{nameError}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-2 block">{tKey("Tan narxi (so'm)")}</label>
                  <input type="text" className="input" placeholder="0" value={formData.costPrice} onChange={e => setFormData(prev => ({ ...prev, costPrice: e.target.value.replace(/[^0-9]/g, '') }))} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-2 block">{tKey("Optom narxi (so'm)")}</label>
                  <input type="text" className="input" placeholder="0" value={formData.wholesalePrice} onChange={e => setFormData(prev => ({ ...prev, wholesalePrice: e.target.value.replace(/[^0-9]/g, '') }))} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-2 block">{tKey("Dona narxi (ixtiyoriy)")}</label>
                <input type="text" className="input" placeholder="0" value={formData.donaNarx} onChange={e => setFormData(prev => ({ ...prev, donaNarx: e.target.value.replace(/[^0-9]/g, '') }))} />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1 font-bold">{tKey("Bekor qilish")}</button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl" 
                  disabled={!!(nameError || (editingProduct && codeError))}
                >
                  {tKey("Saqlash")}
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
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">{tKey("QR Kod")}</h3>
                </div>
                <button onClick={() => setShowQRModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200" title={tKey("Yopish")}>
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
                {tKey("Yuklab olish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrintModal && printProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPrintModal(false)} />
          <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn p-6 border-2 border-surface-100 dark:border-surface-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{tKey("Ценник чоп этиш")}</h3>
              <button onClick={() => setShowPrintModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 transition-all hover:scale-110 hover:rotate-90 duration-200" title={tKey("Yopish")}>
                <X className="w-6 h-6" strokeWidth={3} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-700 dark:to-surface-800 rounded-2xl p-4 flex items-center justify-center gap-20 border-2 border-surface-200 dark:border-surface-600">
                <div>
                  <p className="font-bold text-lg text-surface-900 dark:text-white">{uz(printProduct.name)}</p>
                  <p className="font-semibold text-surface-600 dark:text-surface-400">Code: {printProduct.code}</p>
                  <p className="text-sm font-semibold text-surface-700 dark:text-surface-300 mt-1">
                    Narx: {printProduct.price.toLocaleString()} so'm
                  </p>
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
                <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">{tKey("Kod prefiksi (ixtiyoriy)")}</label>
                <input 
                  type="number" 
                  className="input text-center font-bold text-lg" 
                  placeholder={tKey("Masalan: 1, 2, 3...")}
                  value={printCodePrefix}
                  onChange={e => setPrintCodePrefix(e.target.value)}
                />
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 text-center">
                  {printCodePrefix.trim() 
                    ? `${tKey("Ценникда")}: ${printCodePrefix.trim()},${printProduct.price.toString().replace(/\s/g, '')} ${tKey("so'm")}` 
                    : `${tKey("Ценникда")}: ${printProduct.price.toLocaleString()} ${tKey("so'm")}`}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">{tKey("Сони")}</label>
                <input 
                  type="number" 
                  className="input text-center font-bold text-lg" 
                  min="1"
                  max="50"
                  value={printQuantity}
                  onChange={e => setPrintQuantity(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-700 rounded-xl border-2 border-surface-200 dark:border-surface-600">
                <input
                  type="checkbox"
                  id="showPrice"
                  checked={showPriceOnLabel}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowPriceOnLabel(checked);
                    localStorage.setItem('showPriceOnLabel', JSON.stringify(checked));
                  }}
                  className="w-5 h-5 rounded border-2 border-surface-300 dark:border-surface-500 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="showPrice" className="flex-1 text-sm font-bold text-surface-700 dark:text-surface-300 cursor-pointer select-none">
                  {tKey("Narxni ko'rsatish")}
                </label>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPrintModal(false)} 
                  className="btn-secondary flex-1 font-bold"
                >
                  {tKey("Бекор қилиш")}
                </button>
                <button 
                  type="button" 
                  onClick={handlePrint} 
                  className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl"
                >
                  <Printer className="w-4 h-4" />
                  {tKey("Чоп этиш")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
