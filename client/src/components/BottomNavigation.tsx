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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-surface-200/60 z-40 safe-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                active 
                  ? 'text-brand-600' 
                  : 'text-surface-400 active:text-surface-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                active ? 'bg-brand-50' : ''
              }`}>
                <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
              </div>
              <span className={`text-[10px] font-medium leading-tight ${active ? 'text-brand-600' : 'text-surface-500'}`}>
                {tKey(item.label)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
