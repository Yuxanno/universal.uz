import { HTMLAttributes, forwardRef } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
 variant?: 'success' | 'error' | 'warning' | 'info';
 title?: string;
 message?: string;
 onClose?: () => void;
 icon?: React.ReactNode;
}

/**
 * Logo-based Alert Component
 * Error/Danger: RED from logo
 * Success: GREEN
 * Warning: AMBER
 * Info: SLATE
 */
const Alert = forwardRef<HTMLDivElement, AlertProps>(
 ({ 
 variant = 'info', 
 title, 
 message, 
 onClose,
 icon,
 children, 
 className = '', 
 ...props 
 }, ref) => {
 const variants = {
 success: {
 container: 'bg-green-50 border-green-200 text-green-800',
 icon: 'text-green-600',
 title: 'text-green-900',
 message: 'text-green-700',
 defaultIcon: <CheckCircle className="w-5 h-5" />
 },
 error: {
 container: 'bg-red-50 border-red-200 text-red-800',
 icon: 'text-red-600',
 title: 'text-red-900',
 message: 'text-red-700',
 defaultIcon: <AlertCircle className="w-5 h-5" />
 },
 warning: {
 container: 'bg-amber-50 border-amber-200 text-amber-800',
 icon: 'text-amber-600',
 title: 'text-amber-900',
 message: 'text-amber-700',
 defaultIcon: <AlertTriangle className="w-5 h-5" />
 },
 info: {
 container: 'bg-slate-50 border-slate-200 text-slate-800',
 icon: 'text-slate-600',
 title: 'text-slate-900',
 message: 'text-slate-700',
 defaultIcon: <Info className="w-5 h-5" />
 }
 };

 const config = variants[variant];

 return (
 <div
 ref={ref}
 className={`
 flex items-start gap-3 p-4 
 border-2 rounded-xl
 ${config.container}
 ${className}
 `}
 role="alert"
 {...props}
 >
 <div className={`flex-shrink-0 ${config.icon}`}>
 {icon || config.defaultIcon}
 </div>
 
 <div className="flex-1 min-w-0">
 {title && (
 <h4 className={`text-sm font-semibold mb-1 ${config.title}`}>
 {title}
 </h4>
 )}
 {message && (
 <p className={`text-sm ${config.message}`}>
 {message}
 </p>
 )}
 {children && (
 <div className={`text-sm ${config.message}`}>
 {children}
 </div>
 )}
 </div>

 {onClose && (
 <button
 onClick={onClose}
 className={`
 flex-shrink-0 p-1 rounded-lg
 ${config.icon}
 hover:bg-black/5
 transition-colors
 `}
 aria-label="Close alert"
 >
 <X className="w-4 h-4" />
 </button>
 )}
 </div>
 );
 }
);

Alert.displayName = 'Alert';

export default Alert;
