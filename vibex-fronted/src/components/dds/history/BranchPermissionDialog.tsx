'use client';

/**
 * BranchPermissionDialog.tsx — E3 (Sprint77) + S90-E2-F3
 *
 * 画布分支权限管理对话框：
 * - Tab 1 "权限管理"：显示分支当前权限（owner/admin/write/read）
 *   允许 owner/admin 转移分支所有权
 * - Tab 2 "合并预览"（S90-E2-F3）：显示源分支到目标分支的完整 diff，
 *   冲突组件高亮标记
 */

import { useState, useEffect, useCallback } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import { useTranslations } from '@/hooks/useTranslations';
import type { BranchPermission } from '@/stores/dds/canvasHistoryStore';
import type { BranchDiffResult } from '@/stores/dds/canvasHistoryStore';
import styles from './BranchPermissionDialog.module.css';

interface BranchPermissionDialogProps {
  canvasId: string;
  branchName: string;
  onClose: () => void;
}

type TabId = 'permission' | 'merge-preview';

export function BranchPermissionDialog({ canvasId, branchName, onClose }: BranchPermissionDialogProps) {
  const t = useTranslations('branchPermission')();
  const getBranchMeta = useCanvasHistoryStore((s) => s.getBranchMeta);
  const getBranchPermission = useCanvasHistoryStore((s) => s.getBranchPermission);
  const setBranchOwner = useCanvasHistoryStore((s) => s.setBranchOwner);
  const snapshots = useCanvasHistoryStore((s) => s.snapshots);
  const currentBranch = useCanvasHistoryStore((s) => s.currentBranch);
  const compareBranches = useCanvasHistoryStore((s) => s.compareBranches);

  // === Shared state ===
  const currentUserId = 'user-1'; // TODO: wire to auth store

  // === Tab state ===
  const [activeTab, setActiveTab] = useState<TabId>('permission');

  // === Permission tab state ===
  const [owner, setOwner] = useState<string>('');
  const [myPermission, setMyPermission] = useState<BranchPermission>('read');
  const [newOwner, setNewOwner] = useState('');
  const [permError, setPermError] = useState('');
  const [permLoading, setPermLoading] = useState(false);

  // === Merge preview tab state ===
  const [mergeBranchA, setMergeBranchA] = useState<string>('main');
  const [mergeBranchB, setMergeBranchB] = useState<string>('main');
  const [mergeDiff, setMergeDiff] = useState<BranchDiffResult | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  // Derive unique branch list from snapshots
  const allBranches = Array.from(new Set(
    snapshots.map((s) => s.branchName ?? 'main')
  )).sort();

  // Initialize merge branches to current branch + first available alternative
  useEffect(() => {
    if (allBranches.length === 0) return;
    if (!allBranches.includes(mergeBranchA)) {
      setMergeBranchA(allBranches[0]);
    }
    if (!allBranches.includes(mergeBranchB)) {
      const alt = allBranches.find((b) => b !== currentBranch) ?? allBranches[0];
      setMergeBranchB(alt);
    }
  }, [allBranches, currentBranch]);

  // Load permission data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const meta = await getBranchMeta(canvasId, branchName);
      if (!cancelled) setOwner(meta?.branchOwner ?? '');
      const perm = await getBranchPermission(canvasId, branchName, currentUserId);
      if (!cancelled) setMyPermission(perm);
    })();
    return () => { cancelled = true; };
  }, [canvasId, branchName, getBranchMeta, getBranchPermission]);

  const handleTransfer = async () => {
    if (!newOwner.trim()) { setPermError('请输入新 owner 用户 ID'); return; }
    setPermLoading(true);
    setPermError('');
    const result = await setBranchOwner(canvasId, branchName, newOwner.trim(), currentUserId);
    setPermLoading(false);
    if (result.ok) {
      setOwner(newOwner.trim());
      setNewOwner('');
      onClose();
    } else {
      setPermError(result.error ?? '转移所有权失败');
    }
  };

  const handleCompare = useCallback(async () => {
    if (mergeBranchA === mergeBranchB) {
      setMergeError('请选择两个不同的分支进行对比');
      return;
    }
    setMergeLoading(true);
    setMergeError(null);
    setMergeDiff(null);
    try {
      const result = await compareBranches(canvasId, mergeBranchA, mergeBranchB);
      setMergeDiff(result);
      if (result.error) {
        setMergeError(result.error);
      }
    } catch (e) {
      setMergeError(`对比失败: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setMergeLoading(false);
    }
  }, [canvasId, mergeBranchA, mergeBranchB, compareBranches]);

  const permissionLabel: Record<BranchPermission, string> = {
    owner: '所有者',
    admin: '管理员',
    write: '可编辑',
    read: '只读',
  };

  const canTransfer = myPermission === 'owner' || myPermission === 'admin';

  const { added, removed, modified } = mergeDiff?.diffs ?? { added: [], removed: [], modified: [] };
  const hasChanges = added.length + removed.length + modified.length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="perm-dialog-title">
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title} id="perm-dialog-title">分支权限管理</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'permission'}
            className={`${styles.tabBtn} ${activeTab === 'permission' ? styles.active : ''}`}
            onClick={() => setActiveTab('permission')}
          >
            🔐 权限管理
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'merge-preview'}
            className={`${styles.tabBtn} ${activeTab === 'merge-preview' ? styles.active : ''}`}
            onClick={() => setActiveTab('merge-preview')}
          >
            ↔ 合并预览
          </button>
        </div>

        {/* === Tab 1: Permission Management === */}
        {activeTab === 'permission' && (
          <div className={styles.body} role="tabpanel">
            <div className={styles.permInfo}>
              <div className={styles.permRow}>
                <span className={styles.permLabel}>分支名称</span>
                <span className={styles.permValue}>{branchName}</span>
              </div>
              <div className={styles.permRow}>
                <span className={styles.permLabel}>当前 Owner</span>
                <span className={styles.permValue}>{owner || '(未设置)'}</span>
              </div>
              <div className={styles.permRow}>
                <span className={styles.permLabel}>我的权限</span>
                <span className={`${styles.permBadge} ${styles[`perm-${myPermission}`]}`}>
                  {permissionLabel[myPermission]}
                </span>
              </div>
            </div>

            {canTransfer ? (
              <div className={styles.permTransfer}>
                <h4>转移所有权</h4>
                <input
                  type="text"
                  className={styles.permInput}
                  placeholder="输入新 owner 用户 ID"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTransfer()}
                />
                {permError && <p className={styles.permError}>{permError}</p>}
                <button className={styles.btnPrimary} onClick={handleTransfer} disabled={permLoading}>
                  {permLoading ? '转移中...' : '确认转移'}
                </button>
              </div>
            ) : (
              <p className={styles.permRestricted}>只有所有者或管理员可以转移分支所有权。</p>
            )}
          </div>
        )}

        {/* === Tab 2: Merge Preview (S90-E2-F3) === */}
        {activeTab === 'merge-preview' && (
          <div className={styles.body} role="tabpanel">
            <div className={styles.mergePreview}>
              {/* Branch selectors */}
              <div className={styles.branchSelectRow}>
                <select
                  className={styles.branchSelect}
                  value={mergeBranchA}
                  onChange={(e) => setMergeBranchA(e.target.value)}
                  aria-label="选择源分支"
                  data-testid="merge-source-select"
                >
                  {allBranches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <span className={styles.branchArrow} aria-hidden="true">→</span>
                <select
                  className={styles.branchSelect}
                  value={mergeBranchB}
                  onChange={(e) => setMergeBranchB(e.target.value)}
                  aria-label="选择目标分支"
                  data-testid="merge-target-select"
                >
                  {allBranches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Compare button */}
              <button
                className={styles.btnPrimary}
                onClick={handleCompare}
                disabled={mergeLoading}
                data-testid="merge-compare-btn"
              >
                {mergeLoading ? '对比中...' : '🔍 对比分支'}
              </button>

              {/* Error */}
              {mergeError && (
                <div className={styles.mergeError}>{mergeError}</div>
              )}

              {/* Loading */}
              {mergeLoading && (
                <div className={styles.mergeLoading}>
                  <span>⚡</span>
                  <span>加载对比结果...</span>
                </div>
              )}

              {/* Diff results */}
              {!mergeLoading && mergeDiff && (
                <>
                  {/* Summary stats */}
                  {mergeDiff.summary && (
                    <div className={styles.diffSummary}>
                      <span className={styles.added}>+{mergeDiff.summary.contextsAdded} 限界上下文</span>
                      <span className={styles.removed}>-{mergeDiff.summary.contextsRemoved} 移除</span>
                      <span className={styles.modified}>~{mergeDiff.summary.contextsModified} 修改</span>
                    </div>
                  )}

                  {/* Diff tree */}
                  <div className={styles.mergeDiff}>
                    {/* No changes */}
                    {!hasChanges && (
                      <div className={styles.noChanges}>
                        <span>✓</span>
                        <span>两个分支完全相同</span>
                      </div>
                    )}

                    {/* Added */}
                    {added.length > 0 && (
                      <div className={styles.diffSection}>
                        <h4 className={styles.diffSectionTitle}>+ 新增 ({added.length})</h4>
                        <div className={styles.diffList}>
                          {added.map((item) => (
                            <div key={item.id} className={`${styles.diffItem} ${styles.added}`}>
                              <span className={styles.diffIcon}>+</span>
                              <span className={styles.diffName}>{item.label ?? item.id}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Removed */}
                    {removed.length > 0 && (
                      <div className={styles.diffSection}>
                        <h4 className={styles.diffSectionTitle}>− 移除 ({removed.length})</h4>
                        <div className={styles.diffList}>
                          {removed.map((item) => (
                            <div key={item.id} className={`${styles.diffItem} ${styles.removed}`}>
                              <span className={styles.diffIcon}>−</span>
                              <span className={styles.diffName}>{item.label ?? item.id}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modified */}
                    {modified.length > 0 && (
                      <div className={styles.diffSection}>
                        <h4 className={styles.diffSectionTitle}>~ 修改 ({modified.length})</h4>
                        <div className={styles.diffList}>
                          {modified.map((item) => (
                            <div key={item.id} className={`${styles.diffItem} ${styles.modified}`}>
                              <span className={styles.diffIcon}>~</span>
                              <span className={styles.diffName}>{item.label ?? item.id}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conflict warning — conflicts come from the BranchConflict type */}
                  {mergeDiff.summary && mergeDiff.summary.contextsModified > 0 && (
                    <div className={styles.mergeError}>
                      ⚠️ 检测到 {mergeDiff.summary.contextsModified} 个冲突节点，合并前请先解决冲突
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
