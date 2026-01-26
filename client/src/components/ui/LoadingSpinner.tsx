import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
 size?: 'sm' | 'md' | 'lg' | 'xl';
 text?: string;
 fullScreen?: boolean;
 className?: string;
}

const sizeClasses = {
 sm: 'w-4 h-4',
 md: 'w-6 h-6',
 lg: 'w-8 h-8',
 xl: 'w-12 h-12',
};

export function LoadingSpinner({ 
 size = 'md', 
 text, 
 fullScreen = false,
 className = '' 
}: LoadingSpinnerProps) {
 const spinner = (
 <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
 <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600 dark:text-primary-400`} />
 {text && (
 <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium animate-pulse">
 {text}
 </p>
 )}
 </div>
 );

 if (fullScreen) {
 return (
 <div className="fixed inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
 {spinner}
 </div>
 );
 }

 return spinner;
}
