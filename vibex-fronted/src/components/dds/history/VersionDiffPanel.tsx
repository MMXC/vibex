'use client';

/**
 * VersionDiffPanel — Canvas Version Diff Display Panel
 * S84-E1: Compare two snapshots from the VersionTimeline
 * S86-E5: Add side-by-side two-column layout mode
 *
 * Shows:
 * - List mode: Unidirectional diff: added (green), removed (red), modified (orange)
 * - Side-by-side mode: Two-column layout — baseline left, compare right
 * - Bidirectional diff: A→B changes in one direction
 * - Summary stats bar
 * - Collapsible diff sections
 */
import React, { memo, useCallback, useRef, useEffect } from 'react';
import { useCanvasTimelineStore, type DiffMode } from '@/stores/dds/canvasTimelineStore';
import type { DiffNode } from '@/lib/api/canvasDiff';
import styles from './VersionDiffPanel.module.css';

const s = styles as Record<string, string>;

export type DiffViewMode = 'list' | 'sideBySide';

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

// ─── DiffNodeRow — used in list mode ──────────────────────────────────────────

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

// ─── Side-by-side row — used in side-by-side mode ─────────────────────────────

interface SideBySideRowProps {
  fromNode: DiffNode | null;
  toNode: DiffNode | null;
  nodeId: string;
}

