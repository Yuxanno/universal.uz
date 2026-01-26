import { SelectHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
 label?: string;
 error?: string;
 helperText?: string;
 options?: { value: string; label: string }[];
}

/**
 * Logo-based Select Component
 * Focus color: RED (#dc2626) from logo
 * Background: WHITE
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
 ({ label, error, helperText, options, children, className = '', ...props }, ref) => {
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
 
 <select
 ref={ref}
 className={`
 w-full px-4 py-2.5
 bg-white
 border-2 ${error ? 'border-red-500' : 'border-gray-300'}
 rounded-lg
 text-slate-900
 transition-all duration-200
 focus:outline-none 
 ${error 
 ? 'focus:border-red-600 focus:ring-4 focus:ring-red-500/20' 
 : 'focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
 }
 disabled:bg-gray-100 disabled:text-slate-400 disabled:cursor-not-allowed
 appearance-none cursor-pointer
 ${className}
 `}
 style={{
 backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23${error ? 'dc2626' : '6b7280'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
 backgroundPosition: 'right 0.75rem center',
 backgroundRepeat: 'no-repeat',
 backgroundSize: '1.25em 1.25em',
 paddingRight: '2.5rem'
 }}
 {...props}
 >
 {options ? (
 <>
 <option value="" className="text-slate-500">Tanlang...</option>
 {options.map(opt => (
 <option key={opt.value} value={opt.value} className="text-slate-900">
 {opt.label}
 </option>
 ))}
 </>
 ) : (
 children
 )}
 </select>
 
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

Select.displayName = 'Select';

export default Select;
