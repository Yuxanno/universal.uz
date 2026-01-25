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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Universal" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">Universal</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        >
          <Menu className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
        </button>
      </header>

      {/* Mobile Slide Menu */}
      {mobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-neutral-800 z-50 shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user?.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
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
                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{t(item.label)}</span>
                </NavLink>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 safe-bottom">
              {/* Language Switcher - Mobile (below account) */}
              <div className="flex items-center gap-1 mb-3">
                <button
                  onClick={() => setScript('latin')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    script === 'latin' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600'
                  }`}
                >
                  Lotin
                </button>
                <button
                  onClick={() => setScript('cyrillic')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    script === 'cyrillic' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600'
                  }`}
                >
                  Кирил
                </button>
              </div>
              
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-neutral-500 hover:bg-danger-50 hover:text-danger-600 dark:text-neutral-400 dark:hover:bg-danger-900/30 dark:hover:text-danger-400 transition-all duration-200"
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
