import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'title' | 'avatar' | 'rectangular';
  width?: string;
  height?: string;
}

/**
 * Modern Skeleton Component
 * 
 * Design: Smooth loading placeholders
 * - Pulse animation
 * - Multiple variants
 * - Customizable size
 */
export default function Skeleton({ 
  variant = 'rectangular', 
  width, 
  height,
  className = '',
  style,
  ...props 
}: SkeletonProps) {
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'w-12 h-12 rounded-full',
    rectangular: 'w-full h-full'
  };
  
  const customStyle = {
    width: width,
    height: height,
    ...style
  };
  
  return (
    <div
      className={`bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse ${variants[variant]} ${className}`}
      style={customStyle}
      {...props}
    />
  );
}

/**
 * Skeleton Group - Multiple skeletons
 */
export function SkeletonGroup({ count = 3, spacing = 'gap-4' }: { count?: number; spacing?: string }) {
  return (
    <div className={`flex flex-col ${spacing}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="text" />
      ))}
    </div>
  );
}

/**
 * Card Skeleton - Loading card placeholder
 */
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
      <Skeleton variant="title" className="mb-4" />
      <SkeletonGroup count={3} />
    </div>
  );
}
