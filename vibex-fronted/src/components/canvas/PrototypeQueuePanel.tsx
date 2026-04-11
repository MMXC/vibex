/**
 * PrototypeQueuePanel — 原型生成队列面板
 *
 * Epic 5: 原型生成队列 UI
 * S5.2: 队列状态显示（queued/generating/done/error）
 * S5.3: 单页重生成（不影响其他页面）
 * S5.4: 轮询进度更新（5s interval）
 * S5.5: 错误重试机制
 *
 * 注意: 项目创建由 ProjectBar 处理，此组件只负责队列展示和操作
 *
 * 遵守 AGENTS.md 规范：
 * - 组件接收 slice 相关 props，不直接 dispatch 多个 slice
 * - 无 any 类型泄漏
 * - 无 canvasLogger.default.debug
 * - 轮询间隔 5000ms（ADR-003）
 */
'use client';

import React, { useEffect, useRef } from 'react';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import { canvasApi, startPolling, stopPolling } from '@/lib/canvas/api/canvasApi';
import type { PrototypePage, PrototypeStatus } from '@/lib/canvas/types';
import styles from './canvas.module.css';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// =============================================================================
// Sub-components
// =============================================================================

/** 状态图标 */
function StatusIcon({ status }: { status: PrototypeStatus }) {
  switch (status) {
    case 'queued': return <span aria-label="等待中">⏳</span>;
    case 'generating': return <span aria-label="生成中" className={styles.iconSpin}>⚙️</span>;
    case 'done': return <span aria-label="完成">✅</span>;
    case 'error': return <span aria-label="失败">❌</span>;
  }
}

/** 单个队列项 */
interface QueueItemProps {
  page: PrototypePage;
  onRetry: (pageId: string) => void;
  onDelete: (pageId: string) => void;
}

