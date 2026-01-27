import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { 
 LayoutDashboard, ShoppingCart, Package, Warehouse, Users, 
 CreditCard, ShoppingBag, UserPlus, Receipt, Menu, X, LogOut, Edit, Phone, Lock, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { formatPhone } from '../utils/format';

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
 isMobile?: boolean;
}

export default function Sidebar({ items, basePath, collapsed = false, setCollapsed, isMobile = false }: SidebarProps) {
 const { user, logout, updateUser } = useAuth();
 const { script, setScript, tKey } = useLanguage();
 const [showEditModal, setShowEditModal] = useState(false);
 const [formData, setFormData] = useState({ name: '', phone: '', password: '' });

 // Translate menu items dynamically
 const translatedItems = items.map(item => ({
 ...item,
 label: tKey(item.label)
 }));

 const openEditModal = () => {
 setFormData({
 name: user?.name || '',
 phone: user?.phone || '',
 password: ''
 });
 setShowEditModal(true);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const data: any = { name: formData.name, phone: formData.phone };
 if (formData.password) data.password = formData.password;
 
 const res = await api.put('/auth/profile', data);
 updateUser(res.data);
 setShowEditModal(false);
 } catch (err: any) {
 alert(err.response?.data?.message || 'Xatolik yuz berdi');
 }
 };

 const handleMenuItemClick = () => {
 if (isMobile && setCollapsed) {
 setCollapsed(false);
 }
 };

 return (
 <>
 <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-neutral-950 border-r-2 border-neutral-200 dark:border-neutral-800 transition-all duration-300 z-50 shadow-lg ${
 collapsed ? 'w-[72px]' : 'w-64'
 }`}>
 {/* Logo */}
 <div className="h-16 flex items-center justify-between px-4 border-b-2 border-neutral-200 dark:border-neutral-800">
 {!collapsed && (
 <div className="flex items-center gap-3">
 <img src="/logo.jpg" alt="Universal" className="w-10 h-10 rounded-xl object-cover shadow-md ring-2 ring-red-500/20" />
 <span className="font-bold text-xl text-neutral-900 dark:text-neutral-50">Universal</span>
 </div>
 )}
 <button 
 onClick={() => setCollapsed?.(!collapsed)} 
 className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-all"
 >
 {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
 </button>
 </div>

 {/* Navigation */}
 <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-220px)]">
 {translatedItems.map((item, i) => (
 <NavLink
 key={i}
 to={`${basePath}${items[i].path}`}
 end={items[i].path === ''}
 onClick={handleMenuItemClick}
 className={({ isActive }) => `
 flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200
 ${collapsed ? 'justify-center' : ''}
 ${isActive 
 ? 'bg-red-50 text-red-600 shadow-sm dark:bg-red-900/30 dark:text-red-400' 
 : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
 }
 `}
 title={collapsed ? item.label : undefined}
 >
 <span className="flex-shrink-0">{items[i].icon}</span>
 {!collapsed && <span className="truncate">{item.label}</span>}
 </NavLink>
 ))}
 </nav>

 {/* User Section */}
 <div className="absolute bottom-0 left-0 right-0 p-3 border-t-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
 {/* Language Switcher - Desktop (above account) */}
 {!collapsed && (
 <div className="flex items-center gap-2 mb-3">
 <button
 onClick={() => setScript('latin')}
 className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
 script === 'latin' 
 ? 'bg-red-600 text-white shadow-sm' 
 : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
 }`}
 >
 Lotin
 </button>
 <button
 onClick={() => setScript('cyrillic')}
 className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
 script === 'cyrillic' 
 ? 'bg-red-600 text-white shadow-sm' 
 : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
 }`}
 >
 Кирил
 </button>
 </div>
 )}
 {collapsed && (
 <button
 onClick={() => setScript(script === 'latin' ? 'cyrillic' : 'latin')}
 className="w-full mb-3 py-2.5 text-xs font-bold bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-all"
 title={script === 'latin' ? 'Кирилга ўтиш' : "Lotinga o'tish"}
 >
 {script === 'latin' ? 'Кир' : 'Лот'}
 </button>
 )}
 
 {!collapsed && (
 <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
 <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
 <span className="text-sm font-bold text-white">
 {user?.name?.charAt(0).toUpperCase()}
 </span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{user?.name}</p>
 <p className="text-xs text-neutral-600 dark:text-neutral-400 capitalize font-medium">{user?.role}</p>
 </div>
 {user?.role === 'admin' && (
 <button
 onClick={openEditModal}
 className="p-2 rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
 title={tKey("Tahrirlash")}
 >
 <Edit className="w-4 h-4" />
 </button>
 )}
 </div>
 )}
 <button
 onClick={logout}
 className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-neutral-600 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all duration-200 font-medium ${
 collapsed ? 'justify-center' : ''
 }`}
 title={collapsed ? tKey('Chiqish') : undefined}
 >
 <LogOut className="w-5 h-5" />
 {!collapsed && <span>{tKey("Chiqish")}</span>}
 </button>
 </div>
 </aside>

 {/* Edit Profile Modal - Rendered via Portal */}
 {showEditModal && createPortal(
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowEditModal(false)} />
 <div className="bg-white dark:bg-neutral-800 rounded-xl w-full max-w-2xl p-8 relative z-10 shadow-xl animate-scale-in">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{tKey("Profilni tahrirlash")}</h3>
 <button 
 onClick={() => setShowEditModal(false)} 
 className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">{tKey("Ismingiz")}</label>
 <div className="relative flex items-center">
 <User className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
 <input 
 type="text" 
 className="w-full pl-10 pr-3 py-2.5 text-sm text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:bg-neutral-700 dark:text-neutral-100 dark:border-neutral-600 dark:focus:bg-neutral-900" 
 placeholder={tKey("Ismingiz")} 
 value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})} 
 required 
 />
 </div>
 </div>
 <div>
 <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">{tKey("Telefon")}</label>
 <div className="relative flex items-center">
 <Phone className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
 <input 
 type="tel" 
 className="w-full pl-10 pr-3 py-2.5 text-sm text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:bg-neutral-700 dark:text-neutral-100 dark:border-neutral-600 dark:focus:bg-neutral-900" 
 placeholder="+998 (XX) XXX-XX-XX" 
 value={formData.phone}
 onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} 
 required 
 />
 </div>
 </div>
 <div>
 <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">{tKey("Yangi parol (ixtiyoriy)")}</label>
 <div className="relative flex items-center">
 <Lock className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
 <input 
 type="password" 
 className="w-full pl-10 pr-3 py-2.5 text-sm text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:bg-neutral-700 dark:text-neutral-100 dark:border-neutral-600 dark:focus:bg-neutral-900" 
 placeholder={tKey("O'zgartirmaslik uchun bo'sh qoldiring")} 
 value={formData.password}
 onChange={e => setFormData({...formData, password: e.target.value})} 
 />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">{tKey("Bekor qilish")}</button>
 <button type="submit" className="btn-primary flex-1">{tKey("Saqlash")}</button>
 </div>
 </form>
 </div>
 </div>,
 document.body
 )}
 </>
 );
}

