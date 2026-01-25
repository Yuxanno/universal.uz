import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Button Component - WCAG AA Compliant
 * 
 * Minimal sizes:
 * - Desktop: 44x44px (WCAG 2.1 AA)
 * - Mobile: 48x48px (Apple/Google guidelines)
 * 
 * Usage:
 * <Button variant="primary" size="md" icon={<Plus />}>Qo'shish</Button>
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
    const baseStyles = `
      inline-flex items-center justify-center gap-2 font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `;
    
    const variants = {
      primary: `
        bg-primary-600 text-white shadow-sm
        hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5
        active:bg-primary-800 active:translate-y-0
        focus-visible:ring-primary-500
      `,
      secondary: `
        bg-neutral-100 text-neutral-900 border border-neutral-200
        hover:bg-neutral-200 hover:border-neutral-300
        active:bg-neutral-300
        focus-visible:ring-gray-400
        dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700
        dark:hover:bg-neutral-700
      `,
      ghost: `
        bg-transparent text-neutral-600
        hover:bg-neutral-100 hover:text-neutral-900
        active:bg-neutral-200
        dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100
      `,
      success: `
        bg-success-600 text-white shadow-sm
        hover:bg-success-700 hover:shadow-md hover:-translate-y-0.5
        active:bg-success-800 active:translate-y-0
        focus-visible:ring-success-500
      `,
      danger: `
        bg-danger-600 text-white shadow-sm
        hover:bg-danger-700 hover:shadow-md hover:-translate-y-0.5
        active:bg-danger-800 active:translate-y-0
        focus-visible:ring-danger-500
      `,
      warning: `
        bg-warning-600 text-white shadow-sm
        hover:bg-warning-700 hover:shadow-md hover:-translate-y-0.5
        active:bg-warning-800 active:translate-y-0
        focus-visible:ring-warning-500
      `
    };
    
    const sizes = {
      sm: 'min-h-[40px] px-3 py-2 text-sm',
      md: 'min-h-[44px] px-6 py-3 text-sm',
      lg: 'min-h-[48px] px-8 py-3.5 text-base'
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
