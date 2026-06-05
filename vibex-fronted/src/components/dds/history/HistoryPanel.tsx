'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import type { Snapshot, SnapshotDiff } from '@/stores/dds/canvasHistoryStore';
import TimelineView from './TimelineView';
import SnapshotDiffDialog from './SnapshotDiffDialog';
import SnapshotPreview from './SnapshotPreview';

/** E1 (Sprint66): Branch merge dialog props */
export interface BranchMergeDialogProps {
  open: boolean;
  sourceBranch: string;
  targetBranch: string;
  branches: string[];
  onMerge: (source: string, target: string) => void;
  onClose: () => void;
}

/** E1 (Sprint66): Branch rename dialog props */
export interface BranchRenameDialogProps {
  open: boolean;
  branch: string;
  onRename: (oldName: string, newName: string) => void;
  onClose: () => void;
}

export interface HistoryPanelProps {
  /** Whether the panel is open */
  open: boolean;
  onClose: () => void;
  /** Called when user wants to restore a snapshot — parent should load the snapshot nodes */
  onRestore: (snap: Snapshot) => void;
}

/** View mode for the history panel */
type ViewMode = 'timeline' | 'list' | 'tree';

/** E1 (Sprint65): Tree node — represents a snapshot in the branch tree */
interface TreeNode {
  snap: Snapshot;
  children: TreeNode[];
  isExpanded: boolean;
}

