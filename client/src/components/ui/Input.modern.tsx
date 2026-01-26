import { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
 label?: string;
 error?: string;
 helperText?: string;
 icon?: React.ReactNode;
 fullWidth?: boolean;
}

/**
 * Modern Input Component
 * 
 * Design: Clean with red focus states
 * - White background
 * - Red border on focus
 * - Error states
 * - Icon support
 * - Accessibility compliant
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
 ({ 
 label, 
 error, 
 helperText, 
 icon,
 fullWidth = true,
 className = '',
 id,
 ...props 
 }, ref) => {
 const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
 const hasError = !!error;
 
 const widthClass = fullWidth ? 'w-full' : '';
 
 const inputClasses = `
 ${widthClass} px-4 py-2.5 text-sm
 bg-white text-neutral-900
 border-2 rounded-lg
 placeholder:text-neutral-400
 transition-all duration-200
 focus:outline-none focus:ring-4
 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed
 dark:bg-neutral-900 dark:text-neutral-100
 ${hasError 
 ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' 
 : 'border-neutral-300 focus:border-red-500 focus:ring-red-500/10 dark:border-neutral-700 dark:focus:border-red-400 dark:focus:ring-red-400/10'
 }
 ${icon ? 'pl-10' : ''}
 ${className}
 `;
 
 return (
 <div className={widthClass}>
 {label && (
 <label 
 htmlFor={inputId}
 className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2"
 >
 {label}
 </label>
 )}
 
 <div className="relative">
 {icon && (
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
 {icon}
 </div>
 )}
 
 <input
 ref={ref}
 id={inputId}
 className={inputClasses}
 {...props}
 />
 
 {hasError && (
 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
 <AlertCircle className="w-5 h-5" />
 </div>
 )}
 </div>
 
 {error && (
 <p className="mt-2 text-sm text-red-600 dark:text-red-400">
 {error}
 </p>
 )}
 
 {helperText && !error && (
 <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
 {helperText}
 </p>
 )}
 </div>
 );
 }
);

Input.displayName = 'Input';

export default Input;
