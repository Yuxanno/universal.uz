import { useState } from 'react';
import { X, DollarSign, Calendar, FileText, Package, User, Phone, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCustomers } from '../../context/CustomersContext';
import { formatInputNumber, parseNumber } from '../../utils/format';
import api from '../../utils/api';

interface AddDebtModalProps {
  onClose: () => void;
  onSuccess: () => void;
  customerId?: string;
}

export default function AddDebtModal({ onClose, onSuccess, customerId }: AddDebtModalProps) {
  const { t } = useLanguage();
  const { customers } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(!customerId);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    customer: customerId || '',
    amount: '',
    dueDate: '',
    description: '',
    collateral: ''
  });

  const filteredCustomers = customers.filter(c => {
    const searchLower = customerSearchQuery.toLowerCase();
    return c.name.toLowerCase().includes(searchLower) || 
      c.phone.includes(customerSearchQuery);
  });

  const selectedCustomer = customers.find(c => c._id === formData.customer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer) {
      alert(t('Iltimos, mijozni tanlang!'));
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount.replace(/\s/g, '')) <= 0) {
      alert(t('Iltimos, summani kiriting!'));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/debts', {
        type: 'receivable',
        customer: formData.customer,
        amount: parseFloat(formData.amount.replace(/\s/g, '')),
        dueDate: formData.dueDate || null,
        description: formData.description,
        collateral: formData.collateral
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error adding debt:', err);
      alert(err.response?.data?.message || t('Xatolik yuz berdi!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setFormData({ ...formData, customer: customerId });
    const customer = customers.find(c => c._id === customerId);
    if (customer) {
      setCustomerSearchQuery(`${customer.name} - ${customer.phone}`);
    }
    setShowCustomerSearch(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border-2 border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{t("Yangi qarz qo'shish")}</h3>
                <p className="text-white/80 text-sm">{t("Mijozga qarz berish")}</p>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              {t("Mijoz")} *
            </label>
            
            {selectedCustomer ? (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border-2 border-primary-200 dark:border-primary-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-primary-900 dark:text-primary-100">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-primary-600 dark:text-primary-400 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {selectedCustomer.phone}
                      </p>
                    )}
                  </div>
                  {!customerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, customer: '' });
                        setCustomerSearchQuery('');
                        setShowCustomerSearch(true);
                      }}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {t("O'zgartirish")}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value);
                    setShowCustomerSearch(true);
                  }}
                  onFocus={() => setShowCustomerSearch(true)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all"
                  placeholder={t("Mijoz nomi yoki telefon...")}
                />
                
                {showCustomerSearch && customerSearchQuery && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-700 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl shadow-xl max-h-60 overflow-y-auto z-10">
                    {filteredCustomers.map(customer => (
                      <button
                        key={customer._id}
                        type="button"
                        onClick={() => handleCustomerSelect(customer._id)}
                        className="w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors border-b border-neutral-100 dark:border-neutral-600 last:border-0"
                      >
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{customer.name}</p>
                        {customer.phone && (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">{customer.phone}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t("Qarz summasi")} *
            </label>
            <input
              type="text"
              value={formatInputNumber(formData.amount)}
              onChange={(e) => setFormData({ ...formData, amount: parseNumber(e.target.value) })}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all text-lg font-bold"
              placeholder="0"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t("To'lov muddati")} ({t("ixtiyoriy")})
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t("Izoh")} ({t("ixtiyoriy")})
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all resize-none"
              rows={3}
              placeholder={t("Qarz haqida qo'shimcha ma'lumot...")}
            />
          </div>

          {/* Collateral */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              {t("Zalog")} ({t("ixtiyoriy")})
            </label>
            <input
              type="text"
              value={formData.collateral}
              onChange={(e) => setFormData({ ...formData, collateral: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
              placeholder={t("Masalan: Telefon, Guvohnoma...")}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all font-bold active:scale-95 disabled:opacity-50"
            >
              {t("Bekor qilish")}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              {isSubmitting ? t("Saqlanmoqda...") : t("Qarz qo'shish")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
