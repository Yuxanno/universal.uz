import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = false, padding = 'md', className = '', ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };
    
    return (
      <div
        ref={ref}
        className={`
          bg-white rounded-xl border border-neutral-200 shadow-sm
          dark:bg-neutral-800 dark:border-neutral-700
          ${hover ? 'transition-all duration-200 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600' : ''}
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

export default Card;