export const adminMenuItems: MenuItem[] = [
 { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Statistika', path: '' },
 { icon: <Package className="w-5 h-5" />, label: 'Tovarlar', path: '/products' },
 { icon: <Warehouse className="w-5 h-5" />, label: 'Omborlar', path: '/warehouses' },
 { icon: <Users className="w-5 h-5" />, label: 'Mijozlar', path: '/customers' },
 { icon: <CreditCard className="w-5 h-5" />, label: 'Qarz daftarcha', path: '/debts' },
 { icon: <ShoppingBag className="w-5 h-5" />, label: 'Buyurtmalar', path: '/orders' },
 { icon: <UserPlus className="w-5 h-5" />, label: "Yordamchilar", path: '/helpers' },
];

export const cashierMenuItems: MenuItem[] = [
 { icon: <ShoppingCart className="w-5 h-5" />, label: 'Kassa (POS)', path: '' },
 { icon: <Package className="w-5 h-5" />, label: 'Mahsulotlar', path: '/products' },
 { icon: <Users className="w-5 h-5" />, label: 'Mijozlar', path: '/customers' },
 { icon: <CreditCard className="w-5 h-5" />, label: 'Qarz daftarcha', path: '/debts' },
 { icon: <Receipt className="w-5 h-5" />, label: "Xodimlar cheklari", path: '/staff-receipts' },
];
