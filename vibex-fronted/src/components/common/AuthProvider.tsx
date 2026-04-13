/**
 * AuthProvider — S2.1: 全局 401 事件监听器
 *
 * 挂载在根 layout，统一监听 auth:401 事件。
 * 任何 API 响应 401 时，handleResponseError 会：
 * 1. dispatchEvent(new CustomEvent('auth:401', { detail: { returnTo } }))
 * 2. window.location.href = '/auth?returnTo=...'
 *
 * AuthProvider 负责在 redirect 发生前清除 token 状态，
 * 并可选地通知子组件（如 UserMenu 显示"请重新登录"）。
 *
 * 使用方式:
 *   <AuthProvider>
 *     {children}
 *   </AuthProvider>
 */
'use client';

import React, { useEffect } from 'react';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Listen for auth:401 events from any part of the app
  useEffect(() => {
    const handleAuth401 = (e: Event) => {
      const customEvent = e as CustomEvent<{ returnTo?: string }>;
      const returnTo = customEvent.detail?.returnTo;

      // Clear session store token state
      useSessionStore.getState().logout?.();

      // Redirect is handled by handleResponseError directly
      // This listener just ensures session store is cleared
      console.info('[AuthProvider] auth:401 received, session cleared', { returnTo });
    };

    window.addEventListener('auth:401', handleAuth401);
    return () => window.removeEventListener('auth:401', handleAuth401);
  }, []);

  return <>{children}</>;
}
