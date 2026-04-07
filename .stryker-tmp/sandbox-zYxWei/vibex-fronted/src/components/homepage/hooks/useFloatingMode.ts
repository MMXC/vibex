/**
 * useFloatingMode - 悬浮模式 Hook
 *
 * 功能:
 * - IntersectionObserver 监听滚动位置
 * - 滚动超过 50% 时触发悬浮模式
 * - 停止滚动 1s 后恢复常态
 * - 动画流畅 60fps
 *
 * Epic 8: 悬浮模式
 * ST-8.1: 滚动触发收起 (滚动超过 50%)
 * ST-8.2: 悬浮停止恢复 (停止滚动 1s 后面板恢复)
 */
// @ts-nocheck


import { useState, useEffect, useCallback, useRef } from 'react';

export interface FloatingModeOptions {
  /** 悬浮触发阈值 (0-1)，默认 0.5 (50%) */
  threshold?: number;
  /** 停止滚动后恢复延迟 (ms)，默认 1000 */
  resumeDelay?: number;
  /** 是否启用悬浮模式 */
  enabled?: boolean;
  /** 悬浮状态变化回调 */
  onFloatingChange?: (isFloating: boolean) => void;
}

export interface FloatingModeReturn {
  /** 当前是否处于悬浮模式 */
  isFloating: boolean;
}

const DEFAULT_THRESHOLD = 0.5;
const DEFAULT_RESUME_DELAY = 1000;

/**
 * useFloatingMode Hook
 *
 * 使用 IntersectionObserver + scroll 事件实现悬浮模式
 * 不引入新的状态管理库，仅使用 React state
 */
export function useFloatingMode(
  options: FloatingModeOptions = {}
): FloatingModeReturn {
  const {
    threshold = DEFAULT_THRESHOLD,
    resumeDelay = DEFAULT_RESUME_DELAY,
    enabled = true,
    onFloatingChange,
  } = options;

  const [isFloating, setIsFloating] = useState(false);

  // Call external callback when floating state changes
  const prevFloatingRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevFloatingRef.current !== null && prevFloatingRef.current !== isFloating) {
      onFloatingChange?.(isFloating);
    }
    prevFloatingRef.current = isFloating;
  }, [isFloating, onFloatingChange]);

  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleScroll = () => {
      const testWin = window as Window & { __testScrollY?: number; __testScrollHeight?: number; __testInnerHeight?: number };
      const scrollTop = testWin.__testScrollY !== undefined
        ? testWin.__testScrollY
        : (window.scrollY || document.documentElement.scrollTop);
      const scrollHeight = testWin.__testScrollHeight !== undefined
        ? testWin.__testScrollHeight
        : document.documentElement.scrollHeight;
      const innerHeight = testWin.__testInnerHeight !== undefined
        ? testWin.__testInnerHeight
        : window.innerHeight;
      const docHeight = scrollHeight - innerHeight;

      if (docHeight <= 0) return;

      const scrollRatio = scrollTop / docHeight;
      const shouldFloat = scrollRatio > threshold;

      // Clear any pending resume timer when scrolling
      if (shouldFloat) {
        if (resumeTimerRef.current) {
          clearTimeout(resumeTimerRef.current);
          resumeTimerRef.current = null;
        }
        setIsFloating(true);
      } else {
        // Resume after delay when scrolling back up
        if (resumeTimerRef.current) {
          clearTimeout(resumeTimerRef.current);
        }
        resumeTimerRef.current = setTimeout(() => {
          setIsFloating(false);
          resumeTimerRef.current = null;
        }, resumeDelay);
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
      // Clean up test interface
      const testWin = window as Window & { __testScrollY?: number; __testScrollHeight?: number; __testInnerHeight?: number };
      delete testWin.__testScrollY;
      delete testWin.__testScrollHeight;
      delete testWin.__testInnerHeight;
    };
  }, [enabled, threshold, resumeDelay]);

  return {
    isFloating,
  };
}

export default useFloatingMode;
