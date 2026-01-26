import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
 id: string;
 type: ToastType;
 title: string;
 message?: string;
 duration?: number;
 onClose: (id: string) => void;
}

const toastStyles = {
 success: 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-800 dark:text-success-200',
 error: 'bg-danger-50 border-danger-200 text-danger-800 dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-200',
 info: 'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-200',
 warning: 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-200',
};

const toastIcons = {
 success: CheckCircle,
 error: AlertCircle,
 info: Info,
 warning: AlertTriangle,
};

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
 const Icon = toastIcons[type];
 const [isExiting, setIsExiting] = useState(false);

 useEffect(() => {
 if (duration > 0) {
 const timer = setTimeout(() => {
 setIsExiting(true);
 setTimeout(() => onClose(id), 300); // Match animation duration
 }, duration);
 return () => clearTimeout(timer);
 }
 }, [id, duration, onClose]);

 const handleClose = () => {
 setIsExiting(true);
 setTimeout(() => onClose(id), 300);
 };

 return (
 <div
 className={`
 flex items-start gap-3 p-4 rounded-xl border shadow-lg
 ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
 ${toastStyles[type]}
 `}
 role="alert"
 aria-live="polite"
 aria-atomic="true"
 >
 <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-sm">{title}</p>
 {message && <p className="text-sm mt-1 opacity-90">{message}</p>}
 </div>
 <button
 onClick={handleClose}
 className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
 aria-label="Close notification"
 type="button"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 );
}
