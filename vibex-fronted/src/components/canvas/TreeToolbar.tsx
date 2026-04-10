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
  /** 删除选中节点 (Flow panel only) */
  onDelete?: () => void;
  /** 删除按钮禁用状态 — 无选中节点时禁用 */
  deleteDisabled?: boolean;
  /** 重置画布 (Flow panel only) */
  onReset?: () => void;
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
  onDelete,
  deleteDisabled,
  onReset,
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
          title="取消选择"
          aria-label="取消选择"
        >
          ○ 取消选择
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={onClear}
          title="清空画布"
          aria-label="清空画布"
        >
          ✕ 清空画布
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
        {onDelete && (
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={() => {
              if (window.confirm('确定要删除选中的节点吗？此操作不可撤销。')) {
                onDelete();
              }
            }}
            disabled={deleteDisabled}
            title={deleteDisabled ? '请先选择节点' : '删除选中'}
            aria-label="删除选中的节点"
          >
            🗑 删除
          </button>
        )}
        {onReset && (
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={onReset}
            title="清空当前树所有节点（配合 Ctrl+Z 可撤销）"
            aria-label="清空流程"
          >
            ↺ 清空流程
          </button>
        )}
        {extraButtons}
      </div>
    </div>
  );
}
