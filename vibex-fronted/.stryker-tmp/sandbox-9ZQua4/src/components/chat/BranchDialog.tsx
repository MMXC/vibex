// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import styles from './BranchDialog.module.css';

export interface Branch {
  id: string;
  name: string;
  messageCount: number;
  createdAt?: string;
  parentBranchId?: string;
  isActive?: boolean;
}

export interface BranchDialogProps {
  /** 对话框是否可见 */
  open: boolean;
  /** 所有分支列表 */
  branches: Branch[];
  /** 当前活跃分支ID */
  activeBranchId?: string;
  /** 关闭对话框 */
  onClose: () => void;
  /** 创建分支回调 */
  onCreateBranch?: (name: string, parentBranchId?: string) => void;
  /** 切换分支回调 */
  onSwitchBranch?: (branchId: string) => void;
  /** 删除分支回调 */
  onDeleteBranch?: (branchId: string) => void;
  /** 合并分支回调 */
  onMergeBranch?: (sourceBranchId: string, targetBranchId: string) => void;
  /** 对话框标题 */
  title?: string;
}

type TabType = 'create' | 'switch' | 'merge';

export function BranchDialog({
  open,
  branches,
  activeBranchId,
  onClose,
  onCreateBranch,
  onSwitchBranch,
  onDeleteBranch,
  onMergeBranch,
  title = '对话分支管理',
}: BranchDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedParentBranch, setSelectedParentBranch] = useState<string>('');
  const [selectedSourceBranch, setSelectedSourceBranch] = useState<string>('');
  const [selectedTargetBranch, setSelectedTargetBranch] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  // 重置状态
  useEffect(() => {
    if (open) {
      setNewBranchName('');
      setSelectedParentBranch(activeBranchId || '');
      setSelectedSourceBranch('');
      setSelectedTargetBranch('');
      setActiveTab('create');
    }
  }, [open, activeBranchId]);

  // 过滤掉自己和目标分支
  const getAvailableTargetBranches = (sourceId: string) => {
    return branches.filter((b) => b.id !== sourceId);
  };

  const handleCreateBranch = () => {
    if (newBranchName.trim() && onCreateBranch) {
      onCreateBranch(newBranchName.trim(), selectedParentBranch || undefined);
      setNewBranchName('');
      setSelectedParentBranch('');
      onClose();
    }
  };

  const handleSwitchBranch = (branchId: string) => {
    if (onSwitchBranch) {
      onSwitchBranch(branchId);
      onClose();
    }
  };

  const handleDeleteBranch = (branchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteBranch && window.confirm('确定要删除这个分支吗？')) {
      onDeleteBranch(branchId);
    }
  };

  const handleMergeBranch = () => {
    if (selectedSourceBranch && selectedTargetBranch && onMergeBranch) {
      onMergeBranch(selectedSourceBranch, selectedTargetBranch);
      setSelectedSourceBranch('');
      setSelectedTargetBranch('');
      onClose();
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsAnimating(false);
    }, 150);
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose} title="关闭">
            ×
          </button>
        </div>

        {/* Tab 导航 */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
            onClick={() => handleTabChange('create')}
          >
            <span className={styles.tabIcon}>+</span>
            创建分支
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'switch' ? styles.active : ''}`}
            onClick={() => handleTabChange('switch')}
          >
            <span className={styles.tabIcon}>⑂</span>
            切换分支
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'merge' ? styles.active : ''}`}
            onClick={() => handleTabChange('merge')}
          >
            <span className={styles.tabIcon}>⟐</span>
            合并分支
          </button>
        </div>

        {/* 内容区域 */}
        <div
          className={`${styles.content} ${isAnimating ? styles.animating : ''}`}
        >
          {/* 创建分支 */}
          {activeTab === 'create' && (
            <div className={styles.tabContent}>
              <p className={styles.description}>
                从现有分支创建一个新的对话分支，继续探索不同的对话方向。
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>分支名称</label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="输入新分支名称..."
                  className={styles.input}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>基于分支 (可选)</label>
                <select
                  value={selectedParentBranch}
                  onChange={(e) => setSelectedParentBranch(e.target.value)}
                  className={styles.select}
                >
                  <option value="">从主分支创建</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.messageCount} 条消息)
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={styles.primaryButton}
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim()}
              >
                创建分支
              </button>
            </div>
          )}

          {/* 切换分支 */}
          {activeTab === 'switch' && (
            <div className={styles.tabContent}>
              <p className={styles.description}>
                切换到其他对话分支，查看不同的对话历史。
              </p>

              <div className={styles.branchList}>
                {branches.length === 0 ? (
                  <div className={styles.emptyState}>暂无分支</div>
                ) : (
                  branches.map((branch) => (
                    <div
                      key={branch.id}
                      className={`${styles.branchItem} ${
                        branch.id === activeBranchId ? styles.active : ''
                      }`}
                      onClick={() => handleSwitchBranch(branch.id)}
                    >
                      <div className={styles.branchInfo}>
                        <span className={styles.branchIcon}>⑂</span>
                        <span className={styles.branchName}>{branch.name}</span>
                        {branch.id === activeBranchId && (
                          <span className={styles.activeTag}>当前</span>
                        )}
                      </div>
                      <div className={styles.branchMeta}>
                        <span className={styles.messageCount}>
                          {branch.messageCount} 条消息
                        </span>
                        {branches.length > 1 &&
                          branch.id !== activeBranchId && (
                            <button
                              className={styles.deleteBtn}
                              onClick={(e) => handleDeleteBranch(branch.id, e)}
                              title="删除分支"
                            >
                              ×
                            </button>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 合并分支 */}
          {activeTab === 'merge' && (
            <div className={styles.tabContent}>
              <p className={styles.description}>
                将一个分支的消息合并到另一个分支中。
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>源分支 (将被合并)</label>
                <select
                  value={selectedSourceBranch}
                  onChange={(e) => {
                    setSelectedSourceBranch(e.target.value);
                    setSelectedTargetBranch('');
                  }}
                  className={styles.select}
                >
                  <option value="">选择源分支...</option>
                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                      disabled={branch.id === activeBranchId}
                    >
                      {branch.name} ({branch.messageCount} 条消息)
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.mergeArrow}>
                <span>↓</span>
                <span className={styles.mergeText}>合并到</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>目标分支</label>
                <select
                  value={selectedTargetBranch}
                  onChange={(e) => setSelectedTargetBranch(e.target.value)}
                  className={styles.select}
                  disabled={!selectedSourceBranch}
                >
                  <option value="">选择目标分支...</option>
                  {getAvailableTargetBranches(selectedSourceBranch).map(
                    (branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.messageCount} 条消息)
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                className={styles.primaryButton}
                onClick={handleMergeBranch}
                disabled={!selectedSourceBranch || !selectedTargetBranch}
              >
                合并分支
              </button>

              <p className={styles.hint}>
                合并后，源分支的消息将添加到目标分支的末尾。源分支不会被删除。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 使用示例的 hooks
export function useBranchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string>('');
  const [resolve, setResolve] = useState<
    ((result: { action: string; data?: unknown }) => void) | null
  >(null);

  const open = (options: {
    branches: Branch[];
    activeBranchId?: string;
  }): Promise<{ action: string; data?: unknown }> => {
    return new Promise((resolveFn) => {
      setBranches(options.branches);
      setActiveBranchId(options.activeBranchId || '');
      setResolve(() => resolveFn);
      setIsOpen(true);
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    resolve?.({ action: 'cancel' });
  };

  const handleCreateBranch = (name: string, parentBranchId?: string) => {
    resolve?.({ action: 'create', data: { name, parentBranchId } });
    setIsOpen(false);
  };

  const handleSwitchBranch = (branchId: string) => {
    resolve?.({ action: 'switch', data: { branchId } });
    setIsOpen(false);
  };

  const handleDeleteBranch = (branchId: string) => {
    resolve?.({ action: 'delete', data: { branchId } });
  };

  const handleMergeBranch = (
    sourceBranchId: string,
    targetBranchId: string
  ) => {
    resolve?.({ action: 'merge', data: { sourceBranchId, targetBranchId } });
    setIsOpen(false);
  };

  return {
    isOpen,
    branches,
    activeBranchId,
    BranchDialog: () => (
      <BranchDialog
        open={isOpen}
        branches={branches}
        activeBranchId={activeBranchId}
        onClose={handleClose}
        onCreateBranch={handleCreateBranch}
        onSwitchBranch={handleSwitchBranch}
        onDeleteBranch={handleDeleteBranch}
        onMergeBranch={handleMergeBranch}
      />
    ),
    open,
  };
}

export default BranchDialog;
