'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './BranchSelector.module.css';

export interface Branch {
  id: string;
  name: string;
  messageCount: number;
  createdAt?: string;
  parentBranchId?: string;
  isActive?: boolean;
}

export interface BranchSelectorProps {
  /** 所有分支列表 */
  branches: Branch[];
  /** 当前活跃分支ID */
  activeBranchId?: string;
  /** 切换分支回调 */
  onSwitchBranch?: (branchId: string) => void;
  /** 打开分支管理对话框 */
  onOpenBranchDialog?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 紧凑模式（用于聊天界面） */
  compact?: boolean;
}

/**
 * 分支选择器组件
 * 用于在聊天界面中快速切换对话分支
 */
export function BranchSelector({
  branches,
  activeBranchId,
  onSwitchBranch,
  onOpenBranchDialog,
  disabled = false,
  compact = false,
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentBranch = branches.find(b => b.id === activeBranchId);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelectBranch = (branchId: string) => {
    if (branchId !== activeBranchId && onSwitchBranch) {
      onSwitchBranch(branchId);
    }
    setIsOpen(false);
  };

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onOpenBranchDialog?.();
  };

  if (branches.length === 0 || (branches.length === 1 && !branches[0].parentBranchId)) {
    // 只有一个分支且没有父分支时，不显示选择器
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={`${styles.container} ${compact ? styles.compact : ''} ${disabled ? styles.disabled : ''}`}
    >
      {/* 触发按钮 */}
      <button
        type="button"
        className={styles.trigger}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.branchIcon}>⑂</span>
        <span className={styles.currentBranch}>
          {currentBranch?.name || '选择分支'}
        </span>
        {branches.length > 1 && (
          <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
            ▼
          </span>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>对话分支</span>
            <span className={styles.branchCount}>{branches.length} 个分支</span>
          </div>

          <div className={styles.branchList}>
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                className={`${styles.branchItem} ${
                  branch.id === activeBranchId ? styles.active : ''
                }`}
                onClick={() => handleSelectBranch(branch.id)}
                role="option"
                aria-selected={branch.id === activeBranchId}
              >
                <span className={styles.branchName}>{branch.name}</span>
                <span className={styles.messageCount}>{branch.messageCount} 条</span>
              </button>
            ))}
          </div>

          {/* 管理按钮 */}
          {onOpenBranchDialog && (
            <div className={styles.dropdownFooter}>
              <button
                type="button"
                className={styles.manageBtn}
                onClick={handleOpenDialog}
              >
                <span className={styles.manageIcon}>⚙</span>
                管理分支
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 分支选择器 Hook - 用于管理分支选择状态
 */
export function useBranchSelector(
  initialBranches: Branch[] = [],
  initialActiveId?: string
) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [activeBranchId, setActiveBranchId] = useState<string | undefined>(initialActiveId);

  const handleSwitchBranch = (branchId: string) => {
    setActiveBranchId(branchId);
  };

  const updateBranches = (newBranches: Branch[]) => {
    setBranches(newBranches);
  };

  const addBranch = (branch: Branch) => {
    setBranches(prev => [...prev, branch]);
  };

  const removeBranch = (branchId: string) => {
    setBranches(prev => prev.filter(b => b.id !== branchId));
    if (activeBranchId === branchId) {
      setActiveBranchId(branches[0]?.id);
    }
  };

  const BranchSelectorComponent = (props: Omit<BranchSelectorProps, 'branches' | 'activeBranchId'>) => (
    <BranchSelector
      branches={branches}
      activeBranchId={activeBranchId}
      onSwitchBranch={handleSwitchBranch}
      {...props}
    />
  );

  return {
    branches,
    activeBranchId,
    setActiveBranchId,
    handleSwitchBranch,
    updateBranches,
    addBranch,
    removeBranch,
    BranchSelector: BranchSelectorComponent,
  };
}

export default BranchSelector;
