import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Plus, Package, X, Edit, Trash2, Search, QrCode, Download, Printer, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { Warehouse, Product } from '../../types';
import api from '../../utils/api';
import { formatNumber, formatInputNumber, parseNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../context/LanguageContext';
import { searchProducts } from '../../utils/productSearch';
import { useWarehouses } from '../../context/WarehousesContext';

export default function WarehouseDetail() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const { t } = useLanguage();
 const { showAlert, showConfirm, AlertComponent } = useAlert();
 const { warehouses: allWarehouses } = useWarehouses();

 const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
 const [products, setProducts] = useState<Product[]>([]);
 const [loading, setLoading] = useState(true);
 const [productsLoading, setProductsLoading] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');

 // Add/Edit product modal
 const [showAddProductModal, setShowAddProductModal] = useState(false);
 const [editingProduct, setEditingProduct] = useState<Product | null>(null);
 const [productFormData, setProductFormData] = useState({
  code: '', name: '', costPrice: '', wholesalePrice: '', quantity: ''
 });
 const [packageData, setPackageData] = useState({
  packageCount: '', unitsPerPackage: '', totalCost: ''
 });
 const [codeError, setCodeError] = useState('');

 // QR modal
 const [showQRModal, setShowQRModal] = useState(false);
 const [qrProduct, setQrProduct] = useState<Product | null>(null);

 // Print modal
 const [showPrintModal, setShowPrintModal] = useState(false);
 const [printProduct, setPrintProduct] = useState<Product | null>(null);
 const [printQuantity, setPrintQuantity] = useState('1');
 const [printCodePrefix, setPrintCodePrefix] = useState('');
 const [printing, setPrinting] = useState(false);
 const [showPriceOnLabel, setShowPriceOnLabel] = useState(() => {
  const saved = localStorage.getItem('showPriceOnLabel');
  return saved ? JSON.parse(saved) : true;
 });

 // Transfer modal
 const [showTransferModal, setShowTransferModal] = useState(false);
 const [transferProduct, setTransferProduct] = useState<Product | null>(null);
 const [transferToWarehouse, setTransferToWarehouse] = useState('');
 const [transferQuantity, setTransferQuantity] = useState('');
 const [transferring, setTransferring] = useState(false);

 // Inline editing
 const [editingCell, setEditingCell] = useState<{productId: string, field: string} | null>(null);
 const [editingValue, setEditingValue] = useState('');
 const editInputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
  if (id) {
   fetchWarehouse();
   fetchProducts();
  }
 }, [id]);

 const fetchWarehouse = async () => {
  try {
   const res = await api.get(`/warehouses/${id}`);
   setWarehouse(res.data);
  } catch (err) {
   console.error('Error fetching warehouse:', err);
   navigate('/admin/warehouses');
  } finally {
   setLoading(false);
  }
 };

 const fetchProducts = async () => {
  setProductsLoading(true);
  try {
   const res = await api.get(`/inventory/warehouse/${id}`);
   const mapped = res.data.map((inv: any) => ({
    ...inv.product,
    quantity: inv.quantity,
    minStock: inv.minStock
   }));
   setProducts(mapped);
  } catch (err) {
   console.error('Error fetching products:', err);
  } finally {
   setProductsLoading(false);
  }
 };

 // --- Product CRUD ---
 const handleProductSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!warehouse) return;

  let finalQuantity = 0;
  const finalCostPrice = Number(productFormData.costPrice) || 0;

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
    warehouse: warehouse._id
   };
   if (editingProduct) {
    await api.put(`/products/${editingProduct._id}`, data);
   } else {
    await api.post('/products', data);
   }
   fetchProducts();
   closeAddProductModal();
  } catch (err: any) {
   showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
  }
 };

 const handleDeleteProduct = async (productId: string) => {
  const confirmed = await showConfirm(t("Tovarni o'chirishni tasdiqlaysizmi?"), t("O'chirish"));
  if (!confirmed) return;
  try {
   await api.delete(`/products/${productId}`);
   fetchProducts();
  } catch (err) {
   console.error('Error deleting product:', err);
  }
 };

 const openAddProductModal = async () => {
  setShowQRModal(false);
  setShowPrintModal(false);
  setShowTransferModal(false);
  try {
   const warehouseParam = id ? `?warehouseId=${id}` : '';
   const res = await api.get(`/products/next-code${warehouseParam}`);
   setProductFormData({ code: res.data.code, name: '', costPrice: '', wholesalePrice: '', quantity: '' });
  } catch (err) {
   console.error('Error getting next code:', err);
  }
  setPackageData({ packageCount: '', unitsPerPackage: '', totalCost: '' });
  setCodeError('');
  setShowAddProductModal(true);
 };

 const openEditProductModal = (product: Product) => {
  setShowQRModal(false);
  setShowPrintModal(false);
  setShowTransferModal(false);
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

 const closeAddProductModal = () => {
  setShowAddProductModal(false);
  setEditingProduct(null);
  setProductFormData({ code: '', name: '', costPrice: '', wholesalePrice: '', quantity: '' });
  setPackageData({ packageCount: '', unitsPerPackage: '', totalCost: '' });
  setCodeError('');
 };

 const checkCodeExists = async (code: string) => {
  if (!code) return;
  if (editingProduct) {
   try {
    const res = await api.get(`/products/check-code/${code}?excludeId=${editingProduct._id}`);
    setCodeError(res.data.exists ? `Kod "${code}" allaqachon mavjud` : '');
   } catch (err) {
    console.error('Error checking code:', err);
   }
  } else {
   try {
    const res = await api.get(`/products/check-code/${code}`);
    if (res.data.exists) {
     try {
      const nextCodeRes = await api.get('/products/next-code');
      setProductFormData(prev => ({ ...prev, code: nextCodeRes.data.code }));
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

 // --- Inline Editing ---
 const startInlineEdit = useCallback((product: Product, field: 'costPrice' | 'price' | 'dona_narx' | 'quantity') => {
  if (editingCell && editingValue !== '' && (editingCell.productId !== product._id || editingCell.field !== field)) {
   const numValue = Number(editingValue.replace(/\s/g, ''));
   if (!isNaN(numValue) && numValue >= 0) {
    const oldProduct = products.find(p => p._id === editingCell.productId);
    if (oldProduct) {
     const oldValue = oldProduct[editingCell.field as keyof Product];
     setProducts(prev => prev.map(p => p._id === editingCell.productId ? { ...p, [editingCell.field]: numValue } : p));
     const updateData: Record<string, number> = { [editingCell.field]: numValue };
     api.put(`/products/${editingCell.productId}`, updateData).catch(() => {
      setProducts(prev => prev.map(p => p._id === editingCell.productId ? { ...p, [editingCell.field]: oldValue } : p));
     });
    }
   }
  }

  let currentValue = '';
  if (field === 'quantity') currentValue = String(product.quantity);
  else if (field === 'costPrice') currentValue = String((product as any).costPrice || 0);
  else if (field === 'price') currentValue = String(product.price);
  else if (field === 'dona_narx') currentValue = String((product as any).dona_narx || 0);

  setEditingCell({ productId: product._id, field });
  setEditingValue(currentValue);
  setTimeout(() => { editInputRef.current?.focus(); editInputRef.current?.select(); }, 0);
 }, [editingCell, editingValue, products]);

 const saveInlineEdit = useCallback(async (productId: string, field: string, value: string) => {
  const numValue = Number(value.replace(/\s/g, ''));
  if (isNaN(numValue) || numValue < 0) {
   showAlert("Noto'g'ri qiymat", 'Xatolik', 'danger');
   setEditingCell(null);
   return;
  }

  const oldProduct = products.find(p => p._id === productId);
  if (!oldProduct) return;
  const oldValue = oldProduct[field as keyof Product];

  setProducts(prev => prev.map(p => p._id === productId ? { ...p, [field]: numValue } : p));
  setEditingCell(null);

  try {
   const updateData: Record<string, number | string> = { [field]: numValue };
   if (field === 'quantity' && id) updateData.warehouse = id;
   await api.put(`/products/${productId}`, updateData);
  } catch (err: any) {
   showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
   setProducts(prev => prev.map(p => p._id === productId ? { ...p, [field]: oldValue } : p));
  }
 }, [showAlert, products, id]);

 const cancelInlineEdit = useCallback(() => {
  setEditingCell(null);
  setEditingValue('');
 }, []);

 // --- Transfer ---
 const openTransferModal = (product: Product) => {
  setShowQRModal(false);
  setShowPrintModal(false);
  setShowAddProductModal(false);
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
   showAlert("Barcha maydonlarni to'ldiring", 'Xatolik', 'danger');
   return;
  }

  const quantity = Number(transferQuantity);
  if (quantity <= 0) {
   showAlert("Miqdor 0 dan katta bo'lishi kerak", 'Xatolik', 'danger');
   return;
  }

  if (quantity > transferProduct.quantity) {
   showAlert(`Maksimal miqdor: ${transferProduct.quantity}`, 'Xatolik', 'danger');
   return;
  }

  if (id === transferToWarehouse) {
   showAlert("Bir xil omborga o'tkazish mumkin emas", 'Xatolik', 'danger');
   return;
  }

  const targetName = allWarehouses.find(w => w._id === transferToWarehouse)?.name;
  const confirmed = await showConfirm(
   `${transferProduct.name}\n${quantity} dona\n${warehouse?.name} → ${targetName}`,
   'Transferni tasdiqlaysizmi?'
  );

  if (!confirmed) return;

  setTransferring(true);
  try {
   await api.post('/inventory/transfer', {
    productId: transferProduct._id,
    fromWarehouseId: id,
    toWarehouseId: transferToWarehouse,
    quantity: quantity,
    notes: `Transfer from Warehouse Detail page`
   });

   showAlert('Transfer muvaffaqiyatli!', 'Muvaffaqiyat', 'success');
   closeTransferModal();
   fetchProducts();
  } catch (err: any) {
   showAlert(err.response?.data?.message || 'Transfer xatosi', 'Xatolik', 'danger');
  } finally {
   setTransferring(false);
  }
 };

 // --- QR ---
 const openQRModal = (product: Product) => {
  setShowPrintModal(false);
  setShowTransferModal(false);
  setShowAddProductModal(false);
  setQrProduct(product);
  setShowQRModal(true);
 };

 const downloadQR = () => {
  if (!qrProduct) return;
  const svg = document.getElementById('qr-code-svg-warehouse-detail');
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

 // --- Print ---
 const openPrintModal = (product: Product) => {
  setShowQRModal(false);
  setShowTransferModal(false);
  setShowAddProductModal(false);
  setPrintProduct(product);
  setPrintQuantity('1');
  setPrintCodePrefix('');
  setPrinting(false);
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

  const printHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${printProduct.name}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}@page{size:58mm 40mm;margin:0}@media print{body{width:58mm}.label{page-break-after:always}.label:last-child{page-break-after:auto}}body{font-family:Arial,sans-serif;background:white}.label{width:58mm;height:40mm;padding:2mm;display:flex;flex-direction:column;justify-content:center}.content-row{display:flex;align-items:center;justify-content:space-between;gap:2mm}.left-section{flex:0 0 28mm;max-width:28mm;display:flex;flex-direction:column;justify-content:center}.right-section{flex:0 0 24mm}.name{font-size:15pt;font-weight:bold;margin-bottom:1.5mm;line-height:1.1;color:#000;word-wrap:break-word}.code{font-size:13pt;color:#333;font-weight:600}.qr-container{width:24mm;height:24mm;flex-shrink:0;display:flex;align-items:center;justify-content:center}.qr-container img{width:100%;height:100%;display:block}</style>
</head><body>${labelsHtml}<script>window.onload=function(){var imgs=document.querySelectorAll('img');var loaded=0;imgs.forEach(function(img){if(img.complete){loaded++;if(loaded===imgs.length)setTimeout(function(){window.print()},100)}else{img.onload=function(){loaded++;if(loaded===imgs.length)setTimeout(function(){window.print()},100)};img.onerror=function(){loaded++;if(loaded===imgs.length)setTimeout(function(){window.print()},100)}}});window.onafterprint=function(){window.close()}};</script></body></html>`;

  printWindow.document.write(printHtml);
  printWindow.document.close();
  setShowPrintModal(false);
 };

 if (loading) {
  return (
   <div className="min-h-screen bg-surface-50 flex justify-center items-center">
    <div className="spinner text-brand-600 w-8 h-8" />
   </div>
  );
 }

 if (!warehouse) return null;

 const filteredProducts = searchProducts(products, searchQuery);

 return (
  <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
   {AlertComponent}
   <Header
    title={warehouse.name}
    actions={
     <div className="flex items-center gap-2">
      <button onClick={() => navigate('/admin/warehouses')} className="btn-secondary flex items-center gap-2">
       <ArrowLeft className="w-4 h-4" />
       <span className="hidden sm:inline">{t("Orqaga")}</span>
      </button>
      <button onClick={openAddProductModal} className="btn-primary flex items-center gap-2">
       <Plus className="w-4 h-4" />
       <span className="hidden sm:inline">{t("Tovar qo'shish")}</span>
      </button>
     </div>
    }
   />

   {/* Search */}
   <div className="p-4 lg:p-6 pb-0">
    <div className="relative flex items-center max-w-md">
     <Search className="absolute left-3 w-4 h-4 text-surface-400 pointer-events-none" />
     <input
      type="text"
      placeholder={t("Mahsulot nomi yoki kodi...")}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="input pl-10"
     />
    </div>
    <div className="mt-2 text-sm text-surface-500">
     {filteredProducts.length} {t("ta tovar")}
    </div>
   </div>

   {/* Products Table */}
   <div className="p-4 lg:p-6 space-y-6 max-w-[1800px] mx-auto">
    <div className="card p-0 overflow-hidden">
     {productsLoading ? (
      <div className="flex flex-col items-center justify-center py-20">
       <div className="spinner text-brand-600 w-8 h-8 mb-4" />
       <p className="text-surface-500">Yuklanmoqda...</p>
      </div>
     ) : filteredProducts.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-16 px-4">
       <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-surface-400" />
       </div>
       <h3 className="text-lg font-semibold text-surface-900 mb-2">{products.length === 0 ? t("Tovarlar yo'q") : "Tovarlar topilmadi"}</h3>
       <p className="text-surface-500 text-center max-w-md mb-6">
        {searchQuery ? "Qidiruv bo'yicha tovarlar topilmadi" : t("Bu omborga tovar qo'shing")}
       </p>
       {!searchQuery && <button onClick={openAddProductModal} className="btn-primary">{t("Tovar qo'shish")}</button>}
      </div>
     ) : (
      <>
       {/* DESKTOP TABLE */}
       <div className="hidden lg:block">
        <div className="table-header">
         <div className="grid gap-4 px-6 py-4" style={{gridTemplateColumns: '80px 1fr 110px 110px 110px 90px 160px'}}>
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
          <div key={product._id} className="grid gap-4 px-6 py-4 items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors" style={{gridTemplateColumns: '80px 1fr 110px 110px 110px 90px 160px'}}>
           <div>
            <span className="font-mono text-sm bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-lg">{product.code}</span>
           </div>
           <div className="min-w-0">
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{product.name}</p>
           </div>
           <div
            onClick={() => startInlineEdit(product, 'costPrice')}
            className="text-right cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg px-2 py-1 transition-all"
            title="Tan narxini o'zgartirish"
           >
            {editingCell?.productId === product._id && editingCell?.field === 'costPrice' ? (
             <input ref={editInputRef} type="text"
              className="w-full text-left font-semibold bg-blue-50 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-0"
              value={formatInputNumber(editingValue)}
              onChange={(e) => setEditingValue(parseNumber(e.target.value))}
              onBlur={() => saveInlineEdit(product._id, 'costPrice', editingValue)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(product._id, 'costPrice', editingValue); if (e.key === 'Escape') cancelInlineEdit(); }}
              onClick={(e) => e.stopPropagation()}
             />
            ) : (
             <p className="font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{formatNumber((product as any).costPrice || 0)} <span className="text-sm text-neutral-500">so'm</span></p>
            )}
           </div>
           <div
            onClick={() => startInlineEdit(product, 'price')}
            className="text-right cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg px-2 py-1 transition-all"
            title="Optom narxini o'zgartirish"
           >
            {editingCell?.productId === product._id && editingCell?.field === 'price' ? (
             <input ref={editInputRef} type="text"
              className="w-full text-left font-semibold bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-500 rounded px-2 py-1 focus:outline-none focus:ring-0 text-red-700 dark:text-red-300"
              value={formatInputNumber(editingValue)}
              onChange={(e) => setEditingValue(parseNumber(e.target.value))}
              onBlur={() => saveInlineEdit(product._id, 'price', editingValue)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(product._id, 'price', editingValue); if (e.key === 'Escape') cancelInlineEdit(); }}
              onClick={(e) => e.stopPropagation()}
             />
            ) : (
             <p className="font-semibold !text-red-600 dark:!text-red-400 whitespace-nowrap">{formatNumber(product.price)} <span className="text-sm !text-red-600 dark:!text-red-400">so'm</span></p>
            )}
           </div>
           <div
            onClick={() => startInlineEdit(product, 'dona_narx')}
            className="text-right cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg px-2 py-1 transition-all"
            title="Dona narxini o'zgartirish"
           >
            {editingCell?.productId === product._id && editingCell?.field === 'dona_narx' ? (
             <input ref={editInputRef} type="text"
              className="w-full text-left font-semibold bg-blue-50 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-0"
              value={formatInputNumber(editingValue)}
              onChange={(e) => setEditingValue(parseNumber(e.target.value))}
              onBlur={() => saveInlineEdit(product._id, 'dona_narx', editingValue)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(product._id, 'dona_narx', editingValue); if (e.key === 'Escape') cancelInlineEdit(); }}
              onClick={(e) => e.stopPropagation()}
             />
            ) : (
             <p className="font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{formatNumber((product as any).dona_narx || 0)} <span className="text-sm text-neutral-500">so'm</span></p>
            )}
           </div>
           <div
            onClick={() => startInlineEdit(product, 'quantity')}
            className="text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg px-2 py-1 transition-all"
            title="Miqdorni o'zgartirish"
           >
            {editingCell?.productId === product._id && editingCell?.field === 'quantity' ? (
             <input ref={editInputRef} type="text"
              className="w-full text-left font-semibold bg-blue-50 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-0"
              value={formatInputNumber(editingValue)}
              onChange={(e) => setEditingValue(parseNumber(e.target.value))}
              onBlur={() => saveInlineEdit(product._id, 'quantity', editingValue)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(product._id, 'quantity', editingValue); if (e.key === 'Escape') cancelInlineEdit(); }}
              onClick={(e) => e.stopPropagation()}
             />
            ) : (
             <span className={`font-semibold ${
              product.quantity === 0 ? 'text-red-600 dark:text-red-400' :
              product.quantity <= (product.minStock || 5) ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'
             }`}>{product.quantity}</span>
            )}
           </div>
           <div className="flex items-center justify-center gap-2">
            <button onClick={() => openTransferModal(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all" title="Omborga o'tkazish">
             <ArrowRightLeft className="w-4 h-4" />
            </button>
            <button onClick={() => openQRModal(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all" title="QR kod">
             <QrCode className="w-4 h-4" />
            </button>
            <button onClick={() => openPrintModal(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all" title="Cennik chop etish">
             <Printer className="w-4 h-4" />
            </button>
            <button onClick={() => openEditProductModal(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-all" title="Tahrirlash">
             <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => handleDeleteProduct(product._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all" title="O'chirish">
             <Trash2 className="w-4 h-4" />
            </button>
           </div>
          </div>
         ))}
        </div>
       </div>

       {/* MOBILE CARDS */}
       <div className="lg:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
        {filteredProducts.map(product => (
         <div key={product._id} className="p-4 rounded-xl">
          <div className="flex items-start gap-3 mb-3">
           <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-8 h-8 text-neutral-400" />
           </div>
           <div className="flex-1 min-w-0">
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">{product.name}</h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">Kod: {product.code}</p>
           </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
           <div
            onClick={() => startInlineEdit(product, 'costPrice')}
            className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
           >
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Tan narxi</p>
            {editingCell?.productId === product._id && editingCell?.field === 'costPrice' ? (
             <input ref={editInputRef} type="text"
              className="w-full text-left text-sm font-bold bg-blue-50 dark:bg-blue-900/30 border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-0"
              value={formatInputNumber(editingValue)}
              onChange={(e) => setEditingValue(parseNumber(e.target.value))}
              onBlur={() => saveInlineEdit(product._id, 'costPrice', editingValue)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(product._id, 'costPrice', editingValue); if (e.key === 'Escape') cancelInlineEdit(); }}
              onClick={(e) => e.stopPropagation()}
             />
            ) : (
             <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatNumber((product as any).costPrice || 0)}</p>
            )}
           </div>
           <div
            onClick={() => startInlineEdit(product, 'price')}
            className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
           >
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Optom</p>
            {editingCell?.productId === product._id && editingCell?.field === 'price' ? (
             <input ref={editInputRef} type="text"
              className="w-full text-left text-sm font-bold bg-red-50 dark:bg-red-900/30 border border-red-400 rounded px-1 py-0.5 focus:outline-none focus:ring-0 text-red-700 dark:text-red-300"
              value={formatInputNumber(editingValue)}
              onChange={(e) => setEditingValue(parseNumber(e.target.value))}
              onBlur={() => saveInlineEdit(product._id, 'price', editingValue)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(product._id, 'price', editingValue); if (e.key === 'Escape') cancelInlineEdit(); }}
              onClick={(e) => e.stopPropagation()}
             />
            ) : (
             <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatNumber(product.price)}</p>
            )}
           </div>
           <div
            onClick={() => startInlineEdit(product, 'dona_narx')}
            className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
           >
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Dona</p>
            {editingCell?.productId === product._id && editingCell?.field === 'dona_narx' ? (
             <input ref={editInputRef} type="text"
              className="w-full text-left text-sm font-bold bg-blue-50 dark:bg-blue-900/30 border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-0"
              value={formatInputNumber(editingValue)}
              onChange={(e) => setEditingValue(parseNumber(e.target.value))}
              onBlur={() => saveInlineEdit(product._id, 'dona_narx', editingValue)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(product._id, 'dona_narx', editingValue); if (e.key === 'Escape') cancelInlineEdit(); }}
              onClick={(e) => e.stopPropagation()}
             />
            ) : (
             <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatNumber((product as any).dona_narx || 0)}</p>
            )}
           </div>
           <div
            onClick={() => startInlineEdit(product, 'quantity')}
            className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
           >
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Miqdor</p>
            {editingCell?.productId === product._id && editingCell?.field === 'quantity' ? (
             <input ref={editInputRef} type="text"
              className="w-full text-left text-sm font-bold bg-blue-50 dark:bg-blue-900/30 border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-0"
              value={formatInputNumber(editingValue)}
              onChange={(e) => setEditingValue(parseNumber(e.target.value))}
              onBlur={() => saveInlineEdit(product._id, 'quantity', editingValue)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(product._id, 'quantity', editingValue); if (e.key === 'Escape') cancelInlineEdit(); }}
              onClick={(e) => e.stopPropagation()}
             />
            ) : (
             <p className={`text-sm font-bold ${
              product.quantity === 0 ? 'text-red-600 dark:text-red-400' :
              product.quantity <= (product.minStock || 5) ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'
             }`}>{product.quantity}</p>
            )}
           </div>
          </div>
          <div className="flex gap-2">
           <button onClick={() => openTransferModal(product)} className="flex-1 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-all font-medium text-sm">
            <ArrowRightLeft className="w-4 h-4 inline mr-1" />
            Transfer
           </button>
           <button onClick={() => openQRModal(product)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all">
            <QrCode className="w-4 h-4" />
           </button>
           <button onClick={() => openPrintModal(product)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all">
            <Printer className="w-4 h-4" />
           </button>
           <button onClick={() => openEditProductModal(product)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all">
            <Edit className="w-4 h-4" />
           </button>
           <button onClick={() => handleDeleteProduct(product._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
            <Trash2 className="w-4 h-4" />
           </button>
          </div>
         </div>
        ))}
       </div>
      </>
     )}
    </div>
   </div>

   {/* Add/Edit Product Modal */}
   {showAddProductModal && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAddProductModal} />
     <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl w-full max-w-lg relative z-10 animate-scaleIn overflow-hidden border-2 border-red-100 dark:border-neutral-700 max-h-[90vh] flex flex-col">
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 flex-shrink-0">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
         <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
          <Package className="w-6 h-6 text-white" strokeWidth={2.5} />
         </div>
         <div>
          <h3 className="text-xl font-black text-white">
           {editingProduct ? t('Tovarni tahrirlash') : t('Yangi tovar')}
          </h3>
          <p className="text-xs text-white/80">{warehouse.name}</p>
         </div>
        </div>
        <button onClick={closeAddProductModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200">
         <X className="w-6 h-6" strokeWidth={3} />
        </button>
       </div>
      </div>

      <form onSubmit={handleProductSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
       <div>
        <label className="text-sm font-black text-slate-900 dark:text-neutral-300 mb-2 block">Kod</label>
        <input
         type="text"
         className={`w-full px-4 py-3.5 bg-white border-2 rounded-xl text-slate-900 font-semibold focus:ring-4 transition-all ${codeError && editingProduct ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : codeError ? 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500/10' : 'border-slate-300 focus:border-red-500 focus:ring-red-500/10'}`}
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
        <label className="text-sm font-black text-slate-900 dark:text-neutral-300 mb-2 block">Nomi</label>
        <input
         type="text"
         className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
         placeholder="Tovar nomi"
         value={productFormData.name}
         onChange={e => setProductFormData({...productFormData, name: e.target.value})}
         required
         style={{ color: '#000000' }}
        />
       </div>

       <div className="grid grid-cols-2 gap-3">
        <div>
         <label className="text-sm font-black text-slate-900 dark:text-neutral-300 mb-2 block">Tan narxi</label>
         <input
          type="text"
          className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
          placeholder="0"
          value={formatInputNumber(productFormData.costPrice)}
          onChange={e => setProductFormData({...productFormData, costPrice: parseNumber(e.target.value)})}
          style={{ color: '#000000' }}
         />
        </div>
        <div>
         <label className="text-sm font-black text-slate-900 dark:text-neutral-300 mb-2 block">Optom narxi</label>
         <input
          type="text"
          className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
          placeholder="0"
          value={formatInputNumber(productFormData.wholesalePrice)}
          onChange={e => setProductFormData({...productFormData, wholesalePrice: parseNumber(e.target.value)})}
          required
          style={{ color: '#000000' }}
         />
        </div>
       </div>

       <div className="border-t-2 border-neutral-200 dark:border-neutral-700 pt-4">
        <label className="text-sm font-black text-slate-900 dark:text-neutral-300 mb-3 block">Qop ma'lumotlari</label>
        <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-600">
         <div className="grid grid-cols-3 gap-3">
          <div>
           <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Qoplar</label>
           <input type="number" className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all" placeholder="5"
            value={packageData.packageCount}
            onChange={e => setPackageData({...packageData, packageCount: e.target.value})}
            style={{ color: '#000000' }}
           />
          </div>
          <div>
           <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Har qopda</label>
           <input type="number" className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all" placeholder="20"
            value={packageData.unitsPerPackage}
            onChange={e => setPackageData({...packageData, unitsPerPackage: e.target.value})}
            style={{ color: '#000000' }}
           />
          </div>
          <div>
           <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Jami</label>
           <input type="text" className="w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-600 border-2 border-slate-200 rounded-xl text-sm font-bold" placeholder="0"
            value={packageData.packageCount && packageData.unitsPerPackage ? formatNumber(Number(packageData.packageCount) * Number(packageData.unitsPerPackage)) : ''}
            readOnly style={{ color: '#000000' }}
           />
          </div>
         </div>
        </div>
       </div>

       <div className="flex gap-3 pt-2">
        <button type="button" onClick={closeAddProductModal} className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-xl transition-all border-2 border-slate-200">{t("Bekor qilish")}</button>
        <button type="submit" className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={!!(editingProduct && codeError)}>
         {!editingProduct && codeError ? t("Bo'sh kod bilan saqlash") : t("Saqlash")}
        </button>
       </div>
      </form>
     </div>
    </div>
   )}

   {/* Transfer Modal */}
   {showTransferModal && transferProduct && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeTransferModal} />
     <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn border-2 border-red-100">
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
       {/* Product Info */}
       <div className="bg-white rounded-2xl p-4 border-2 border-red-500 shadow-md">
        <div className="flex items-start gap-4">
         <div className="w-20 h-20 bg-red-50 rounded-xl flex items-center justify-center border-2 border-red-300 shadow-md flex-shrink-0">
          <Package className="w-10 h-10 text-red-500" />
         </div>
         <div className="flex-1 min-w-0">
          <p className="font-black text-xl text-slate-900 mb-2 leading-tight">{transferProduct.name}</p>
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
         {warehouse?.name}
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
         {allWarehouses
          .filter(w => w._id !== id)
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

   {/* QR Modal */}
   {showQRModal && qrProduct && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn">
     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQRModal(false)} />
     <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 animate-scaleIn overflow-hidden border-2 border-red-100 dark:border-surface-700">
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
         <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
          <QrCode className="w-6 h-6 text-white" strokeWidth={2.5} />
         </div>
         <h3 className="text-xl font-black text-white">QR Kod</h3>
        </div>
        <button onClick={() => setShowQRModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200">
         <X className="w-6 h-6" strokeWidth={3} />
        </button>
       </div>
      </div>
      <div className="p-6 flex flex-col items-center">
       <div className="bg-white p-4 rounded-xl border border-surface-200 mb-4">
        <QRCodeSVG
         id="qr-code-svg-warehouse-detail"
         value={JSON.stringify({ id: qrProduct._id, code: qrProduct.code, name: qrProduct.name, price: qrProduct.price })}
         size={200} level="H" includeMargin
        />
       </div>
       <div className="text-center mb-4">
        <p className="font-black text-lg text-slate-900">{qrProduct.name}</p>
        <p className="text-sm text-surface-500">Kod: {qrProduct.code}</p>
        <p className="text-sm text-surface-500">Tan narxi: {formatNumber((qrProduct as any).costPrice || 0)} so'm</p>
        <p className="text-sm font-semibold !text-red-600">Optom: {formatNumber(qrProduct.price)} so'm</p>
       </div>
       <button onClick={downloadQR} className="w-full px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
        <Download className="w-5 h-5" /> Yuklab olish
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Print Modal */}
   {showPrintModal && printProduct && (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fadeIn">
     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !printing && setShowPrintModal(false)} />
     <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn border-2 border-red-100">
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
         <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
          <Printer className="w-6 h-6 text-white" strokeWidth={2.5} />
         </div>
         <h3 className="text-xl font-black text-white">{t("Cennik chop etish")}</h3>
        </div>
        <button onClick={() => !printing && setShowPrintModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200" disabled={printing}>
         <X className="w-6 h-6" strokeWidth={3} />
        </button>
       </div>
      </div>
      <div className="p-6 space-y-5">
       <div className="bg-white rounded-2xl p-4 border-2 border-red-500 shadow-md flex items-center justify-center gap-6">
        <div>
         <p className="font-black text-lg text-slate-900">{printProduct.name}</p>
         <p className="text-sm text-slate-500">Kod: {printProduct.code}</p>
         <p className="text-sm font-bold !text-red-600 mt-1">Narx: {printProduct.price.toLocaleString()} so'm</p>
        </div>
        <div className="bg-white p-1 rounded-lg border-2 border-red-300">
         <QRCodeSVG
          value={JSON.stringify({ id: printProduct._id, code: printProduct.code, name: printProduct.name, price: printProduct.price })}
          size={80} level="H"
         />
        </div>
       </div>
       <div>
        <label className="text-sm font-black text-slate-900 mb-2 block">Kod prefiksi (ixtiyoriy)</label>
        <input type="number" className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 font-bold text-center focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all" placeholder="Masalan: 1, 2, 3..."
         value={printCodePrefix} onChange={e => setPrintCodePrefix(e.target.value)} disabled={printing} />
        <p className="text-xs text-slate-500 mt-1 text-center">
         {printCodePrefix.trim()
          ? `Cennikda: ${printCodePrefix.trim()},${printProduct.price.toString().replace(/\s/g, '')} so'm`
          : `Cennikda: ${printProduct.price.toLocaleString()} so'm`}
        </p>
       </div>
       <div>
        <label className="text-sm font-black text-slate-900 mb-2 block">Soni</label>
        <input type="number" className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 font-bold text-xl text-center focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all" min="1" max="50"
         value={printQuantity} onChange={e => setPrintQuantity(e.target.value)} disabled={printing} />
       </div>
       <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
        <input type="checkbox" id="showPriceWarehouseDetail" checked={showPriceOnLabel}
         onChange={(e) => { setShowPriceOnLabel(e.target.checked); localStorage.setItem('showPriceOnLabel', JSON.stringify(e.target.checked)); }}
         className="w-5 h-5 rounded border-2 border-slate-300 text-red-600 focus:ring-2 focus:ring-red-500 cursor-pointer" disabled={printing} />
        <label htmlFor="showPriceWarehouseDetail" className="flex-1 text-sm font-bold text-slate-900 cursor-pointer select-none">
         Narxni ko'rsatish
        </label>
       </div>
       <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => setShowPrintModal(false)} className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-xl transition-all border-2 border-slate-200" disabled={printing}>{t("Bekor qilish")}</button>
        <button type="button" onClick={handlePrint} className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={printing}>
         {printing ? (<><div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" /> Yuborilmoqda...</>) : (<><Printer className="w-5 h-5" strokeWidth={2.5} /> Chop etish</>)}
        </button>
       </div>
      </div>
     </div>
    </div>
   )}

   {/* Mobile FAB */}
   <button
    onClick={openAddProductModal}
    className="lg:hidden fixed right-4 bottom-24 w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:from-red-600 hover:to-red-700 active:scale-95 transition-all z-50"
   >
    <Plus className="w-8 h-8" strokeWidth={3} />
   </button>
  </div>
 );
}