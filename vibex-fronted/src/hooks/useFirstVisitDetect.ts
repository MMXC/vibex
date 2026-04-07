/**
 * useFirstVisitDetect Hook
 * 
 * 首次访问检测 - 检测用户是否为首次访问，支持过期时间设置
 * 
 * 功能:
 * - F1.1: 首次访问自动触发
 * - F1.2: localStorage 记录访问状态
 * - F1.3: 过期后可重新触发
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

export interface FirstVisitOptions {
  /** 过期时间（毫秒），默认 7 天 */
  expirationMs?: number;
  /** 存储键名 */
  storageKey?: string;
  /** 是否自动触发 */
  autoTrigger?: boolean;
}

export interface FirstVisitState {
  /** 是否为首次访问 */
  isFirstVisit: boolean;
  /** 是否已过期（可重新触发） */
  isExpired: boolean;
  /** 上次访问时间戳 */
  lastVisitedAt: number | null;
  /** 距过期还有多久（毫秒） */
  expiresInMs: number | null;
}

const DEFAULT_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 天
const DEFAULT_STORAGE_KEY = 'vibex-first-visit';

/**
 * 首次访问检测 Hook
 * 
 * @param options 配置选项
 * @returns 首次访问状态和操作方法
 */
export function useFirstVisitDetect(options: FirstVisitOptions = {}) {
  const {
    expirationMs = DEFAULT_EXPIRATION,
    storageKey = DEFAULT_STORAGE_KEY,
    autoTrigger = true,
  } = options;

  const [state, setState] = useState<FirstVisitState>({
    isFirstVisit: true,
    isExpired: false,
    lastVisitedAt: null,
    expiresInMs: null,
  });

  const [isReady, setIsReady] = useState(false);

  // 检查是否过期
  const checkExpiration = useCallback(() => {
    if (typeof window === 'undefined') return { isExpired: false, expiresInMs: null };
    
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return { isExpired: true, expiresInMs: null, lastVisitedAt: null };
    }

    try {
      const data = JSON.parse(stored);
      const now = Date.now();
      const lastVisited = data.timestamp || 0;
      const expiresAt = lastVisited + expirationMs;
      const isExpired = now >= expiresAt;
      const expiresInMs = isExpired ? null : expiresAt - now;

      return {
        isExpired,
        expiresInMs,
        lastVisitedAt: lastVisited,
      };
    } catch {
      return { isExpired: true, expiresInMs: null, lastVisitedAt: null };
    }
  }, [storageKey, expirationMs]);

  // 初始化检测
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsReady(true);
      return;
    }

    const { isExpired, expiresInMs, lastVisitedAt } = checkExpiration();
    
    setState({
      isFirstVisit: !lastVisitedAt || isExpired,
      isExpired,
      lastVisitedAt,
      expiresInMs,
    });
    
    setIsReady(true);
  }, [checkExpiration]);

  // 记录访问
  const recordVisit = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    localStorage.setItem(storageKey, JSON.stringify({
      timestamp: now,
      expiresIn: expirationMs,
    }));
    
    setState(prev => ({
      ...prev,
      isFirstVisit: false,
      lastVisitedAt: now,
      isExpired: false,
      expiresInMs: expirationMs,
    }));
  }, [storageKey, expirationMs]);

  // 重置首次访问状态（允许重新触发）
  const resetFirstVisit = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // 清除存储的状态
    localStorage.removeItem(storageKey);
    
    setState({
      isFirstVisit: true,
      isExpired: true,
      lastVisitedAt: null,
      expiresInMs: null,
    });
  }, [storageKey]);

  // 手动触发引导
  const triggerOnboarding = useCallback(() => {
    recordVisit();
    return true;
  }, [recordVisit]);

  return {
    ...state,
    isReady,
    recordVisit,
    resetFirstVisit,
    triggerOnboarding,
  };
}

export default useFirstVisitDetect;
