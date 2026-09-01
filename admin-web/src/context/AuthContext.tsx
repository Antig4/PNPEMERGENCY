import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStationUser: boolean;
  isLoading: boolean;
  login: (emailOrBadge: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const saved = authService.getSavedUser();
    if (saved && (saved.role === 'ADMIN' || saved.role === 'STATION_USER')) {
      setUser(saved);
    } else {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
    setIsLoading(false);
  }, []);

  const login = async (emailOrBadge: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.login(emailOrBadge, pass);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && (user.role === 'ADMIN' || user.role === 'STATION_USER'),
        isAdmin: !!user && user.role === 'ADMIN',
        isStationUser: !!user && user.role === 'STATION_USER',
        isLoading,
        login,
        logout,
      }}
    >
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
