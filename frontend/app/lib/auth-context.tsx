'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { normalizeUser } from './api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'seller';
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const transformedUser = normalizeUser(parsedUser) as User | null;
      setToken(storedToken);
      setUser(transformedUser);
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { authApi } = await import('./api');
      const response = await authApi.login(email, password);

      const { token: newToken, user: userData } = response;
      const transformedUser = normalizeUser(userData) as User;
      
      setToken(newToken);
      setUser(transformedUser);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(transformedUser));

      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        user: '/',
        seller: '/seller/dashboard',
        admin: '/admin/dashboard',
      };

      window.location.href = roleRoutes[userData.role] || '/';
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'seller';
  }) => {
    try {
      const { authApi } = await import('./api');
      const response = await authApi.register(userData);

      const { token: newToken, user: newUser } = response;
      const transformedUser = normalizeUser(newUser) as User;
      
      setToken(newToken);
      setUser(transformedUser);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(transformedUser));

      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        user: '/',
        seller: '/seller/dashboard',
        admin: '/admin/dashboard',
      };

      window.location.href = roleRoutes[newUser.role] || '/';
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
