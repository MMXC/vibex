'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import type { Snapshot, SnapshotDiff } from '@/stores/dds/canvasHistoryStore';
import TimelineView from './TimelineView';
import SnapshotDiffDialog from './SnapshotDiffDialog';
import SnapshotPreview from './SnapshotPreview';

export interface HistoryPanelProps {
  /** Whether the panel is open */
  open: boolean;
  onClose: () => void;
  /** Called when user wants to restore a snapshot — parent should load the snapshot nodes */
  onRestore: (snap: Snapshot) => void;
}

/** View mode for the history panel */
type ViewMode = 'timeline' | 'list';

/** Format size in bytes to human-readable string */
function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const HistoryPanel = React.memo(function HistoryPanel({
  open,
  onClose,
  onRestore,
}: HistoryPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedSnap, setSelectedSnap] = useState<Snapshot | null>(null);
  const [compareSnap, setCompareSnap] = useState<Snapshot | null>(null);
  const [diff, setDiff] = useState<SnapshotDiff | null>(null);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [nameFilter, setNameFilter] = useState('');

  const snapshots = useCanvasHistoryStore((s) => s.snapshots);
  const compareSnapshots = useCanvasHistoryStore((s) => s.compareSnapshots);
  const updateSnapshotMetadata = useCanvasHistoryStore((s) => s.updateSnapshotMetadata);
  const deleteSnapshot = useCanvasHistoryStore((s) => s.deleteSnapshot);

  // Reset state when panel opens
  useEffect(() => {
    if (open) {
      setSelectedSnap(null);
      setCompareSnap(null);
      setDiff(null);
    }
  }, [open]);

  // Apply filters
  const filteredSnapshots = snapshots.filter((snap) => {
    if (branchFilter !== 'all' && snap.branchName !== branchFilter) return false;
    if (nameFilter && !snap.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    return true;
  });

  // Branch list for filter dropdown
  const branches = Array.from(new Set(snapshots.map((s) => s.branchName ?? 'main')));

  const handleStar = useCallback(async (snap: Snapshot) => {
    await updateSnapshotMetadata(snap.id, { isStarred: !snap.isStarred });
  }, [updateSnapshotMetadata]);

  const handleCompare = useCallback(async (snap: Snapshot) => {
    const current = snapshots[0];
    if (!current || current.id === snap.id) return;
    const diffResult = compareSnapshots(current, snap);
    setDiff(diffResult);
    setCompareSnap(snap);
  }, [snapshots, compareSnapshots]);

  const handleRestore = useCallback((snap: Snapshot) => {
    onRestore(snap);
    onClose();
  }, [onRestore, onClose]);

  const handleDelete = useCallback(async (snap: Snapshot) => {
    if (!confirm(`确定删除快照 "${snap.name}" 吗？`)) return;
    await deleteSnapshot(snap.id);
    if (selectedSnap?.id === snap.id) setSelectedSnap(null);
  }, [deleteSnapshot, selectedSnap]);

  const handleBranchFilter = useCallback((branch: string) => {
    setBranchFilter(branch);
  }, []);

  if (!open) return null;

  return (
    <div className="history-panel" role="complementary" aria-label="画布版本历史">
      {/* Header */}
      <div className="history-panel-header">
        <h2 className="history-panel-title">版本历史</h2>
        <div className="history-panel-controls">
          {/* View mode toggle */}
          <div className="history-view-toggle" role="group" aria-label="视图切换">
            <button
              className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
              aria-pressed={viewMode === 'timeline'}
              title="时间线视图"
            >
              ≡
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              title="列表视图"
            >
              ☰
            </button>
          </div>
          <button className="history-close-btn" onClick={onClose} aria-label="关闭">✕</button>
        </div>
      </div>

      {/* Filters */}
      <div className="history-panel-filters">
        <input
          type="search"
          className="history-filter-search"
          placeholder="搜索快照名称..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          aria-label="搜索快照"
        />
        {branches.length > 1 && (
          <select
            className="history-filter-branch"
            value={branchFilter}
            onChange={(e) => handleBranchFilter(e.target.value)}
            aria-label="分支筛选"
          >
            <option value="all">全部分支</option>
            {branches.map((b) => (
              <option key={b} value={b}>{b === 'main' ? '主分支' : b}</option>
            ))}
          </select>
        )}
        <span className="history-filter-count" aria-live="polite">
          {filteredSnapshots.length} 个快照
        </span>
      </div>

      {/* Snapshot count badge */}
      <div className="history-panel-meta">
        <span>{filteredSnapshots.length} 个快照</span>
        {snapshots[0] && (
          <span className="history-panel-current">
            当前: {snapshots[0].name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="history-panel-content">
        {viewMode === 'timeline' ? (
          <TimelineView
            snapshots={filteredSnapshots}
            selectedId={selectedSnap?.id ?? null}
            onSelect={setSelectedSnap}
            onStar={handleStar}
            onCompare={handleCompare}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        ) : (
          /* List view */
          <div className="history-list" role="list" aria-label="快照列表">
            {filteredSnapshots.length === 0 ? (
              <div className="history-empty">没有匹配的快照</div>
            ) : (
              filteredSnapshots.map((snap) => (
                <div
                  key={snap.id}
                  className={`history-list-item ${selectedSnap?.id === snap.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSnap(snap)}
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedSnap(snap)}
                >
                  <div className="list-item-header">
                    {snap.isStarred && <span className="list-item-star" aria-label="已星标">★</span>}
                    <span className="list-item-name">{snap.name}</span>
                    {snap.branchName && snap.branchName !== 'main' && (
                      <span className="list-item-branch">{snap.branchName}</span>
                    )}
                  </div>
                  <div className="list-item-meta">
                    <span>{new Date(snap.timestamp).toLocaleString('zh-CN')}</span>
                    <span>{snap.data.nodes?.length ?? 0} 节点</span>
                  </div>
                  <div className="list-item-actions">
                    <button
                      className={`list-action-btn ${snap.isStarred ? 'starred' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleStar(snap); }}
                      aria-label={snap.isStarred ? '取消星标' : '星标'}
                    >
                      {snap.isStarred ? '★' : '☆'}
                    </button>
                    <button
                      className="list-action-btn"
                      onClick={(e) => { e.stopPropagation(); handleCompare(snap); }}
                      aria-label="对比"
                    >
                      ⟷
                    </button>
                    <button
                      className="list-action-btn restore"
                      onClick={(e) => { e.stopPropagation(); handleRestore(snap); }}
                      aria-label="恢复"
                    >
                      ↩
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected snapshot preview (D1.2: SnapshotPreview.tsx — E1 Sprint61) */}
      {selectedSnap && (
        <div className="history-panel-detail">
          {/* E1 (Sprint61): D1.2 — Use SnapshotPreview for visual node preview */}
          <SnapshotPreview snapshot={selectedSnap} onRestore={handleRestore} />
          {/* Also show compare/restore buttons if not in preview */}
          <div className="detail-actions">
            <button
              className="detail-compare-btn"
              onClick={() => handleCompare(selectedSnap)}
              disabled={snapshots[0]?.id === selectedSnap.id}
              aria-label="与当前对比"
            >
              ⟷ 与当前对比
            </button>
            <button
              className="detail-close-btn"
              onClick={() => setSelectedSnap(null)}
              aria-label="关闭预览"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Diff dialog */}
      {diff && compareSnap && (
        <SnapshotDiffDialog
          baseSnapshot={snapshots[0]}
          compareSnapshot={compareSnap}
          diff={diff}
          onClose={() => { setDiff(null); setCompareSnap(null); }}
          onRestore={handleRestore}
        />
      )}
    </div>
  );
});

export default HistoryPanel;
