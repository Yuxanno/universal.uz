import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Modern Empty State Component
 * 
 * Design: Clean and helpful
 * - Large icon
 * - Clear messaging
 * - Optional CTA
 */
export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 mb-4 text-neutral-400 dark:text-neutral-600">
          <Icon className="w-full h-full" strokeWidth={1.5} />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && <div>{action}</div>}
    </div>
  );
}
