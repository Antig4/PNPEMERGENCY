import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginDTO, RegisterDTO } from '../types/auth';
import { Incident } from '../types/incident';
import { authService } from '../services/authService';
import { incidentService } from '../services/incidentService';
import { storage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeIncident: Incident | null;
  login: (credentials: LoginDTO) => Promise<User>;
  register: (data: RegisterDTO) => Promise<User>;
  logout: () => Promise<void>;
  refreshActiveIncident: () => Promise<Incident | null>;
  setActiveIncident: (incident: Incident | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);

  useEffect(() => {
    initAuth();
  }, []);

  // Poll citizen active incident status every 3 seconds (only for CITIZEN role)
  useEffect(() => {
    if (!user || user.role !== 'CITIZEN') return;
    refreshActiveIncident();
    const interval = setInterval(() => {
      refreshActiveIncident();
    }, 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const initAuth = async () => {
    try {
      setIsLoading(true);
      const session = await authService.getSavedSession();
      if (session) {
        setUser(session.user);
        // Only fetch active incident for citizen role
        if (session.user.role === 'CITIZEN') {
          const active = await incidentService.getActiveIncident();
          setActiveIncident(active);
        }
      }
    } catch (e) {
      console.warn('[AuthProvider] initAuth error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshActiveIncident = async (): Promise<Incident | null> => {
    if (!user || user.role !== 'CITIZEN') return null;
    try {
      const active = await incidentService.getActiveIncident();
      if (active && (active.status === 'RESOLVED' || active.status === 'CANCELLED')) {
        setActiveIncident(null);
        return null;
      }
      setActiveIncident(active);
      return active;
    } catch (e: any) {
      if (e?.status === 401 || e?.message?.includes('Unauthenticated')) {
        // Clear invalid local user session
        setUser(null);
        setActiveIncident(null);
        await authService.logout();
      }
      return null;
    }
  };

  const login = async (credentials: LoginDTO): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      setUser(res.user);

      // Only fetch active incident for citizen
      if (res.user.role === 'CITIZEN') {
        await refreshActiveIncident();
      }

      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterDTO): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (e) {
      console.warn('[AuthContext] logout warning:', e);
    } finally {
      setUser(null);
      setActiveIncident(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        activeIncident,
        login,
        register,
        logout,
        refreshActiveIncident,
        setActiveIncident,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
