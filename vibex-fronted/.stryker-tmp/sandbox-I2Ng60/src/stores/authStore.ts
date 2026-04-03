/**
 * AuthStore - Zustand 认证状态管理
 * 
 * 解决登录状态检测时机问题：
 * - 使用 Zustand 全局状态管理
 * - 使用 persist 中间件持久化到 localStorage
 * - 提供 checkAuth() 实时检测方法
 */
// @ts-nocheck


import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => boolean;  // 实时检测
  syncFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setLoading: (isLoading) => set({ isLoading }),

      login: (token, user) => {
        set({ token, user, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        // Clear sessionStorage (auth tokens should NOT persist across sessions)
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('user_id');
          sessionStorage.removeItem('user_role');
          // Also clear any localStorage entries for backward compatibility
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_role');
        }
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      },

      checkAuth: () => {
        // 实时检测 sessionStorage 中的登录状态（安全：不用 localStorage 存敏感 token）
        if (typeof window === 'undefined') {
          return false;
        }

        // 优先从 sessionStorage 读取（安全），fallback 到 localStorage（兼容旧数据）
        const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
        
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }

        // Token exists, check if it's expired (basic check)
        try {
          const payload = token.split('.')[1];
          if (payload) {
            const decoded = JSON.parse(atob(payload));
            const now = Date.now() / 1000;
            
            if (decoded.exp && decoded.exp < now) {
              // Token expired - clear from both storages
              sessionStorage.removeItem('auth_token');
              localStorage.removeItem('auth_token');
              set({ isAuthenticated: false, user: null, token: null });
              return false;
            }
            
            // Token valid - migrate to sessionStorage if from localStorage
            if (localStorage.getItem('auth_token')) {
              sessionStorage.setItem('auth_token', token);
              localStorage.removeItem('auth_token');
            }
            
            const user: User = {
              id: decoded.userId || decoded.sub || '',
              email: decoded.email || '',
              name: decoded.name,
              role: decoded.role,
            };
            set({ isAuthenticated: true, user, token, isLoading: false });
            return true;
          }
        } catch {
          // Invalid token
          sessionStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token');
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }

        // Fallback: token exists but can't decode
        set({ isAuthenticated: true, token, isLoading: false });
        return true;
      },

      syncFromStorage: () => {
        // 从 sessionStorage 同步状态（安全），兼容 localStorage（迁移期）
        if (typeof window === 'undefined') return;

        const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
        const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
        const userRole = sessionStorage.getItem('user_role') || localStorage.getItem('user_role');

        if (token) {
          try {
            const payload = token.split('.')[1];
            if (payload) {
              const decoded = JSON.parse(atob(payload));
              const user: User = {
                id: userId || decoded.userId || decoded.sub || '',
                email: decoded.email || '',
                name: decoded.name,
                role: userRole || decoded.role,
              };
              // Migrate to sessionStorage
              if (localStorage.getItem('auth_token')) {
                sessionStorage.setItem('auth_token', token);
                localStorage.removeItem('auth_token');
              }
              set({ isAuthenticated: true, user, token, isLoading: false });
              return;
            }
          } catch {
            // Invalid token
          }
        }

        set({ isAuthenticated: false, user: null, token: null, isLoading: false });
      },
    }),
    {
      name: 'vibex-auth-storage',
      // 使用 sessionStorage 而非 localStorage，确保认证 token 不在持久化存储中明文保存
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // SSR 环境下返回空存储
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return sessionStorage;
      }),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  ),
  { name: 'AuthStore' }
  )
);

// 导出便捷方法
export const authActions = {
  login: useAuthStore.getState().login,
  logout: useAuthStore.getState().logout,
  checkAuth: useAuthStore.getState().checkAuth,
  syncFromStorage: useAuthStore.getState().syncFromStorage,
};

// PRD FR-5.1: 跨标签页同步 - 监听 localStorage auth_token 变化
if (typeof window !== 'undefined') {
  const handleAuthStorageChange = (e: StorageEvent) => {
    if (e.key !== 'auth_token') return;
    // localStorage auth_token 变化 → 同步 sessionStorage 状态
    const { syncFromStorage } = useAuthStore.getState();
    syncFromStorage();
  };

  window.addEventListener('storage', handleAuthStorageChange);
}

export default useAuthStore;