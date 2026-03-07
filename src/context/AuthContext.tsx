'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { authAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_CACHE_KEY = 'auth_user';
const TOKEN_CACHE_KEY = 'token';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async ({ background = false }: { background?: boolean } = {}) => {
    if (typeof window === 'undefined') {
      if (!background) setLoading(false);
      return;
    }

    const token = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!token) {
      localStorage.removeItem(USER_CACHE_KEY);
      setUser(null);
      if (!background) setLoading(false);
      return;
    }

    try {
      const response = await authAPI.me();
      setUser(response.data.user);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data.user));
    } catch (error) {
      logger.warn('Auth check failed:', error);
      setUser(null);
      localStorage.removeItem(TOKEN_CACHE_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    } finally {
      if (!background) setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.data.token && typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_CACHE_KEY, response.data.token);
      }
      setUser(response.data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data.user));
      }
    } catch (error: any) {
      const isTimeout =
        error?.code === 'ECONNABORTED' || String(error?.message || '').toLowerCase().includes('timeout');

      if (!isTimeout) {
        throw error;
      }

      // Retry once for backend cold starts.
      const retryResponse = await authAPI.login({ email, password });
      if (retryResponse.data.token && typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_CACHE_KEY, retryResponse.data.token);
      }
      setUser(retryResponse.data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(retryResponse.data.user));
      }
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authAPI.register({ name, email, password });
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_CACHE_KEY, response.data.token);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data.user));
    }
    setUser(response.data.user);
  };

  const logout = async () => {
    await authAPI.logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_CACHE_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    }
    setUser(null);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    const cachedUser = localStorage.getItem(USER_CACHE_KEY);
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
        setLoading(false);
        checkAuth({ background: true });
        return;
      } catch {
        localStorage.removeItem(USER_CACHE_KEY);
      }
    }

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, register }}>
      {children}
    </AuthContext.Provider>
  );
};
