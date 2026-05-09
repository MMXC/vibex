/**
 * IntentionBubble — E3-U2: 协作者意图气泡
 *
 * 在 RemoteCursor 上方显示当前用户正在执行的操作类型。
 * - 停留 > 500ms → 显示气泡（动画 200ms ease-out）
 * - 状态变为 idle 或 3s 无操作 → 淡出消失
 * - 气泡已消失后移动 → 重新计时 500ms 后显示
 *
 * 意图类型映射:
 * | 操作          | 文案      |
 * |--------------|----------|
 * | hover node   | 正在编辑  |
 * | hover empty  | 正在选择  |
 * | drag node    | 正在拖拽  |
 * | idle > 3s    | 消失      |
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './IntentionBubble.module.css';

export type { IntentionType } from '@/lib/firebase/presence';

export interface IntentionBubbleProps {
  intention: 'edit' | 'select' | 'drag' | 'idle';
  /** 显示延迟（ms），默认 500ms */
  showDelay?: number;
  /** 消失延迟（idle 后 ms），默认 3000ms */
  hideDelay?: number;
}

const INTENTION_LABELS: Record<string, string> = {
  edit: '正在编辑',
  select: '正在选择',
  drag: '正在拖拽',
  idle: '',
};

const DISPLAY_DELAY = 500;
const HIDE_DELAY = 3000;

export function IntentionBubble({
  intention,
  showDelay = DISPLAY_DELAY,
  hideDelay = HIDE_DELAY,
}: IntentionBubbleProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // idle → 立即隐藏
    if (intention === 'idle') {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // 清除现有定时器
    if (timerRef.current) clearTimeout(timerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    // 延迟显示
    timerRef.current = setTimeout(() => {
      setVisible(true);
      // 3s 后自动隐藏（重新计时）
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, hideDelay);
    }, showDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [intention, showDelay, hideDelay]);

  const label = INTENTION_LABELS[intention] ?? intention;
  if (!label || intention === 'idle') return null;

  return (
    <div
      data-testid="intention-bubble"
      className={`${styles.bubble} ${visible ? styles.visible : styles.hidden}`}
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}