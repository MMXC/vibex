'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';

interface BranchManagerProps {
  /** Whether the panel is open */
  open: boolean;
  /** Current canvas ID for branch operations */
  canvasId?: string;
  /** Called when user switches to a different branch */
  onBranchSwitch?: (branchName: string) => void;
  /** Called to close the panel */
  onClose: () => void;
}

type Tab = 'list' | 'create' | 'delete';

// E1 (Sprint70): MergeBranchButton — visible only on non-main branches
interface MergeBranchButtonProps {
  /** Current branch name */
  branch: string;
  /** Current canvas ID */
  canvasId?: string;
  /** Called when merge completes successfully */
  onMergeSuccess?: () => void;
  /** Called to close the panel */
  onClose: () => void;
}

function MergeBranchButton({ branch, canvasId, onMergeSuccess, onClose }: MergeBranchButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const mergeBranch = useCanvasHistoryStore((s) => s.mergeBranch);
  const setCurrentBranch = useCanvasHistoryStore((s) => s.setCurrentBranch);
  const listSnapshots = useCanvasHistoryStore((s) => s.listSnapshots);

  const handleMerge = React.useCallback(async () => {
    if (branch === 'main') return;
    setLoading(true);
    setError(null);
    try {
      await mergeBranch(canvasId ?? '', branch, 'main');
      setCurrentBranch('main');
      // Reload snapshots
      await listSnapshots(canvasId ?? '');
      onMergeSuccess?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '合并失败');
    } finally {
      setLoading(false);
    }
  }, [branch, canvasId, mergeBranch, setCurrentBranch, listSnapshots, onMergeSuccess, onClose]);

  if (branch === 'main') return null;

  return (
    <div className="branch-merge-section">
      <div className="branch-merge-header">
        <span className="branch-merge-label">分支合并</span>
      </div>
      <div className="branch-merge-actions">
        <button
          className="branch-merge-btn"
          onClick={handleMerge}
          disabled={loading}
          title={`将 "${branch}" 分支合并到 main`}
        >
          {loading ? '合并中…' : '合并到主分支'}
        </button>
      </div>
      {error && (
        <div className="branch-merge-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

// E1 (Sprint69): BranchManager
const BranchManager = memo(function BranchManager({
  open,
  canvasId,
  onBranchSwitch,
  onClose,
}: BranchManagerProps) {
  const snapshots = useCanvasHistoryStore((s) => s.snapshots);
  const listSnapshots = useCanvasHistoryStore((s) => s.listSnapshots);
  const createBranch = useCanvasHistoryStore((s) => s.createBranch);
  const deleteBranch = useCanvasHistoryStore((s) => s.deleteBranch);

  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [activeBranch, setActiveBranch] = useState<string>('main');
  const [branches, setBranches] = useState<string[]>(['main']);
  const [branchSnapshots, setBranchSnapshots] = useState<Snapshot[]>([]);

  // New branch form state
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Delete branch state
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load branches whenever panel opens or canvasId changes
  useEffect(() => {
    if (!open) return;
    const uniqueBranches = Array.from(
      new Set(snapshots.map((s) => s.branchName ?? 'main'))
    );
    const sorted = uniqueBranches.sort((a, b) => {
      if (a === 'main') return -1;
      if (b === 'main') return 1;
      return a.localeCompare(b);
    });
    setBranches(sorted.length > 0 ? sorted : ['main']);
  }, [open, snapshots]);

  // Load snapshots for selected branch
  useEffect(() => {
    if (!open) return;
    const filtered = snapshots.filter(
      (s) => (s.branchName ?? 'main') === activeBranch
    );
    setBranchSnapshots(filtered.sort((a, b) => b.timestamp - a.timestamp));
    if (filtered.length > 0) {
      setSelectedSnapshotId(filtered[0].id);
    }
  }, [open, activeBranch, snapshots]);

  const handleSwitchBranch = useCallback(
    (branch: string) => {
      setActiveBranch(branch);
      onBranchSwitch?.(branch);
    },
    [onBranchSwitch]
  );

  const handleCreateBranch = useCallback(async () => {
    const name = newBranchName.trim();
    if (!name) {
      setCreateError('请输入分支名称');
      return;
    }
    if (name === 'main') {
      setCreateError('分支名称不能为 "main"');
      return;
    }
    if (branches.includes(name)) {
      setCreateError('分支已存在，请使用其他名称');
      return;
    }
    if (!selectedSnapshotId) {
      setCreateError('请选择一个快照作为分支起点');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createBranch(canvasId ?? '', selectedSnapshotId, name);
      setNewBranchName('');
      setSelectedSnapshotId('');
      setActiveTab('list');
      // Reload branches
      const allSnaps = await listSnapshots(canvasId ?? '');
      const unique = Array.from(
        new Set(allSnaps.map((s) => s.branchName ?? 'main'))
      );
      const sorted = unique.sort((a, b) => {
        if (a === 'main') return -1;
        if (b === 'main') return 1;
        return a.localeCompare(b);
      });
      setBranches(sorted);
      setActiveBranch(name);
    } catch (e) {
      setCreateError(
        `创建分支失败: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setCreateLoading(false);
    }
  }, [
    newBranchName,
    branches,
    selectedSnapshotId,
    canvasId,
    createBranch,
    listSnapshots,
  ]);

  const handleDeleteBranch = useCallback(async () => {
    if (!branchToDelete) return;
    if (branchToDelete === 'main') {
      setDeleteError('不能删除 main 分支');
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteBranch(canvasId ?? '', branchToDelete);
      setBranchToDelete(null);
      // Reload branches
      const allSnaps = await listSnapshots(canvasId ?? '');
      const unique = Array.from(
        new Set(allSnaps.map((s) => s.branchName ?? 'main'))
      );
      const sorted = unique.sort((a, b) => {
        if (a === 'main') return -1;
        if (b === 'main') return 1;
        return a.localeCompare(b);
      });
      setBranches(sorted.length > 0 ? sorted : ['main']);
      if (activeBranch === branchToDelete) {
        setActiveBranch('main');
        onBranchSwitch?.('main');
      }
    } catch (e) {
      setDeleteError(
        `删除分支失败: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setDeleteLoading(false);
    }
  }, [
    branchToDelete,
    canvasId,
    deleteBranch,
    listSnapshots,
    activeBranch,
    onBranchSwitch,
  ]);

  if (!open) return null;

  return (
    <div className="branch-manager" role="dialog" aria-label="分支管理">
      {/* Header */}
      <div className="branch-manager-header">
        <h2 className="branch-manager-title">分支管理</h2>
        <button
          className="branch-manager-close"
          onClick={onClose}
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      {/* E1 (Sprint70): Merge to Main — visible only when on non-main branch */}
      <MergeBranchButton
        branch={activeBranch}
        canvasId={canvasId}
        onClose={onClose}
      />

      {/* Tab navigation */}
      <div className="branch-manager-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'list'}
          className={`branch-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          分支列表
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'create'}
          className={`branch-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          新建分支
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'delete'}
          className={`branch-tab ${activeTab === 'delete' ? 'active' : ''}`}
          onClick={() => setActiveTab('delete')}
        >
          删除分支
        </button>
      </div>

      {/* Tab: List */}
      {activeTab === 'list' && (
        <div className="branch-manager-content" role="tabpanel">
          <div className="branch-list">
            {branches.map((branch) => {
              const count = snapshots.filter(
                (s) => (s.branchName ?? 'main') === branch
              ).length;
              const isActive = branch === activeBranch;
              return (
                <div
                  key={branch}
                  className={`branch-list-item ${isActive ? 'active' : ''}`}
                >
                  <div className="branch-list-info">
                    <span className="branch-list-name">
                      {branch === 'main' ? '⭐ main' : branch}
                    </span>
                    <span className="branch-list-count">{count} 个快照</span>
                  </div>
                  <div className="branch-list-actions">
                    {!isActive && (
                      <button
                        className="branch-action-btn switch"
                        onClick={() => handleSwitchBranch(branch)}
                        title="切换到此分支"
                      >
                        切换
                      </button>
                    )}
                    {isActive && (
                      <span className="branch-active-badge">当前</span>
                    )}
                  </div>
                </div>
              );
            })}
            {branches.length === 0 && (
              <div className="branch-list-empty">暂无分支</div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Create */}
      {activeTab === 'create' && (
        <div className="branch-manager-content" role="tabpanel">
          <div className="branch-form">
            <label className="branch-form-label" htmlFor="branch-name-input">
              分支名称
            </label>
            <input
              id="branch-name-input"
              type="text"
              className="branch-form-input"
              placeholder="例如：feature-x, v2.0"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              maxLength={64}
              autoFocus
            />

            <label className="branch-form-label" htmlFor="source-snapshot-select">
              快照起点（可选）
            </label>
            <select
              id="source-snapshot-select"
              className="branch-form-select"
              value={selectedSnapshotId}
              onChange={(e) => setSelectedSnapshotId(e.target.value)}
            >
              <option value="">当前画布状态</option>
              {branchSnapshots.map((snap) => (
                <option key={snap.id} value={snap.id}>
                  {snap.name} —{' '}
                  {new Date(snap.timestamp).toLocaleString('zh-CN')}
                </option>
              ))}
            </select>

            {createError && (
              <div className="branch-form-error" role="alert">
                {createError}
              </div>
            )}

            <button
              className="branch-form-submit"
              onClick={handleCreateBranch}
              disabled={
                createLoading || !newBranchName.trim() || newBranchName === 'main'
              }
            >
              {createLoading ? '创建中…' : '创建分支'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Delete */}
      {activeTab === 'delete' && (
        <div className="branch-manager-content" role="tabpanel">
          {branches.filter((b) => b !== 'main').length === 0 ? (
            <div className="branch-list-empty">
              没有可删除的分支（main 不可删除）
            </div>
          ) : (
            <div className="branch-list">
              {branches
                .filter((b) => b !== 'main')
                .map((branch) => {
                  const count = snapshots.filter(
                    (s) => (s.branchName ?? 'main') === branch
                  ).length;
                  return (
                    <div key={branch} className="branch-list-item delete-mode">
                      <div className="branch-list-info">
                        <span className="branch-list-name">{branch}</span>
                        <span className="branch-list-count">
                          {count} 个快照
                        </span>
                      </div>
                      <div className="branch-list-actions">
                        {branchToDelete === branch ? (
                          <>
                            <button
                              className="branch-action-btn confirm-delete"
                              onClick={handleDeleteBranch}
                              disabled={deleteLoading}
                            >
                              {deleteLoading ? '…' : '确认'}
                            </button>
                            <button
                              className="branch-action-btn cancel"
                              onClick={() => {
                                setBranchToDelete(null);
                                setDeleteError(null);
                              }}
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <button
                            className="branch-action-btn delete"
                            onClick={() => setBranchToDelete(branch)}
                            title="删除此分支"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          {deleteError && (
            <div className="branch-form-error" role="alert">
              {deleteError}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default BranchManager;
