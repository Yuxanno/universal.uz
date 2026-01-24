import { HTMLAttributes, forwardRef } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  onClose?: () => void;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ children, variant = 'info', title, onClose, className = '', ...props }, ref) => {
    const variants = {
      info: {
        container: 'bg-primary-50 border-primary-200 text-primary-800',
        icon: <AlertCircle className="w-5 h-5 text-primary-600" />
      },
      success: {
        container: 'bg-success-50 border-success-200 text-success-800',
        icon: <CheckCircle className="w-5 h-5 text-success-600" />
      },
      warning: {
        container: 'bg-warning-50 border-warning-200 text-warning-800',
        icon: <AlertTriangle className="w-5 h-5 text-warning-600" />
      },
      danger: {
        container: 'bg-danger-50 border-danger-200 text-danger-800',
        icon: <XCircle className="w-5 h-5 text-danger-600" />
      }
    };
    
    return (
      <div
        ref={ref}
        className={`
          flex items-start gap-3 p-4 rounded-xl border
          ${variants[variant].container}
          ${className}
        `}
        {...props}
      >
        <div className="flex-shrink-0 mt-0.5">
          {variants[variant].icon}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
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
