import { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
 icon: LucideIcon;
 label: string;
 value: string | number;
 suffix?: string;
 trend?: {
 value: string;
 isPositive: boolean;
 };
 color?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
 onClick?: () => void;
 isActive?: boolean;
}

/**
 * StatCard Component - Dashboard Statistics Card
 * 
 * Features:
 * - Clean, modern design
 * - Trend indicators
 * - Color variants
 * - Clickable (optional)
 * - Active state
 * 
 * Usage:
 * <StatCard
 * icon={Package}
 * label="Jami mahsulotlar"
 * value={150}
 * trend={{ value: '+12%', isPositive: true }}
 * color="primary"
 * onClick={() => setFilter('all')}
 * isActive={filter === 'all'}
 * />
 */
export default function StatCard({
 icon: Icon,
 label,
 value,
 suffix,
 trend,
 color = 'gray',
 onClick,
 isActive = false
}: StatCardProps) {
 const colorClasses = {
 primary: {
 bg: 'bg-primary-50 dark:bg-primary-900/20',
 icon: 'text-primary-600 dark:text-primary-400',
 ring: 'ring-primary-500'
 },
 success: {
 bg: 'bg-success-50 dark:bg-success-900/20',
 icon: 'text-success-600 dark:text-success-400',
 ring: 'ring-success-500'
 },
 warning: {
 bg: 'bg-warning-50 dark:bg-warning-900/20',
 icon: 'text-warning-600 dark:text-warning-400',
 ring: 'ring-warning-500'
 },
 danger: {
 bg: 'bg-danger-50 dark:bg-danger-900/20',
 icon: 'text-danger-600 dark:text-danger-400',
 ring: 'ring-danger-500'
 },
 gray: {
 bg: 'bg-neutral-50 dark:bg-neutral-800',
 icon: 'text-neutral-600 dark:text-neutral-400',
 ring: 'ring-gray-500'
 }
 };

 const colors = colorClasses[color];

 return (
 <div
 onClick={onClick}
 className={`
 bg-white dark:bg-neutral-800 rounded-xl p-5
 border border-neutral-200 dark:border-neutral-700
 shadow-sm
 transition-all duration-200
 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600' : ''}
 ${isActive ? `ring-2 ${colors.ring}` : ''}
 `}
 >
 {/* Header */}
 <div className="flex items-start justify-between mb-4">
 {/* Icon */}
 <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
 <Icon className={`w-6 h-6 ${colors.icon}`} />
 </div>
 
 {/* Trend */}
 {trend && (
 <div className={`
 flex items-center gap-1 text-xs font-medium
 ${trend.isPositive ? 'text-success-600' : 'text-danger-600'}
 `}>
 {trend.isPositive ? (
 <ArrowUpRight className="w-3 h-3" />
 ) : (
 <ArrowDownRight className="w-3 h-3" />
 )}
 {trend.value}
 </div>
 )}
 </div>
 
 {/* Value */}
 <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
 {value}
 {suffix && <span className="text-sm font-normal text-neutral-400 ml-1">{suffix}</span>}
 </p>
 
 {/* Label */}
 <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
 {label}
 </p>
 </div>
 );
}
