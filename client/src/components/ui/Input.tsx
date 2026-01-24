import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    icon,
    iconPosition = 'left',
    className = '',
    ...props 
  }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-gray-700">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50
              border rounded-lg placeholder:text-gray-400
              transition-all duration-200
              focus:outline-none focus:bg-white focus:ring-4
              disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
              dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
              dark:focus:bg-gray-900 dark:placeholder:text-gray-500
              dark:disabled:bg-gray-900
              ${error 
                ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10' 
                : 'border-gray-200 focus:border-red-500 focus:ring-red-500/10'
              }
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-danger-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
