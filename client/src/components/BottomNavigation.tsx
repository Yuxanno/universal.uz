import { useLocation, useNavigate } from 'react-router-dom';
import { 
 LayoutDashboard, 
 Package, 
 Receipt, 
 Users,
 Warehouse
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function BottomNavigation() {
 const location = useLocation();
 const navigate = useNavigate();
 const { tKey } = useLanguage();

 const navItems = [
 { path: '/admin', icon: LayoutDashboard, label: 'Statistika', exact: true },
 { path: '/admin/products', icon: Package, label: 'Tovarlar' },
 { path: '/admin/warehouses', icon: Warehouse, label: 'Omborlar' },
 { path: '/admin/debts', icon: Receipt, label: 'Qarzlar' },
 { path: '/admin/customers', icon: Users, label: 'Mijozlar' }
 ];

 const isActive = (path: string, exact?: boolean) => {
 if (exact) return location.pathname === path;
 return location.pathname.startsWith(path);
 };

 return (
 <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/98 dark:bg-neutral-950/98 backdrop-blur-xl border-t-2 border-neutral-200 dark:border-neutral-800 z-40 safe-bottom shadow-lg">
 <div className="grid grid-cols-5 h-16">
 {navItems.map((item) => {
 const Icon = item.icon;
 const active = isActive(item.path, item.exact);
 
 return (
 <button
 key={item.path}
 onClick={() => navigate(item.path)}
 className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
 active 
 ? 'text-red-600 dark:text-red-400' 
 : 'text-neutral-500 dark:text-neutral-400 active:text-neutral-700 dark:active:text-neutral-300'
 }`}
 >
 <div className={`p-2 rounded-xl transition-all duration-200 ${
 active ? 'bg-red-50 dark:bg-red-900/30 shadow-sm' : ''
 }`}>
 <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
 </div>
 <span className={`text-[10px] font-bold leading-tight ${active ? 'text-red-600 dark:text-red-400' : 'text-neutral-600 dark:text-neutral-500'}`}>
 {tKey(item.label)}
 </span>
 </button>
 );
 })}
 </div>
 </nav>
 );
}
