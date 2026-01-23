import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

/**
 * Logo-based Button Component
 * Primary color: RED (#dc2626) from logo
 * Background: WHITE
 */
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
    const baseStyles = `
      inline-flex items-center justify-center gap-2 
      font-semibold rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-4
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: `
        bg-red-600 hover:bg-red-700 active:bg-red-800
        text-white shadow-sm hover:shadow-md
        focus:ring-red-500/20
      `,
      secondary: `
        bg-white hover:bg-gray-50 active:bg-gray-100
        text-slate-700 
        border-2 border-red-500 hover:border-red-600
        focus:ring-red-500/20
      `,
      ghost: `
        bg-transparent hover:bg-red-50 active:bg-red-100
        text-red-600 hover:text-red-700
        focus:ring-red-500/20
      `,
      danger: `
        bg-red-600 hover:bg-red-700 active:bg-red-800
        text-white shadow-sm hover:shadow-md
        focus:ring-red-500/20
      `
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
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
