import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Warehouse, Users, 
  CreditCard, ShoppingBag, UserPlus, Receipt, Menu, X, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface SidebarProps {
  items: MenuItem[];
  basePath: string;
  collapsed?: boolean;
  setCollapsed?: (v: boolean) => void;
}

export default function Sidebar({ items, basePath, collapsed = false, setCollapsed }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all z-50 shadow-sm ${
      collapsed ? 'w-16' : 'w-60'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && <span className="font-bold text-lg text-primary-500">Universal.uz</span>}
        <button onClick={() => setCollapsed?.(!collapsed)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="p-2 space-y-1">
        {items.map((item, i) => (
          <NavLink
            key={i}
            to={`${basePath}${item.path}`}
            end={item.path === ''}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        {!collapsed && (
          <div className="mb-3 text-sm">
            <p className="text-gray-900 font-medium">{user?.name}</p>
            <p className="text-gray-500 text-xs">{user?.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Chiqish</span>}
        </button>
      </div>
    </aside>
  );
}

export const adminMenuItems: MenuItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Statistika', path: '' },
  { icon: <ShoppingCart className="w-5 h-5" />, label: 'Kassa (POS)', path: '/kassa' },
  { icon: <Package className="w-5 h-5" />, label: 'Tovarlar', path: '/products' },
  { icon: <Warehouse className="w-5 h-5" />, label: 'Omborlar', path: '/warehouses' },
  { icon: <Users className="w-5 h-5" />, label: 'Mijozlar', path: '/customers' },
  { icon: <CreditCard className="w-5 h-5" />, label: 'Qarz daftarcha', path: '/debts' },
  { icon: <ShoppingBag className="w-5 h-5" />, label: 'Buyurtmalar', path: '/orders' },
  { icon: <UserPlus className="w-5 h-5" />, label: "Yordamchilar", path: '/helpers' },
  { icon: <Receipt className="w-5 h-5" />, label: "Xodimlar cheklari", path: '/staff-receipts' },
];

export const cashierMenuItems: MenuItem[] = [
  { icon: <ShoppingCart className="w-5 h-5" />, label: 'Kassa (POS)', path: '' },
  { icon: <CreditCard className="w-5 h-5" />, label: 'Qarz daftarcha', path: '/debts' },
  { icon: <Receipt className="w-5 h-5" />, label: "Xodimlar cheklari", path: '/staff-receipts' },
];
