import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  showPasswordToggle?: boolean;
}

/**
 * Input Component - Professional Form Input
 * 
 * Features:
 * - Real-time validation feedback
 * - Success/Error states
 * - Helper text
 * - Icon support
 * - Password toggle
 * - WCAG AA compliant
 * 
 * Usage:
 * <Input
 *   label="Mahsulot nomi"
 *   value={name}
 *   onChange={handleChange}
 *   error={nameError}
 *   success={nameValid}
 *   helperText="Kamida 3 ta harf"
 * />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    success = false,
    helperText,
    icon,
    iconPosition = 'left',
    showPasswordToggle = false,
    type = 'text',
    className = '',
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative group">
          {/* Left Icon */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors pointer-events-none">
              {icon}
            </div>
          )}
          
          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full px-4 py-3 text-sm text-gray-900 bg-white
              border rounded-lg placeholder:text-gray-400
              transition-all duration-200
              focus:outline-none focus:ring-4
              disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
              dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
              dark:focus:bg-gray-900 dark:placeholder:text-gray-500
              dark:disabled:bg-gray-900
              ${error 
                ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10 pr-10' 
                : success
                ? 'border-success-300 focus:border-success-500 focus:ring-success-500/10 pr-10'
                : 'border-gray-300 focus:border-red-500 focus:ring-red-500/10'
              }
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${showPasswordToggle ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          
          {/* Right Icon */}
          {icon && iconPosition === 'right' && !error && !success && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          
          {/* Password Toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
          
          {/* Error Icon */}
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-danger-500 pointer-events-none">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          
          {/* Success Icon */}
          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success-500 pointer-events-none">
              <CheckCircle className="w-5 h-5" />
            </div>
          )}
        </div>
        
        {/* Helper Text / Error Message */}
        {(helperText || error) && (
          <div className="flex items-start gap-1.5">
            {error ? (
              <p className="text-sm text-danger-600 dark:text-danger-400 font-medium">
                {error}
              </p>
            ) : helperText ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {helperText}
              </p>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
