import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // CRITICAL SECURITY: Never trust raw user object from localStorage!
  // User state must strictly be verified by the backend on every session initialization.
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tm_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verify authenticated session against backend database on mount
    const verifySession = async () => {
      const savedToken = localStorage.getItem('tm_token');
      if (!savedToken) {
        // No token present; ensure any forged or stale user data in localStorage is wiped
        localStorage.removeItem('tm_user');
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      try {
        const resp = await api.get<User>('/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        // Token is genuine and validated against database
        setUser(resp.data);
        setToken(savedToken);
        localStorage.setItem('tm_user', JSON.stringify(resp.data));
      } catch (err) {
        // Token expired, signature invalid, or user deactivated
        localStorage.removeItem('tm_token');
        localStorage.removeItem('tm_user');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email: string, password: string, role?: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const payload: any = { email, password };
      if (role) {
        payload.role = role;
      }

      const resp = await api.post<AuthResponse>('/auth/login', payload);
      const { access_token, user: loggedUser } = resp.data;

      localStorage.setItem('tm_token', access_token);
      localStorage.setItem('tm_user', JSON.stringify(loggedUser));
      setToken(access_token);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      // Ensure no state persists on failed login
      localStorage.removeItem('tm_token');
      localStorage.removeItem('tm_user');
      setUser(null);
      setToken(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<User> => {
    setIsLoading(true);
    try {
      const resp = await api.post<AuthResponse>('/auth/register', data);
      const { access_token, user: newUser } = resp.data;

      localStorage.setItem('tm_token', access_token);
      localStorage.setItem('tm_user', JSON.stringify(newUser));
      setToken(access_token);
      setUser(newUser);
      return newUser;
    } catch (err) {
      localStorage.removeItem('tm_token');
      localStorage.removeItem('tm_user');
      setUser(null);
      setToken(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('tm_token');
    localStorage.removeItem('tm_user');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updated: User) => {
    // Only update safe profile fields; preserve the database verified role
    setUser((prev) => (prev ? { ...prev, ...updated, role: prev.role } : updated));
    if (user) {
      localStorage.setItem('tm_user', JSON.stringify({ ...user, ...updated, role: user.role }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
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
