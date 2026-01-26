/**
 * Modern Dashboard Example
 * 
 * Демонстрация новой дизайн-системы:
 * - Белый фон
 * - Красные акценты
 * - Чистый минимализм
 * - Быстрая производительность
 */

import { ShoppingCart, Users, Package, TrendingUp, Plus, Search } from 'lucide-react';
import Button from '../../components/ui/Button.modern';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.modern';
import Input from '../../components/ui/Input.modern';
import Badge from '../../components/ui/Badge.modern';
import { CardSkeleton } from '../../components/ui/Skeleton.modern';

export default function ModernDashboardExample() {
 return (
 <div className="min-h-screen bg-white dark:bg-neutral-950">
 {/* Header */}
 <header className="sticky top-0 z-30 bg-white dark:bg-neutral-950 border-b-2 border-neutral-200 dark:border-neutral-800">
 <div className="container-responsive h-16 flex items-center justify-between">
 <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
 Dashboard
 </h1>
 
 <div className="flex items-center gap-3">
 <Input
 placeholder="Поиск..."
 icon={<Search className="w-4 h-4" />}
 fullWidth={false}
 className="w-64"
 />
 <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
 Создать
 </Button>
 </div>
 </div>
 </header>

 {/* Main Content */}
 <main className="container-responsive py-8">
 {/* Stats Grid */}
 <div className="grid-responsive-4 mb-8">
 <StatCard
 icon={<ShoppingCart className="w-6 h-6" />}
 label="Продажи"
 value="1,234"
 change="+12%"
 positive
 />
 <StatCard
 icon={<Users className="w-6 h-6" />}
 label="Клиенты"
 value="567"
 change="+8%"
 positive
 />
 <StatCard
 icon={<Package className="w-6 h-6" />}
 label="Товары"
 value="890"
 change="-3%"
 />
 <StatCard
 icon={<TrendingUp className="w-6 h-6" />}
 label="Доход"
 value="12.5M"
 change="+15%"
 positive
 />
 </div>

 {/* Content Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Recent Orders */}
 <Card className="lg:col-span-2">
 <CardHeader title="Последние заказы" />
 <CardBody>
 <div className="space-y-3">
 {[1, 2, 3, 4].map((i) => (
 <OrderItem key={i} />
 ))}
 </div>
 </CardBody>
 </Card>

 {/* Quick Actions */}
 <Card>
 <CardHeader title="Быстрые действия" />
 <CardBody>
 <div className="space-y-2">
 <Button variant="primary" fullWidth icon={<Plus className="w-4 h-4" />}>
 Новый заказ
 </Button>
 <Button variant="secondary" fullWidth icon={<Package className="w-4 h-4" />}>
 Добавить товар
 </Button>
 <Button variant="ghost" fullWidth icon={<Users className="w-4 h-4" />}>
 Клиенты
 </Button>
 </div>
 </CardBody>
 </Card>
 </div>

 {/* Loading Example */}
 <div className="mt-8">
 <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
 Loading States
 </h2>
 <div className="grid-responsive">
 <CardSkeleton />
 <CardSkeleton />
 <CardSkeleton />
 </div>
 </div>
 </main>
 </div>
 );
}

// Stat Card Component
function StatCard({ 
 icon, 
 label, 
 value, 
 change, 
 positive = false 
}: { 
 icon: React.ReactNode; 
 label: string; 
 value: string; 
 change: string; 
 positive?: boolean;
}) {
 return (
 <div className="stat-card">
 <div className="flex items-start justify-between mb-4">
 <div className="stat-icon">
 {icon}
 </div>
 <Badge variant={positive ? 'primary' : 'secondary'}>
 {change}
 </Badge>
 </div>
 <div className="stat-value">{value}</div>
 <div className="stat-label">{label}</div>
 </div>
 );
}

// Order Item Component
function OrderItem() {
 return (
 <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
 <ShoppingCart className="w-5 h-5 text-red-600 dark:text-red-400" />
 </div>
 <div>
 <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
 Заказ #1234
 </p>
 <p className="text-xs text-neutral-600 dark:text-neutral-400">
 2 минуты назад
 </p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
 125,000 сум
 </p>
 <Badge variant="primary" size="sm">Новый</Badge>
 </div>
 </div>
 );
}
