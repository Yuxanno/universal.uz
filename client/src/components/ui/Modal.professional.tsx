/**
 * 🎨 Professional Modal Component
 * Accessible, animated, and feature-rich modal dialogs
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: React.ReactNode;
 footer?: React.ReactNode;
 size?: ModalSize;
 closeOnOverlayClick?: boolean;
 closeOnEscape?: boolean;
 showCloseButton?: boolean;
 className?: string;
}

const sizeStyles: Record<ModalSize, string> = {
 sm: 'max-w-md',
 md: 'max-w-lg',
 lg: 'max-w-2xl',
 xl: 'max-w-4xl',
 full: 'max-w-7xl mx-4',
};

export const Modal: React.FC<ModalProps> = ({
 isOpen,
 onClose,
 title,
 children,
 footer,
 size = 'md',
 closeOnOverlayClick = true,
 closeOnEscape = true,
 showCloseButton = true,
 className = '',
}) => {
 const modalRef = useRef<HTMLDivElement>(null);
 const previousActiveElement = useRef<HTMLElement | null>(null);

 // Handle escape key
 useEffect(() => {
 if (!isOpen || !closeOnEscape) return;

 const handleEscape = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 onClose();
 }
 };

 document.addEventListener('keydown', handleEscape);
 return () => document.removeEventListener('keydown', handleEscape);
 }, [isOpen, closeOnEscape, onClose]);

 // Focus management
 useEffect(() => {
 if (isOpen) {
 previousActiveElement.current = document.activeElement as HTMLElement;
 modalRef.current?.focus();
 } else {
 previousActiveElement.current?.focus();
 }
 }, [isOpen]);

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

 const handleOverlayClick = (e: React.MouseEvent) => {
 if (closeOnOverlayClick && e.target === e.currentTarget) {
 onClose();
 }
 };

 const modalContent = (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
 onClick={handleOverlayClick}
 >
 {/* Backdrop */}
 <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

 {/* Modal */}
 <div
 ref={modalRef}
 role="dialog"
 aria-modal="true"
 aria-labelledby={title ? 'modal-title' : undefined}
 tabIndex={-1}
 className={`
 relative
 w-full ${sizeStyles[size]}
 bg-white
 rounded-2xl
 shadow-2xl
 animate-scaleIn
 max-h-[90vh]
 flex flex-col
 ${className}
 `.trim().replace(/\s+/g, ' ')}
 >
 {/* Header */}
 {(title || showCloseButton) && (
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
 {title && (
 <h2
 id="modal-title"
 className="text-xl font-bold text-gray-900"
 >
 {title}
 </h2>
 )}
 {showCloseButton && (
 <button
 onClick={onClose}
 className="
 p-2
 text-gray-400 hover:text-gray-600
 rounded-lg
 hover:bg-gray-100
 transition-colors
 focus:outline-none focus:ring-2 focus:ring-red-500/20
 "
 aria-label="Close modal"
 >
 <X className="w-5 h-5" />
 </button>
 )}
 </div>
 )}

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
 {children}
 </div>

 {/* Footer */}
 {footer && (
 <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
 {footer}
 </div>
 )}
 </div>
 </div>
 );

 return createPortal(modalContent, document.body);
};

/**
 * Confirmation Modal
 */
interface ConfirmModalProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: () => void;
 title: string;
 message: string;
 confirmText?: string;
 cancelText?: string;
 variant?: 'danger' | 'warning' | 'info';
 loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
 isOpen,
 onClose,
 onConfirm,
 title,
 message,
 confirmText = 'Подтвердить',
 cancelText = 'Отмена',
 variant = 'danger',
 loading = false,
}) => {
 const variantStyles = {
 danger: {
 icon: '🗑️',
 iconBg: 'bg-red-100',
 iconColor: 'text-red-600',
 buttonBg: 'bg-red-600 hover:bg-red-700',
 },
 warning: {
 icon: '⚠️',
 iconBg: 'bg-yellow-100',
 iconColor: 'text-yellow-600',
 buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
 },
 info: {
 icon: 'ℹ️',
 iconBg: 'bg-blue-100',
 iconColor: 'text-blue-600',
 buttonBg: 'bg-blue-600 hover:bg-blue-700',
 },
 };

 const style = variantStyles[variant];

 return (
 <Modal
 isOpen={isOpen}
 onClose={onClose}
 size="sm"
 closeOnOverlayClick={!loading}
 closeOnEscape={!loading}
 >
 <div className="text-center">
 <div className={`w-16 h-16 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
 <span className="text-3xl">{style.icon}</span>
 </div>
 <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
 <p className="text-gray-600 mb-6">{message}</p>
 <div className="flex gap-3">
 <button
 onClick={onClose}
 disabled={loading}
 className="
 flex-1 px-4 py-3
 bg-white hover:bg-gray-50
 text-gray-700
 font-semibold
 border-2 border-gray-200
 rounded-lg
 transition-colors
 disabled:opacity-50 disabled:cursor-not-allowed
 "
 >
 {cancelText}
 </button>
 <button
 onClick={onConfirm}
 disabled={loading}
 className={`
 flex-1 px-4 py-3
 ${style.buttonBg}
 text-white
 font-semibold
 rounded-lg
 transition-colors
 disabled:opacity-50 disabled:cursor-not-allowed
 flex items-center justify-center gap-2
 `}
 >
 {loading && (
 <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
 </svg>
 )}
 {confirmText}
 </button>
 </div>
 </div>
 </Modal>
 );
};

/**
 * Drawer Modal (Slide from side)
 */
interface DrawerProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: React.ReactNode;
 footer?: React.ReactNode;
 position?: 'left' | 'right';
 size?: 'sm' | 'md' | 'lg';
}

const drawerSizes = {
 sm: 'max-w-sm',
 md: 'max-w-md',
 lg: 'max-w-lg',
};

export const Drawer: React.FC<DrawerProps> = ({
 isOpen,
 onClose,
 title,
 children,
 footer,
 position = 'right',
 size = 'md',
}) => {
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

 const slideAnimation = position === 'right' ? 'animate-slideInRight' : 'animate-slideInLeft';

 const drawerContent = (
 <div className="fixed inset-0 z-50 animate-fadeIn">
 {/* Backdrop */}
 <div
 className="absolute inset-0 bg-black/50 backdrop-blur-sm"
 onClick={onClose}
 />

 {/* Drawer */}
 <div
 className={`
 absolute top-0 ${position}-0 bottom-0
 w-full ${drawerSizes[size]}
 bg-white
 shadow-2xl
 ${slideAnimation}
 flex flex-col
 `}
 >
 {/* Header */}
 {title && (
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
 <h2 className="text-xl font-bold text-gray-900">{title}</h2>
 <button
 onClick={onClose}
 className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 )}

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
 {children}
 </div>

 {/* Footer */}
 {footer && (
 <div className="p-6 border-t border-gray-200 bg-gray-50">
 {footer}
 </div>
 )}
 </div>
 </div>
 );

 return createPortal(drawerContent, document.body);
};
