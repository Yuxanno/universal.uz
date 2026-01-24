import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar, { cashierMenuItems } from '../components/Sidebar';

export default function CashierLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar items={cashierMenuItems} basePath="/cashier" collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Header with Burger Menu */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Universal" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Universal</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-72 z-50 animate-slide-in-left">
            <Sidebar 
              items={cashierMenuItems} 
              basePath="/cashier" 
              collapsed={false} 
              setCollapsed={() => setMobileMenuOpen(false)}
              isMobile={true}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 pt-14 lg:pt-0 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        <Outlet />
      </main>
    </div>
  );
}
