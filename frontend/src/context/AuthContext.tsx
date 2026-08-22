import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser } from '../types';
import { authApi } from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'ticketease_user';
const TOKEN_KEY = 'ticketease_access_token';
const REFRESH_KEY = 'ticketease_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const token = localStorage.getItem(TOKEN_KEY);

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          // Refresh user profile from backend
          const res = await authApi.getMe();
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data.data));
          }
        } catch {
          // Fallback to stored user or clear if invalid
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    if (res.data.success) {
      const { user: authUser, accessToken, refreshToken } = res.data.data;
      setUser(authUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
  };

  const register = async (data: { name: string; email: string; phone?: string; password: string }) => {
    const res = await authApi.register(data);
    if (res.data.success) {
      const { user: authUser, accessToken, refreshToken } = res.data.data;
      setUser(authUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    authApi.logout().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
