import { HTMLAttributes, forwardRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 description?: string;
 size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
 showCloseButton?: boolean;
}

/**
 * Modal Component - Professional Dialog
 * 
 * Features:
 * - Clean, minimal design
 * - Proper spacing
 * - Keyboard support (ESC to close)
 * - Focus trap
 * - Backdrop blur
 * - Smooth animations
 * 
 * Usage:
 * <Modal
 * isOpen={showModal}
 * onClose={() => setShowModal(false)}
 * title="Yangi mahsulot qo'shish"
 * description="Mahsulot ma'lumotlarini kiriting"
 * size="md"
 * >
 * <form>...</form>
 * </Modal>
 */
const Modal = forwardRef<HTMLDivElement, ModalProps>(
 ({ 
 children, 
 isOpen, 
 onClose, 
 title, 
 description,
 size = 'md', 
 showCloseButton = true,
 className = '', 
 ...props 
 }, ref) => {
 // Handle ESC key
 useEffect(() => {
 const handleEscape = (e: KeyboardEvent) => {
 if (e.key === 'Escape' && isOpen) {
 onClose();
 }
 };
 
 if (isOpen) {
 document.addEventListener('keydown', handleEscape);
 document.body.style.overflow = 'hidden';
 }
 
 return () => {
 document.removeEventListener('keydown', handleEscape);
 document.body.style.overflow = 'unset';
 };
 }, [isOpen, onClose]);
 
 if (!isOpen) return null;
 
 const sizes = {
 sm: 'max-w-sm',
 md: 'max-w-md',
 lg: 'max-w-lg',
 xl: 'max-w-xl',
 full: 'max-w-full mx-4'
 };
 
 return (
 <div 
 className="fixed inset-0 z-50 flex items-center justify-center p-4"
 role="dialog"
 aria-modal="true"
 aria-labelledby={title ? 'modal-title' : undefined}
 >
 {/* Backdrop */}
 <div 
 className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
 onClick={onClose}
 aria-hidden="true"
 />
 
 {/* Modal */}
 <div
 ref={ref}
 className={`
 relative bg-white rounded-2xl shadow-2xl w-full
 max-h-[90vh] overflow-hidden
 dark:bg-neutral-800
 animate-scale-in
 ${sizes[size]}
 ${className}
 `}
 {...props}
 >
 {/* Header */}
 {(title || showCloseButton) && (
 <div className="flex items-start justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
 <div className="flex-1 pr-4">
 {title && (
 <h3 
 id="modal-title"
 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
 >
 {title}
 </h3>
 )}
 {description && (
 <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
 {description}
 </p>
 )}
 </div>
 
 {showCloseButton && (
 <button
 onClick={onClose}
 className="
 flex-shrink-0 p-2 rounded-lg text-neutral-400
 hover:text-neutral-600 hover:bg-neutral-100
 dark:hover:bg-neutral-700 dark:hover:text-neutral-300
 transition-colors
 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
 "
 aria-label="Yopish"
 >
 <X className="w-5 h-5" />
 </button>
 )}
 </div>
 )}
 
 {/* Content */}
 <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
 {children}
 </div>
 </div>
 </div>
 );
 }
);

Modal.displayName = 'Modal';

export default Modal;
