import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: ReactNode;
  headerColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
}

export default function EnhancedModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  headerColor = 'blue'
}: ModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]'
  };

  const headerColors = {
    blue: 'from-blue-600 to-blue-700',
    purple: 'from-purple-600 to-purple-700',
    green: 'from-green-600 to-green-700',
    red: 'from-red-600 to-red-700',
    orange: 'from-orange-600 to-orange-700'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} relative z-10 max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerColors[headerColor]} px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              {subtitle && <p className="text-sm text-white/80 mt-0.5">{subtitle}</p>}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all hover:rotate-90 duration-200"
                title="Yopish (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
