import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 active:bg-primary-800 active:translate-y-0 focus-visible:ring-primary-500',
      secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300 focus-visible:ring-secondary-400',
      ghost: 'bg-transparent text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 active:bg-secondary-200',
      success: 'bg-success-600 text-white shadow-sm hover:bg-success-700 hover:shadow-md hover:-translate-y-0.5 active:bg-success-800 active:translate-y-0 focus-visible:ring-success-500',
      danger: 'bg-danger-600 text-white shadow-sm hover:bg-danger-700 hover:shadow-md hover:-translate-y-0.5 active:bg-danger-800 active:translate-y-0 focus-visible:ring-danger-500',
      warning: 'bg-warning-500 text-white shadow-sm hover:bg-warning-600 hover:shadow-md hover:-translate-y-0.5 active:bg-warning-700 active:translate-y-0 focus-visible:ring-warning-500'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Yuklanmoqda...</span>
          </>
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