/** Build a tree from flat snapshots using parentSnapshotId */
function buildSnapshotTree(snapshots: Snapshot[]): TreeNode[] {
  const snapMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // First pass: create nodes
  for (const snap of snapshots) {
    snapMap.set(snap.id, { snap, children: [], isExpanded: true });
  }

  // Second pass: link children to parents
  for (const snap of snapshots) {
    const node = snapMap.get(snap.id)!;
    if (snap.parentSnapshotId && snapMap.has(snap.parentSnapshotId)) {
      snapMap.get(snap.parentSnapshotId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

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
  // E1 (Sprint65): Tree view state
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const snapshots = useCanvasHistoryStore((s) => s.snapshots);
  const compareSnapshots = useCanvasHistoryStore((s) => s.compareSnapshots);
  const updateSnapshotMetadata = useCanvasHistoryStore((s) => s.updateSnapshotMetadata);
  const deleteSnapshot = useCanvasHistoryStore((s) => s.deleteSnapshot);
  // E1 (Sprint66): Branch operations
  const renameBranch = useCanvasHistoryStore((s) => s.renameBranch);
  const deleteBranch = useCanvasHistoryStore((s) => s.deleteBranch);
  const mergeBranch = useCanvasHistoryStore((s) => s.mergeBranch);

  // E1 (Sprint66): Branch operation menu state
  const [openMenuBranch, setOpenMenuBranch] = useState<string | null>(null);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; branch: string }>({ open: false, branch: '' });
  const [mergeDialog, setMergeDialog] = useState<{ open: boolean; source: string; target: string }>({ open: false, source: '', target: '' });

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

  // E1 (Sprint65): Tree view expand/collapse
  const handleToggleExpand = useCallback((snapId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(snapId)) next.delete(snapId);
      else next.add(snapId);
      return next;
    });
  }, []);

  // E1 (Sprint66): Branch operations
  const handleBranchMenuOpen = useCallback((branch: string) => {
    setOpenMenuBranch((prev) => (prev === branch ? null : branch));
  }, []);

  const handleBranchRename = useCallback(async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) { setRenameDialog({ open: false, branch: '' }); return; }
    await renameBranch('', oldName, newName.trim());
    setRenameDialog({ open: false, branch: '' });
    setOpenMenuBranch(null);
  }, [renameBranch]);

  const handleBranchDelete = useCallback(async (branch: string) => {
    if (!confirm(`确定删除分支 "${branch}" 及其所有快照吗？此操作不可恢复。`)) { setOpenMenuBranch(null); return; }
    await deleteBranch('', branch);
    setOpenMenuBranch(null);
  }, [deleteBranch]);

  const handleBranchMerge = useCallback(async (source: string, target: string) => {
    if (source === target) { setMergeDialog({ open: false, source: '', target: '' }); return; }
    await mergeBranch('', source, target);
    setMergeDialog({ open: false, source: '', target: '' });
    setOpenMenuBranch(null);
  }, [mergeBranch]);

  // Close menus on outside click
  useEffect(() => {
    if (!openMenuBranch) return;
    const handler = () => setOpenMenuBranch(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuBranch]);

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
              className={`view-toggle-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
              aria-pressed={viewMode === 'tree'}
              title="分支树视图"
            >
              ⌘
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
        {/* E1 (Sprint66): Branch operation menus */}
        {branches.length > 1 && (
          <div className="branch-ops-list" aria-label="分支管理">
            {branches.map((branch) => (
              <div key={branch} className={`branch-ops-item ${branchFilter === branch ? 'active' : ''}`}>
                <span
                  className="branch-ops-name"
                  onClick={() => handleBranchFilter(branch)}
                  title={`筛选到分支: ${branch}`}
                >
                  {branch === 'main' ? '🌿' : '📂'} {branch}
                </span>
                <div className="branch-ops-actions">
                  <button
                    className="branch-ops-btn"
                    onClick={(e) => { e.stopPropagation(); setRenameDialog({ open: true, branch }); setOpenMenuBranch(null); }}
                    title="重命名分支"
                    aria-label={`重命名分支 ${branch}`}
                  >✎</button>
                  {branch !== 'main' && (
                    <>
                      <button
                        className="branch-ops-btn"
                        onClick={(e) => { e.stopPropagation(); setMergeDialog({ open: true, source: branch, target: branches.find((b) => b !== branch) ?? 'main' }); setOpenMenuBranch(null); }}
                        title="合并到其他分支"
                        aria-label={`合并分支 ${branch}`}
                      >↗</button>
                      <button
                        className="branch-ops-btn danger"
                        onClick={(e) => { e.stopPropagation(); handleBranchDelete(branch); }}
                        title="删除分支"
                        aria-label={`删除分支 ${branch}`}
                      >🗑</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
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
        ) : viewMode === 'tree' ? (
          /* E1 (Sprint65): Branch tree view */
          <div className="history-tree" role="tree" aria-label="快照分支树">
            {filteredSnapshots.length === 0 ? (
              <div className="history-empty">没有匹配的快照</div>
            ) : (
              (() => {
                const tree = buildSnapshotTree(filteredSnapshots);
                if (tree.length === 0) {
                  // Fallback: no tree structure — show flat list with indent
                  return (
                    <div className="history-tree-flat">
                      {filteredSnapshots.map((snap) => (
                        <div key={snap.id} className="history-tree-node history-tree-root">
                          <SnapshotTreeNode
                            snap={snap}
                            depth={0}
                            isExpanded={expandedNodes.has(snap.id)}
                            isSelected={selectedSnap?.id === snap.id}
                            onToggleExpand={handleToggleExpand}
                            onSelect={() => setSelectedSnap(snap)}
                            onStar={handleStar}
                            onCompare={handleCompare}
                            onRestore={handleRestore}
                            onDelete={handleDelete}
                            hasChildren={false}
                          />
                        </div>
                      ))}
                    </div>
                  );
                }
                return tree.map((root) => (
                  <TreeNodeRenderer
                    key={root.snap.id}
                    node={root}
                    depth={0}
                    expandedNodes={expandedNodes}
                    selectedId={selectedSnap?.id ?? null}
                    onToggleExpand={handleToggleExpand}
                    onSelect={setSelectedSnap}
                    onStar={handleStar}
                    onCompare={handleCompare}
                    onRestore={handleRestore}
                    onDelete={handleDelete}
                  />
                ));
              })()
            )}
          </div>
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

      {/* E1 (Sprint66): Branch Rename Dialog */}
      {renameDialog.open && (
        <div className="snapshot-dialog-overlay" onClick={() => setRenameDialog({ open: false, branch: '' })}>
          <div className="snapshot-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="重命名分支">
            <h3 className="dialog-title">重命名分支</h3>
            <p className="dialog-desc">将分支 <strong>{renameDialog.branch}</strong> 重命名为：</p>
            <input
              className="dialog-input"
              type="text"
              id="branch-rename-input"
              defaultValue={renameDialog.branch}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  handleBranchRename(renameDialog.branch, val);
                }
              }}
            />
            <div className="dialog-actions">
              <button className="dialog-btn cancel" onClick={() => setRenameDialog({ open: false, branch: '' })}>取消</button>
              <button
                className="dialog-btn confirm"
                onClick={(e) => {
                  const input = document.getElementById('branch-rename-input') as HTMLInputElement;
                  handleBranchRename(renameDialog.branch, input?.value ?? '');
                }}
              >确认</button>
            </div>
          </div>
        </div>
      )}

      {/* E1 (Sprint66): Branch Merge Dialog */}
      {mergeDialog.open && (
        <div className="snapshot-dialog-overlay" onClick={() => setMergeDialog({ open: false, source: '', target: '' })}>
          <div className="snapshot-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="合并分支">
            <h3 className="dialog-title">合并分支</h3>
            <p className="dialog-desc">将 <strong>{mergeDialog.source}</strong> 合并到：</p>
            <select
              className="dialog-select"
              id="branch-merge-target"
              defaultValue={mergeDialog.target}
            >
              {branches.filter((b) => b !== mergeDialog.source).map((b) => (
                <option key={b} value={b}>{b === 'main' ? '主分支 (main)' : b}</option>
              ))}
            </select>
            <p className="dialog-hint">源分支的所有快照将被移至目标分支，目标分支名称保持不变。</p>
            <div className="dialog-actions">
              <button className="dialog-btn cancel" onClick={() => setMergeDialog({ open: false, source: '', target: '' })}>取消</button>
              <button
                className="dialog-btn confirm"
                onClick={() => {
                  const sel = document.getElementById('branch-merge-target') as HTMLSelectElement;
                  handleBranchMerge(mergeDialog.source, sel?.value ?? 'main');
                }}
              >合并</button>
            </div>
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

/* ===== E1 (Sprint65): Tree View Components ===== */

/** Recursive tree node renderer */
function TreeNodeRenderer({
  node,
  depth,
  expandedNodes,
  selectedId,
  onToggleExpand,
  onSelect,
  onStar,
  onCompare,
  onRestore,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  expandedNodes: Set<string>;
  selectedId: string | null;
  onToggleExpand: (id: string) => void;
  onSelect: (snap: Snapshot) => void;
  onStar: (snap: Snapshot) => void;
  onCompare: (snap: Snapshot) => void;
  onRestore: (snap: Snapshot) => void;
  onDelete: (snap: Snapshot) => void;
}) {
  const { snap, children } = node;
  const isExpanded = expandedNodes.has(snap.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === snap.id;

  return (
    <div className="history-tree-node" style={{ paddingLeft: `${depth * 16}px` }} role="treeitem">
      <SnapshotTreeNode
        snap={snap}
        depth={depth}
        isExpanded={isExpanded}
        isSelected={isSelected}
        onToggleExpand={onToggleExpand}
        onSelect={() => onSelect(snap)}
        onStar={() => onStar(snap)}
        onCompare={() => onCompare(snap)}
        onRestore={() => onRestore(snap)}
        onDelete={() => onDelete(snap)}
        hasChildren={hasChildren}
      />
      {isExpanded && hasChildren && (
        <div className="history-tree-children" role="group">
          {children.map((child) => (
            <TreeNodeRenderer
              key={child.snap.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              selectedId={selectedId}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onStar={onStar}
              onCompare={onCompare}
              onRestore={onRestore}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Individual snapshot node in the tree */
function SnapshotTreeNode({
  snap,
  depth,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
  onStar,
  onCompare,
  onRestore,
  onDelete,
  hasChildren,
}: {
  snap: Snapshot;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: (id: string) => void;
  onSelect: () => void;
  onStar: () => void;
  onCompare: () => void;
  onRestore: () => void;
  onDelete: () => void;
  hasChildren: boolean;
}) {
  return (
    <div
      className={`tree-snap-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      {/* Expand/collapse toggle */}
      {hasChildren ? (
        <button
          className="tree-toggle-btn"
          onClick={(e) => { e.stopPropagation(); onToggleExpand(snap.id); }}
          aria-label={isExpanded ? '折叠' : '展开'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      ) : (
        <span className="tree-toggle-placeholder" />
      )}

      {/* Star indicator */}
      {snap.isStarred && <span className="tree-star" aria-label="已星标">★</span>}

      {/* Branch label */}
      {snap.branchName && snap.branchName !== 'main' && (
        <span className="tree-branch-label">{snap.branchName}</span>
      )}

      {/* Name */}
      <span className="tree-snap-name">{snap.name}</span>

      {/* Timestamp */}
      <span className="tree-snap-time">
        {new Date(snap.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </span>

      {/* Inline actions */}
      <span className="tree-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={`tree-action-btn ${snap.isStarred ? 'starred' : ''}`}
          onClick={(e) => { e.stopPropagation(); onStar(); }}
          aria-label={snap.isStarred ? '取消星标' : '星标'}
        >
          {snap.isStarred ? '★' : '☆'}
        </button>
        <button
          className="tree-action-btn"
          onClick={(e) => { e.stopPropagation(); onCompare(); }}
          aria-label="对比"
        >
          ⟷
        </button>
        <button
          className="tree-action-btn restore"
          onClick={(e) => { e.stopPropagation(); onRestore(); }}
          aria-label="恢复"
        >
          ↩
        </button>
      </span>
    </div>
  );
}

export default HistoryPanel;
