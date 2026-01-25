import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Modern Button Component
 * 
 * Design: White • Red • Black
 * - Primary: Red CTA (main actions)
 * - Secondary: Black outline (supporting actions)
 * - Ghost: Minimal (tertiary actions)
 * - Danger: Red destructive (delete, cancel)
 * 
 * Features:
 * - Smooth hover animations
 * - Loading states
 * - Icon support
 * - Accessibility compliant
 * - Mobile optimized
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    fullWidth = false,
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';
    
    const variants = {
      primary: 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md hover:-translate-y-0.5 active:bg-red-800 active:translate-y-0 active:shadow-sm focus-visible:ring-red-500',
      secondary: 'bg-white text-neutral-900 border-2 border-neutral-900 hover:bg-neutral-900 hover:text-white hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 dark:border-neutral-50 dark:hover:bg-neutral-50 dark:hover:text-neutral-950',
      ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
      danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md hover:-translate-y-0.5 active:bg-red-800 active:translate-y-0 focus-visible:ring-red-500'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
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
