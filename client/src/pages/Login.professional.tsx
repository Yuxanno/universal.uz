/**
 * 🎨 Professional Login Page
 * Modern, accessible, and beautiful authentication
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginProfessional() {
 const navigate = useNavigate();
 const { login } = useAuth();
 
 const [phone, setPhone] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [rememberMe, setRememberMe] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setLoading(true);

 try {
 await login(phone, password);
 navigate('/');
 } catch (err: any) {
 setError(err.response?.data?.message || 'Неверный телефон или пароль');
 } finally {
 setLoading(false);
 }
 };

 const formatPhoneNumber = (value: string) => {
 // Remove all non-digits
 const digits = value.replace(/\D/g, '');
 
 // Format as +998 XX XXX XX XX
 if (digits.length === 0) return '';
 if (digits.length <= 3) return `+${digits}`;
 if (digits.length <= 5) return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
 if (digits.length <= 8) return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
 if (digits.length <= 10) return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
 return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
 };

 const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const formatted = formatPhoneNumber(e.target.value);
 setPhone(formatted);
 };

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
 {/* Background Pattern */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
 <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
 </div>

 {/* Login Card */}
 <div className="relative w-full max-w-md">
 {/* Logo & Brand */}
 <div className="text-center mb-8 animate-slideInDown">
 <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-2xl shadow-lg mb-4">
 <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
 </svg>
 </div>
 <h1 className="text-3xl font-bold text-gray-900 mb-2">UNIVERSAL</h1>
 <p className="text-gray-600">Система управления бизнесом</p>
 </div>

 {/* Login Form Card */}
 <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-scaleIn">
 {/* Welcome Text */}
 <div className="mb-8">
 <h2 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать</h2>
 <p className="text-gray-600">Войдите в систему для продолжения</p>
 </div>

 {/* Error Alert */}
 {error && (
 <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slideInDown">
 <div className="flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-sm font-medium text-red-800">{error}</p>
 </div>
 </div>
 </div>
 )}

 {/* Form */}
 <form onSubmit={handleSubmit} className="space-y-6">
 {/* Phone Input */}
 <div>
 <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
 Номер телефона
 </label>
 <div className="relative">
 <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400">
 <Phone className="w-5 h-5" />
 </div>
 <input
 id="phone"
 type="tel"
 value={phone}
 onChange={handlePhoneChange}
 placeholder="+998 XX XXX XX XX"
 required
 disabled={loading}
 className="
 w-full pl-12 pr-4 py-3
 bg-white
 border-2 border-gray-200
 rounded-lg
 text-gray-900
 placeholder:text-gray-400
 transition-all duration-200
 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10
 disabled:bg-gray-50 disabled:cursor-not-allowed
 "
 />
 </div>
 </div>

 {/* Password Input */}
 <div>
 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
 Пароль
 </label>
 <div className="relative">
 <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400">
 <Lock className="w-5 h-5" />
 </div>
 <input
 id="password"
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Введите пароль"
 required
 disabled={loading}
 className="
 w-full pl-12 pr-12 py-3
 bg-white
 border-2 border-gray-200
 rounded-lg
 text-gray-900
 placeholder:text-gray-400
 transition-all duration-200
 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10
 disabled:bg-gray-50 disabled:cursor-not-allowed
 "
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 disabled={loading}
 className="
 absolute right-0 top-0 bottom-0 w-12
 flex items-center justify-center
 text-gray-400 hover:text-gray-600
 transition-colors
 disabled:cursor-not-allowed
 "
 tabIndex={-1}
 >
 {showPassword ? (
 <EyeOff className="w-5 h-5" />
 ) : (
 <Eye className="w-5 h-5" />
 )}
 </button>
 </div>
 </div>

 {/* Remember Me & Forgot Password */}
 <div className="flex items-center justify-between">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={rememberMe}
 onChange={(e) => setRememberMe(e.target.checked)}
 disabled={loading}
 className="
 w-4 h-4
 text-red-600
 border-gray-300
 rounded
 focus:ring-2 focus:ring-red-500/20
 disabled:cursor-not-allowed
 "
 />
 <span className="text-sm text-gray-700">Запомнить меня</span>
 </label>
 <button
 type="button"
 disabled={loading}
 className="
 text-sm font-medium text-red-600 hover:text-red-700
 transition-colors
 disabled:cursor-not-allowed disabled:opacity-50
 "
 >
 Забыли пароль?
 </button>
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={loading}
 className="
 w-full
 px-6 py-3
 bg-red-600 hover:bg-red-700 active:bg-red-800
 text-white font-semibold
 rounded-lg
 shadow-sm hover:shadow-md
 transition-all duration-200
 focus:outline-none focus:ring-4 focus:ring-red-500/20
 disabled:opacity-50 disabled:cursor-not-allowed
 active:scale-95
 flex items-center justify-center gap-2
 "
 >
 {loading ? (
 <>
 <Loader2 className="w-5 h-5 animate-spin" />
 <span>Вход...</span>
 </>
 ) : (
 <span>Войти в систему</span>
 )}
 </button>
 </form>

 {/* Demo Credentials */}
 <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
 <p className="text-xs font-medium text-gray-700 mb-2">Демо доступ:</p>
 <div className="space-y-1 text-xs text-gray-600">
 <p>📱 Телефон: <code className="px-1.5 py-0.5 bg-white rounded font-mono">+998901234567</code></p>
 <p>🔒 Пароль: <code className="px-1.5 py-0.5 bg-white rounded font-mono">admin123</code></p>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="mt-8 text-center text-sm text-gray-600">
 <p>© 2025 Universal.uz. Все права защищены.</p>
 </div>
 </div>
 </div>
 );
}
