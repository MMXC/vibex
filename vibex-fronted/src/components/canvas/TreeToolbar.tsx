/**
 * TreeToolbar — 统一三栏工具栏
 *
 * E1-T3: 三栏工具栏统一
 * 提供全选、取消、清空、继续按钮
 */
'use client';

import React from 'react';
import type { TreeType } from '@/lib/canvas/types';
import styles from './canvas.module.css';

interface TreeToolbarProps {
  treeType: TreeType;
  nodeCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClear: () => void;
  /** 继续按钮: 传入则显示，phase === 'context' 时需要 */
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  /** 其他自定义按钮 */
  extraButtons?: React.ReactNode;
}

export function TreeToolbar({
  treeType,
  nodeCount,
  onSelectAll,
  onDeselectAll,
  onClear,
  onContinue,
  continueLabel,
  continueDisabled,
  extraButtons,
}: TreeToolbarProps) {
  return (
    <div className={styles.treeToolbar}>
      <span className={styles.treeToolbarCount}>{nodeCount} 个节点</span>
      <div className={styles.treeToolbarButtons}>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={onSelectAll}
          title="全选"
          aria-label="全选所有节点"
        >
          ✓ 全选
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={onDeselectAll}
          title="取消全选"
          aria-label="取消全选"
        >
          ○ 取消
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={onClear}
          title="清空"
          aria-label="清空所有节点"
        >
          ✕ 清空
        </button>
        {onContinue && (
          <button
            type="button"
            className={styles.continueButton}
            onClick={onContinue}
            disabled={continueDisabled}
            aria-label={continueLabel ?? '继续'}
            title={continueLabel ?? '继续'}
          >
            {continueLabel ?? '继续 →'}
          </button>
        )}
        {extraButtons}
      </div>
    </div>
  );
}
