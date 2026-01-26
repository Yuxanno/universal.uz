import { createPortal } from 'react-dom';
import { Toast, ToastProps } from './Toast';

interface ToastContainerProps {
 toasts: ToastProps[];
 onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
 if (toasts.length === 0) return null;

 return createPortal(
 <div
 className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
 aria-live="polite"
 aria-atomic="true"
 >
 {toasts.map((toast) => (
 <div key={toast.id} className="pointer-events-auto">
 <Toast {...toast} onClose={onClose} />
 </div>
 ))}
 </div>,
 document.body
 );
}
