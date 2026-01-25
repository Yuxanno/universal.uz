import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Phone, Lock, ArrowRight, Shield } from 'lucide-react';
import { formatPhone, getRawPhone } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const rawPhone = getRawPhone(phone);
      await login(rawPhone, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t('Xatolik yuz berdi'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-neutral-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background - Logo Red */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-100/40 dark:bg-red-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-50/40 dark:bg-red-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 mb-4">
            <img 
              src="/logo.jpg" 
              alt="Universal" 
              className="w-16 h-16 rounded-2xl object-cover shadow-xl ring-4 ring-red-500/30"
            />
            <h1 className="text-5xl font-black text-slate-900 dark:text-white">
              Universal
            </h1>
          </div>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
            {t("Biznes boshqaruv tizimi")}
          </p>
        </div>

        {/* Login Card */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl blur-sm opacity-20" />
          
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border-2 border-neutral-200 dark:border-slate-700">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-600 rounded-full mb-4 border-2 border-red-700 dark:border-red-500 shadow-md">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">{t("Xavfsiz kirish")}</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                {t("Tizimga kirish")}
              </h2>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-800 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-red-900 dark:text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Phone Input */}
              <div>
                <label 
                  htmlFor="phone" 
                  className="block text-base font-bold mb-2 text-slate-800 dark:text-slate-200"
                >
                  {t("Telefon raqam")}
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+998 (XX) XXX-XX-XX"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full pl-12 pr-4 py-3.5 text-base font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-neutral-300 dark:border-slate-600 rounded-xl transition-all focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-red-900/30 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-base font-bold mb-2 text-slate-800 dark:text-slate-200"
                >
                  {t("Parol")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 text-base font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-neutral-300 dark:border-slate-600 rounded-xl transition-all focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-red-900/30 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-base font-bold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t("Yuklanmoqda")}...</span>
                  </>
                ) : (
                  <>
                    <span>{t("Kirish")}</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6 font-medium">
          © 2025 Universal.uz
        </p>
      </div>
    </div>
  );
}
