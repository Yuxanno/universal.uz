import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import Header from '../../components/Header';
import { Plus, Package, X, Edit, Trash2, DollarSign, QrCode, Image, Printer, ArrowRightLeft, Search } from 'lucide-react';
import { Product, Warehouse } from '../../types';
import api from '../../utils/api';
import { formatNumber, formatInputNumber, parseNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useDebounce } from '../../hooks/useDebounce';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../context/LanguageContext';

const API_URL = 'https://pos.universalbozor.uz';
const ITEMS_PER_PAGE = 50;
const ROW_HEIGHT = 80;

// Optimized Product Row with React.memo
const ProductRow = memo(({ 
  index,
  style,
  data
}: any) => {
  const { products, handlers, uz, formatNumber } = data;
  const product = products[index];
  
  if (!product) return null;

  return (
    <div style={style} className="px-6 border-b border-gray-100 dark:border-gray-700">
      <div className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <div className="col-span-1">
          {handlers.getProductImage(product) ? (
            <img 
              src={handlers.getProductImage(product)!} 
              alt={product.name} 
              className="w-10 h-10 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
        <div className="col-span-1">
          <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{product.code}</span>
        </div>
        <div className="col-span-2">
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{uz(product.name)}</p>
        </div>
        <div className="col-span-1">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
            {product._warehouseName || 'N/A'}
          </span>
        </div>
        <div className="col-span-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{formatNumber(product.costPrice || 0)}</p>
        </div>
        <div className="col-span-2">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{formatNumber(product.price)}</p>
        </div>
        <div className="col-span-1">
          <span className={`font-semibold ${
            product.quantity === 0 ? 'text-red-600 dark:text-red-400' :
            product.quantity <= 5 ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'
          }`}>{product.quantity}</span>
        </div>
        <div className="col-span-3 flex items-center justify-center gap-2">
          <button onClick={() => handlers.onTransfer(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-all" title="Transfer">
            <ArrowRightLeft className="w-4 h-4" />
          </button>
          <button onClick={() => handlers.onQR(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all" title="QR">
            <QrCode className="w-4 h-4" />
          </button>
          <button onClick={() => handlers.onPrint(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all" title="Print">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={() => handlers.onEdit(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 transition-all">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handlers.onDelete(product._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

ProductRow.displayName = 'ProductRow';

export default function ProductsOptimized() {
  const { tKey, uz } = useLanguage();
  const { showAlert, showConfirm, AlertComponent } = useAlert();
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [mainWarehouse, setMainWarehouse] = useState<Warehouse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<any>(null);
  
  // Modals state
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [printQuantity, setPrintQuantity] = useState('1');

  useEffect(() => {
    fetchMainWarehouse();
  }, []);

  useEffect(() => {
    if (mainWarehouse) {
      fetchInitialProducts();
    }
  }, [mainWarehouse]);

  // Background loading of remaining products
  useEffect(() => {
    if (products.length > 0 && products.length < 1000 && hasMore && !loadingMore) {
      const timer = setTimeout(() => {
        loadMoreProducts();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [products, hasMore, loadingMore]);

  const fetchMainWarehouse = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data);
      const main = res.data.find((w: Warehouse) => w.name === 'Asosiy ombor');
      if (main) {
        setMainWarehouse(main);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setLoading(false);
    }
  };

  const fetchInitialProducts = async () => {
    if (!mainWarehouse) return;
    
    try {
      setLoading(true);
      // Load first batch
      const res = await api.get(`/inventory/warehouse/${mainWarehouse._id}?limit=${ITEMS_PER_PAGE}&skip=0`);
      const productsData = res.data.map((inv: any) => ({
        ...inv.product,
        quantity: inv.quantity,
        minStock: inv.minStock,
        _inventoryId: inv._id,
        _warehouseName: inv.warehouse?.name || 'Asosiy ombor',
        _warehouseId: mainWarehouse._id
      }));
      
      productsData.sort((a: any, b: any) => {
        const codeA = parseInt(a.code) || 0;
        const codeB = parseInt(b.code) || 0;
        return codeB - codeA;
      });
      
      setProducts(productsData);
      setDisplayedProducts(productsData);
      setPage(1);
      setHasMore(productsData.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    if (!mainWarehouse || loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const skip = page * ITEMS_PER_PAGE;
      const res = await api.get(`/inventory/warehouse/${mainWarehouse._id}?limit=${ITEMS_PER_PAGE}&skip=${skip}`);
      
      if (res.data.length === 0) {
        setHasMore(false);
        return;
      }
      
      const newProducts = res.data.map((inv: any) => ({
        ...inv.product,
        quantity: inv.quantity,
        minStock: inv.minStock,
        _inventoryId: inv._id,
        _warehouseName: inv.warehouse?.name || 'Asosiy ombor',
        _warehouseId: mainWarehouse._id
      }));
      
      newProducts.sort((a: any, b: any) => {
        const codeA = parseInt(a.code) || 0;
        const codeB = parseInt(b.code) || 0;
        return codeB - codeA;
      });
      
      setProducts(prev => [...prev, ...newProducts]);
      setDisplayedProducts(prev => [...prev, ...newProducts]);
      setPage(prev => prev + 1);
      setHasMore(newProducts.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Error loading more products:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchQuery) return displayedProducts;
    const query = debouncedSearchQuery.toLowerCase();
    return displayedProducts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query)
    ).slice(0, 100); // Limit search results
  }, [displayedProducts, debouncedSearchQuery]);

  const getProductImage = useCallback((product: Product) => {
    const images = (product as any).images;
    if (images && images.length > 0) {
      return `${API_URL}${images[0]}`;
    }
    return null;
  }, []);

  const openQRModal = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowQRModal(true);
  }, []);

  const openPrintModal = useCallback((product: Product) => {
    setPrintProduct(product);
    setPrintQuantity('1');
    setShowPrintModal(true);
  }, []);

  const handlePrint = useCallback(() => {
    if (!printProduct) return;
    
    const qty = Number(printQuantity) || 1;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      showAlert('Popup bloklangan', 'Xatolik', 'danger');
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
    
    const printHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ценник</title><style>*{margin:0;padding:0;box-sizing:border-box}@page{size:58mm 40mm;margin:0}@media print{body{width:58mm}.label{page-break-after:always}.label:last-child{page-break-after:auto}}body{font-family:Arial,sans-serif;background:white}.label{width:58mm;height:40mm;padding:2mm;display:flex;align-items:center;justify-content:space-between}.info{flex:1}.name{font-size:14pt;font-weight:bold;margin-bottom:2mm;line-height:1.1}.code{font-size:12pt;color:#333}.qr-container{width:22mm;height:22mm;flex-shrink:0}.qr-container img{width:100%;height:100%}</style></head><body>${labelsHtml}<script>window.onload=function(){var imgs=document.querySelectorAll('img');var loaded=0;imgs.forEach(function(img){if(img.complete){loaded++;if(loaded===imgs.length)setTimeout(function(){window.print()},100)}else{img.onload=function(){loaded++;if(loaded===imgs.length)setTimeout(function(){window.print()},100)};img.onerror=function(){loaded++;if(loaded===imgs.length)setTimeout(function(){window.print()},100)}}});window.onafterprint=function(){window.close()}}</script></body></html>`;
    
    printWindow.document.write(printHtml);
    printWindow.document.close();
    setShowPrintModal(false);
  }, [printProduct, printQuantity, showAlert]);

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Tovarni o'chirishni tasdiqlaysizmi?", "O'chirish");
    if (!confirmed) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      setDisplayedProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

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

  const handlers = useMemo(() => ({
    onTransfer: (product: Product) => console.log('Transfer', product),
    onQR: openQRModal,
    onPrint: openPrintModal,
    onEdit: (product: Product) => console.log('Edit', product),
    onDelete: handleDelete,
    getProductImage
  }), [openQRModal, openPrintModal, handleDelete, getProductImage]);

  const itemData = useMemo(() => ({
    products: filteredProducts,
    handlers,
    uz,
    formatNumber
  }), [filteredProducts, handlers, uz]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title={tKey("Mahsulotlar")} />
      
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
            {filteredProducts.length} / {products.length} mahsulot
            {loadingMore && <span className="ml-2 text-primary-500">• Yuklanmoqda...</span>}
          </div>
        </div>

        {/* Virtualized Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="col-span-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">RASM</div>
            <div className="col-span-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">KOD</div>
            <div className="col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">NOMI</div>
            <div className="col-span-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">OMBOR</div>
            <div className="col-span-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">TAN NARXI</div>
            <div className="col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">OPTOM NARXI</div>
            <div className="col-span-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">MIQDORI</div>
            <div className="col-span-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">AMALLAR</div>
          </div>

          {/* Virtualized List */}
          {filteredProducts.length > 0 ? (
            <List
              ref={listRef}
              height={600}
              itemCount={filteredProducts.length}
              itemSize={ROW_HEIGHT}
              width="100%"
              itemData={itemData}
              overscanCount={5}
            >
              {ProductRow}
            </List>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Mahsulot topilmadi' : 'Mahsulotlar yo\'q'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowQRModal(false)} />
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl relative z-10">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">QR Kod</h3>
              <button onClick={() => setShowQRModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{selectedProduct.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Kod: {selectedProduct.code}</p>
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG id="qr-code-svg" value={JSON.stringify({ id: selectedProduct._id, code: selectedProduct.code, name: selectedProduct.name })} size={200} level="H" />
                </div>
              </div>
              <button onClick={downloadQR} className="w-full px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
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
              <button onClick={() => setShowPrintModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{printProduct.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Kod: {printProduct.code}</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nechta?</label>
                <input type="number" min="1" value={printQuantity} onChange={e => setPrintQuantity(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:text-gray-100" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPrintModal(false)} className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300">Bekor</button>
                <button onClick={handlePrint} className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />Чоп этиш
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
