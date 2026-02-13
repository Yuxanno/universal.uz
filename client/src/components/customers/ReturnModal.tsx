import { useState } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

interface ReturnItem {
  product: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
  customerName: string;
  onConfirm: (items: { product: string; quantity: number }[]) => Promise<void>;
  processing: boolean;
}

export default function ReturnModal({ 
  isOpen, 
  onClose, 
  purchase, 
  customerName,
  onConfirm,
  processing 
}: ReturnModalProps) {
  const { t } = useLanguage();
  const [returnQuantities, setReturnQuantities] = useState<{ [key: string]: number }>({});

  if (!isOpen || !purchase) return null;

  // Log purchase data for debugging
  console.log('🔍 [ReturnModal] Purchase data:', {
    receiptId: purchase.receiptId,
    total: purchase.total,
    cashAmount: purchase.cashAmount,
    cardAmount: purchase.cardAmount,
    debtAmount: purchase.debtAmount,
    items: purchase.items
  });

  // Initialize return items from purchase
  const returnItems: ReturnItem[] = purchase.items.map((item: any) => ({
    product: item.product || item._id,
    name: item.name,
    code: item.code,
    price: item.price,
    quantity: returnQuantities[item.product || item._id] || 0,
    maxQuantity: item.quantity
  }));

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const item = returnItems.find(i => i.product === productId);
    if (!item) return;
    
    const validQuantity = Math.max(0, Math.min(numValue, item.maxQuantity));
    setReturnQuantities(prev => ({
      ...prev,
      [productId]: validQuantity
    }));
  };

  const incrementQuantity = (productId: string) => {
    const item = returnItems.find(i => i.product === productId);
    if (!item) return;
    
    const currentQty = returnQuantities[productId] || 0;
    if (currentQty < item.maxQuantity) {
      setReturnQuantities(prev => ({
        ...prev,
        [productId]: currentQty + 1
      }));
    }
  };

  const decrementQuantity = (productId: string) => {
    const currentQty = returnQuantities[productId] || 0;
    if (currentQty > 0) {
      setReturnQuantities(prev => ({
        ...prev,
        [productId]: currentQty - 1
      }));
    }
  };

  const calculateReturnTotal = () => {
    return returnItems.reduce((sum, item) => {
      const qty = returnQuantities[item.product] || 0;
      return sum + (item.price * qty);
    }, 0);
  };

  const handleConfirm = async () => {
    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({
        product: productId,
        quantity
      }));

    if (itemsToReturn.length === 0) {
      return;
    }

    await onConfirm(itemsToReturn);
    setReturnQuantities({});
  };

  const returnTotal = calculateReturnTotal();
  const hasItemsToReturn = Object.values(returnQuantities).some(qty => qty > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 animate-scaleIn overflow-hidden border-2 border-surface-100 dark:border-surface-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{t("Mahsulotni qaytarish")}</h3>
                <p className="text-white/80 text-sm">{customerName}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              disabled={processing}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Purchase Info */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="font-bold text-orange-900 dark:text-orange-100">
                {t("Xarid ma'lumotlari")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <span className="text-orange-600 dark:text-orange-400">{t("Sana")}:</span>
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  {new Date(purchase.date).toLocaleDateString('en-GB').replace(/\//g, '.')}
                </p>
              </div>
              <div>
                <span className="text-orange-600 dark:text-orange-400">{t("Jami summa")}:</span>
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  {formatNumber(purchase.total)} {t("so'm")}
                </p>
              </div>
            </div>
            
            {/* Payment breakdown */}
            {(purchase.cashAmount > 0 || purchase.cardAmount > 0 || purchase.debtAmount > 0) && (
              <div className="border-t border-orange-200 dark:border-orange-700 pt-3 space-y-1">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-2">
                  {t("To'lov tafsilotlari")}:
                </p>
                {purchase.cashAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-600 dark:text-orange-400">💵 {t("Naqd")}:</span>
                    <span className="font-semibold text-orange-900 dark:text-orange-100">
                      {formatNumber(purchase.cashAmount)} {t("so'm")}
                    </span>
                  </div>
                )}
                {purchase.cardAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-600 dark:text-orange-400">💳 {t("Karta")}:</span>
                    <span className="font-semibold text-orange-900 dark:text-orange-100">
                      {formatNumber(purchase.cardAmount)} {t("so'm")}
                    </span>
                  </div>
                )}
                {purchase.debtAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-600 dark:text-orange-400">⚠️ {t("Qarz")}:</span>
                    <span className="font-semibold text-danger-600 dark:text-danger-400">
                      {formatNumber(purchase.debtAmount)} {t("so'm")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <h4 className="font-bold text-surface-900 dark:text-surface-100 mb-3">
              {t("Qaytariladigan mahsulotlar")}
            </h4>
            
            {returnItems.map((item) => (
              <div 
                key={item.product} 
                className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-semibold text-surface-900 dark:text-surface-100">
                      {item.name}
                    </h5>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {t("Kod")}: {item.code}
                    </p>
                    <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                      {formatNumber(item.price)} {t("so'm")} × {item.maxQuantity} {t("ta")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-600 dark:text-brand-400">
                      {formatNumber(item.price * item.maxQuantity)} {t("so'm")}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-surface-600 dark:text-surface-400 min-w-[120px]">
                    {t("Qaytarish soni")}:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrementQuantity(item.product)}
                      disabled={processing || (returnQuantities[item.product] || 0) === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-200 dark:bg-surface-600 hover:bg-surface-300 dark:hover:bg-surface-500 text-surface-700 dark:text-surface-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={item.maxQuantity}
                      value={returnQuantities[item.product] || 0}
                      onChange={(e) => handleQuantityChange(item.product, e.target.value)}
                      disabled={processing}
                      className="w-16 text-center px-2 py-1 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 font-semibold disabled:opacity-50"
                    />
                    <button
                      onClick={() => incrementQuantity(item.product)}
                      disabled={processing || (returnQuantities[item.product] || 0) >= item.maxQuantity}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-200 dark:bg-surface-600 hover:bg-surface-300 dark:hover:bg-surface-500 text-surface-700 dark:text-surface-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-surface-500 dark:text-surface-400">
                    / {item.maxQuantity} {t("ta")}
                  </span>
                </div>

                {/* Return Amount for this item */}
                {(returnQuantities[item.product] || 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-600">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-surface-600 dark:text-surface-400">
                        {t("Qaytariladigan summa")}:
                      </span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {formatNumber(item.price * (returnQuantities[item.product] || 0))} {t("so'm")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Return Total */}
          {hasItemsToReturn && (
            <div className="mt-6 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-4 border-2 border-orange-200 dark:border-orange-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {t("Jami qaytariladigan summa")}:
                </span>
                <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                  {formatNumber(returnTotal)} {t("so'm")}
                </span>
              </div>
            </div>
          )}

          {/* Info Message */}
          {!hasItemsToReturn && (
            <div className="mt-6 bg-surface-100 dark:bg-surface-700 rounded-xl p-4 flex items-center gap-3">
              <Package className="w-5 h-5 text-surface-400" />
              <p className="text-sm text-surface-600 dark:text-surface-400">
                {t("Qaytariladigan mahsulot sonini kiriting")}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={processing}
              className="btn-secondary flex-1 font-bold disabled:opacity-50"
            >
              {t("Bekor qilish")}
            </button>
            <button 
              onClick={handleConfirm}
              disabled={processing || !hasItemsToReturn}
              className="btn-primary flex-1 font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-orange-500 hover:bg-orange-600"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="spinner w-4 h-4" />
                  <span>{t("Qaytarilmoqda")}...</span>
                </div>
              ) : (
                t("Qaytarishni tasdiqlash")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
