import React, { createContext, useContext, useEffect, useState } from 'react';
import { Storage } from '../lib/storage';
import { AuthUser } from '../api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const [savedToken, savedUser] = await Promise.all([
          Storage.getToken(),
          Storage.getUser<AuthUser>(),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  const login = async (newToken: string, newUser: AuthUser) => {
    await Promise.all([
      Storage.setToken(newToken),
      Storage.setUser(newUser),
    ]);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await Storage.clearAll();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
