import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar, { adminMenuItems } from '../components/Sidebar';
import BottomNavigation from '../components/BottomNavigation';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { script, setScript, t } = useLanguage();

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          items={adminMenuItems} 
          basePath="/admin" 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
        />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-surface-200 z-40 flex items-center justify-between px-4">
        <span className="font-bold text-lg text-surface-900">Universal</span>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl hover:bg-surface-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-surface-700" />
        </button>
      </header>

      {/* Mobile Slide Menu */}
      {mobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-surface-200 to-surface-300 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-semibold text-surface-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">{user?.name}</p>
                  <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-surface-100 transition-colors"
              >
                <X className="w-5 h-5 text-surface-500" />
              </button>
            </div>
            <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              {adminMenuItems.map((item, i) => (
                <NavLink
                  key={i}
                  to={`/admin${item.path}`}
                  end={item.path === ''}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-brand-50 text-brand-600' 
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{t(item.label)}</span>
                </NavLink>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-surface-100 bg-white safe-bottom">
              {/* Language Switcher - Mobile (below account) */}
              <div className="flex items-center gap-1 mb-3">
                <button
                  onClick={() => setScript('latin')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    script === 'latin' 
                      ? 'bg-brand-500 text-white' 
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  Lotin
                </button>
                <button
                  onClick={() => setScript('cyrillic')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    script === 'cyrillic' 
                      ? 'bg-brand-500 text-white' 
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  Кирил
                </button>
              </div>
              
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-surface-500 hover:bg-danger-50 hover:text-danger-600 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t("Chiqish")}</span>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Main Content */}
      <main className={`transition-all duration-300 ease-smooth pt-14 lg:pt-0 pb-20 lg:pb-0 ${
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
      }`}>
        <Outlet />
      </main>
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
