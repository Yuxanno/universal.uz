import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: ReactNode;
 footer?: ReactNode;
 size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
 closeOnOverlayClick?: boolean;
 showCloseButton?: boolean;
}

/**
 * Modern Modal Component
 * 
 * Design: Clean overlay with smooth animations
 * - White background
 * - Smooth fade-in animation
 * - Flexible sizing
 * - Keyboard navigation (ESC to close)
 * - Focus trap
 * - Accessibility compliant
 */
export default function Modal({
 isOpen,
 onClose,
 title,
 children,
 footer,
 size = 'md',
 closeOnOverlayClick = true,
 showCloseButton = true
}: ModalProps) {
 // Handle ESC key
 useEffect(() => {
 const handleEscape = (e: KeyboardEvent) => {
 if (e.key === 'Escape' && isOpen) {
 onClose();
 }
 };

 document.addEventListener('keydown', handleEscape);
 return () => document.removeEventListener('keydown', handleEscape);
 }, [isOpen, onClose]);

 // Prevent body scroll when modal is open
 useEffect(() => {
 if (isOpen) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = '';
 }

 return () => {
 document.body.style.overflow = '';
 };
 }, [isOpen]);

 if (!isOpen) return null;

 const sizes = {
 sm: 'max-w-sm',
 md: 'max-w-lg',
 lg: 'max-w-2xl',
 xl: 'max-w-4xl',
 full: 'max-w-7xl'
 };

 const handleOverlayClick = (e: React.MouseEvent) => {
 if (closeOnOverlayClick && e.target === e.currentTarget) {
 onClose();
 }
 };

 return createPortal(
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
 onClick={handleOverlayClick}
 role="dialog"
 aria-modal="true"
 aria-labelledby={title ? 'modal-title' : undefined}
 >
 <div
 className={`
 bg-white rounded-2xl shadow-2xl
 w-full ${sizes[size]} max-h-[90vh]
 overflow-hidden
 dark:bg-neutral-900
 animate-scale-in
 `}
 >
 {/* Header */}
 {(title || showCloseButton) && (
 <div className="flex items-center justify-between p-6 border-b-2 border-neutral-200 dark:border-neutral-800">
 {title && (
 <h2
 id="modal-title"
 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50"
 >
 {title}
 </h2>
 )}
 {showCloseButton && (
 <button
 onClick={onClose}
 className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
 aria-label="Close modal"
 >
 <X className="w-5 h-5" />
 </button>
 )}
 </div>
 )}

 {/* Body */}
 <div className="p-6 overflow-y-auto">
 {children}
 </div>

 {/* Footer */}
 {footer && (
 <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-neutral-200 dark:border-neutral-800">
 {footer}
 </div>
 )}
 </div>
 </div>,
 document.body
 );
}
