'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import type { IUser } from 'shared';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token salvo
    const token = localStorage.getItem('token');
    console.log('[useAuth] Initial check - Token exists:', !!token);
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      console.log('[useAuth] Fetching user...');
      const response = await authApi.getMe();
      console.log('[useAuth] User fetched successfully:', response.data.user);
      setUser(response.data.user);
    } catch (error) {
      console.error('[useAuth] Error fetching user:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[useAuth] Attempting login...');
    const response = await authApi.login({ email, password });
    const { token, user: userData } = response.data;

    console.log('[useAuth] Login successful, saving token and user:', userData);
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const contextValue = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
