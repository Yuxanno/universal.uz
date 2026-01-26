import { Outlet } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HelperLayout() {
 const { user, logout } = useAuth();

 return (
 <div className="min-h-screen bg-surface-50">
 <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-surface-200/60">
 <div className="px-4 h-16 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl shadow-sm overflow-hidden">
 <img src="/logo.jpg" alt="Universal" className="w-full h-full object-cover" />
 </div>
 <span className="font-bold text-lg text-surface-900">Universal</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2 px-3 py-2 bg-surface-100 rounded-xl">
 <User className="w-4 h-4 text-surface-500" />
 <span className="text-sm font-medium text-surface-700">{user?.name}</span>
 </div>
 <button onClick={logout} className="btn-icon text-surface-500 hover:text-danger-600 hover:bg-danger-50">
 <LogOut className="w-5 h-5" />
 </button>
 </div>
 </div>
 </header>
 <main className="p-4">
 <Outlet />
 </main>
 </div>
 );
}
