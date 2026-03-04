/**
 * StepGuard Component - 确认流程步骤守卫
 * 
 * 用于保护确认流程的各个步骤，确保用户按照正确顺序访问
 * 
 * Usage:
 * <StepGuard step="context" fallback={<Loading />}>
 *   <ContextPage />
 * </StepGuard>
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirmationState, ConfirmationStepKey } from '@/hooks/useConfirmationState';

interface StepGuardProps {
  /** 要保护的步骤 */
  step: ConfirmationStepKey;
  /** 验证通过时显示的内容 */
  children: React.ReactNode;
  /** 验证失败时显示的内容 */
  fallback?: React.ReactNode;
  /** 是否在挂载时立即重定向（避免闪烁） */
  immediateRedirect?: boolean;
}

/**
 * 步骤守卫组件
 * 检查前置数据是否存在，不存在则重定向
 */
export function StepGuard({
  step,
  children,
  fallback = null,
  immediateRedirect = true,
}: StepGuardProps) {
  const router = useRouter();
  const { isValid, redirectTo, message } = useConfirmationState(step);
  const [isReady, setIsReady] = useState(!immediateRedirect);
  
  // 客户端挂载后开始验证
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  // 验证状态并处理重定向
  useEffect(() => {
    if (isReady && !isValid) {
      // 显示错误消息后短暂重定向
      const timer = setTimeout(() => {
        router.push(redirectTo);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isReady, isValid, redirectTo, router]);
  
  // 验证通过，显示内容
  if (isValid) {
    return <>{children}</>;
  }
  
  // 使用自定义 fallback
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // 默认加载状态
  return (
    <DefaultFallback 
      message={message || '正在验证...'} 
      isRedirecting={isReady && !isValid} 
    />
  );
}

/**
 * 默认的加载/重定向提示
 */
function DefaultFallback({ message, isRedirecting }: { message: string; isRedirecting: boolean }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>
        {message}
      </p>
      {isRedirecting && (
        <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          即将跳转到正确步骤...
        </p>
      )}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * 验证提示组件 - 显示在页面顶部
 * 
 * Usage:
 * <StepGuardAlert step="model" />
 */
interface StepGuardAlertProps {
  step: ConfirmationStepKey;
  /** 自定义样式类 */
  className?: string;
}

export function StepGuardAlert({ step, className }: StepGuardAlertProps) {
  const { isValid, message } = useConfirmationState(step);
  
  if (isValid) return null;
  
  return (
    <div 
      className={className}
      style={{
        padding: '12px 16px',
        background: 'rgba(255, 170, 0, 0.1)',
        border: '1px solid rgba(255, 170, 0, 0.3)',
        borderRadius: '8px',
        color: 'var(--color-warning)',
        fontSize: '14px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span>⚠️</span>
      <span>{message || '请先完成上一步骤'}</span>
    </div>
  );
}

export default StepGuard;
