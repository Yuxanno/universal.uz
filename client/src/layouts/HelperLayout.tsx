import { Outlet } from 'react-router-dom';
import { LogOut, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HelperLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <QrCode className="w-6 h-6 text-primary-500" />
          <span className="font-bold text-lg text-primary-500">Universal.uz</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-gray-500 hover:text-primary-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
