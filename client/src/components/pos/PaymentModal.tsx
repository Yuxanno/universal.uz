import { useState, useEffect, useRef } from 'react';
import { X, Banknote, CreditCard, AlertTriangle, User, Calculator } from 'lucide-react';
import { formatNumber, formatInputNumber, parseNumber } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';

interface PaymentModalProps {
  total: number;
  customerName?: string;
  customerId?: string;
  onConfirm: (cashAmount: number, cardAmount: number, debtAmount: number, debtPaymentCash: number, debtPaymentCard: number) => void;
  onClose: () => void;
}

export default function PaymentModal({ total, customerName, customerId, onConfirm, onClose }: PaymentModalProps) {
  const { t } = useLanguage();
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [debtAmount, setDebtAmount] = useState(0);
  const [debtPaymentCash, setDebtPaymentCash] = useState('');
  const [debtPaymentCard, setDebtPaymentCard] = useState('');
  const [customerTotalDebt, setCustomerTotalDebt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDebtPayment, setShowDebtPayment] = useState(false); // New state for checkbox
  const [isBlacklisted, setIsBlacklisted] = useState(false); // Check if customer is blacklisted
  
  // SENIOR SOLUTION: Auto focus cash input
  const cashInputRef = useRef<HTMLInputElement>(null);
  
  // Don't allow debt for "Oddiy mijoz" (regular customer without ID)
  const allowDebt = customerName !== 'Oddiy mijoz' && customerName !== undefined;
  
  // SENIOR SOLUTION: Focus cash input when modal opens
  useEffect(() => {
    setTimeout(() => {
      cashInputRef.current?.focus();
      cashInputRef.current?.select();
    }, 100);
  }, []);

  // Fetch customer's total debt when modal opens
  useEffect(() => {
    const fetchCustomerDebt = async () => {
      if (customerId && customerId !== '') {
        try {
          // Get customer data directly - it has debt field
          const response = await api.get(`/customers/${customerId}`);
          const totalDebt = response.data.debt || 0;
          setCustomerTotalDebt(totalDebt);
          
          // Check if customer is blacklisted
          const debtsResponse = await api.get(`/debts/grouped?type=receivable`);
          const customerGroup = debtsResponse.data.find((g: any) => g.customer._id === customerId);
          if (customerGroup && customerGroup.status === 'blacklist') {
            setIsBlacklisted(true);
          } else {
            setIsBlacklisted(false);
          }
        } catch (error) {
          console.error('❌ Error fetching customer debt:', error);
          setCustomerTotalDebt(0);
          setIsBlacklisted(false);
        }
      }
    };
    fetchCustomerDebt();
  }, [customerId]);

  // Auto-calculate debt when cash or card changes
  useEffect(() => {
    const cash = parseFloat(cashAmount.replace(/\s/g, '')) || 0;
    const card = parseFloat(cardAmount.replace(/\s/g, '')) || 0;
    const paid = cash + card;
    
    // Prevent overpayment - paid amount should not exceed total
    if (paid > total) {
      // If cash was just changed and exceeds total, cap it
      if (cash > total) {
        setCashAmount(total.toString());
        setCardAmount('');
      }
      // If card was just changed and total paid exceeds, cap card
      else if (card > 0) {
        const maxCard = total - cash;
        setCardAmount(Math.max(0, maxCard).toString());
      }
      return;
    }
    
    const remaining = Math.max(0, total - paid);
    
    // Only set debt if allowed
    if (allowDebt) {
      setDebtAmount(remaining);
    } else {
      setDebtAmount(0);
    }
  }, [cashAmount, cardAmount, total, allowDebt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    const cash = parseFloat(cashAmount.replace(/\s/g, '')) || 0;
    const card = parseFloat(cardAmount.replace(/\s/g, '')) || 0;
    const debtCash = parseFloat(debtPaymentCash.replace(/\s/g, '')) || 0;
    const debtCard = parseFloat(debtPaymentCard.replace(/\s/g, '')) || 0;
    const debtPayment = debtCash + debtCard;
    
    // CRITICAL: Check if customer is blacklisted and trying to create debt
    if (isBlacklisted && debtAmount > 0) {
      alert(t('⚠️ Bu mijoz qora ro\'yxatda! Qarzga sotish mumkin emas!'));
      return;
    }
    
    // Check if debt payment exceeds customer's total debt
    if (debtPayment > customerTotalDebt) {
      alert(t('Qarz to\'lovi mijozning umumiy qarzidan oshmasligi kerak!'));
      return;
    }
    
    // Prevent overpayment for current purchase
    if (cash + card > total) {
      alert(t('To\'langan summa jami summadan yuqori bo\'lmasligi kerak!'));
      return;
    }
    
    // If debt not allowed, must pay full amount
    if (!allowDebt && cash + card < total) {
      alert(t('To\'lov summasi to\'liq bo\'lishi kerak!'));
      return;
    }
    
    if (cash + card + debtAmount < total) {
      alert(t('To\'lov summasi yetarli emas!'));
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onConfirm(cash, card, allowDebt ? debtAmount : 0, debtCash, debtCard);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paidAmount = (parseFloat(cashAmount.replace(/\s/g, '')) || 0) + (parseFloat(cardAmount.replace(/\s/g, '')) || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl w-full max-w-lg relative z-10 animate-scaleIn border-2 border-neutral-200 dark:border-neutral-700 max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{t("To'lov")}</h3>
                <p className="text-white/80 text-sm">{t("To'lov turini tanlang")}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 active:scale-95"
            >
              <X className="w-6 h-6" strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Customer Info */}
            {customerName && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl p-3 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{t("Mijoz")}</p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{customerName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Total Amount */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 rounded-2xl p-4 border-2 border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">{t("Jami summa")}</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {formatNumber(total)} <span className="text-base">{t("so'm")}</span>
              </p>
            </div>

            {/* Cash Payment */}
            <div>
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                {t("Naqd pul")}
              </label>
              <input
                ref={cashInputRef}
                type="text"
                className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-bold text-center"
                placeholder="0"
                value={formatInputNumber(cashAmount)}
                onChange={e => setCashAmount(parseNumber(e.target.value))}
              />
            </div>

            {/* Card Payment */}
            <div>
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                {t("Plastik karta")}
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-lg font-bold text-center"
                placeholder="0"
                value={formatInputNumber(cardAmount)}
                onChange={e => setCardAmount(parseNumber(e.target.value))}
              />
            </div>

            {/* Debt Amount (Auto-calculated) - Compact */}
            {allowDebt && debtAmount > 0 && (
              <div className={`rounded-xl p-3 border-2 ${
                isBlacklisted 
                  ? 'bg-gradient-to-r from-gray-700 to-gray-900 border-gray-800'
                  : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle 
                      className={`w-5 h-5 ${isBlacklisted ? 'text-white' : 'text-red-600 dark:text-red-400'}`}
                      style={isBlacklisted ? { color: '#ffffff' } : undefined}
                    />
                    <p 
                      className={`text-sm font-bold ${isBlacklisted ? 'text-white' : 'text-red-600 dark:text-red-400'}`}
                      style={isBlacklisted ? { color: '#ffffff' } : undefined}
                    >
                      {isBlacklisted ? t("⚠️ QORA RO'YXAT") : t("Qarz summasi")}
                    </p>
                  </div>
                  <p 
                    className={`text-lg font-black ${isBlacklisted ? 'text-white' : 'text-red-700 dark:text-red-300'}`}
                    style={isBlacklisted ? { color: '#ffffff' } : undefined}
                  >
                    {formatNumber(debtAmount)} <span className="text-sm" style={isBlacklisted ? { color: '#ffffff' } : undefined}>{t("so'm")}</span>
                  </p>
                </div>
                {isBlacklisted && (
                  <p 
                    className="text-sm font-semibold text-center"
                    style={{ color: '#ffffff' }}
                  >
                    {t("Bu mijozga qarzga sotish taqiqlangan!")}
                  </p>
                )}
              </div>
            )}

            {/* Debt Payment Section - Only show when purchase is fully paid */}
            {customerId && customerId !== '' && customerTotalDebt > 0 && paidAmount >= total && (
              <div className="space-y-2">
                {/* Button to toggle debt payment */}
                <button
                  type="button"
                  onClick={() => {
                    setShowDebtPayment(!showDebtPayment);
                    if (showDebtPayment) {
                      setDebtPaymentCash(''); // Clear amounts when closing
                      setDebtPaymentCard('');
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border-2 ${
                    showDebtPayment
                      ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 hover:border-amber-300 dark:hover:border-amber-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      showDebtPayment 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-white dark:bg-neutral-700 border-2 border-amber-300 dark:border-amber-600'
                    }`}>
                      {showDebtPayment && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                      {t("Qarzdan to'lash")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                      {formatNumber(customerTotalDebt)} {t("so'm")}
                    </span>
                  </div>
                </button>

                {/* Input fields - only show when button is active */}
                {showDebtPayment && (
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 rounded-xl p-3 border-2 border-amber-200 dark:border-amber-800 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Cash debt payment */}
                      <div>
                        <label className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                          <Banknote className="w-3 h-3" />
                          {t("Naqd")}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 border-2 border-amber-300 dark:border-amber-600 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm font-bold text-center"
                          placeholder="0"
                          value={formatInputNumber(debtPaymentCash)}
                          onChange={e => setDebtPaymentCash(parseNumber(e.target.value))}
                          autoFocus
                        />
                      </div>

                      {/* Card debt payment */}
                      <div>
                        <label className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {t("Karta")}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 border-2 border-amber-300 dark:border-amber-600 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm font-bold text-center"
                          placeholder="0"
                          value={formatInputNumber(debtPaymentCard)}
                          onChange={e => setDebtPaymentCard(parseNumber(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="bg-neutral-50 dark:bg-neutral-700 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">{t("To'langan")}:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {formatNumber(paidAmount)} {t("so'm")}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-600 flex justify-between">
                <span className="font-bold text-neutral-700 dark:text-neutral-300">{t("Jami")}:</span>
                <span className="font-black text-lg text-neutral-900 dark:text-neutral-100">
                  {formatNumber(total)} {t("so'm")}
                </span>
              </div>
            </div>

            {/* Warning if debt without customer */}
            {allowDebt && debtAmount > 0 && !customerName && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 text-center">
                  ⚠️ {t("Qarz yaratish uchun avval mijoz tanlang!")}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="flex-shrink-0 p-4 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all font-bold active:scale-95 disabled:opacity-50"
            >
              {t("Bekor qilish")}
            </button>
            <button 
              type="submit"
              form="payment-form"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              disabled={isSubmitting || (allowDebt && debtAmount > 0 && !customerName) || (!allowDebt && paidAmount < total) || (isBlacklisted && debtAmount > 0)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-bold shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("Yuklanmoqda...") : t("To'lash")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
