interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'title' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  count?: number;
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  count = 1
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 animate-pulse';
  
  const variantClasses = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  const skeletonElement = (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-busy="true"
      aria-live="polite"
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={`skeleton-${index}`}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={style}
          aria-busy="true"
          aria-live="polite"
        />
      ))}
    </div>
  );
}

// Predefined skeleton layouts
export function SkeletonCard() {
  return (
    <div className="card space-y-4">
      <Skeleton variant="title" width="60%" />
      <Skeleton variant="text" count={3} />
      <div className="flex gap-2 mt-4">
        <Skeleton width="80px" height="32px" />
        <Skeleton width="80px" height="32px" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton variant="circular" width="40px" height="40px" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </div>
          <Skeleton width="80px" height="32px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProduct() {
  return (
    <div className="card space-y-4">
      <Skeleton height="200px" className="rounded-xl" />
      <Skeleton variant="title" width="80%" />
      <Skeleton variant="text" width="40%" />
      <div className="flex gap-2 mt-4">
        <Skeleton width="100%" height="40px" />
      </div>
    </div>
  );
}
