import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
 variant?: 'primary' | 'secondary' | 'outline';
 size?: 'sm' | 'md';
 icon?: React.ReactNode;
}

/**
 * Modern Badge Component
 * 
 * Design: Minimal pills with red accent
 * - Primary: Red background
 * - Secondary: Gray background
 * - Outline: Transparent with border
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
 ({ children, variant = 'primary', size = 'md', icon, className = '', ...props }, ref) => {
 const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-200';
 
 const variants = {
 primary: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
 secondary: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
 outline: 'bg-transparent border-2 border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300'
 };
 
 const sizes = {
 sm: 'px-2 py-0.5 text-xs',
 md: 'px-2.5 py-1 text-xs'
 };
 
 return (
 <span
 ref={ref}
 className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
 {...props}
 >
 {icon && <span className="flex-shrink-0">{icon}</span>}
 {children}
 </span>
 );
 }
);

Badge.displayName = 'Badge';

export default Badge;
