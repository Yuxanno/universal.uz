import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

/**
 * Modern Toast Component
 * 
 * Design: Slide-in notifications
 * - Success: Red with checkmark
 * - Error: Red with alert
 * - Info: Neutral
 * - Auto-dismiss
 * - Smooth animations
 */
export default function Toast({ id, type, message, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    info: <Info className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
  };

  const borderColors = {
    success: 'border-red-500',
    error: 'border-red-500',
    info: 'border-neutral-300 dark:border-neutral-700'
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl shadow-lg border-2
        bg-white dark:bg-neutral-900
        ${borderColors[type]}
        animate-slide-in-right
        min-w-[300px] max-w-md
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      
      <p className="flex-1 text-sm text-neutral-900 dark:text-neutral-100">
        {message}
      </p>
      
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 p-1 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Toast Container - Manages multiple toasts
 */
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    message: string;
  }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={onClose}
        />
      ))}
    </div>,
    document.body
  );
}
