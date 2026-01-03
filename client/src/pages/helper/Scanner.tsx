import { useState, useEffect, useRef } from 'react';
import { QrCode, Search, Send, Plus, Minus, Trash2, X, Package, ShoppingCart } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product, CartItem } from '../../types';
import api from '../../utils/api';

export default function HelperScanner() {
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [sending, setSending] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    fetchProducts();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const startScanner = async () => {
    setScannedProduct(null);
    setSearchQuery('');
    setSearchResults([]);
    
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          const product = products.find(p => p.code === decodedText);
          if (product) {
            setScannedProduct(product);
          } else {
            alert('Tovar topilmadi: ' + decodedText);
          }
          stopScanner();
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      console.error('Scanner error:', err);
      alert('Kamerani ishga tushirishda xatolik');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setScannedProduct(null);
    if (query.length > 0) {
      const results = products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p._id === product._id);
      if (existing) {
        return prev.map(p => p._id === product._id ? {...p, cartQuantity: p.cartQuantity + 1} : p);
      }
      return [...prev, {...product, cartQuantity: 1}];
    });
    setSearchQuery('');
    setSearchResults([]);
    setScannedProduct(null);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item._id === id 
        ? { ...item, cartQuantity: Math.max(1, item.cartQuantity + delta) }
        : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const sendToCashier = async () => {
    if (cart.length === 0) return;
    setSending(true);
    try {
      await api.post('/receipts', {
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          code: item.code,
          price: item.price,
          quantity: item.cartQuantity
        })),
        total
      });
      alert("Chek kassirga yuborildi!");
      setCart([]);
    } catch (err) {
      console.error('Error sending receipt:', err);
      alert('Xatolik yuz berdi');
    } finally {
      setSending(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        
        {/* Search + QR Scanner Section */}
        <div className="card">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Tovar qidirish..."
                className="input w-full pl-11 pr-4 py-3 text-base"
              />
            </div>
            <button
              onClick={scanning ? stopScanner : startScanner}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${
                scanning 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              <QrCode className="w-5 h-5" />
              {scanning ? 'Stop' : 'QR'}
            </button>
          </div>

          {/* QR Scanner Camera */}
          {scanning && (
            <div className="mt-4">
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
              <p className="text-center text-sm text-gray-500 mt-2">QR kodni kameraga ko'rsating</p>
            </div>
          )}

          {/* Scanned Product Result */}
          {scannedProduct && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-green-700">Tovar topildi!</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{scannedProduct.name}</p>
                  <p className="text-sm text-gray-500">Kod: {scannedProduct.code}</p>
                  <p className="text-primary-600 font-bold mt-1">{scannedProduct.price.toLocaleString()} so'm</p>
                </div>
                <button
                  onClick={() => addToCart(scannedProduct)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Qo'shish
                </button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-64 overflow-auto">
              {searchResults.map(product => (
                <div 
                  key={product._id}
                  onClick={() => addToCart(product)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 border border-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">Kod: {product.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">{product.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{product.quantity} dona</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <p className="mt-4 text-center text-gray-400 py-4">Tovar topilmadi</p>
          )}
        </div>

        {/* Cart Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-500" />
              <span className="font-semibold text-gray-900">Savat</span>
            </div>
            <span className="px-2 py-1 bg-primary-100 text-primary-600 rounded-lg text-sm font-medium">
              {cart.length} ta
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400">Savat bo'sh</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-primary-600 font-medium">
                      {(item.price * item.cartQuantity).toLocaleString()} so'm
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                    <button 
                      onClick={() => updateQuantity(item._id, -1)} 
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-medium text-gray-900">{item.cartQuantity}</span>
                    <button 
                      onClick={() => updateQuantity(item._id, 1)} 
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item._id)} 
                    className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Total & Send Button */}
          {cart.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500">Jami:</span>
                <span className="text-2xl font-bold text-gray-900">{total.toLocaleString()} so'm</span>
              </div>
              <button
                onClick={sendToCashier}
                disabled={sending}
                className="w-full py-4 bg-primary-500 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-primary-600 disabled:opacity-50 font-medium text-lg shadow-lg shadow-primary-500/20"
              >
                {sending ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Kassaga yuborish
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
