import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

/**
 * EmptyState Component - Professional Empty State
 * 
 * Usage:
 * <EmptyState
 *   icon={Package}
 *   title="Mahsulotlar topilmadi"
 *   description="Hozircha mahsulotlar yo'q. Birinchi mahsulotni qo'shing"
 *   action={{
 *     label: "Mahsulot qo'shish",
 *     onClick: () => openAddModal(),
 *     icon: <Plus className="w-4 h-4" />
 *   }}
 * />
 */
export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Icon */}
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="
            inline-flex items-center justify-center gap-2
            min-h-[44px] px-6 py-3 text-sm font-medium
            bg-primary-600 text-white rounded-lg shadow-sm
            hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5
            active:bg-primary-800 active:translate-y-0
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
          "
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
}
