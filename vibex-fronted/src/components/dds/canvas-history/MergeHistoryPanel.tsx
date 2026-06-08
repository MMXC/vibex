'use client';

import React, { memo, useEffect, useState } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import type { MergeHistoryEntry } from '@/stores/dds/canvasHistoryStore';
import styles from './MergeHistoryPanel.module.css';

interface MergeHistoryPanelProps {
  /** Whether the panel is open */
  open: boolean;
  /** Current canvas ID */
  canvasId?: string;
  /** Called to close the panel */
  onClose: () => void;
}

/**
 * MergeHistoryPanel — side panel showing a timeline of branch merge operations.
 * Displays: source branch → target branch + timestamp + merged-by user.
 * E5 (Sprint79): New component.
 * E3 (Sprint80): Expanded timeline items with stats, avatars, conflict badges, Markdown export.
 */
const MergeHistoryPanel = memo(function MergeHistoryPanel({
  open,
  canvasId,
  onClose,
}: MergeHistoryPanelProps) {
  const mergeHistory = useCanvasHistoryStore((s) => s.mergeHistory);
  const getMergeHistory = useCanvasHistoryStore((s) => s.getMergeHistory);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load merge history when panel opens
  useEffect(() => {
    if (open && canvasId) {
      getMergeHistory(canvasId);
    }
  }, [open, canvasId, getMergeHistory]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const exportMarkdown = (): void => {
    const lines: string[] = [
      '# 合并历史报告',
      '',
      `**画布**: ${canvasId ?? '未知'}`,
      `**导出时间**: ${new Date().toLocaleString('zh-CN')}`,
      '',
      '---',
      '',
    ];

    for (const entry of mergeHistory) {
      const date = new Date(entry.timestamp).toLocaleString('zh-CN');
      lines.push(`## ${entry.sourceBranch} → ${entry.targetBranch}`);
      lines.push(`- **时间**: ${date}`);
      lines.push(`- **操作者**: ${entry.mergedBy ?? '未知'}`);
      if (entry.mergedNodeIds && entry.mergedNodeIds.length > 0) {
        lines.push(`- **合并节点数**: ${entry.mergedNodeIds.length}`);
        lines.push(`  - ${entry.mergedNodeIds.join(', ')}`);
      }
      if (entry.conflictCount !== undefined && entry.conflictCount > 0) {
        lines.push(`- **冲突数**: ${entry.conflictCount} ⚠️`);
      } else if (entry.conflictCount !== undefined) {
        lines.push(`- **冲突数**: 0`);
      }
      if (entry.authorIds && entry.authorIds.length > 0) {
        lines.push(`- **贡献者**: ${entry.authorIds.join(', ')}`);
      }
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merge-history-${canvasId ?? 'canvas'}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className={styles['merge-history-panel']} role="complementary" aria-label="合并历史">
      {/* Header */}
      <div className={styles['merge-history-header']}>
        <h2 className={styles['merge-history-title']}>合并历史</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          {mergeHistory.length > 0 && (
            <button
              className={styles['merge-history-export']}
              onClick={exportMarkdown}
              aria-label="导出 Markdown"
              title="导出 Markdown 报告"
            >
              📥
            </button>
          )}
          <button
            className={styles['merge-history-close']}
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles['merge-history-content']}>
        {mergeHistory.length === 0 ? (
          <div className={styles['merge-history-empty']}>
            <span className={styles['merge-history-empty-icon']}>📋</span>
            <p className={styles['merge-history-empty-text']}>
              暂无合并记录
              <br />
              <span style={{ fontSize: '11px' }}>合并分支后会自动显示在这里</span>
            </p>
          </div>
        ) : (
          <div className={styles['merge-history-timeline']}>
            {mergeHistory.map((entry: MergeHistoryEntry) => {
              const isExpanded = expandedId === entry.id;
              const mergedNodeCount = entry.mergedNodeIds?.length ?? 0;
              const conflictCount = entry.conflictCount ?? 0;
              const authorIds = entry.authorIds ?? [];
              const authorCount = authorIds.length;

              return (
                <div key={entry.id} className={styles['merge-history-item']}>
                  <div
                    className={styles['merge-history-dot']}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedId(isExpanded ? null : entry.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${entry.sourceBranch} 到 ${entry.targetBranch} 详情`}
                    style={{ cursor: 'pointer' }}
                  />
                  <div className={styles['merge-history-main-row']}>
                    <div className={styles['merge-history-branch-row']}>
                      <span className={styles['merge-history-source']}>{entry.sourceBranch}</span>
                      <span className={styles['merge-history-arrow']}>→</span>
                      <span className={styles['merge-history-target']}>{entry.targetBranch}</span>
                    </div>
                    <div className={styles['merge-history-meta']}>
                      <span className={styles['merge-history-time']}>{formatTime(entry.timestamp)}</span>
                      {entry.mergedBy && (
                        <span className={styles['merge-history-user']}>{entry.mergedBy}</span>
                      )}
                      {/* E3: conflict badge */}
                      {conflictCount > 0 && (
                        <span className={styles['merge-history-conflict']} title={`${conflictCount} 个冲突`}>
                          ⚠️ {conflictCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* E3: Expandable detail */}
                  {isExpanded && (
                    <div className={styles['merge-history-detail']}>
                      {/* Node stats */}
                      {mergedNodeCount > 0 && (
                        <div className={styles['merge-history-stat']}>
                          <span className={styles['merge-history-stat-label']}>节点统计</span>
                          <span>{mergedNodeCount} 个节点</span>
                        </div>
                      )}
                      {/* Contributor avatars */}
                      {authorCount > 0 && (
                        <div className={styles['merge-history-authors']}>
                          <span className={styles['merge-history-stat-label']}>贡献者</span>
                          <div className={styles['merge-history-avatar-list']}>
                            {authorIds.map((uid) => (
                              <span
                                key={uid}
                                className={styles['merge-history-avatar']}
                                title={uid}
                                role="img"
                                aria-label={uid}
                              >
                                {uid.slice(0, 2).toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Conflict detail */}
                      {conflictCount > 0 && (
                        <div className={styles['merge-history-stat']}>
                          <span className={styles['merge-history-stat-label']}>冲突</span>
                          <span style={{ color: 'var(--color-danger, #ef4444)' }}>{conflictCount} 个冲突已解决</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export { MergeHistoryPanel };
