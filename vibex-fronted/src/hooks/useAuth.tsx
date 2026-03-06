/**
 * useAuth Hook - 认证状态管理
 *
 * 管理用户登录状态、Token、用户信息
 *
 * Usage:
 * const { user, isAuthenticated, login, logout, isLoading } = useAuth()
 */

'use client';

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { apiService } from '@/services/api';

// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

// 认证状态
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

// Auth Context
interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth Provider
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化: 检查 localStorage 中的 token
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          // 获取用户信息
          const userData = await apiService.getCurrentUser();
          setUser(userData as User);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          // Token 失效，清除
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 登录
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = (await apiService.login({
        email,
        password,
      })) as unknown as { token?: string; user?: User };

      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        setToken(response.token);

        // 获取用户信息
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 注册
  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = (await apiService.register({
          name,
          email,
          password,
        })) as unknown as { token?: string; user?: User };

        if (response.token) {
          localStorage.setItem('auth_token', response.token);
          setToken(response.token);

          // 获取用户信息
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 登出
  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // 即使 API 调用失败也清除本地状态
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('project_roles');
      setToken(null);
      setUser(null);
    }
  }, []);

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData as User);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [token]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!token && !!user,
    isLoading,
    token,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * 便捷: 检查是否已认证
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * 便捷: 获取当前用户
 */
export function useCurrentUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * 便捷: 需要认证的高阶组件包装
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
      return null;
    }

    return <Component {...props} />;
  };
}

export default useAuth;
