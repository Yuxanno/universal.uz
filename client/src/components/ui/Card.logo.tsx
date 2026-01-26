import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
 variant?: 'default' | 'hover' | 'interactive';
 padding?: 'sm' | 'md' | 'lg';
}

/**
 * Logo-based Card Component
 * Background: WHITE
 * Border: GRAY with RED accent on hover
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
 ({ children, variant = 'default', padding = 'md', className = '', ...props }, ref) => {
 const baseStyles = `
 bg-white 
 border-2 border-gray-200
 rounded-xl 
 shadow-sm
 transition-all duration-200
 `;

 const variants = {
 default: '',
 hover: 'hover:shadow-md hover:border-red-200 hover:-translate-y-0.5 cursor-pointer',
 interactive: 'hover:shadow-md hover:border-red-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm cursor-pointer'
 };

 const paddings = {
 sm: 'p-4',
 md: 'p-6',
 lg: 'p-8'
 };

 return (
 <div
 ref={ref}
 className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
 {...props}
 >
 {children}
 </div>
 );
 }
);

Card.displayName = 'Card';

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
 title?: string;
 subtitle?: string;
 icon?: React.ReactNode;
 action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
 ({ title, subtitle, icon, action, children, className = '', ...props }, ref) => {
 return (
 <div ref={ref} className={`flex items-start justify-between mb-4 ${className}`} {...props}>
 <div className="flex items-center gap-3">
 {icon && (
 <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
 <div className="text-red-600">{icon}</div>
 </div>
 )}
 <div>
 {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
 {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
 {children}
 </div>
 </div>
 {action && <div className="flex-shrink-0">{action}</div>}
 </div>
 );
 }
);

CardHeader.displayName = 'CardHeader';

// Card Body
export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
 ({ children, className = '', ...props }, ref) => {
 return (
 <div ref={ref} className={className} {...props}>
 {children}
 </div>
 );
 }
);

CardBody.displayName = 'CardBody';

// Card Footer
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
 ({ children, className = '', ...props }, ref) => {
 return (
 <div ref={ref} className={`mt-4 pt-4 border-t-2 border-gray-200 ${className}`} {...props}>
 {children}
 </div>
 );
 }
);

CardFooter.displayName = 'CardFooter';

export default Card;
