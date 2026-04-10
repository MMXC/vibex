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
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
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
  const router = useRouter();

  // E1-S1.3: 全局 401 监听 — 收到 auth:401 事件后自动跳转 /auth
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ returnTo: string }>;
      const returnTo = customEvent.detail?.returnTo;
      if (!returnTo) return;
      // Avoid redirect loop: if already on /auth, skip
      if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
        return;
      }
      sessionStorage.setItem('auth_return_to', returnTo);
      router.push('/auth');
    };
    window.addEventListener('auth:401', handler);
    return () => window.removeEventListener('auth:401', handler);
  }, [router]);

  // 初始化: 检查 localStorage 中的 token
  useEffect(() => {
    const initAuth = async () => {
      // 优先从 sessionStorage 读取（安全），fallback 到 localStorage（兼容旧数据迁移）
      const storedToken = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          // 获取用户信息
          const userData = await apiService.getCurrentUser();
          setUser(userData as User);
        } catch (error) {
          canvasLogger.default.error('Failed to fetch user:', error);
          // Token 失效，清除
          sessionStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // PRD FR-5.1: 跨标签页同步 - 监听 storage 事件
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key !== 'auth_token') return;

      const newToken = e.newValue;
      if (newToken) {
        // 另一个标签页登录了
        setToken(newToken);
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData as User);
        } catch {
          // Token 可能已失效，忽略
        }
      } else {
        // 另一个标签页登出了
        setToken(null);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
        // 安全：使用 sessionStorage 存储认证 token
        sessionStorage.setItem('auth_token', response.token);
        // E1-S1.5: 同时设置 cookie 让 middleware 可读
        document.cookie = `auth_session=${response.token}; path=/; max-age=86400; SameSite=Lax`;
        // 清除旧 localStorage 中的 token
        localStorage.removeItem('auth_token');
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
          // 安全：使用 sessionStorage 存储认证 token
          sessionStorage.setItem('auth_token', response.token);
          // E1-S1.5: 同时设置 cookie 让 middleware 可读
          document.cookie = `auth_session=${response.token}; path=/; max-age=86400; SameSite=Lax`;
          localStorage.removeItem('auth_token');
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
    // E1-S1.3: 标记为主动登出，防止 401 触发 redirect loop
    sessionStorage.setItem('auth_is_logout', '1');
    try {
      await apiService.logout();
    } catch (error) {
      // 即使 API 调用失败也清除本地状态
      canvasLogger.default.error('Logout API error:', error);
    } finally {
      // 清除 sessionStorage（主存储）和 localStorage（兼容）
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('project_roles');
      sessionStorage.removeItem('auth_is_logout'); // clean up flag
      // E1-S1.5: 清除 middleware 认证 cookie
      document.cookie = 'auth_session=; path=/; max-age=0';
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
      canvasLogger.default.error('Failed to refresh user:', error);
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
