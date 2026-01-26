import { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
 label?: string;
 error?: string;
 helperText?: string;
}

/**
 * Logo-based Input Component
 * Focus color: RED (#dc2626) from logo
 * Background: WHITE
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
 ({ label, error, helperText, className = '', ...props }, ref) => {
 return (
 <div className="w-full">
 {label && (
 <label 
 htmlFor={props.id} 
 className="block text-sm font-medium text-slate-700 mb-2"
 >
 {label}
 {props.required && <span className="text-red-600 ml-1">*</span>}
 </label>
 )}
 
 <input
 ref={ref}
 className={`
 w-full px-4 py-2.5
 bg-white
 border-2 ${error ? 'border-red-500' : 'border-gray-300'}
 rounded-lg
 text-slate-900
 placeholder:text-slate-400
 transition-all duration-200
 focus:outline-none 
 ${error 
 ? 'focus:border-red-600 focus:ring-4 focus:ring-red-500/20' 
 : 'focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
 }
 disabled:bg-gray-100 disabled:text-slate-400 disabled:cursor-not-allowed
 ${className}
 `}
 {...props}
 />
 
 {error && (
 <div className="mt-1.5 flex items-center gap-1.5 text-red-600">
 <AlertCircle className="w-4 h-4 flex-shrink-0" />
 <p className="text-sm">{error}</p>
 </div>
 )}
 
 {helperText && !error && (
 <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
 )}
 </div>
 );
 }
);

Input.displayName = 'Input';

export default Input;
