/**
 * AuthToast - 未登录用户友好提示组件
 *
 * F-2.1: 当未登录用户尝试使用需要登录的功能时，显示友好的提示
 *
 * 使用方式:
 * ```tsx
 * <AuthToast
 *   message="请先登录后再使用此功能"
 *   action={{ label: "登录", onClick: () => setIsLoginDrawerOpen(true) }}
 * />
 * ```
 *
 * 或使用 useAuthToast hook:
 * ```tsx
 * const { showAuthToast } = useAuthToast();
 * showAuthToast('请先登录');
 * ```
 */
// @ts-nocheck


'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { Toast } from '@/components/ui/Toast';

interface AuthToastAction {
  label: string;
  onClick: () => void;
}

interface AuthToastConfig {
  message?: string;
  action?: AuthToastAction;
  /** 默认持续时间（毫秒），0 表示不自动关闭 */
  duration?: number;
}

interface AuthToastContextValue {
  /** 显示登录提示 toast */
  showAuthToast: (config?: AuthToastConfig) => void;
}

const AuthToastContext = createContext<AuthToastContextValue | null>(null);

export function useAuthToast() {
  const context = useContext(AuthToastContext);
  if (!context) {
    throw new Error('useAuthToast must be used within AuthToastProvider');
  }
  return context;
}

export function AuthToastProvider({ children }: { children: React.ReactNode }) {
  // 使用独立的 Toast 渲染状态
  const [toastState, setToastState] = React.useState<{
    visible: boolean;
    message: string;
    action?: AuthToastAction;
    duration: number;
  }>({
    visible: false,
    message: '请先登录后再使用此功能',
    action: undefined,
    duration: 5000,
  });

  const showAuthToast = useCallback((config: AuthToastConfig = {}) => {
    setToastState({
      visible: true,
      message: config.message || '请先登录后再使用此功能',
      action: config.action,
      duration: config.duration ?? 5000,
    });
  }, []);

  const handleClose = useCallback(() => {
    setToastState(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <AuthToastContext.Provider value={{ showAuthToast }}>
      {children}
      {toastState.visible && (
        <Toast
          message={toastState.message}
          type="warning"
          onClose={handleClose}
          autoClose={toastState.duration > 0}
          duration={toastState.duration}
        />
      )}
    </AuthToastContext.Provider>
  );
}

/**
 * AuthToast - 独立组件形式
 * 用于需要单独控制显示/隐藏的场景
 */
export interface AuthToastProps {
  message?: string;
  onLoginClick?: () => void;
  onClose?: () => void;
  visible?: boolean;
  duration?: number;
}

export function AuthToast({
  message = '请先登录后再使用此功能',
  onLoginClick,
  onClose,
  visible = true,
  duration = 5000,
}: AuthToastProps) {
  if (!visible) return null;

  const displayMessage = onLoginClick
    ? `${message} 点击登录按钮前往登录。`
    : message;

  return (
    <Toast
      message={displayMessage}
      type="warning"
      onClose={onClose}
      autoClose={duration > 0}
      duration={duration}
    />
  );
}

export default AuthToast;
