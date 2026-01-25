import { HTMLAttributes, forwardRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ children, isOpen, onClose, title, size = 'md', className = '', ...props }, ref) => {
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
    
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          ref={ref}
          className={`
            relative bg-white rounded-xl shadow-xl w-full
            dark:bg-neutral-800
            animate-scale-in
            ${sizes[size]}
            ${className}
          `}
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

export default Modal;
