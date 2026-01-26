import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
 variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
 size?: 'sm' | 'md' | 'lg';
 dot?: boolean;
}

/**
 * Logo-based Badge Component
 * Brand: RED from logo
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
 ({ children, variant = 'neutral', size = 'md', dot = false, className = '', ...props }, ref) => {
 const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full';

 const variants = {
 brand: 'bg-red-100 text-red-700',
 success: 'bg-green-100 text-green-700',
 warning: 'bg-amber-100 text-amber-700',
 danger: 'bg-red-100 text-red-700',
 neutral: 'bg-slate-100 text-slate-700'
 };

 const sizes = {
 sm: 'px-2 py-0.5 text-xs',
 md: 'px-2.5 py-1 text-xs',
 lg: 'px-3 py-1.5 text-sm'
 };

 const dotColors = {
 brand: 'bg-red-600',
 success: 'bg-green-600',
 warning: 'bg-amber-600',
 danger: 'bg-red-600',
 neutral: 'bg-slate-600'
 };

 return (
 <span
 ref={ref}
 className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
 {...props}
 >
 {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
 {children}
 </span>
 );
 }
);

Badge.displayName = 'Badge';

export default Badge;
