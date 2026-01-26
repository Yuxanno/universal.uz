import { HTMLAttributes, forwardRef } from 'react';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
 size?: 'sm' | 'md' | 'lg';
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
 ({ size = 'md', className = '', ...props }, ref) => {
 const sizes = {
 sm: 'w-4 h-4 border-2',
 md: 'w-6 h-6 border-2',
 lg: 'w-8 h-8 border-3'
 };
 
 return (
 <div
 ref={ref}
 className={`
 border-current border-t-transparent rounded-full animate-spin
 ${sizes[size]}
 ${className}
 `}
 {...props}
 />
 );
 }
);

Spinner.displayName = 'Spinner';

export default Spinner;
