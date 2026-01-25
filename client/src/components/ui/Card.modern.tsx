import { HTMLAttributes, forwardRef, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: ReactNode;
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Modern Card Component
 * 
 * Design: White background with subtle borders
 * - Clean and minimal
 * - Smooth hover effects
 * - Flexible layout with header, body, footer
 * - Mobile optimized
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = false, padding = 'md', className = '', ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };
    
    const hoverStyles = hover 
      ? 'cursor-pointer hover:shadow-md hover:border-neutral-300 hover:-translate-y-1 active:translate-y-0 active:shadow-sm dark:hover:border-neutral-700' 
      : '';
    
    return (
      <div
        ref={ref}
        className={`
          bg-white rounded-xl border-2 border-neutral-200 shadow-sm
          dark:bg-neutral-900 dark:border-neutral-800
          transition-all duration-200
          ${hoverStyles}
          ${paddings[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header - Title and optional action
 */
const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, action, children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-between mb-4 pb-4 border-b-2 border-neutral-200 dark:border-neutral-800 ${className}`}
        {...props}
      >
        {title ? (
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {title}
          </h3>
        ) : children}
        {action && <div>{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * Card Body - Main content area
 */
const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`space-y-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

/**
 * Card Footer - Actions area
 */
const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-end gap-3 mt-6 pt-4 border-t-2 border-neutral-200 dark:border-neutral-800 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };
export default Card;
