/**
 * FloatingMode - 悬浮模式组件
 *
 * Epic 8: 悬浮模式
 *
 * 功能:
 * - 滚动超过 50% 时底部面板收起
 * - 右侧 AI 面板固定定位
 * - 不遮挡核心内容 (R-1)
 * - 不引入新状态管理库 (R-2)
 *
 * ST-8.1: 滚动触发收起 (滚动超过 50%)
 * ST-8.2: 悬浮停止恢复 (停止滚动 1s 后面板恢复)
 */

'use client';

import React, { useEffect } from 'react';
import { useFloatingMode } from './hooks/useFloatingMode';
import styles from './FloatingMode.module.css';

export interface FloatingModeProps {
  /** 悬浮触发阈值 (0-1)，默认 0.5 */
  threshold?: number;
  /** 停止滚动后恢复延迟 (ms)，默认 1000 */
  resumeDelay?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 底部面板 ref */
  bottomPanelRef?: React.RefObject<HTMLElement | null>;
  /** 右侧 AI 面板 ref */
  rightPanelRef?: React.RefObject<HTMLElement | null>;
  /** 悬浮状态变化回调 */
  onFloatingChange?: (isFloating: boolean) => void;
  /** 子元素 */
  children?: React.ReactNode;
}

export const FloatingMode: React.FC<FloatingModeProps> = ({
  threshold = 0.5,
  resumeDelay = 1000,
  enabled = true,
  bottomPanelRef,
  rightPanelRef,
  onFloatingChange,
  children,
}) => {
  const { isFloating } = useFloatingMode({
    threshold,
    resumeDelay,
    enabled,
  });

  // Sync with external callback
  useEffect(() => {
    onFloatingChange?.(isFloating);
  }, [isFloating, onFloatingChange]);

  // Apply floating class to bottom panel when floating
  useEffect(() => {
    if (!bottomPanelRef?.current) return;
    const el = bottomPanelRef.current;
    if (isFloating) {
      el.classList.add(styles.collapsed);
    } else {
      el.classList.remove(styles.collapsed);
    }
  }, [isFloating, bottomPanelRef]);

  // Apply floating-right class to right panel when floating
  useEffect(() => {
    if (!rightPanelRef?.current) return;
    const el = rightPanelRef.current;
    if (isFloating) {
      el.classList.add(styles['floating-right']);
    } else {
      el.classList.remove(styles['floating-right']);
    }
  }, [isFloating, rightPanelRef]);

  return (
    <div
      className={[
        styles.floatingMode,
        isFloating ? styles.active : '',
      ].filter(Boolean).join(' ')}
      data-testid="floating-mode"
      data-floating={isFloating ? 'true' : 'false'}
    >
      {children}
    </div>
  );
};

export default FloatingMode;