const SideBySideRow = memo(function SideBySideRow({ fromNode, toNode, nodeId }: SideBySideRowProps) {
  const changeType = toNode?.changeType ?? (fromNode ? 'removed' : 'added');
  const changeClass = getChangeClass(changeType);

  return (
    <div className={`${s.sideBySideRow} ${changeClass ? changeClass : ''}`} data-testid="diff-side-row">
      {/* Left cell: baseline (from) */}
      <div className={s.sideCell} data-testid="diff-side-from">
        {fromNode ? (
          <div className={`${s.cellContent} ${fromNode.changeType === 'removed' ? s.cellRemoved : ''}`}>
            <span className={s.cellName}>{fromNode.name || fromNode.nodeId}</span>
            <span className={s.cellType}>{fromNode.type}</span>
            {fromNode.changeType === 'removed' && (
              <span className={`${s.changeBadge} ${s.badgeRemoved}`} data-testid="diff-from-badge">删除</span>
            )}
          </div>
        ) : (
          <div className={`${s.cellContent} ${s.cellEmpty}`}>
            <span className={s.emptyMarker}>—</span>
          </div>
        )}
      </div>
      {/* Right cell: compare (to) */}
      <div className={s.sideCell} data-testid="diff-side-to">
        {toNode ? (
          <div className={`${s.cellContent} ${toNode.changeType === 'added' ? s.cellAdded : toNode.changeType === 'modified' ? s.cellModified : ''}`}>
            <span className={s.cellName}>{toNode.name || toNode.nodeId}</span>
            <span className={s.cellType}>{toNode.type}</span>
            {toNode.changeType === 'added' && (
              <span className={`${s.changeBadge} ${s.badgeAdded}`} data-testid="diff-to-badge">新增</span>
            )}
            {toNode.changeType === 'modified' && (
              <span className={`${s.changeBadge} ${s.badgeModified}`} data-testid="diff-to-badge">修改</span>
            )}
          </div>
        ) : (
          <div className={`${s.cellContent} ${s.cellEmpty}`}>
            <span className={s.emptyMarker}>—</span>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Side-by-side view content ────────────────────────────────────────────────

interface SideBySideContentProps {
  diffData: NonNullable<ReturnType<typeof useCanvasTimelineStore>['diffData']>;
}

const SideBySideContent = memo(function SideBySideContent({ diffData }: SideBySideContentProps) {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // Synchronized scrolling
  const handleLeftScroll = useCallback(() => {
    if (rightScrollRef.current && leftScrollRef.current) {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    }
  }, []);

  const handleRightScroll = useCallback(() => {
    if (leftScrollRef.current && rightScrollRef.current) {
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    }
  }, []);

  // Build combined node list: all nodes from both sides
  const { added, removed, modified } = diffData.diff;
  const allNodeIds = new Set<string>();
  added.forEach(n => allNodeIds.add(n.nodeId));
  removed.forEach(n => allNodeIds.add(n.nodeId));
  modified.forEach(n => allNodeIds.add(n.nodeId));

  const rows: Array<{ nodeId: string; fromNode: DiffNode | null; toNode: DiffNode | null }> = [];
  allNodeIds.forEach(nodeId => {
    const fromNode = [...removed, ...modified].find(n => n.nodeId === nodeId) ?? null;
    const toNode = [...added, ...modified].find(n => n.nodeId === nodeId) ?? null;
    rows.push({ nodeId, fromNode, toNode });
  });

  return (
    <div className={s.sideBySideContainer} data-testid="diff-side-by-side">
      {/* Column headers */}
      <div className={s.sideBySideHeaders}>
        <div className={s.sideCell}>
          <span className={s.columnLabel}>
            <span className={s.labelTag}>基准</span>
            {diffData.fromName || diffData.fromSnapshotId.slice(0, 8)}
          </span>
        </div>
        <div className={s.sideCell}>
          <span className={s.columnLabel}>
            <span className={s.labelTag}>对比</span>
            {diffData.toName || diffData.toSnapshotId.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Scrollable rows */}
      <div className={s.sideBySideScroller} data-testid="diff-side-scroller">
        <div
          className={s.sideColumn}
          ref={leftScrollRef}
          onScroll={handleLeftScroll}
          data-testid="diff-side-left"
        >
          {rows.map(({ nodeId, fromNode }) => {
            const changeType = fromNode?.changeType ?? 'removed';
            const changeClass = getChangeClass(changeType);
            return (
              <div key={nodeId} className={`${s.sideRow} ${changeClass ? changeClass : ''}`} data-testid="diff-side-left-row">
                {fromNode ? (
                  <div className={`${s.cellContent} ${fromNode.changeType === 'removed' ? s.cellRemoved : ''}`}>
                    <span className={s.cellName}>{fromNode.name || fromNode.nodeId}</span>
                    <span className={s.cellType}>{fromNode.type}</span>
                    {fromNode.changeType === 'removed' && (
                      <span className={`${s.changeBadge} ${s.badgeRemoved}`}>删除</span>
                    )}
                  </div>
                ) : (
                  <div className={`${s.cellContent} ${s.cellEmpty}`}>
                    <span className={s.emptyMarker}>—</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className={s.sideColumn}
          ref={rightScrollRef}
          onScroll={handleRightScroll}
          data-testid="diff-side-right"
        >
          {rows.map(({ nodeId, toNode }) => {
            const changeType = toNode?.changeType ?? 'added';
            const changeClass = getChangeClass(changeType);
            return (
              <div key={nodeId} className={`${s.sideRow} ${changeClass ? changeClass : ''}`} data-testid="diff-side-right-row">
                {toNode ? (
                  <div className={`${s.cellContent} ${toNode.changeType === 'added' ? s.cellAdded : toNode.changeType === 'modified' ? s.cellModified : ''}`}>
                    <span className={s.cellName}>{toNode.name || toNode.nodeId}</span>
                    <span className={s.cellType}>{toNode.type}</span>
                    {toNode.changeType === 'added' && (
                      <span className={`${s.changeBadge} ${s.badgeAdded}`}>新增</span>
                    )}
                    {toNode.changeType === 'modified' && (
                      <span className={`${s.changeBadge} ${s.badgeModified}`}>修改</span>
                    )}
                  </div>
                ) : (
                  <div className={`${s.cellContent} ${s.cellEmpty}`}>
                    <span className={s.emptyMarker}>—</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ─── Main panel ───────────────────────────────────────────────────────────────

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

  // S86-E5: side-by-side view mode toggle
  const [diffViewMode, setDiffViewMode] = React.useState<DiffViewMode>('list');

  const handleModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDiffMode(e.target.value as DiffMode);
  }, [setDiffMode]);

  const handleViewModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDiffViewMode(e.target.value as DiffViewMode);
  }, []);

  if (!isDiffPanelOpen) return null;

  const stats = diffData?.diff?.stats;

  return (
    <div className={s.panel} role="dialog" aria-label="版本对比面板" data-testid="version-diff-panel">
      {/* Header */}
      <div className={s.header}>
        <h3 className={s.title}>版本对比</h3>
        <div className={s.headerControls}>
          {diffData && (
            <>
              <select
                className={s.viewModeSelect}
                value={diffViewMode}
                onChange={handleViewModeChange}
                aria-label="视图模式"
                data-testid="diff-view-mode-select"
              >
                <option value="list">列表视图</option>
                <option value="sideBySide">双栏对比</option>
              </select>
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
            </>
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

      {/* Source/target info — hidden in side-by-side mode (headers replace it) */}
      {diffData && diffViewMode === 'list' && (
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

          {/* Content — list vs side-by-side */}
          {diffViewMode === 'sideBySide' ? (
            <SideBySideContent diffData={diffData} />
          ) : (
            /* List mode (original S84-E1 layout) */
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
          )}
        </>
      )}
    </div>
  );
});

export default VersionDiffPanel;
