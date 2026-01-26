import { HTMLAttributes, forwardRef } from 'react';

interface IconProps extends HTMLAttributes<HTMLDivElement> {
 size?: 'sm' | 'md' | 'lg' | 'xl';
 variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const Icon = forwardRef<HTMLDivElement, IconProps>(
 ({ children, size = 'md', variant = 'default', className = '', ...props }, ref) => {
 const sizes = {
 sm: 'w-4 h-4',
 md: 'w-5 h-5',
 lg: 'w-6 h-6',
 xl: 'w-8 h-8'
 };
 
 const variants = {
 default: 'text-neutral-500',
 primary: 'text-primary-600',
 success: 'text-success-600',
 warning: 'text-warning-600',
 danger: 'text-danger-600'
 };
 
 return (
 <div
 ref={ref}
 className={`
 inline-flex items-center justify-center flex-shrink-0
 ${sizes[size]}
 ${variants[variant]}
 ${className}
 `}
 {...props}
 >
 {children}
 </div>
 );
 }
);

Icon.displayName = 'Icon';

export default Icon;
