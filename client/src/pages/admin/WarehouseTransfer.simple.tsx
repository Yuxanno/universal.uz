import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { 
  ArrowRight, Package, Warehouse as WarehouseIcon, 
  ArrowUpCircle, ArrowDownCircle, Search, X, AlertCircle
} from 'lucide-react';
import { Warehouse, Product } from '../../types';
import api from '../../utils/api';
import { useAlert } from '../../hooks/useAlert';

interface InventoryItem {
  _id: string;
  product: Product;
  warehouse: Warehouse;
  quantity: number;
  minStock: number;
}

export default function WarehouseTransferSimple() {
  const { showAlert, AlertComponent } = useAlert();
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [targetWarehouse, setTargetWarehouse] = useState<string>('');
  const [transferQuantity, setTransferQuantity] = useState<string>('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchInventory();
    }
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data);
      // Auto-select first warehouse
      if (res.data.length > 0) {
        setSelectedWarehouse(res.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const fetchInventory = async () => {
    if (!selectedWarehouse) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/inventory/warehouse/${selectedWarehouse}`);
      setInventory(res.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const openTransferModal = (item: InventoryItem) => {
    setSelectedProduct(item);
    setTargetWarehouse('');
    setTransferQuantity('1');
    setShowTransferModal(true);
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setSelectedProduct(null);
    setTargetWarehouse('');
    setTransferQuantity('');
  };

  const handleTransfer = async () => {
    if (!selectedProduct || !targetWarehouse || !transferQuantity) {
      showAlert('Barcha maydonlarni to\'ldiring', 'Xatolik', 'danger');
      return;
    }

    const qty = Number(transferQuantity);
    if (qty <= 0 || qty > selectedProduct.quantity) {
      showAlert('Noto\'g\'ri miqdor', 'Xatolik', 'danger');
      return;
    }

    setTransferring(true);
    try {
      await api.post('/inventory/transfer', {
        productId: selectedProduct.product._id,
        fromWarehouseId: selectedWarehouse,
        toWarehouseId: targetWarehouse,
        quantity: qty,
        notes: 'Tezkor transfer'
      });

      const fromName = warehouses.find(w => w._id === selectedWarehouse)?.name;
      const toName = warehouses.find(w => w._id === targetWarehouse)?.name;
      
      showAlert(
        `${selectedProduct.product.name}\n${qty} dona\n${fromName} → ${toName}`,
        'Muvaffaqiyat',
        'success'
      );
      
      closeTransferModal();
      fetchInventory();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Transfer xatosi', 'Xatolik', 'danger');
    } finally {
      setTransferring(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (!item.product) return false;
    const query = searchQuery.toLowerCase();
    return item.product.name.toLowerCase().includes(query) ||
           item.product.code.toLowerCase().includes(query);
  });

  const getTransferIcon = (targetWh: Warehouse) => {
    const currentWh = warehouses.find(w => w._id === selectedWarehouse);
    if (!currentWh) return ArrowRight;
    
    if ((currentWh as any).isMain && !(targetWh as any).isMain) {
      return ArrowUpCircle; // Export
    } else if (!(currentWh as any).isMain && (targetWh as any).isMain) {
      return ArrowDownCircle; // Import
    }
    return ArrowRight; // Internal
  };

  const getTransferColor = (targetWh: Warehouse) => {
    const currentWh = warehouses.find(w => w._id === selectedWarehouse);
    if (!currentWh) return 'slate';
    
    if ((currentWh as any).isMain && !(targetWh as any).isMain) {
      return 'red'; // Export
    } else if (!(currentWh as any).isMain && (targetWh as any).isMain) {
      return 'green'; // Import
    }
    return 'slate'; // Internal
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 lg:pb-0">
      {AlertComponent}
      
      <Header 
        title="Mahsulot o'tkazish"
        showSearch
        onSearch={setSearchQuery}
        filterOptions={warehouses.map(w => ({ 
          value: w._id, 
          label: w.name + ((w as any).isMain ? ' (Asosiy)' : '')
        }))}
        filterValue={selectedWarehouse}
        onFilterChange={setSelectedWarehouse}
      />

      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Tezkor transfer</p>
              <p>Mahsulot yonidagi icon'ga bosing va qaysi omborga o'tkazishni tanlang.</p>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-gray-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner text-red-600 w-8 h-8" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                {searchQuery ? 'Mahsulot topilmadi' : 'Bu omborida mahsulot yo\'q'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredInventory.map(item => (
                <div key={item._id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Kod: {item.product.code}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          item.quantity === 0 ? 'text-red-600' :
                          item.quantity <= item.minStock ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {item.quantity}
                        </p>
                        <p className="text-xs text-slate-500">dona</p>
                      </div>
                      
                      <button
                        onClick={() => openTransferModal(item)}
                        disabled={item.quantity === 0}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="O'tkazish"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeTransferModal} />
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-scaleIn border-2 border-gray-200 dark:border-slate-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Mahsulot o'tkazish</h3>
                    <p className="text-sm text-white/90 font-semibold">
                      {selectedProduct.product.name}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeTransferModal}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Current Info */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Hozirgi ombor:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {warehouses.find(w => w._id === selectedWarehouse)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Mavjud:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {selectedProduct.quantity} dona
                  </span>
                </div>
              </div>

              {/* Target Warehouse */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Qaysi omborga o'tkazasiz?
                </label>
                <div className="space-y-2">
                  {warehouses
                    .filter(w => w._id !== selectedWarehouse)
                    .map(warehouse => {
                      const Icon = getTransferIcon(warehouse);
                      const color = getTransferColor(warehouse);
                      const isSelected = targetWarehouse === warehouse._id;
                      
                      return (
                        <button
                          key={warehouse._id}
                          type="button"
                          onClick={() => setTargetWarehouse(warehouse._id)}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`
                              : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? `bg-${color}-600` : 'bg-gray-100 dark:bg-slate-800'
                          }`}>
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`font-semibold ${
                              isSelected ? `text-${color}-700 dark:text-${color}-300` : 'text-slate-900 dark:text-white'
                            }`}>
                              {warehouse.name}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {(warehouse as any).isMain ? 'Asosiy ombor' : 'Filial ombor'}
                            </p>
                          </div>
                          {isSelected && (
                            <div className={`w-6 h-6 bg-${color}-500 rounded-full flex items-center justify-center`}>
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Necha dona o'tkazasiz?
                </label>
                <input
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  min="1"
                  max={selectedProduct.quantity}
                  className="w-full px-4 py-3 text-lg font-bold text-center text-slate-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                />
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 text-center">
                  Maksimal: {selectedProduct.quantity} dona
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeTransferModal}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={!targetWarehouse || !transferQuantity || transferring}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {transferring ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Yuklanmoqda...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      O'tkazish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
