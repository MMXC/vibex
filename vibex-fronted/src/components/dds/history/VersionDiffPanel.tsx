'use client';

/**
 * VersionDiffPanel — Canvas Version Diff Display Panel
 * S84-E1: Compare two snapshots from the VersionTimeline
 *
 * Shows:
 * - Unidirectional diff: added (green), removed (red), modified (yellow)
 * - Bidirectional diff: A→B changes in one direction
 * - Summary stats bar
 * - Collapsible diff sections
 */
import React, { memo, useCallback } from 'react';
import { useCanvasTimelineStore, type DiffMode } from '@/stores/dds/canvasTimelineStore';
import type { DiffNode } from '@/lib/api/canvasDiff';
import styles from './VersionDiffPanel.module.css';

const s = styles as Record<string, string>;

interface VersionDiffPanelProps {
  /** Current project ID for API calls */
  projectId: string;
  /** The current (latest) snapshot ID */
  currentSnapshotId: string | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
}

function getChangeLabel(changeType: DiffNode['changeType']): string {
  switch (changeType) {
    case 'added': return '新增';
    case 'removed': return '删除';
    case 'modified': return '修改';
  }
}

function getChangeClass(changeType: DiffNode['changeType']): string {
  switch (changeType) {
    case 'added': return s.added;
    case 'removed': return s.removed;
    case 'modified': return s.modified;
  }
}

const DiffNodeRow = memo(function DiffNodeRow({ node }: { node: DiffNode }) {
  const changeLabel = getChangeLabel(node.changeType);
  const changeClass = getChangeClass(node.changeType);

  const beforeStr = node.before
    ? Object.entries(node.before).map(([k, v]) => `${k}: ${v}`).join(', ')
    : null;
  const afterStr = node.after
    ? Object.entries(node.after).map(([k, v]) => `${k}: ${v}`).join(', ')
    : null;

  return (
    <div className={`${s.diffRow} ${changeClass}`} data-testid={`diff-row-${node.changeType}`}>
      <span className={s.changeBadge} data-testid="diff-change-type">{changeLabel}</span>
      <span className={s.nodeName} data-testid="diff-node-name">{node.name || node.nodeId}</span>
      <span className={s.nodeType} data-testid="diff-node-type">{node.type}</span>
      {node.changeType === 'modified' && (
        <div className={s.modifiedFields} data-testid="diff-modified-fields">
          {beforeStr && <span className={s.fieldBefore}>{beforeStr}</span>}
          {afterStr && <span className={s.fieldAfter}>{afterStr}</span>}
        </div>
      )}
    </div>
  );
});

export const VersionDiffPanel = memo(function VersionDiffPanel({
  projectId,
  currentSnapshotId,
  isLoading = false,
  error = null,
}: VersionDiffPanelProps) {
  const {
    isDiffPanelOpen,
    closeDiffPanel,
    diffData,
    diffMode,
    setDiffMode,
    compareSnapshotId,
  } = useCanvasTimelineStore();

  const handleModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDiffMode(e.target.value as DiffMode);
  }, [setDiffMode]);

  if (!isDiffPanelOpen) return null;

  const stats = diffData?.diff?.stats;

  return (
    <div className={s.panel} role="dialog" aria-label="版本对比面板" data-testid="version-diff-panel">
      {/* Header */}
      <div className={s.header}>
        <h3 className={s.title}>版本对比</h3>
        <div className={s.headerControls}>
          {diffData && (
            <select
              className={s.modeSelect}
              value={diffMode}
              onChange={handleModeChange}
              aria-label="对比模式"
              data-testid="diff-mode-select"
            >
              <option value="unidirectional">单向对比</option>
              <option value="bidirectional">双向对比</option>
            </select>
          )}
          <button
            className={s.closeBtn}
            onClick={closeDiffPanel}
            aria-label="关闭"
            data-testid="diff-close-btn"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Source/target info */}
      {diffData && (
        <div className={s.snapshotLabels} data-testid="diff-snapshot-labels">
          <span className={s.snapshotLabel}>
            <span className={s.labelTag}>基准</span>
            {diffData.fromName || diffData.fromSnapshotId.slice(0, 8)}
          </span>
          <span className={s.arrow}>→</span>
          <span className={s.snapshotLabel}>
            <span className={s.labelTag}>对比</span>
            {diffData.toName || diffData.toSnapshotId.slice(0, 8)}
          </span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className={s.loading} data-testid="diff-loading">
          <span>加载对比数据...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className={s.error} data-testid="diff-error" role="alert">
          {error}
        </div>
      )}

      {/* Diff data */}
      {diffData && !isLoading && (
        <>
          {/* Summary stats */}
          {stats && (
            <div className={s.summaryBar} data-testid="diff-stats">
              <div className={s.summaryStat}>
                <span className={s.statAdded}>+{stats.added}</span>
                <span>新增</span>
              </div>
              <div className={s.summaryStat}>
                <span className={s.statRemoved}>−{stats.removed}</span>
                <span>删除</span>
              </div>
              <div className={s.summaryStat}>
                <span className={s.statModified}>~{stats.modified}</span>
                <span>修改</span>
              </div>
              <div className={s.summaryStat}>
                <span className={s.statUnchanged}>{stats.unchanged}</span>
                <span>未变</span>
              </div>
            </div>
          )}

          {/* Diff sections */}
          <div className={s.diffSections}>
            {diffData.diff.added.length > 0 && (
              <div className={s.diffSection}>
                <div className={`${s.sectionHeader} ${s.addedSection}`}>
                  <span>新增 ({diffData.diff.added.length})</span>
                </div>
                <div className={s.sectionBody}>
                  {diffData.diff.added.map((node) => (
                    <DiffNodeRow key={node.nodeId} node={node} />
                  ))}
                </div>
              </div>
            )}

            {diffData.diff.removed.length > 0 && (
              <div className={s.diffSection}>
                <div className={`${s.sectionHeader} ${s.removedSection}`}>
                  <span>删除 ({diffData.diff.removed.length})</span>
                </div>
                <div className={s.sectionBody}>
                  {diffData.diff.removed.map((node) => (
                    <DiffNodeRow key={node.nodeId} node={node} />
                  ))}
                </div>
              </div>
            )}

            {diffData.diff.modified.length > 0 && (
              <div className={s.diffSection}>
                <div className={`${s.sectionHeader} ${s.modifiedSection}`}>
                  <span>修改 ({diffData.diff.modified.length})</span>
                </div>
                <div className={s.sectionBody}>
                  {diffData.diff.modified.map((node) => (
                    <DiffNodeRow key={node.nodeId} node={node} />
                  ))}
                </div>
              </div>
            )}

            {diffData.diff.added.length === 0 &&
              diffData.diff.removed.length === 0 &&
              diffData.diff.modified.length === 0 && (
                <div className={s.noChanges} data-testid="diff-no-changes">
                  两个版本完全相同，无变化
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
});

export default VersionDiffPanel;
