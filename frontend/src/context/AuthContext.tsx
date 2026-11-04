import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  switchRoleDemo: (role: UserRole) => Promise<void>;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('tm_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verify token on mount
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('tm_token');
      if (savedToken) {
        try {
          const resp = await api.get<User>('/auth/me');
          setUser(resp.data);
          localStorage.setItem('tm_user', JSON.stringify(resp.data));
        } catch (err) {
          localStorage.removeItem('tm_token');
          localStorage.removeItem('tm_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    verifyToken();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const resp = await api.post<AuthResponse>('/auth/login', { email, password });
    const { access_token, user: loggedUser } = resp.data;
    localStorage.setItem('tm_token', access_token);
    localStorage.setItem('tm_user', JSON.stringify(loggedUser));
    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (data: any): Promise<User> => {
    const resp = await api.post<AuthResponse>('/auth/register', data);
    const { access_token, user: newUser } = resp.data;
    localStorage.setItem('tm_token', access_token);
    localStorage.setItem('tm_user', JSON.stringify(newUser));
    setToken(access_token);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('tm_token');
    localStorage.removeItem('tm_user');
    setUser(null);
    setToken(null);
  };

  const switchRoleDemo = async (targetRole: UserRole) => {
    const demoAccounts: Record<UserRole, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@talentmatch.ai', pass: 'talentmatch123' },
      RECRUITER: { email: 'sarah.recruiter@cloudtech.com', pass: 'talentmatch123' },
      JOB_SEEKER: { email: 'elena.dev@gmail.com', pass: 'talentmatch123' }
    };
    const creds = demoAccounts[targetRole];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('tm_user', JSON.stringify(updated));
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
        switchRoleDemo,
        updateUser
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
