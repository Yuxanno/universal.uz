import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, User, Package, CheckCircle, Eye, EyeOff, Edit2, Check, X, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useLanguage } from '../../context/LanguageContext';

interface WorkerItem {
  product: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
}

interface WorkerReceipt {
  _id: string;
  items: WorkerItem[];
  total: number;
  status: 'draft' | 'pending' | 'approved' | 'completed';
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Worker {
  _id: string;
  name: string;
  role: string;
}

export default function StaffReceipts() {
  const { t } = useLanguage();
  const { AlertComponent } = useAlert();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [receipts, setReceipts] = useState<WorkerReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [editingItem, setEditingItem] = useState<{receiptId: string, itemIndex: number} | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [workersRes, receiptsRes] = await Promise.all([
        api.get('/users/helpers'),
        api.get('/receipts/staff')
      ]);
      // Фильтруем только helpers и убираем дубликаты
      const helpers = workersRes.data.filter((w: Worker) => w.role === 'helper');
      const uniqueHelpers = helpers.filter((w: Worker, index: number, self: Worker[]) => 
        index === self.findIndex((t) => t._id === w._id)
      );
      setWorkers(uniqueHelpers);
      
      // Remove duplicate receipts by _id (defensive filtering)
      const uniqueReceipts = receiptsRes.data.filter((r: WorkerReceipt, index: number, self: WorkerReceipt[]) => 
        index === self.findIndex((t) => t._id === r._id)
      );
      console.log('📊 Fetched receipts:', {
        total: receiptsRes.data.length,
        unique: uniqueReceipts.length,
        duplicates: receiptsRes.data.length - uniqueReceipts.length
      });
      setReceipts(uniqueReceipts);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000); // Обновляем каждую секунду
    return () => clearInterval(interval);
  }, [fetchData]);

  const getWorkerReceipts = (workerId: string) => {
    const filtered = receipts.filter(r => r.createdBy?._id === workerId && (r.status === 'pending' || r.status === 'draft'));
    // Remove duplicates by _id (defensive)
    const unique = filtered.filter((r, index, self) => 
      index === self.findIndex(t => t._id === r._id)
    );
    console.log(`📋 getWorkerReceipts for ${workerId}:`, {
      filtered: filtered.length,
      unique: unique.length,
      ids: unique.map(r => ({ id: r._id, status: r.status, itemsCount: r.items.length }))
    });
    return unique;
  };

  const getReadyReceipts = (workerId: string) => {
    const filtered = receipts.filter(r => r.createdBy?._id === workerId && r.status === 'approved');
    // Remove duplicates by _id (defensive)
    const unique = filtered.filter((r, index, self) => 
      index === self.findIndex(t => t._id === r._id)
    );
    console.log(`✅ getReadyReceipts for ${workerId}:`, {
      filtered: filtered.length,
      unique: unique.length,
      ids: unique.map(r => ({ id: r._id, status: r.status, itemsCount: r.items.length }))
    });
    return unique;
  };

  const handleEditItem = (receiptId: string, itemIndex: number, currentPrice: number, currentQuantity: number) => {
    setEditingItem({ receiptId, itemIndex });
    setEditPrice(currentPrice.toString());
    setEditQuantity(currentQuantity.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    try {
      const price = parseInt(editPrice) || 0;
      const quantity = parseInt(editQuantity) || 0;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0
        await api.delete(`/receipts/${editingItem.receiptId}`);
      } else {
        await api.put(`/receipts/${editingItem.receiptId}/update-item/${editingItem.itemIndex}`, {
          price,
          quantity
        });
      }
      
      setEditingItem(null);
      setEditPrice('');
      setEditQuantity('');
      fetchData();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditPrice('');
    setEditQuantity('');
  };

  const handleRemoveItem = async (receiptId: string, itemIndex: number) => {
    try {
      await api.put(`/receipts/${receiptId}/remove-item/${itemIndex}`);
      fetchData();
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  // Показываем всех рабочих (helpers)
  const displayWorkers = workers;

  return (
    <div className="min-h-screen bg-surface-50">
      {AlertComponent}
      
      {/* Top Bar */}
      <div className="bg-white border-b border-surface-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-surface-900">{t("Xodimlar POS")}</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const newValue = !showPrices;
                console.log('🔄 Toggling showPrices:', { from: showPrices, to: newValue });
                setShowPrices(newValue);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all border-2 shadow-sm ${
                showPrices
                  ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-red-200'
                  : 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
              }`}
            >
              {showPrices ? (
                <>
                  <EyeOff className="w-5 h-5" />
                  <span>{t("Narxni yashirish")}</span>
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  <span>{t("Narxni ko'rsatish")}</span>
                </>
              )}
            </button>
            <span className="text-sm text-surface-500">
              {workers.length} {t("ta xodim")} • {receipts.filter(r => r.status === 'pending').length} {t("ta kutilmoqda")}
            </span>
          </div>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {displayWorkers.map((worker, index) => {
              const pendingReceipts = getWorkerReceipts(worker._id);
              const readyReceipts = getReadyReceipts(worker._id);
              const isReady = readyReceipts.length > 0;
              const hasDraft = pendingReceipts.some(r => r.status === 'draft');
              const hasPending = pendingReceipts.some(r => r.status === 'pending');
              
              // Собираем все товары и группируем по коду
              // ВАЖНО: Используем только pending и ready, без дубликатов
              const allReceipts = [...pendingReceipts, ...readyReceipts];
              // Убираем дубликаты чеков по _id
              const uniqueReceipts = allReceipts.filter((receipt, index, self) =>
                index === self.findIndex(r => r._id === receipt._id)
              );
              
              console.log(`👤 Worker ${worker.name}:`, {
                pendingCount: pendingReceipts.length,
                readyCount: readyReceipts.length,
                allCount: allReceipts.length,
                uniqueCount: uniqueReceipts.length,
                receiptIds: uniqueReceipts.map(r => r._id)
              });
              
              const rawItems = uniqueReceipts.flatMap(r => 
                r.items.map((item, idx) => ({ ...item, receiptId: r._id, status: r.status, itemIndex: idx }))
              );
              
              // Группируем товары по коду, суммируя количество (для отображения общего количества)
              const groupedItemsMap = new Map<string, typeof rawItems[0]>();
              rawItems.forEach(item => {
                const existing = groupedItemsMap.get(item.code);
                if (existing) {
                  existing.quantity += item.quantity;
                } else {
                  groupedItemsMap.set(item.code, { ...item });
                }
              });
              // allItems не используется, но оставляем для будущего использования
              // const allItems = Array.from(groupedItemsMap.values());
              
              // Для редактирования используем rawItems (не группированные)
              const displayItems = rawItems;
              
              // Считаем total
              const total = displayItems.reduce((sum, item) => {
                return sum + item.price * item.quantity;
              }, 0);

              if (displayItems.length === 0 && !isReady) {
                // Показываем пустую карточку
              }

              return (
                <div
                  key={worker._id}
                  className={`rounded-2xl border-2 overflow-hidden transition-all bg-white shadow-sm ${
                    isReady 
                      ? 'border-success-500 shadow-lg shadow-success-500/10' 
                      : hasPending
                        ? 'border-warning-500 shadow-lg shadow-warning-500/10'
                        : 'border-surface-200'
                  }`}
                >
                  {/* Header */}
                  <div className={`px-5 py-4 ${
                    isReady ? 'bg-success-500' : hasPending ? 'bg-warning-500' : 'bg-surface-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isReady ? 'bg-success-400' : hasPending ? 'bg-warning-400' : 'bg-white'
                        }`}>
                          <User className={`w-6 h-6 ${isReady || hasPending ? 'text-white' : 'text-surface-600'}`} />
                        </div>
                        <div>
                          <h3 className={`font-semibold text-lg ${isReady || hasPending ? 'text-white' : 'text-surface-900'}`}>
                            {worker.name || `Xodim ${index + 1}`}
                          </h3>
                          <p className={`text-sm ${isReady || hasPending ? 'text-white/80' : 'text-surface-500'}`}>
                            {isReady ? t('Tayyor') : hasPending ? t('Yuborilgan') : hasDraft ? t('Yig\'moqda...') : worker.role}
                          </p>
                        </div>
                      </div>
                      {isReady && <CheckCircle className="w-7 h-7 text-white" />}
                      {hasDraft && !hasPending && !isReady && (
                        <div className="w-3 h-3 bg-brand-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Notifications */}
                  {isReady && (
                    <div className="bg-success-50 border-b border-success-200 px-5 py-3">
                      <p className="text-success-700 text-sm font-medium text-center">
                        ✓ {t("Xodim barcha tovarlarni yig'di")}
                      </p>
                    </div>
                  )}
                  {hasPending && !isReady && (
                    <div className="bg-warning-50 border-b border-warning-200 px-5 py-3">
                      <p className="text-warning-700 text-sm font-medium text-center">
                        ⏳ {t("Tasdiqlash kutilmoqda")}
                      </p>
                    </div>
                  )}

                  {/* Items list */}
                  <div className="p-4 min-h-[350px] max-h-[400px] overflow-auto">
                    {displayItems.length === 0 ? (
                      <div className="text-center py-12 text-surface-400">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">{t("Tovarlar yo'q")}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {displayItems.map((item) => {
                          const isEditing = editingItem?.receiptId === item.receiptId && editingItem?.itemIndex === item.itemIndex;
                          
                          return (
                            <div 
                              key={`${item.receiptId}-${item.itemIndex}`}
                              className="flex items-center gap-2 p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-surface-900 truncate">{item.name}</p>
                                <p className="text-xs text-surface-500">Kod: {item.code?.length > 10 ? item.code.slice(-6) : item.code}</p>
                              </div>
                              
                              {isEditing ? (
                                <>
                                  {showPrices && (
                                    <>
                                      <input
                                        type="text"
                                        value={editPrice}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/\s/g, '');
                                          if (val === '' || /^\d+$/.test(val)) {
                                            setEditPrice(val);
                                          }
                                        }}
                                        className="w-20 h-8 text-right text-sm font-medium border-2 border-brand-500 rounded-lg px-2 focus:outline-none"
                                        placeholder="Narx"
                                      />
                                      <span className="text-surface-400">×</span>
                                    </>
                                  )}
                                  <input
                                    type="text"
                                    value={editQuantity}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || /^\d+$/.test(val)) {
                                        setEditQuantity(val);
                                      }
                                    }}
                                    className="w-12 h-8 text-center text-sm font-semibold border-2 border-brand-500 rounded-lg focus:outline-none"
                                    placeholder="Son"
                                  />
                                  <button
                                    onClick={handleSaveEdit}
                                    className="p-1.5 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="p-1.5 bg-surface-300 text-surface-700 rounded-lg hover:bg-surface-400 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    {showPrices && (
                                      <>
                                        <span className="w-20 h-8 flex items-center justify-end text-sm font-medium text-surface-700 px-2">
                                          {formatNumber(item.price)}
                                        </span>
                                        <span className="text-surface-400">×</span>
                                      </>
                                    )}
                                    <span className="w-12 h-8 flex items-center justify-center text-sm font-semibold text-surface-700">
                                      {item.quantity}
                                    </span>
                                    {showPrices && (
                                      <span className="w-20 text-right font-semibold text-surface-900 text-sm">
                                        {formatNumber(item.price * item.quantity)}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleEditItem(item.receiptId, item.itemIndex, item.price, item.quantity)}
                                    className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveItem(item.receiptId, item.itemIndex)}
                                    className="p-1.5 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className={`px-5 py-4 border-t ${
                    isReady ? 'border-success-200 bg-success-50' : 
                    hasPending ? 'border-warning-200 bg-warning-50' : 
                    'border-surface-200 bg-surface-50'
                  }`}>
                    {showPrices && (
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-surface-500 font-medium">{t("Jami")}:</span>
                        <span className="text-3xl font-bold text-surface-900">
                          {formatNumber(total)} <span className="text-base font-normal text-surface-500">{t("so'm")}</span>
                        </span>
                      </div>
                    )}
                    
                    {(isReady || hasPending) && (
                      <button
                        onClick={() => {
                          // Собираем все чеки работника (pending и approved)
                          const allReceipts = [...pendingReceipts, ...readyReceipts];
                          
                          // Убираем дубликаты чеков по _id
                          const uniqueReceipts = allReceipts.filter((receipt, index, self) =>
                            index === self.findIndex(r => r._id === receipt._id)
                          );
                          
                          console.log('🔍 DEBUG - Unique receipts:', {
                            count: uniqueReceipts.length,
                            ids: uniqueReceipts.map(r => r._id),
                            receipts: uniqueReceipts
                          });
                          
                          // Собираем все товары из уникальных чеков
                          const rawItems = uniqueReceipts.flatMap(receipt => 
                            receipt.items.map(item => ({
                              _id: item.product,
                              name: item.name,
                              code: item.code,
                              price: item.price,
                              cartQuantity: item.quantity,
                              quantity: 0
                            }))
                          );
                          
                          console.log('🔍 DEBUG - Raw items before grouping:', {
                            count: rawItems.length,
                            items: rawItems
                          });
                          
                          // Группируем по product ID, суммируя количество
                          const groupedMap = new Map<string, typeof rawItems[0]>();
                          rawItems.forEach(item => {
                            const existing = groupedMap.get(item._id);
                            if (existing) {
                              console.log(`🔄 Merging duplicate: ${item.name} (${existing.cartQuantity} + ${item.cartQuantity})`);
                              existing.cartQuantity += item.cartQuantity;
                            } else {
                              groupedMap.set(item._id, { ...item });
                            }
                          });
                          const allKassaItems = Array.from(groupedMap.values());
                          
                          console.log('📦 Loading to kassa:', {
                            receiptsCount: uniqueReceipts.length,
                            rawItemsCount: rawItems.length,
                            groupedItemsCount: allKassaItems.length,
                            items: allKassaItems
                          });
                          
                          if (allKassaItems.length > 0) {
                            localStorage.setItem('kassaItems', JSON.stringify(allKassaItems));
                            localStorage.setItem('kassaReceiptId', uniqueReceipts.map(r => r._id).join(','));
                            navigate('/cashier');
                          }
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-4 text-white rounded-xl font-semibold text-lg transition-colors ${
                          isReady ? 'bg-success-500 hover:bg-success-600' : 'bg-warning-500 hover:bg-warning-600'
                        }`}
                      >
                        <Download className="w-5 h-5" />
                        {t("Kassaga yuklash")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {workers.length === 0 && !loading && (
              <div className="col-span-full text-center py-20 text-surface-400">
                <User className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2 text-surface-600">{t("Xodimlar yo'q")}</h3>
                <p>{t("Avval xodimlarni qo'shing")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
