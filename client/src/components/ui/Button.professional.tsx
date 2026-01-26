/**
 * 🎨 Professional Button Component
 * Based on 20 years of UX/UI best practices
 * Fully accessible, responsive, and beautiful
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: ButtonVariant;
 size?: ButtonSize;
 loading?: boolean;
 icon?: React.ReactNode;
 iconPosition?: 'left' | 'right';
 fullWidth?: boolean;
 children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
 primary: `
 bg-red-600 hover:bg-red-700 active:bg-red-800
 text-white
 shadow-sm hover:shadow-md
 border-2 border-transparent
 `,
 secondary: `
 bg-gray-100 hover:bg-gray-200 active:bg-gray-300
 text-gray-900
 border-2 border-transparent
 `,
 outline: `
 bg-transparent hover:bg-gray-50 active:bg-gray-100
 text-gray-900
 border-2 border-gray-300 hover:border-gray-400
 `,
 ghost: `
 bg-transparent hover:bg-gray-100 active:bg-gray-200
 text-gray-700
 border-2 border-transparent
 `,
 danger: `
 bg-red-600 hover:bg-red-700 active:bg-red-800
 text-white
 shadow-sm hover:shadow-md
 border-2 border-transparent
 `,
 success: `
 bg-green-600 hover:bg-green-700 active:bg-green-800
 text-white
 shadow-sm hover:shadow-md
 border-2 border-transparent
 `,
};

const sizeStyles: Record<ButtonSize, string> = {
 sm: 'px-3 py-1.5 text-sm gap-1.5',
 md: 'px-4 py-2.5 text-base gap-2',
 lg: 'px-6 py-3 text-lg gap-2.5',
 xl: 'px-8 py-4 text-xl gap-3',
};

const iconSizeStyles: Record<ButtonSize, string> = {
 sm: 'w-4 h-4',
 md: 'w-5 h-5',
 lg: 'w-6 h-6',
 xl: 'w-7 h-7',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 (
 {
 variant = 'primary',
 size = 'md',
 loading = false,
 icon,
 iconPosition = 'left',
 fullWidth = false,
 disabled,
 className = '',
 children,
 ...props
 },
 ref
 ) => {
 const baseStyles = `
 inline-flex items-center justify-center
 font-semibold
 rounded-lg
 transition-all duration-200
 focus:outline-none focus:ring-4 focus:ring-red-500/20
 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
 active:scale-95
 `;

 const widthStyles = fullWidth ? 'w-full' : '';

 const iconSize = iconSizeStyles[size];

 return (
 <button
 ref={ref}
 disabled={disabled || loading}
 className={`
 ${baseStyles}
 ${variantStyles[variant]}
 ${sizeStyles[size]}
 ${widthStyles}
 ${className}
 `.trim().replace(/\s+/g, ' ')}
 {...props}
 >
 {loading && (
 <Loader2 className={`${iconSize} animate-spin`} />
 )}
 
 {!loading && icon && iconPosition === 'left' && (
 <span className={iconSize}>{icon}</span>
 )}
 
 <span>{children}</span>
 
 {!loading && icon && iconPosition === 'right' && (
 <span className={iconSize}>{icon}</span>
 )}
 </button>
 );
 }
);

Button.displayName = 'Button';

/**
 * Icon-only button variant
 */
interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
 icon: React.ReactNode;
 'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
 ({ icon, size = 'md', ...props }, ref) => {
 const sizeMap = {
 sm: 'w-8 h-8',
 md: 'w-10 h-10',
 lg: 'w-12 h-12',
 xl: 'w-14 h-14',
 };

 return (
 <button
 ref={ref}
 className={`
 inline-flex items-center justify-center
 ${sizeMap[size]}
 rounded-lg
 transition-all duration-200
 focus:outline-none focus:ring-4 focus:ring-red-500/20
 disabled:opacity-50 disabled:cursor-not-allowed
 active:scale-95
 ${variantStyles[props.variant || 'ghost']}
 `.trim().replace(/\s+/g, ' ')}
 {...props}
 >
 <span className={iconSizeStyles[size]}>{icon}</span>
 </button>
 );
 }
);

IconButton.displayName = 'IconButton';

/**
 * Button Group for related actions
 */
interface ButtonGroupProps {
 children: React.ReactNode;
 className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ children, className = '' }) => {
 return (
 <div className={`inline-flex rounded-lg shadow-sm ${className}`} role="group">
 {React.Children.map(children, (child, index) => {
 if (!React.isValidElement(child)) return child;
 
 const isFirst = index === 0;
 const isLast = index === React.Children.count(children) - 1;
 
 return React.cloneElement(child as React.ReactElement<any>, {
 className: `
 ${(child as React.ReactElement<any>).props.className || ''}
 ${!isFirst ? '-ml-px' : ''}
 ${!isFirst && !isLast ? 'rounded-none' : ''}
 ${isFirst ? 'rounded-r-none' : ''}
 ${isLast ? 'rounded-l-none' : ''}
 `.trim().replace(/\s+/g, ' '),
 });
 })}
 </div>
 );
};

ButtonGroup.displayName = 'ButtonGroup';
