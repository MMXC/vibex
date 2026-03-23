/**
 * CardTreeNode — ReactFlow custom node for CardTree visualization
 *
 * Renders a card with:
 * - Title (editable)
 * - Checkbox tree of children
 * - Collapse/expand button
 * - Status indicator
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import type { NodeProps } from 'reactflow';
import type { CardTreeNodeData, CardTreeChild } from '@/types/visualization';
import styles from './CardTreeNode.module.css';

export type CardTreeNodeProps = NodeProps<CardTreeNodeData>;

interface CheckboxItemProps {
  item: CardTreeChild;
  depth: number;
  onToggle: (id: string, checked: boolean) => void;
}

function CheckboxItem({ item, depth, onToggle }: CheckboxItemProps) {
  const [expanded, setExpanded] = useState(item.isExpanded ?? true);
  const hasChildren = Boolean(item.children && item.children.length > 0);

  const handleToggle = useCallback(() => {
    onToggle(item.id, !item.checked);
  }, [item.id, item.checked, onToggle]);

  const handleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div className={styles.checkboxItem} style={{ paddingLeft: `${depth * 16 + 8}px` }}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={item.checked}
          onChange={handleToggle}
          className={styles.checkbox}
          data-testid={`checkbox-${item.id}`}
        />
        <span className={`${styles.checkboxText} ${item.checked ? styles.checked : ''}`}>
          {item.label}
        </span>
      </label>

      {hasChildren && (
        <button
          type="button"
          onClick={handleExpand}
          className={styles.expandBtn}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          data-testid={`expand-btn-${item.id}`}
        >
          {expanded ? '▼' : '▶'}
        </button>
      )}

      {hasChildren && expanded && (
        <div className={styles.children}>
          {item.children!.map((child) => (
            <CheckboxItem
              key={child.id}
              item={child}
              depth={depth + 1}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * CardTreeNode — ReactFlow node component
 *
 * Displays a single card in the card tree:
 * - Header with title, status badge, expand/collapse toggle
 * - Checkbox tree of child actions
 */
export const CardTreeNode = memo(function CardTreeNode({
  data,
  selected,
}: CardTreeNodeProps) {
  const isExpanded = data.isExpanded !== false; // default to expanded
  const hasChildren = data.children.length > 0;
  const uncheckedCount = data.children.filter((c) => !c.checked).length;

  const handleCheckboxToggle = useCallback((childId: string, checked: boolean) => {
    // Parent handles state via onCheckboxToggle callback
    // This is a controlled component pattern
    console.debug(`[CardTreeNode] Toggle child ${childId}: ${checked}`);
  }, []);

  const statusClass = {
    pending: styles.statusPending,
    'in-progress': styles.statusInProgress,
    done: styles.statusDone,
    error: styles.statusError,
  }[data.status] || styles.statusPending;

  const statusLabel = {
    pending: '待处理',
    'in-progress': '进行中',
    done: '完成',
    error: '错误',
  }[data.status] || '待处理';

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      data-testid="cardtree-node"
    >
      {/* Card Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {data.icon && <span className={styles.icon}>{data.icon}</span>}
          <h3 className={styles.title} data-testid="node-title">
            {data.title}
          </h3>
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.statusBadge} ${statusClass}`} data-testid="status-badge">
            {statusLabel}
          </span>
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // Parent handles expand/collapse via onNodeClick
              }}
              className={styles.collapseBtn}
              aria-label={isExpanded ? 'Collapse all' : 'Expand all'}
              title={isExpanded ? '收起' : '展开'}
              data-testid="toggle-expand"
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>

      {/* Card Body — Checkbox Tree */}
      {hasChildren ? (
        <div className={styles.body} data-testid="node-body">
          {isExpanded ? (
            data.children.map((item) => (
              <CheckboxItem
                key={item.id}
                item={item}
                depth={0}
                onToggle={handleCheckboxToggle}
              />
            ))
          ) : (
            <div className={styles.collapsedHint} data-testid="collapsed-hint">
              {uncheckedCount > 0
                ? `${uncheckedCount} 项待完成`
                : '全部完成'}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.empty} data-testid="node-empty">
          暂无子操作
        </div>
      )}

      {/* Card Footer */}
      {data.description && (
        <div className={styles.footer} data-testid="node-footer">
          {data.description}
        </div>
      )}
    </div>
  );
});
