import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User } from '../types';
import api from '../utils/api';

interface AuthContextType {
 user: User | null;
 loading: boolean;
 login: (phone: string, password: string) => Promise<User>;
 logout: () => void;
 updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);

 // Track app session for PWA
 useEffect(() => {
 const handleVisibilityChange = () => {
 if (document.visibilityState === 'visible') {
 // App became visible (opened/resumed)
 const sessionId = sessionStorage.getItem('appSessionId');
 const lastSessionId = localStorage.getItem('lastAppSessionId');
 
 // If no session ID or different session, it's a new app launch
 if (!sessionId || sessionId !== lastSessionId) {
 console.log('🔒 New PWA session detected, checking auth...');
 
 // Check if user is admin/cashier and force re-login
 const token = sessionStorage.getItem('token') || localStorage.getItem('token');
 if (token) {
 api.get('/auth/me')
 .then(res => {
 if (res.data.role === 'admin' || res.data.role === 'cashier') {
 console.log('🔒 Admin/Cashier detected in new session, logging out');
 sessionStorage.removeItem('token');
 sessionStorage.removeItem('tokenExpiry');
 localStorage.removeItem('token');
 localStorage.removeItem('tokenExpiry');
 setUser(null);
 }
 })
 .catch(() => {
 // Token invalid, clear everything
 sessionStorage.clear();
 localStorage.removeItem('token');
 localStorage.removeItem('tokenExpiry');
 setUser(null);
 });
 }
 
 // Create new session ID
 const newSessionId = Date.now().toString();
 sessionStorage.setItem('appSessionId', newSessionId);
 localStorage.setItem('lastAppSessionId', newSessionId);
 }
 }
 };
 
 // Listen for visibility changes (PWA open/close)
 document.addEventListener('visibilitychange', handleVisibilityChange);
 
 // Initialize session on mount
 const sessionId = Date.now().toString();
 sessionStorage.setItem('appSessionId', sessionId);
 localStorage.setItem('lastAppSessionId', sessionId);
 
 return () => {
 document.removeEventListener('visibilitychange', handleVisibilityChange);
 };
 }, []);

 useEffect(() => {
 // Check token expiry first
 const sessionExpiry = sessionStorage.getItem('tokenExpiry');
 const localExpiry = localStorage.getItem('tokenExpiry');
 const now = Date.now();
 
 // Check if token expired
 if (sessionExpiry && parseInt(sessionExpiry) < now) {
 console.log('🔒 Session token expired');
 sessionStorage.removeItem('token');
 sessionStorage.removeItem('tokenExpiry');
 setLoading(false);
 return;
 }
 
 if (localExpiry && parseInt(localExpiry) < now) {
 console.log('🔒 Local token expired');
 localStorage.removeItem('token');
 localStorage.removeItem('tokenExpiry');
 setLoading(false);
 return;
 }
 
 // Get token
 let token = sessionStorage.getItem('token');
 
 if (!token) {
 token = localStorage.getItem('token');
 }
 
 if (token) {
 api.get('/auth/me')
 .then(res => setUser(res.data))
 .catch(() => {
 sessionStorage.removeItem('token');
 sessionStorage.removeItem('tokenExpiry');
 localStorage.removeItem('token');
 localStorage.removeItem('tokenExpiry');
 })
 .finally(() => setLoading(false));
 } else {
 setLoading(false);
 }
 }, []);

 const login = useCallback(async (phone: string, password: string) => {
 const res = await api.post('/auth/login', { phone, password });
 
 // Admin va Kassir uchun token saqlanmasin (har safar login qilsin)
 // Faqat Helper uchun token saqlansin (1 marta login)
 if (res.data.user.role === 'admin' || res.data.user.role === 'cashier') {
 // Admin va Kassir uchun sessionStorage + expiry time (8 soat)
 sessionStorage.setItem('token', res.data.token);
 const expiryTime = Date.now() + (8 * 60 * 60 * 1000); // 8 hours
 sessionStorage.setItem('tokenExpiry', expiryTime.toString());
 localStorage.setItem('tokenExpiry', expiryTime.toString()); // PWA uchun
 } else {
 // Faqat Helper uchun localStorage (5 yil)
 localStorage.setItem('token', res.data.token);
 const expiryTime = Date.now() + (5 * 365 * 24 * 60 * 60 * 1000); // 5 years
 localStorage.setItem('tokenExpiry', expiryTime.toString());
 }
 
 setUser(res.data.user);
 return res.data.user;
 }, []);

 const logout = useCallback(() => {
 sessionStorage.removeItem('token');
 sessionStorage.removeItem('tokenExpiry');
 localStorage.removeItem('token');
 localStorage.removeItem('tokenExpiry');
 setUser(null);
 }, []);

 const updateUser = useCallback((userData: User) => {
 setUser(userData);
 }, []);

 // Memoize context value to prevent unnecessary re-renders
 const value = useMemo(() => ({
 user,
 loading,
 login,
 logout,
 updateUser
 }), [user, loading, login, logout, updateUser]);

 return (
 <AuthContext.Provider value={value}>
 {children}
 </AuthContext.Provider>
 );
};

export const useAuth = () => {
 const context = useContext(AuthContext);
 if (!context) throw new Error('useAuth must be used within AuthProvider');
 return context;
};
