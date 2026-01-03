import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Search, RotateCcw, Save, CreditCard, Trash2, Plus, Minus, X, Archive, ArrowLeft } from 'lucide-react';
import { CartItem, Product } from '../../types';
import api from '../../utils/api';

interface SavedReceipt {
  id: string;
  items: CartItem[];
  total: number;
  savedAt: string;
}

export default function Kassa() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [inputMode, setInputMode] = useState<'quantity' | 'code'>('code');
  const [inputValue, setInputValue] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [savedReceipts, setSavedReceipts] = useState<SavedReceipt[]>([]);
  const [isReturnMode, setIsReturnMode] = useState(false);

  useEffect(() => {
    fetchProducts();
    loadSavedReceipts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const loadSavedReceipts = () => {
    const saved = localStorage.getItem('savedReceipts');
    if (saved) {
      setSavedReceipts(JSON.parse(saved));
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  const handleNumpadClick = (value: string) => {
    if (value === 'C') {
      setInputValue('');
    } else if (value === '⌫') {
      setInputValue(prev => prev.slice(0, -1));
    } else if (value === '+') {
      addProductByCode(inputValue);
    } else {
      setInputValue(prev => prev + value);
    }
  };

  const addProductByCode = (code: string) => {
    const product = products.find(p => p.code === code);
    if (product) {
      addToCart(product);
      setInputValue('');
    } else {
      alert('Tovar topilmadi');
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
    setShowSearch(false);
    setSearchQuery('');
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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

  const handlePayment = async (method: 'cash' | 'card') => {
    if (cart.length === 0) return;
    try {
      await api.post('/receipts', {
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          code: item.code,
          price: item.price,
          quantity: item.cartQuantity
        })),
        total,
        paymentMethod: method,
        isReturn: isReturnMode
      });
      setCart([]);
      setShowPayment(false);
      setIsReturnMode(false);
      alert(isReturnMode ? 'Qaytarish muvaffaqiyatli amalga oshirildi!' : 'Chek muvaffaqiyatli saqlandi!');
      fetchProducts(); // Refresh products to get updated quantities
    } catch (err) {
      console.error('Error creating receipt:', err);
      alert('Xatolik yuz berdi');
    }
  };

  // Toggle return mode
  const toggleReturnMode = () => {
    setIsReturnMode(!isReturnMode);
    if (!isReturnMode) {
      setCart([]); // Clear cart when entering return mode
    }
  };

  // Save current receipt
  const saveReceipt = () => {
    if (cart.length === 0) {
      alert('Chek bo\'sh');
      return;
    }
    
    const newSaved: SavedReceipt = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      savedAt: new Date().toLocaleString()
    };
    
    const updated = [...savedReceipts, newSaved];
    setSavedReceipts(updated);
    localStorage.setItem('savedReceipts', JSON.stringify(updated));
    setCart([]);
    alert('Chek saqlandi!');
  };

  // Load saved receipt
  const loadSavedReceipt = (receipt: SavedReceipt) => {
    setCart(receipt.items);
    // Remove from saved
    const updated = savedReceipts.filter(r => r.id !== receipt.id);
    setSavedReceipts(updated);
    localStorage.setItem('savedReceipts', JSON.stringify(updated));
    setShowSaved(false);
  };

  // Delete saved receipt
  const deleteSavedReceipt = (id: string) => {
    const updated = savedReceipts.filter(r => r.id !== id);
    setSavedReceipts(updated);
    localStorage.setItem('savedReceipts', JSON.stringify(updated));
  };

  return (
    <div className={`min-h-screen flex flex-col ${isReturnMode ? 'bg-orange-50' : 'bg-gray-50'}`}>
      <Header 
        title={isReturnMode ? "Qaytarish rejimi" : "Kassa (POS)"} 
        actions={
          <div className="flex items-center gap-2">
            {isReturnMode && (
              <span className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">
                QAYTARISH
              </span>
            )}
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Ishlash: {cart.length}
            </button>
            <button 
              onClick={() => setShowSaved(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 relative"
            >
              <Archive className="w-4 h-4" />
              Saqlangan
              {savedReceipts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                  {savedReceipts.length}
                </span>
              )}
            </button>
          </div>
        }
      />

      <div className="flex-1 flex">
        {/* Cart Table */}
        <div className="flex-1 p-4">
          <div className={`card h-full flex flex-col ${isReturnMode ? 'border-2 border-orange-300' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">
                {isReturnMode ? 'QAYTARISH - ' : 'JAMI: '}{cart.length} ta mahsulot
              </div>
              {isReturnMode && (
                <span className="text-orange-600 text-sm font-medium">Tovarlar omborga qaytariladi</span>
              )}
            </div>
            
            {/* Table Header */}
            <div className={`grid grid-cols-8 gap-4 py-2 border-b text-sm ${isReturnMode ? 'border-orange-200 text-orange-600' : 'border-gray-200 text-gray-500'}`}>
              <span>KOD</span>
              <span className="col-span-2">MAHSULOT</span>
              <span>OMBOR</span>
              <span>SONI</span>
              <span>NARX</span>
              <span>SUMMA</span>
              <span>AMALLAR</span>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Search className="w-16 h-16 mb-4 opacity-30" />
                  <p>{isReturnMode ? 'Qaytariladigan tovarlarni qo\'shing' : '"Qidirish" tugmasini bosing'}</p>
                  <p className="text-sm">0 ta mahsulot</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item._id} className={`grid grid-cols-8 gap-4 py-3 border-b items-center ${isReturnMode ? 'border-orange-100 text-orange-900' : 'border-gray-100 text-gray-900'}`}>
                    <span className="text-sm font-mono">{item.code}</span>
                    <span className="col-span-2">{item.name}</span>
                    <span className="text-sm text-gray-500">-</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item._id, -1)} className="p-1 hover:bg-gray-100 rounded">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.cartQuantity}</span>
                      <button onClick={() => updateQuantity(item._id, 1)} className="p-1 hover:bg-gray-100 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span>{item.price.toLocaleString()}</span>
                    <span className="font-medium">{(item.price * item.cartQuantity).toLocaleString()}</span>
                    <button onClick={() => removeFromCart(item._id)} className="text-primary-500 hover:text-primary-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Numpad & Total */}
        <div className="w-80 p-4 flex flex-col gap-4">
          {/* Total */}
          <div className="text-right">
            <span className={`text-4xl font-bold ${isReturnMode ? 'text-orange-600' : 'text-gray-900'}`}>
              {isReturnMode && '-'}{total.toLocaleString()} so'm
            </span>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setInputMode('quantity')}
              className={`flex-1 py-2 rounded-lg text-sm ${inputMode === 'quantity' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Soni
            </button>
            <button 
              onClick={() => setInputMode('code')}
              className={`flex-1 py-2 rounded-lg text-sm ${inputMode === 'code' ? 'bg-primary-500 text-white' : 'text-gray-500'}`}
            >
              Kod
            </button>
          </div>

          {/* Input */}
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addProductByCode(inputValue)}
            placeholder="Kod kiriting..."
            className="input text-center"
          />

          {/* Numpad */}
          <div className="grid grid-cols-4 gap-2">
            {['7', '8', '9', 'C', '4', '5', '6', '⌫', '1', '2', '3', '+', '0', '00'].map(key => (
              <button
                key={key}
                onClick={() => handleNumpadClick(key)}
                className={`py-4 rounded-lg text-lg font-medium transition-colors ${
                  key === 'C' ? 'bg-primary-500 hover:bg-primary-600 text-white' :
                  key === '⌫' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                  key === '+' ? 'bg-primary-500 hover:bg-primary-600 text-white row-span-2' :
                  'bg-gray-100 hover:bg-gray-200 text-gray-900'
                } ${key === '0' ? 'col-span-1' : ''} ${key === '00' ? 'col-span-2' : ''}`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className={`border-t p-4 shadow-lg ${isReturnMode ? 'bg-orange-100 border-orange-200' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700"
          >
            <Search className="w-5 h-5" />
            Qidirish
          </button>
          <button 
            onClick={toggleReturnMode}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
              isReturnMode 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-yellow-500 text-white hover:bg-yellow-400'
            }`}
          >
            {isReturnMode ? <ArrowLeft className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
            {isReturnMode ? 'Orqaga' : 'Qaytarish'}
          </button>
          {!isReturnMode && (
            <button 
              onClick={saveReceipt}
              disabled={cart.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Saqlash
            </button>
          )}
          <button 
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg disabled:opacity-50 ${
              isReturnMode 
                ? 'bg-orange-500 text-white hover:bg-orange-400' 
                : 'bg-green-500 text-white hover:bg-green-400'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            {isReturnMode ? 'Qaytarish' : "To'lov"}
          </button>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tovar qidirish</h3>
              <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Kod yoki nom bo'yicha qidiring..."
                className="input w-full pl-10"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-auto">
              {searchResults.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  {searchQuery ? 'Tovar topilmadi' : 'Qidirish uchun yozing...'}
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(product => (
                    <div 
                      key={product._id}
                      onClick={() => addToCart(product)}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">Kod: {product.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{product.price.toLocaleString()} so'm</p>
                        <p className="text-sm text-gray-500">{product.quantity} dona</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Receipts Modal */}
      {showSaved && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Saqlangan cheklar</h3>
              <button onClick={() => setShowSaved(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {savedReceipts.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Saqlangan cheklar yo'q</p>
              ) : (
                <div className="space-y-3">
                  {savedReceipts.map(receipt => (
                    <div key={receipt.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">{receipt.savedAt}</span>
                        <span className="font-bold text-gray-900">{receipt.total.toLocaleString()} so'm</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {receipt.items.map(item => (
                          <div key={item._id} className="flex justify-between">
                            <span>{item.name} x{item.cartQuantity}</span>
                            <span>{(item.price * item.cartQuantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => loadSavedReceipt(receipt)}
                          className="flex-1 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                        >
                          Ochish
                        </button>
                        <button 
                          onClick={() => deleteSavedReceipt(receipt.id)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isReturnMode ? 'Qaytarishni tasdiqlash' : "To'lov"}
              </h3>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mb-6">
              <p className="text-gray-500 mb-2">{isReturnMode ? 'Qaytarish summasi' : 'Jami summa'}</p>
              <p className={`text-3xl font-bold ${isReturnMode ? 'text-orange-600' : 'text-gray-900'}`}>
                {isReturnMode && '-'}{total.toLocaleString()} so'm
              </p>
            </div>
            {isReturnMode ? (
              <button 
                onClick={() => handlePayment('cash')}
                className="w-full py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-400 font-medium"
              >
                ✓ Qaytarishni tasdiqlash
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handlePayment('cash')}
                  className="py-4 bg-green-500 text-white rounded-lg hover:bg-green-400 font-medium"
                >
                  💵 Naqd
                </button>
                <button 
                  onClick={() => handlePayment('card')}
                  className="py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
                >
                  💳 Karta
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
