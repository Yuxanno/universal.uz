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

 useEffect(() => {
 // Avval sessionStorage dan tekshir (admin uchun)
 let token = sessionStorage.getItem('token');
 
 // Agar sessionStorage da yo'q bo'lsa, localStorage dan tekshir (kassir/helper uchun)
 if (!token) {
 token = localStorage.getItem('token');
 }
 
 if (token) {
 api.get('/auth/me')
 .then(res => setUser(res.data))
 .catch(() => {
 sessionStorage.removeItem('token');
 localStorage.removeItem('token');
 })
 .finally(() => setLoading(false));
 } else {
 setLoading(false);
 }
 }, []);

 const login = useCallback(async (phone: string, password: string) => {
 const res = await api.post('/auth/login', { phone, password });
 
 // Admin uchun token saqlanmasin (har safar login qilsin)
 // Kassir va helper uchun token saqlansin (1 marta login)
 if (res.data.user.role === 'admin') {
 // Admin uchun faqat sessionStorage (browser yopilganda o'chadi)
 sessionStorage.setItem('token', res.data.token);
 } else {
 // Kassir va helper uchun localStorage (saqlanib qoladi)
 localStorage.setItem('token', res.data.token);
 }
 
 setUser(res.data.user);
 return res.data.user; // Return user data for immediate redirect
 }, []);

 const logout = useCallback(() => {
 sessionStorage.removeItem('token');
 localStorage.removeItem('token');
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
