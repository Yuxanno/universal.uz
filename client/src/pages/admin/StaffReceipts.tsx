import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, User, Package, CheckCircle } from 'lucide-react';
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
      setReceipts(receiptsRes.data);
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
    return receipts.filter(r => r.createdBy?._id === workerId && (r.status === 'pending' || r.status === 'draft'));
  };

  const getReadyReceipts = (workerId: string) => {
    return receipts.filter(r => r.createdBy?._id === workerId && r.status === 'approved');
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
              const allReceipts = [...pendingReceipts, ...readyReceipts];
              // Убираем дубликаты чеков по _id
              const uniqueReceipts = allReceipts.filter((receipt, index, self) =>
                index === self.findIndex(r => r._id === receipt._id)
              );
              
              const rawItems = uniqueReceipts.flatMap(r => 
                r.items.map((item, idx) => ({ ...item, receiptId: r._id, status: r.status, itemIndex: idx }))
              );
              
              // Группируем товары по коду, суммируя количество
              const groupedItemsMap = new Map<string, typeof rawItems[0]>();
              rawItems.forEach(item => {
                const existing = groupedItemsMap.get(item.code);
                if (existing) {
                  existing.quantity += item.quantity;
                } else {
                  groupedItemsMap.set(item.code, { ...item });
                }
              });
              const allItems = Array.from(groupedItemsMap.values());
              
              // Считаем total
              const total = allItems.reduce((sum, item) => {
                return sum + item.price * item.quantity;
              }, 0);

              if (allItems.length === 0 && !isReady) {
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
                    {allItems.length === 0 ? (
                      <div className="text-center py-12 text-surface-400">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">{t("Tovarlar yo'q")}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allItems.map((item) => (
                          <div 
                            key={item.code}
                            className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-surface-900 truncate">{item.name}</p>
                              <p className="text-xs text-surface-500">Kod: {item.code?.length > 10 ? item.code.slice(-6) : item.code}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-20 h-8 flex items-center justify-end text-sm font-medium text-surface-700 px-2">
                                {formatNumber(item.price)}
                              </span>
                              <span className="text-surface-400">×</span>
                              <span className="w-12 h-8 flex items-center justify-center text-sm font-semibold text-surface-700">
                                {item.quantity}
                              </span>
                              <span className="w-20 text-right font-semibold text-surface-900 text-sm">
                                {formatNumber(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className={`px-5 py-4 border-t ${
                    isReady ? 'border-success-200 bg-success-50' : 
                    hasPending ? 'border-warning-200 bg-warning-50' : 
                    'border-surface-200 bg-surface-50'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-surface-500 font-medium">{t("Jami")}:</span>
                      <span className="text-3xl font-bold text-surface-900">
                        {formatNumber(total)} <span className="text-base font-normal text-surface-500">{t("so'm")}</span>
                      </span>
                    </div>
                    
                    {(isReady || hasPending) && (
                      <button
                        onClick={() => {
                          // Собираем все товары из всех чеков работника
                          // readyReceipts = approved, pendingReceipts с status === 'pending'
                          const allReceipts = [
                            ...readyReceipts,
                            ...pendingReceipts.filter(r => r.status === 'pending')
                          ];
                          
                          // Убираем дубликаты чеков по _id
                          const uniqueReceipts = allReceipts.filter((receipt, index, self) =>
                            index === self.findIndex(r => r._id === receipt._id)
                          );
                          
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
                          
                          // Группируем по коду, суммируя количество
                          const groupedMap = new Map<string, typeof rawItems[0]>();
                          rawItems.forEach(item => {
                            const existing = groupedMap.get(item.code);
                            if (existing) {
                              existing.cartQuantity += item.cartQuantity;
                            } else {
                              groupedMap.set(item.code, { ...item });
                            }
                          });
                          const allKassaItems = Array.from(groupedMap.values());
                          
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
