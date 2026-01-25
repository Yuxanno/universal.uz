/**
 * 🎨 Professional Card Component
 * Flexible, accessible, and beautiful card layouts
 */

import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  clickable?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200 shadow-sm',
  elevated: 'bg-white shadow-md hover:shadow-lg',
  outlined: 'bg-white border-2 border-gray-300',
  ghost: 'bg-gray-50',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  className = '',
  onClick,
}) => {
  const baseStyles = 'rounded-xl transition-all duration-200';
  const hoverStyles = hoverable ? 'hover:shadow-lg hover:-translate-y-0.5' : '';
  const clickableStyles = clickable ? 'cursor-pointer active:scale-98' : '';

  return (
    <div
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hoverStyles}
        ${clickableStyles}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </div>
  );
};

/**
 * Card Header Component
 */
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  className = '',
}) => {
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div className="flex items-start gap-3 flex-1">
        {icon && (
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="w-5 h-5 text-red-600">{icon}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
};

/**
 * Card Content Component
 */
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={`${className}`}>{children}</div>;
};

/**
 * Card Footer Component
 */
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Stat Card Component - For displaying metrics
 */
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  trend?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  trend,
  className = '',
}) => {
  const changeColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  return (
    <Card variant="elevated" padding="md" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <div className="flex items-center gap-2">
              <span
                className={`
                  inline-flex items-center gap-1
                  px-2 py-1
                  text-xs font-semibold
                  rounded-full
                  ${changeColors[changeType]}
                `}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="w-6 h-6 text-red-600">{icon}</span>
          </div>
        )}
      </div>
      {trend && <div className="mt-4">{trend}</div>}
    </Card>
  );
};

/**
 * Product Card Component
 */
interface ProductCardProps {
  image?: string;
  name: string;
  code: string;
  price: number;
  stock?: number;
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  onEdit?: () => void;
  onDelete?: () => void;
  onAddToCart?: () => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  image,
  name,
  code,
  price,
  stock,
  stockStatus = 'in-stock',
  onEdit,
  onDelete,
  onAddToCart,
  className = '',
}) => {
  const stockBadges = {
    'in-stock': { label: 'В наличии', color: 'bg-green-100 text-green-700' },
    'low-stock': { label: 'Мало', color: 'bg-yellow-100 text-yellow-700' },
    'out-of-stock': { label: 'Нет в наличии', color: 'bg-red-100 text-red-700' },
  };

  return (
    <Card variant="default" padding="none" hoverable className={`group ${className}`}>
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-t-xl">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        
        {/* Stock Badge */}
        {stock !== undefined && (
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stockBadges[stockStatus].color}`}>
              {stockBadges[stockStatus].label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-1">{name}</h3>
        <p className="text-sm text-gray-600 mb-2">#{code}</p>
        
        {stock !== undefined && (
          <p className="text-sm text-gray-600 mb-2">Остаток: {stock}</p>
        )}
        
        <p className="text-xl font-bold text-red-600 mb-3">
          {price.toLocaleString()} <span className="text-sm">сум</span>
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          {onAddToCart && (
            <button
              onClick={onAddToCart}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              В корзину
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};
