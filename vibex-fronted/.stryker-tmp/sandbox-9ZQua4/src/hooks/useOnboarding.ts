/**
 * useOnboarding Hook
 * 
 * 引导触发逻辑 - 负责自动触发引导、处理路由集成
 * 集成首次访问检测 (F1.1, F1.2, F1.3)
 */
// @ts-nocheck


'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboarding/onboardingStore';
import { useFirstVisitDetect } from './useFirstVisitDetect';

const AUTO_TRIGGER_DELAY = 1500; // 1.5秒延迟触发

// 需要触发引导的路由白名单
const ONBOARDING_ROUTES = [
  '/',
  '/dashboard',
  '/chat',
];

// 需要排除的路由（已登录用户可能已熟悉）
const EXCLUDED_ROUTES = [
  '/project/',
  '/design/',
  '/editor/',
  '/confirm/',
];

/**
 * 引导触发 Hook
 * 
 * 功能:
 * - F1.1: 首次访问自动触发
 * - F1.2: localStorage 记录访问状态 (通过 useFirstVisitDetect)
 * - F1.3: 过期后可重新触发 (通过 useFirstVisitDetect)
 */
export function useOnboarding() {
  const pathname = usePathname();
  const { status, start } = useOnboardingStore();
  const hasAutoTriggered = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 首次访问检测
  const { 
    isFirstVisit, 
    isExpired, 
    recordVisit,
    isReady: isFirstVisitReady 
  } = useFirstVisitDetect({
    expirationMs: 7 * 24 * 60 * 60 * 1000, // 7 天过期
    storageKey: 'vibex-first-visit',
    autoTrigger: true,
  });

  // 检查是否应该触发引导
  const shouldTriggerOnboarding = useCallback(() => {
    // 只对未开始的用户触发
    if (status !== 'not-started') {
      return false;
    }

    // F1.1: 首次访问自动触发 - 只有首次访问或过期后才自动触发
    // 如果不是首次访问且未过期，则不自动触发
    if (!isFirstVisit && !isExpired) {
      return false;
    }

    // 检查是否在白名单路由
    const isInWhitelist = ONBOARDING_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route)
    );

    // 检查是否在排除路由
    const isExcluded = EXCLUDED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    return isInWhitelist && !isExcluded;
  }, [status, pathname, isFirstVisit, isExpired]);

  // 清理定时器
  const clearTriggerTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 触发引导
  const triggerOnboarding = useCallback(() => {
    if (hasAutoTriggered.current) {
      return;
    }

    if (shouldTriggerOnboarding()) {
      hasAutoTriggered.current = true;
      clearTriggerTimer();
      
      // 延迟1.5秒触发，避免干扰用户
      timerRef.current = setTimeout(() => {
        // 再次检查状态，确保用户仍未开始引导
        const currentStatus = useOnboardingStore.getState().status;
        if (currentStatus === 'not-started') {
          // F1.2: 记录访问状态
          recordVisit();
          // 启动引导
          start();
        }
      }, AUTO_TRIGGER_DELAY);
    }
  }, [shouldTriggerOnboarding, start, clearTriggerTimer, recordVisit]);

  // 路由变化时重新检查
  useEffect(() => {
    // 等待首次访问检测 ready
    if (!isFirstVisitReady) return;
    
    // 每次路由变化时重置触发标记，允许在新页面再次触发
    hasAutoTriggered.current = false;
    
    triggerOnboarding();

    // 组件卸载时清理定时器
    return () => {
      clearTriggerTimer();
    };
  }, [pathname, triggerOnboarding, clearTriggerTimer, isFirstVisitReady]);

  // 手动触发引导（用于设置页手动开始）- F1.3: 过期后可重新触发
  const manuallyStartOnboarding = useCallback(() => {
    hasAutoTriggered.current = true;
    clearTriggerTimer();
    // 手动触发时也记录访问状态
    recordVisit();
    start();
  }, [start, clearTriggerTimer, recordVisit]);

  return {
    // 状态
    status,
    // 首次访问状态（供 UI 使用）
    isFirstVisit,
    isExpired,
    // 手动触发
    manuallyStartOnboarding,
  };
}

export default useOnboarding;
