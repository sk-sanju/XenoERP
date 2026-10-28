import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isSuperuser?: boolean;
  isStaff?: boolean;
  role?: string;
  organization?: {
    id: number;
    name: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('xeno_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('xeno_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        if (res.data.success && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('xeno_user', JSON.stringify(res.data.user));
        } else {
          setUser(null);
          localStorage.removeItem('xeno_token');
          localStorage.removeItem('xeno_user');
        }
      } catch {
        setUser(null);
        localStorage.removeItem('xeno_token');
        localStorage.removeItem('xeno_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/api/auth/login', { username, password });
      if (res.data.success) {
        const { token, user: loggedUser } = res.data;
        localStorage.setItem('xeno_token', token);
        localStorage.setItem('xeno_user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return { success: true };
      }
      return { success: false, error: res.data.error || 'Login failed' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Invalid credentials or server error';
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('xeno_token');
      localStorage.removeItem('xeno_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
