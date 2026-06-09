'use client';

/**
 * ConflictConfirmToast — S83-E3: 协作者冲突确认反馈
 *
 * 显示在冲突自动解决后的确认 Toast，3秒自动消失。
 * 用户可点击 Toast 查看详细变更。
 *
 * 使用方式：
 * - 传入 strategy (auto-merge | keep-mine | keep-theirs) 和一个可选的 details 回调
 * - visible=true 时显示，点击 Toast 调用 onDetails()
 * - 3秒后自动消失（autoClose=true）
 */

import React, { useEffect, useRef } from 'react';

export type AutoResolveStrategy = 'auto-merge' | 'keep-mine' | 'keep-theirs';

const STRATEGY_LABELS: Record<AutoResolveStrategy, string> = {
  'auto-merge': '自动合并',
  'keep-mine': '保留我的版本',
  'keep-theirs': '保留对方版本',
};

const STRATEGY_ICONS: Record<AutoResolveStrategy, string> = {
  'auto-merge': '🔀',
  'keep-mine': '✅',
  'keep-theirs': '✅',
};

export interface ConflictConfirmToastProps {
  /** 控制 Toast 是否显示 */
  visible: boolean;
  /** 使用的解决策略 */
  strategy: AutoResolveStrategy | null;
  /** 收到点击时的回调（查看详情） */
  onDetails?: () => void;
  /** Toast 隐藏时的回调 */
  onDismiss?: () => void;
  /** 自动消失时间（ms），默认 3000 */
  autoCloseMs?: number;
}

export function ConflictConfirmToast({
  visible,
  strategy,
  onDetails,
  onDismiss,
  autoCloseMs = 3000,
}: ConflictConfirmToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    // Auto-close after autoCloseMs
    timerRef.current = setTimeout(() => {
      onDismiss?.();
    }, autoCloseMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, autoCloseMs, onDismiss]);

  if (!visible || !strategy) return null;

  const label = STRATEGY_LABELS[strategy];
  const icon = STRATEGY_ICONS[strategy];

  return (
    <div className="conflict-confirm-toast-container" role="status" aria-live="polite">
      <div
        className="conflict-confirm-toast"
        onClick={onDetails}
        title="点击查看详细变更"
        data-testid="conflict-confirm-toast"
        data-strategy={strategy}
      >
        <span className="toast-icon" aria-hidden="true">{icon}</span>
        <div className="toast-content">
          <span className="toast-title">冲突已自动解决</span>
          <span className="toast-strategy" data-testid="toast-strategy-label">
            策略：{label}
          </span>
        </div>
        <span className="toast-hint" aria-hidden="true">点击查看详情 ×</span>
      </div>

      <style>{`
        .conflict-confirm-toast-container {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 9998;
          max-width: 360px;
          width: calc(100vw - 32px);
        }

        .conflict-confirm-toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          background: #fff;
          border-left: 4px solid #4caf50;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          animation: slideInRight 0.3s ease-out;
          cursor: pointer;
          transition: box-shadow 0.15s;
        }

        .conflict-confirm-toast:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .toast-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .toast-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .toast-title {
          font-size: 14px;
          font-weight: 600;
          color: #111;
          line-height: 1.4;
        }

        .toast-strategy {
          font-size: 13px;
          color: #555;
          line-height: 1.4;
        }

        .toast-hint {
          font-size: 12px;
          color: #aaa;
          flex-shrink: 0;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .conflict-confirm-toast {
            background: #2a2a3a;
            border-left-color: #66bb6a;
          }
          .toast-title {
            color: #e0e0e0;
          }
          .toast-strategy {
            color: #aaa;
          }
        }
      `}</style>
    </div>
  );
}
