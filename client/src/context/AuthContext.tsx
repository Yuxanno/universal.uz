import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User } from '../types';
import api from '../utils/api';

interface AuthContextType {
 user: User | null;
 loading: boolean;
 login: (phone: string, password: string) => Promise<void>;
 logout: () => void;
 updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const token = localStorage.getItem('token');
 if (token) {
 api.get('/auth/me')
 .then(res => setUser(res.data))
 .catch(() => localStorage.removeItem('token'))
 .finally(() => setLoading(false));
 } else {
 setLoading(false);
 }
 }, []);

 const login = useCallback(async (phone: string, password: string) => {
 const res = await api.post('/auth/login', { phone, password });
 localStorage.setItem('token', res.data.token);
 setUser(res.data.user);
 }, []);

 const logout = useCallback(() => {
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
