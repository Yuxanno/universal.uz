import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export default function AlertModal({
  isOpen, onClose, onConfirm, title, message,
  type = 'info', confirmText = 'OK', cancelText = 'Bekor qilish', showCancel = false
}: AlertModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); onConfirm ? onConfirm() : onClose(); }
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onConfirm, onClose]);

  if (!isOpen) return null;

  const icons = {
    info: <Info className="w-6 h-6 text-primary-600" />,
    success: <CheckCircle className="w-6 h-6 text-primary-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-red-600" />,
    danger: <AlertTriangle className="w-6 h-6 text-red-600" />
  };

  const colors = {
    info: 'bg-primary-50', success: 'bg-primary-50',
    warning: 'bg-red-50', danger: 'bg-red-50'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-scaleIn border-2 border-neutral-100">
        <div className="p-8">
          <div className="flex items-start gap-5 mb-8">
            <div className={`w-16 h-16 ${colors[type]} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
              {icons[type]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-900 mb-3" style={{ color: '#111827' }}>{title}</h3>
              <p className="text-base font-semibold text-neutral-900 dark:text-neutral-900 whitespace-pre-line leading-relaxed" style={{ color: '#1f2937' }}>{message}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {showCancel && (
              <button 
                onClick={onClose} 
                className="flex-1 px-5 py-3.5 bg-neutral-200 text-neutral-900 rounded-xl hover:bg-neutral-300 font-bold transition-all text-base"
                style={{ color: '#111827' }}
              >
                {cancelText}
              </button>
            )}
            <button 
              ref={confirmRef} 
              onClick={onConfirm || onClose} 
              className={`flex-1 px-5 py-3.5 rounded-xl font-bold transition-all shadow-lg text-base text-white ${
                type === 'danger' || type === 'warning' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-500 hover:bg-primary-600'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
