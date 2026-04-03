/**
 * QuickAskButtons - AI 快捷询问按钮组
 * 功能: 5 个预设问题，点击发送
 * 规格: 横向滚动，80px 高度区域
 */
// @ts-nocheck

import React, { useCallback } from 'react';
import styles from './QuickAskButtons.module.css';

export interface QuickAskButtonsProps {
  /** 发送回调 */
  onQuickAsk?: (question: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

// 5 个预设快捷问题
export const QUICK_ASK_QUESTIONS = [
  '这个领域模型合理吗？',
  '可以简化这个流程吗？',
  '有哪些潜在风险？',
  '如何优化性能？',
  '有什么改进建议？',
] as const;

export function QuickAskButtons({ onQuickAsk, disabled = false }: QuickAskButtonsProps) {
  const handleClick = useCallback(
    (question: string) => {
      if (!disabled) {
        onQuickAsk?.(question);
      }
    },
    [disabled, onQuickAsk]
  );

  return (
    <div
      className={styles.container}
      data-testid="quick-ask-buttons"
      role="group"
      aria-label="AI 快捷询问"
    >
      <span className={styles.label}>快捷:</span>
      <div className={styles.buttons}>
        {QUICK_ASK_QUESTIONS.map((question) => (
          <button
            key={question}
            className={styles.btn}
            onClick={() => handleClick(question)}
            disabled={disabled}
            type="button"
            title={question}
            aria-label={`快捷询问: ${question}`}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickAskButtons;
