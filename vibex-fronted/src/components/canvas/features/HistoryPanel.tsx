'use client';

/**
 * HistoryPanel — Undo/Redo History Sidebar
 * P004-E4: History Panel for selective undo/redo
 *
 * Displays a list of command snapshots from canvasHistoryStore.
 * Clicking a snapshot rolls back to that point in history.
 *
 *遵守约束:
 * - 无 any 类型
 * - 无 canvasLogger.default.debug
 */

import React, { useCallback } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import styles from './HistoryPanel.module.css';

interface HistoryPanelProps {
  /** Whether the panel is visible */
  open: boolean;
  /** Close callback */
  onClose: () => void;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDescription(desc: string | undefined, index: number): string {
  if (desc) return desc;
  return `操作 ${index + 1}`;
}

export function HistoryPanel({ open, onClose }: HistoryPanelProps) {
  const past = useCanvasHistoryStore((s) => s.past);
  const future = useCanvasHistoryStore((s) => s.future);
  const selectiveUndo = useCanvasHistoryStore((s) => s.selectiveUndo);
  const canUndo = useCanvasHistoryStore((s) => s.canUndo);
  const canRedo = useCanvasHistoryStore((s) => s.canRedo);
  const redo = useCanvasHistoryStore((s) => s.redo);

  const total = past.length + future.length;
  const currentIndex = past.length - 1; // 0-indexed position of current state

  const handleSelect = useCallback(
    (targetIndex: number) => {
      if (targetIndex === currentIndex) {
        // Already at this position, just close
        onClose();
        return;
      }
      if (targetIndex < past.length) {
        // Roll back to targetIndex in past
        selectiveUndo(targetIndex);
      } else {
        // Need to redo forward
        const redoCount = targetIndex - (past.length - 1);
        for (let i = 0; i < redoCount; i++) {
          redo();
        }
      }
      onClose();
    },
    [currentIndex, past.length, selectiveUndo, redo, onClose]
  );

  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <aside className={styles.panel} role="dialog" aria-label="历史记录面板">
        <header className={styles.header}>
          <h2 className={styles.title}>历史记录</h2>
          <div className={styles.position}>
            {canUndo() || canRedo()
              ? `步骤 ${past.length + 1} / ${total > 0 ? total : 1}`
              : '无历史记录'}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>

        <div className={styles.body}>
          {past.length === 0 && future.length === 0 ? (
            <div className={styles.empty}>暂无历史记录</div>
          ) : (
            <ol className={styles.list} aria-label="历史记录列表">
              {/* Past commands — undoable */}
              {past.map((cmd, i) => (
                <li key={cmd.id} className={styles.item}>
                  <button
                    className={styles.itemBtn}
                    onClick={() => handleSelect(i)}
                    aria-label={`回退到: ${formatDescription(cmd.description, i)}`}
                    disabled={i === currentIndex}
                  >
                    <span className={styles.timestamp}>{formatTimestamp(cmd.timestamp)}</span>
                    <span className={styles.desc}>{formatDescription(cmd.description, i)}</span>
                    {i === currentIndex && <span className={styles.currentBadge}>当前</span>}
                  </button>
                </li>
              ))}

              {/* Divider */}
              {past.length > 0 && future.length > 0 && (
                <li className={styles.dividerItem}>
                  <span className={styles.dividerLabel}>— 已撤销 —</span>
                </li>
              )}

              {/* Future (redo) commands */}
              {future.map((cmd, i) => {
                const targetIndex = past.length + i;
                return (
                  <li key={cmd.id} className={`${styles.item} ${styles.futureItem}`}>
                    <button
                      className={`${styles.itemBtn} ${styles.itemBtnFuture}`}
                      onClick={() => handleSelect(targetIndex)}
                      aria-label={`重做到: ${formatDescription(cmd.description, past.length + i)}`}
                    >
                      <span className={styles.timestamp}>{formatTimestamp(cmd.timestamp)}</span>
                      <span className={styles.desc}>{formatDescription(cmd.description, past.length + i)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.hint}>
            点击记录可跳转至任意历史位置
          </div>
        </footer>
      </aside>
    </>
  );
}
