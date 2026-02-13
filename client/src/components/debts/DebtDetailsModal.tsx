import { useState } from 'react';
import { X, User, Phone, Calendar, DollarSign, AlertTriangle, Clock, CheckCircle2, CreditCard, Banknote, FileText, Package } from 'lucide-react';
import { Debt } from '../../types';
import { formatNumber, displayPhone, formatInputNumber, parseNumber } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';

interface DebtDetailsModalProps {
  debt: Debt;
  group?: {
    customer: any;
    totalAmount: number;
    totalPaid: number;
    remainingAmount: number;
    debtCount: number;
    debts: Debt[];
  };
  onClose: () => void;
  onUpdate: () => void;
  onAddDebt?: () => void;
}



export default function DebtDetailsModal({ debt, group, onClose, onUpdate, onAddDebt }: DebtDetailsModalProps) {
  const { t } = useLanguage();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlacklisting, setIsBlacklisting] = useState(false);

  // Use group data if available, otherwise use single debt data
  const totalAmount = group ? group.totalAmount : debt.amount;
  const totalPaid = group ? group.totalPaid : debt.paidAmount;
  const remainingAmount = group ? group.remainingAmount : (debt.amount - debt.paidAmount);
  const paymentProgress = (totalPaid / totalAmount) * 100;

  // Calculate amounts from different sources
  const manualDebtAmount = (debt as any).receipt ? 0 : debt.amount;
  const receiptDebtAmount = (debt as any).receipt ? debt.amount : 0;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cash = parseFloat(cashAmount.replace(/\s/g, '')) || 0;
    const card = parseFloat(cardAmount.replace(/\s/g, '')) || 0;
    const totalPayment = cash + card;

    if (totalPayment <= 0 || totalPayment > remainingAmount) {
      alert(t('Noto\'g\'ri summa!'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Use bulk payment endpoint to pay oldest debts first
      const customerId = debt.customer?._id || group?.customer?._id;
      
      if (!customerId) {
        alert(t('Mijoz topilmadi!'));
        return;
      }

      await api.post('/debts/pay-bulk', {
        customerId,
        cashAmount: cash,
        cardAmount: card,
        totalAmount: totalPayment
      });
      
      setShowPaymentForm(false);
      setCashAmount('');
      setCardAmount('');
      onUpdate();
      
      if (totalPayment >= remainingAmount) {
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      console.error('Error making payment:', err);
      alert(t('Xatolik yuz berdi!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlacklist = async () => {
    if (isBlacklisting) return;
    
    const isCurrentlyBlacklisted = debt.status === 'blacklist';
    const confirmMessage = isCurrentlyBlacklisted 
      ? t("Mijozni qora ro'yxatdan chiqarmoqchimisiz?")
      : t("Mijozni qora ro'yxatga qo'shmoqchimisiz? Qora ro'yxatdagi mijozlarga qarzga sotish mumkin emas!");
    
    if (!window.confirm(confirmMessage)) return;
    
    setIsBlacklisting(true);
    try {
      await api.put(`/debts/${debt._id}/blacklist`, {
        blacklist: !isCurrentlyBlacklisted
      });
      onUpdate();
    } catch (err) {
      console.error('Error toggling blacklist:', err);
      alert(t('Xatolik yuz berdi!'));
    } finally {
      setIsBlacklisting(false);
    }
  };

  const getDebtorName = () => {
    if (debt.customer?.name) return debt.customer.name;
    if ((debt as any).creditorName) return (debt as any).creditorName;
    
    // Debug: log the debt object
    console.log('Debt object:', debt);
    console.log('Customer:', debt.customer);
    
    return t("Mijoz nomi ko'rsatilmagan");
  };

  const getDebtorPhone = () => {
    return debt.customer?.phone || '';
  };

  const getStatusColor = () => {
    if (debt.status === 'paid') return 'emerald';
    if (debt.status === 'overdue') return 'red';
    return 'amber';
  };

  const getStatusIcon = () => {
    if (debt.status === 'paid') return <CheckCircle2 className="w-5 h-5" />;
    if (debt.status === 'overdue') return <AlertTriangle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (debt.status === 'paid') return t("To'langan");
    if (debt.status === 'blacklist') return t("Qora ro'yxat");
    if (debt.status === 'overdue') return t("Muddati o'tgan");
    return t('Kutilmoqda');
  };

  const statusColor = getStatusColor();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 animate-scaleIn border-2 border-neutral-200 dark:border-neutral-700 max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r from-${statusColor}-500 to-${statusColor}-600 px-6 py-5 flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                {getStatusIcon()}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{t("Qarz tafsilotlari")}</h3>
                <p className="text-white/80 text-sm">{getStatusText()}</p>
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
          <div className="p-6 space-y-4">
            {/* Customer Info */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    {(debt as any).type === 'receivable' ? t('Qarzdor') : t('Kimga qarzdorman')}
                  </p>
                  <p className="text-lg font-black text-blue-900 dark:text-blue-100 mb-1">
                    {getDebtorName()}
                  </p>
                  {getDebtorPhone() && (
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Phone className="w-4 h-4" />
                      <span className="font-semibold text-sm">{displayPhone(getDebtorPhone())}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Amount Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-800 rounded-xl p-3 border-2 border-neutral-200 dark:border-neutral-600">
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">{t("Jami qarz")}</p>
                <p className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                  {formatNumber(totalAmount)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("so'm")}</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 rounded-xl p-3 border-2 border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">{t("To'langan")}</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  {formatNumber(totalPaid)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{t("so'm")}</p>
              </div>

              <div className={`bg-gradient-to-br from-${statusColor}-50 to-${statusColor}-100 dark:from-${statusColor}-900/20 dark:to-${statusColor}-900/30 rounded-xl p-3 border-2 border-${statusColor}-200 dark:border-${statusColor}-800`}>
                <p className={`text-xs font-bold text-${statusColor}-600 dark:text-${statusColor}-400 mb-1`}>{t("Qoldiq")}</p>
                <p className={`text-xl font-black text-${statusColor}-700 dark:text-${statusColor}-300`}>
                  {formatNumber(remainingAmount)}
                </p>
                <p className={`text-xs text-${statusColor}-600 dark:text-${statusColor}-400`}>{t("so'm")}</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              {debt.dueDate && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{t("Muddat")}</p>
                    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {new Date(debt.dueDate).toLocaleDateString('en-GB').replace(/\//g, '.')}
                    </p>
                  </div>
                </div>
              )}

              {/* Collateral */}
              {(debt as any).collateral && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex items-center gap-3 border-2 border-amber-200 dark:border-amber-800">
                  <div className="w-10 h-10 bg-amber-200 dark:bg-amber-800 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t("Zalog")}</p>
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                      {(debt as any).collateral}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* All Debts List - Show all debts for this customer */}
            {group && group.debts && group.debts.length > 0 && (
              <div>
                {/* Action Buttons - Before "Barcha qarzlar" */}
                {debt.status !== 'paid' && !showPaymentForm && (
                  <div className="flex gap-2 mb-3">
                    {onAddDebt && (
                      <button
                        onClick={onAddDebt}
                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        {t("Qarz qo'shish")}
                      </button>
                    )}
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-bold shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      {t("To'lov qilish")}
                    </button>
                    {/* Blacklist Toggle Button - Icon Only with WHITE icon */}
                    <button
                      onClick={handleToggleBlacklist}
                      disabled={isBlacklisting}
                      className={`py-3 px-4 rounded-xl transition-all font-bold shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center ${
                        debt.status === 'blacklist'
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                          : 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black'
                      } disabled:opacity-50`}
                      title={isBlacklisting 
                        ? t("Yuklanmoqda...") 
                        : debt.status === 'blacklist' 
                          ? t("Qora ro'yxatdan chiqarish") 
                          : t("Qora ro'yxatga qo'shish")
                      }
                    >
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}
                
                {/* Payment Form - Right after buttons */}
                {showPaymentForm && (
                  <form onSubmit={handlePayment} className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 rounded-2xl p-5 border-2 border-emerald-200 dark:border-emerald-800 space-y-4 mb-3 animate-slideDown">
                    <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      {t("To'lov qilish")}
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-2 block flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          {t("Naqd")}
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-bold text-center"
                          placeholder="0"
                          value={formatInputNumber(cashAmount)}
                          onChange={e => setCashAmount(parseNumber(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-2 block flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          {t("Karta")}
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-bold text-center"
                          placeholder="0"
                          value={formatInputNumber(cardAmount)}
                          onChange={e => setCardAmount(parseNumber(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-700 rounded-xl p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{t("Jami to'lov")}:</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {formatNumber((parseFloat(cashAmount.replace(/\s/g, '')) || 0) + (parseFloat(cardAmount.replace(/\s/g, '')) || 0))} {t("so'm")}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPaymentForm(false);
                          setCashAmount('');
                          setCardAmount('');
                        }}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all font-bold active:scale-95 disabled:opacity-50"
                      >
                        {t("Bekor qilish")}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-bold shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50"
                      >
                        {isSubmitting ? t("Yuklanmoqda...") : t("Tasdiqlash")}
                      </button>
                    </div>
                  </form>
                )}
                
                <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t("Barcha qarzlar")} ({group.debts.length})
                </h4>
                <div className="space-y-2">
                  {group.debts.map((debtItem: any, index: number) => {
                    const debtRemaining = debtItem.amount - debtItem.paidAmount;
                    const isFromReceipt = debtItem.receipt;
                    
                    return (
                      <div 
                        key={debtItem._id || index} 
                        className={`rounded-xl p-4 border-2 ${
                          isFromReceipt 
                            ? 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 border-purple-200 dark:border-purple-800'
                            : 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isFromReceipt ? 'bg-purple-500' : 'bg-blue-500'
                            }`}>
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className={`text-xs font-semibold mb-1 ${
                                isFromReceipt 
                                  ? 'text-purple-600 dark:text-purple-400' 
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}>
                                {isFromReceipt ? '📄 Sotuvdan' : '✍️ Qo\'lda qo\'shilgan'}
                              </p>
                              <p className={`text-lg font-black mb-1 ${
                                isFromReceipt 
                                  ? 'text-purple-900 dark:text-purple-100' 
                                  : 'text-blue-900 dark:text-blue-100'
                              }`}>
                                {formatNumber(debtItem.amount)} {t("so'm")}
                              </p>
                              {debtItem.paidAmount > 0 && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                                  ✅ To'langan: {formatNumber(debtItem.paidAmount)} {t("so'm")}
                                </p>
                              )}
                              {debtRemaining > 0 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                                  ⏳ Qoldiq: {formatNumber(debtRemaining)} {t("so'm")}
                                </p>
                              )}
                              {debtItem.createdAt && (
                                <p className={`text-xs mt-1 ${
                                  isFromReceipt 
                                    ? 'text-purple-700 dark:text-purple-300' 
                                    : 'text-blue-700 dark:text-blue-300'
                                }`}>
                                  📅 {new Date(debtItem.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.')} {new Date(debtItem.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                              {debtItem.description && (
                                <div className="mt-2 p-2 bg-white/50 dark:bg-neutral-800/50 rounded-lg">
                                  <p className="text-xs text-neutral-600 dark:text-neutral-400 break-words whitespace-pre-wrap">
                                    💬 {debtItem.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            debtItem.status === 'paid' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : debtItem.status === 'overdue'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}>
                            {debtItem.status === 'paid' ? '✅ To\'langan' : 
                             debtItem.status === 'overdue' ? '⚠️ O\'tgan' : '⏳ Kutilmoqda'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single Debt Info - Only show if no group */}
            {!group && ((debt as any).receipt ? (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">{t("Qarz manbai")}</p>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-1">
                      📄 {t("Sotuvdan")} - {formatNumber(receiptDebtAmount)} {t("so'm")}
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                      {t("Chek")} #{(debt as any).receipt?.receiptNumber || (debt as any).receipt?._id?.slice(-6) || 'N/A'}
                    </p>
                    {(debt as any).receipt?.createdAt && (
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        📅 {new Date((debt as any).receipt.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.')} {new Date((debt as any).receipt.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {(debt as any).receipt?.createdBy && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        👤 {t("Sotuvchi")}: {(debt as any).receipt.createdBy.name || (debt as any).receipt.createdBy.username}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">{t("Qarz manbai")}</p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
                      ✍️ {t("Qo'lda qo'shilgan")} - {formatNumber(manualDebtAmount)} {t("so'm")}
                    </p>
                    {(debt as any).createdAt && (
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        📅 {new Date((debt as any).createdAt).toLocaleDateString('en-GB').replace(/\//g, '.')} {new Date((debt as any).createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Description - if receipt exists, show description below receipt */}
            {(debt as any).receipt && (debt as any).description && (
              <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-800 rounded-2xl p-5 border-2 border-neutral-200 dark:border-neutral-600">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">{t("Qarz haqida to'liq ma'lumot")}</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed whitespace-pre-line">
                      {(debt as any).description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History */}
            {(debt as any).payments && (debt as any).payments.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t("To'lovlar tarixi")} ({(debt as any).payments.length})
                </h4>
                <div className="space-y-2">
                  {(debt as any).payments.map((payment: any, index: number) => (
                    <div key={index} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border-2 border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                            {payment.method === 'card' ? (
                              <CreditCard className="w-5 h-5 text-white" />
                            ) : (
                              <Banknote className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                              {formatNumber(payment.amount)} {t("so'm")}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              {new Date(payment.date).toLocaleDateString('en-GB').replace(/\//g, '.')} {new Date(payment.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-lg">
                            {payment.method === 'card' ? '💳 Karta' : '💵 Naqd'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
