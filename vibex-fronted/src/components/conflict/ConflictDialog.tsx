/**
 * ConflictDialog.tsx — Sprint53 E2 (Sprint58 E5 扩展)
 *
 * 三选项 + 手动合并冲突对话框（Sprint58 E5 扩展）：
 * - Discard Local: 丢弃本地修改，采用远程版本
 * - Merge: 保留两者（追加到未来栈，支持后续 redo）
 * - Discard Remote: 丢弃远程修改，保留本地版本
 * - Manual Merge (E5): 手动编辑 JSON 后合并
 *
 * 由 canvasHistoryStore.triggerConflictToast() 调用触发
 * E5: 由 wsConflictHandler 写入 conflictStore，ConflictDialog 读取 store 状态
 */

'use client';

import React, { useCallback, useState, useMemo } from 'react';
import styles from './ConflictDialog.module.css';

// ============================================================================
// Types
// ============================================================================

// E5: extended to include 'manual'
export type ConflictResolution = 'discard-local' | 'merge' | 'discard-remote' | 'manual';

export interface ConflictDialogProps {
  /** 对话框打开状态 */
  isOpen: boolean;
  /** 画布 ID */
  canvasId: string;
  /** 本地 revision 版本号 */
  localRevision: number;
  /** 远程 revision 版本号 */
  remoteRevision: number;
  /** 本地数据（用于手动合并编辑器） */
  localData?: unknown;
  /** 远程数据（用于手动合并编辑器 diff 展示） */
  remoteData?: unknown;
  /** 用户选择解决方式后的回调 */
  onResolve: (resolution: ConflictResolution, manualContent?: string) => void;
  /** 关闭对话框（不解决冲突） */
  onClose: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatJSON(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function simpleDiff(localData: unknown, remoteData: unknown): { localOnly: string[]; remoteOnly: string[] } {
  const localKeys = Object.keys(localData as object || {});
  const remoteKeys = Object.keys(remoteData as object || {});
  const localSet = new Set(localKeys);
  const remoteSet = new Set(remoteKeys);

  return {
    localOnly: localKeys.filter(k => !remoteSet.has(k)),
    remoteOnly: remoteKeys.filter(k => !localSet.has(k)),
  };
}

// ============================================================================
// Component
// ============================================================================

export function ConflictDialog({
  isOpen,
  canvasId,
  localRevision,
  remoteRevision,
  localData,
  remoteData,
  onResolve,
  onClose,
}: ConflictDialogProps) {
  const [selected, setSelected] = useState<ConflictResolution | null>(null);
  const [manualContent, setManualContent] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);

  // Initialize manual editor with local data when entering manual mode
  const handleEnterManual = useCallback(() => {
    setSelected('manual');
    setIsManualMode(true);
    // Pre-populate with formatted local data
    if (localData !== undefined) {
      setManualContent(formatJSON(localData));
    } else {
      setManualContent('{\\n  \\n}');
    }
  }, [localData]);

  const handleManualSubmit = useCallback(() => {
    setSelected('manual');
    onResolve('manual', manualContent);
  }, [manualContent, onResolve]);

  const handleResolve = useCallback(
    (resolution: Exclude<ConflictResolution, 'manual'>) => {
      setSelected(resolution);
      onResolve(resolution);
    },
    [onResolve]
  );

  const handleBack = useCallback(() => {
    setIsManualMode(false);
    setSelected(null);
  }, []);

  // Compute diff summary when showing diff view
  const diffSummary = useMemo(() => {
    if (!isManualMode || localData === undefined || remoteData === undefined) return null;
    return simpleDiff(localData, remoteData);
  }, [isManualMode, localData, remoteData]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      data-testid="conflict-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Undo/Redo 协作冲突"
    >
      <div className={styles.dialog} data-testid="conflict-dialog">
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title} data-testid="dialog-title">
            {isManualMode ? '✏️ 手动合并冲突' : '⚠️ 协作冲突检测到'}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={isManualMode ? handleBack : onClose}
            data-testid="dialog-close"
            aria-label={isManualMode ? '返回' : '关闭'}
          >
            {isManualMode ? '← 返回' : '✕'}
          </button>
        </div>

        {isManualMode ? (
          <>
            {/* Manual Merge Mode */}
            <div className={styles.conflictInfo} data-testid="conflict-info">
              <p className={styles.explanation}>
                请直接编辑下方的 JSON 内容以解决冲突。左侧为本地版本，右侧为远程版本的关键差异。
              </p>
              {diffSummary && (
                <div className={styles.diffSummary} data-testid="diff-summary">
                  {diffSummary.localOnly.length > 0 && (
                    <div className={styles.diffSection}>
                      <span className={styles.diffLabel}>仅本地:</span>
                      {diffSummary.localOnly.map(k => (
                        <code key={k} className={styles.diffKey}>[{k}]</code>
                      ))}
                    </div>
                  )}
                  {diffSummary.remoteOnly.length > 0 && (
                    <div className={styles.diffSection}>
                      <span className={styles.diffLabel}>仅远程:</span>
                      {diffSummary.remoteOnly.map(k => (
                        <code key={k} className={styles.diffKey}>[{k}]</code>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* JSON Editor */}
            <div className={styles.manualEditor} data-testid="manual-editor">
              <div className={styles.editorHeader}>
                <span>JSON 编辑器</span>
                <span className={styles.editorHint}>请确保 JSON 格式正确</span>
              </div>
              <textarea
                className={styles.editorTextarea}
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                data-testid="manual-merge-textarea"
                spellCheck={false}
                rows={16}
              />
            </div>

            {/* Manual merge submit */}
            <div className={styles.manualActions} data-testid="manual-actions">
              <button
                type="button"
                className={`${styles.actionBtn} ${styles['actionBtn--manual-submit']}`}
                onClick={handleManualSubmit}
                data-testid="btn-manual-submit"
              >
                <span className={styles.btnIcon}>✓</span>
                <span className={styles.btnTitle}>确认合并</span>
                <span className={styles.btnDesc}>提交手动编辑的内容</span>
              </button>
            </div>

            {/* Selected indicator */}
            {selected === 'manual' && (
              <div className={styles.selectedIndicator} data-testid="selected-action">
                手动合并编辑器已打开
              </div>
            )}
          </>
        ) : (
          <>
            {/* Conflict info */}
            <div className={styles.conflictInfo} data-testid="conflict-info">
              <div className={styles.versionRow}>
                <span className={styles.versionBadge}>
                  <span className={styles.versionLabel}>本地版本</span>
                  <span className={styles.versionNum} data-testid="local-revision">
                    {localRevision}
                  </span>
                </span>
                <span className={styles.vs}>vs</span>
                <span className={styles.versionBadge}>
                  <span className={styles.versionLabel}>远程版本</span>
                  <span className={styles.versionNum} data-testid="remote-revision">
                    {remoteRevision}
                  </span>
                </span>
              </div>
              <p className={styles.explanation}>
                另一用户在您编辑期间修改了画布。请选择如何解决冲突：
              </p>
            </div>

            {/* Action buttons */}
            <div className={styles.actions} data-testid="dialog-actions">
              <button
                type="button"
                className={`${styles.actionBtn} ${styles['actionBtn--discard-local']}`}
                onClick={() => handleResolve('discard-local')}
                data-testid="btn-discard-local"
              >
                <span className={styles.btnIcon}>🔄</span>
                <span className={styles.btnTitle}>Discard Local</span>
                <span className={styles.btnDesc}>放弃本地修改，采用远程版本</span>
              </button>

              <button
                type="button"
                className={`${styles.actionBtn} ${styles['actionBtn--merge']}`}
                onClick={() => handleResolve('merge')}
                data-testid="btn-merge"
              >
                <span className={styles.btnIcon}>⇄</span>
                <span className={styles.btnTitle}>Merge</span>
                <span className={styles.btnDesc}>保留两者，远程追加到 redo 栈</span>
              </button>

              <button
                type="button"
                className={`${styles.actionBtn} ${styles['actionBtn--discard-remote']}`}
                onClick={() => handleResolve('discard-remote')}
                data-testid="btn-discard-remote"
              >
                <span className={styles.btnIcon}>💾</span>
                <span className={styles.btnTitle}>Discard Remote</span>
                <span className={styles.btnDesc}>丢弃远程修改，保留本地版本</span>
              </button>

              {/* E5: Manual merge button */}
              <button
                type="button"
                className={`${styles.actionBtn} ${styles['actionBtn--manual']}`}
                onClick={handleEnterManual}
                data-testid="btn-manual"
              >
                <span className={styles.btnIcon}>✏️</span>
                <span className={styles.btnTitle}>Manual Merge</span>
                <span className={styles.btnDesc}>手动编辑 JSON 后合并</span>
              </button>
            </div>

            {/* Selected indicator */}
            {selected && (
              <div className={styles.selectedIndicator} data-testid="selected-action">
                已选择: {selected === 'discard-local' ? 'Discard Local（采用远程）' : selected === 'discard-remote' ? 'Discard Remote（保留本地）' : selected === 'merge' ? 'Merge（合并两者）' : 'Manual Merge（手动合并）'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
