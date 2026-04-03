// @ts-nocheck
'use client';

/**
 * ConflictDialog — 冲突解决对话框
 *
 * E4-SyncProtocol: 三选项冲突解决（保留本地 / 使用服务端 / 合并）
 *
 * 遵守 AGENTS.md 规范:
 * - 无 any 类型泄漏
 * - 无 console.log
 * - WCAG 2.1 AA 合规 (aria-labels, keyboard nav, focus management)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import styles from './ConflictDialog.module.css';

// =============================================================================
// Types
// =============================================================================

/** 画布快照数据（服务端版本） */
export interface CanvasSnapshot {
  snapshotId: string;
  version: number;
  createdAt: string;
  data: {
    contexts?: unknown[];
    flows?: unknown[];
    components?: unknown[];
    [key: string]: unknown;
  };
}

/** 画布数据（本地版本） */
export interface CanvasData {
  contextNodes?: unknown[];
  flowNodes?: unknown[];
  componentNodes?: unknown[];
  [key: string]: unknown;
}

export interface ConflictDialogProps {
  /** 服务端快照数据 */
  serverSnapshot: CanvasSnapshot;
  /** 本地画布数据 */
  localData: CanvasData;
  /** 保留本地数据 */
  onKeepLocal: () => void;
  /** 使用服务端数据 */
  onUseServer: () => void;
  /** 合并双方数据 */
  onMerge: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

function countNodes(data: CanvasData): { contexts: number; flows: number; components: number } {
  return {
    contexts: data.contextNodes?.length ?? 0,
    flows: data.flowNodes?.length ?? 0,
    components: data.componentNodes?.length ?? 0,
  };
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

// =============================================================================
// Component
// =============================================================================

export function ConflictDialog({
  serverSnapshot,
  localData,
  onKeepLocal,
  onUseServer,
  onMerge,
}: ConflictDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const serverCounts = countNodes(serverSnapshot.data as CanvasData);
  const localCounts = countNodes(localData);

  // Focus first button on mount for keyboard accessibility
  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  // Trap focus within dialog
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button');
      if (!buttons || buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
        aria-describedby="conflict-dialog-desc"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 id="conflict-dialog-title" className={styles.title}>
            检测到数据冲突
          </h2>
          <p id="conflict-dialog-desc" className={styles.subtitle}>
            有其他设备或标签页修改了此项目，请选择如何解决冲突
          </p>
        </div>

        {/* Version Info */}
        <div className={styles.versionInfo} aria-label="版本信息">
          <div className={styles.versionBadge}>
            <span className={styles.versionLabel}>服务端版本</span>
            <span className={styles.versionNumber}>v{serverSnapshot.version}</span>
            <span className={styles.versionTime}>{formatDate(serverSnapshot.createdAt)}</span>
          </div>
          <div className={styles.versionDivider} aria-hidden="true">↔</div>
          <div className={styles.versionBadge}>
            <span className={styles.versionLabel}>本地版本</span>
            <span className={styles.versionNumber}>v{serverSnapshot.version + 1}</span>
            <span className={styles.versionTime}>刚才</span>
          </div>
        </div>

        {/* Comparison Table */}
        <div className={styles.comparison} aria-label="数据对比">
          <div className={styles.comparisonHeader}>
            <span aria-hidden="true" />
            <span className={styles.comparisonColTitle}>上下文</span>
            <span className={styles.comparisonColTitle}>流程</span>
            <span className={styles.comparisonColTitle}>组件</span>
          </div>
          <div className={styles.comparisonRow}>
            <span className={styles.comparisonRowLabel}>服务端</span>
            <span className={styles.comparisonCell} role="cell">{serverCounts.contexts}</span>
            <span className={styles.comparisonCell} role="cell">{serverCounts.flows}</span>
            <span className={styles.comparisonCell} role="cell">{serverCounts.components}</span>
          </div>
          <div className={styles.comparisonRow}>
            <span className={styles.comparisonRowLabel}>本地</span>
            <span className={styles.comparisonCell} role="cell">{localCounts.contexts}</span>
            <span className={styles.comparisonCell} role="cell">{localCounts.flows}</span>
            <span className={styles.comparisonCell} role="cell">{localCounts.components}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            ref={firstButtonRef}
            type="button"
            className={styles.buttonLocal}
            onClick={onKeepLocal}
            aria-label="保留本地数据，丢弃服务端更改"
          >
            <span className={styles.buttonIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={styles.buttonText}>
              <strong>保留本地</strong>
              <small>使用您当前的本地更改覆盖服务端</small>
            </span>
          </button>

          <button
            type="button"
            className={styles.buttonServer}
            onClick={onUseServer}
            aria-label="使用服务端数据，丢弃本地更改"
          >
            <span className={styles.buttonIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 15a4 4 0 004 4h10a4 4 0 000-8H7a4 4 0 00-4 4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 4v4M8 8l2 2M16 8l-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={styles.buttonText}>
              <strong>使用服务端</strong>
              <small>放弃本地更改，使用服务端最新版本</small>
            </span>
          </button>

          <button
            type="button"
            className={styles.buttonMerge}
            onClick={onMerge}
            aria-label="合并双方数据"
          >
            <span className={styles.buttonIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={styles.buttonText}>
              <strong>合并双方</strong>
              <small>智能合并，保留两边的修改</small>
            </span>
          </button>
        </div>

        {/* Help text */}
        <p className={styles.helpText}>
          如有疑问，请联系您的团队成员确认正确的版本
        </p>
      </div>
    </div>
  );
}

export default ConflictDialog;