function QueueItem({ page, onRetry, onDelete }: QueueItemProps) {
  const statusVariant = page.status === 'queued' ? 'queued'
    : page.status === 'generating' ? 'generating'
    : page.status === 'done' ? 'done'
    : 'error';

  return (
    <li className={`${styles.queueItem} ${(styles as Record<string, string>)[`queueItem${statusVariant.charAt(0).toUpperCase() + statusVariant.slice(1)}`]}`}>
      {/* Status icon */}
      <div className={styles.queueItemIcon}>
        <StatusIcon status={page.status} />
      </div>

      {/* Info */}
      <div className={styles.queueItemBody}>
        <div className={styles.queueItemNameRow}>
          <span className={styles.queueItemName}>{page.name}</span>
          <span className={styles.queueItemStatus}>
            {page.status === 'queued' ? '等待中'
              : page.status === 'generating' ? '生成中'
              : page.status === 'done' ? '完成'
              : '失败'}
          </span>
        </div>

        {/* Progress bar */}
        {page.status === 'generating' && page.progress > 0 && (
          <div className={styles.queueItemProgressBar} role="progressbar"
            aria-valuenow={page.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.queueItemProgressFill} style={{ width: `${page.progress}%` }} />
            <span className={styles.queueItemProgressLabel}>{page.progress}%</span>
          </div>
        )}

        {/* Retry count */}
        {page.retryCount > 0 && (
          <span className={styles.queueItemRetry}>重试 ×{page.retryCount}</span>
        )}

        {/* Error message */}
        {page.status === 'error' && page.errorMessage && (
          <p className={styles.queueItemError}>{page.errorMessage}</p>
        )}
      </div>

      {/* Actions */}
      <div className={styles.queueItemActions}>
        {page.status === 'error' && (
          <button
            type="button"
            className={styles.queueBtn}
            onClick={() => onRetry(page.pageId)}
            aria-label={`重试 ${page.name}`}
          >
            🔄
          </button>
        )}
        {page.status !== 'generating' && (
          <button
            type="button"
            className={`${styles.queueBtn} ${styles.queueBtnDanger}`}
            onClick={() => onDelete(page.pageId)}
            aria-label={`移除 ${page.name}`}
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export interface PrototypeQueuePanelProps {
  /** 面板是否展开 */
  expanded: boolean;
  /** 展开/折叠回调 */
  onToggleExpand: () => void;
}

export function PrototypeQueuePanel({ expanded, onToggleExpand }: PrototypeQueuePanelProps) {
  // === Store selectors ===
  const prototypeQueue = useSessionStore((s) => s.prototypeQueue);
  const projectId = useSessionStore((s) => s.projectId);
  const isPolling = useSessionStore((s) => s.isPolling);
  const updateQueueItem = useSessionStore((s) => s.updateQueueItem);
  const setIsPolling = useSessionStore((s) => s.setIsPolling);
  const removeFromQueue = useSessionStore((s) => s.removeFromQueue);
  const clearQueue = useSessionStore((s) => s.clearQueue);

  const pollingRef = useRef(false);

  // === Polling ===
  useEffect(() => {
    if (!projectId) {
      stopPolling();
      setIsPolling(false);
      pollingRef.current = false;
      return;
    }

    if (pollingRef.current) return;
    pollingRef.current = true;

    startPolling(
      projectId,
      (status) => {
        for (const page of status.pages) {
          updateQueueItem(page.pageId, {
            status: page.status,
            progress: page.progress,
            errorMessage: page.errorMessage,
            generatedAt: page.generatedAt,
          });
        }
        setIsPolling(true);
      },
      5000 // ADR-003: 5000ms
    );

    return () => {
      stopPolling();
      pollingRef.current = false;
    };
  }, [projectId]);

  // === Computed stats ===
  const queue = prototypeQueue ?? [];
  const total = queue.length;
  const done = queue.filter((p) => p.status === 'done').length;
  const generating = queue.filter((p) => p.status === 'generating').length;
  const queued = queue.filter((p) => p.status === 'queued').length;
  const errors = queue.filter((p) => p.status === 'error').length;
  const allDone = total > 0 && done === total;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  // === Handlers ===
  const handleRetry = async (pageId: string) => {
    if (!projectId) return;
    try {
      const result = await canvasApi.generate({
        projectId,
        pageIds: [pageId],
        mode: 'parallel',
      });
      updateQueueItem(pageId, {
        status: (result.pages[0]?.status ?? 'queued') as PrototypeStatus,
        progress: 0,
        errorMessage: undefined,
      });
    } catch (err) {
      updateQueueItem(pageId, {
        status: 'error',
        errorMessage: err instanceof Error ? err.message : '重试失败',
      });
    }
  };

  const handleDelete = (pageId: string) => {
    removeFromQueue(pageId);
  };

  const handleExport = async () => {
    if (!projectId) return;
    try {
      const blob = await canvasApi.exportZip(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibex-prototype-${projectId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`导出失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  return (
    <div className={styles.queuePanel}>
      {/* Header — always visible */}
      <button
        type="button"
        className={styles.queuePanelHeader}
        onClick={onToggleExpand}
        aria-expanded={expanded}
        aria-controls="queue-panel-content"
      >
        <div className={styles.queuePanelHeaderLeft}>
          <span className={styles.queuePanelTitle}>
            {expanded ? '▼' : '▶'} 🚀 原型队列
          </span>
          {total > 0 && (
            <span className={styles.queuePanelBadge}>
              {done}/{total}
              {isPolling && <span className={styles.pollingDot} title="轮询中" />}
            </span>
          )}
        </div>
        {total > 0 && (
          <span className={styles.queuePanelProgress}>{progress}%</span>
        )}
      </button>

      {/* Content — collapsible */}
      <div
        id="queue-panel-content"
        className={`${styles.queuePanelContent} ${expanded ? styles.queuePanelContentExpanded : ''}`}
        aria-hidden={!expanded}
      >
        {!projectId ? (
          /* No project yet — shown by ProjectBar */
          <p className={styles.queuePanelHint}>在顶部点击「创建项目」开始生成</p>
        ) : total === 0 ? (
          <p className={styles.queuePanelHint}>项目已创建，正在生成原型...</p>
        ) : (
          <>
            {/* Stats row */}
            <div className={styles.queueStatsRow}>
              {queued > 0 && <span className={styles.statBadge}>⏳ {queued} 待生成</span>}
              {generating > 0 && <span className={`${styles.statBadge} ${styles.statBadgeInfo}`}>⚙️ {generating} 生成中</span>}
              {done > 0 && <span className={`${styles.statBadge} ${styles.statBadgeSuccess}`}>✅ {done} 完成</span>}
              {errors > 0 && <span className={`${styles.statBadge} ${styles.statBadgeError}`}>❌ {errors} 失败</span>}
            </div>

            {/* Queue list */}
            <ul className={styles.queueList} role="list" aria-label="原型生成队列">
              {queue.map((page) => (
                <QueueItem
                  key={page.pageId}
                  page={page}
                  onRetry={handleRetry}
                  onDelete={handleDelete}
                />
              ))}
            </ul>

            {/* Export section */}
            {allDone && (
              <div className={styles.queueExportArea}>
                <p className={styles.queueExportMsg}>🎉 所有页面生成完成！</p>
                <button type="button" className={styles.exportButton} onClick={handleExport}>
                  📦 导出 Zip
                </button>
              </div>
            )}

            {/* Error notice */}
            {errors > 0 && !allDone && (
              <p className={styles.queueErrorNotice}>
                ⚠️ {errors} 个页面失败，可点击重试按钮
              </p>
            )}

            {/* Clear all */}
            <button
              type="button"
              className={styles.clearQueueBtn}
              onClick={clearQueue}
            >
              清空队列
            </button>
          </>
        )}
      </div>
    </div>
  );
}
