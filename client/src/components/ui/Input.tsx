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
 <label className="block text-xs font-semibold text-neutral-700">
 {label}
 </label>
 )}
 <div className="relative group">
 {icon && iconPosition === 'left' && (
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-600 transition-colors">
 {icon}
 </div>
 )}
 <input
 ref={ref}
 className={`
 w-full px-4 py-2.5 text-sm text-neutral-900 bg-neutral-50
 border rounded-lg placeholder:text-neutral-400
 transition-all duration-200
 focus:outline-none focus:bg-white focus:ring-4
 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed
 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700
 dark:focus:bg-neutral-900 dark:placeholder:text-neutral-500
 dark:disabled:bg-neutral-900
 ${error 
 ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10' 
 : 'border-neutral-200 focus:border-red-500 focus:ring-red-500/10'
 }
 ${icon && iconPosition === 'left' ? 'pl-10' : ''}
 ${icon && iconPosition === 'right' ? 'pr-10' : ''}
 ${className}
 `}
 {...props}
 />
 {icon && iconPosition === 'right' && (
 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
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
