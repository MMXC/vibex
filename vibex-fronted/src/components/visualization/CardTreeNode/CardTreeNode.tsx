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
  onChildToggle?: (id: string) => void;
}

function CheckboxItem({ item, depth, onToggle, onChildToggle }: CheckboxItemProps) {
  const [expanded, setExpanded] = useState(item.isExpanded ?? true);
  const hasChildren = item.children && item.children.length > 0;

  const handleToggle = useCallback(() => {
    onToggle(item.id, !item.checked);
  }, [item.id, item.checked, onToggle]);

  const handleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
    onChildToggle?.(item.id);
  }, [item.id, onChildToggle]);

  return (
    <div className={styles.checkboxItem} style={{ paddingLeft: `${depth * 16 + 8}px` }}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={item.checked}
          onChange={handleToggle}
          className={styles.checkbox}
        />
        <span
          className={`${styles.checkboxText} ${item.checked ? styles.checked : ''}`}
        >
          {item.label}
        </span>
      </label>

      {hasChildren && (
        <button
          type="button"
          onClick={handleExpand}
          className={styles.expandBtn}
          aria-label={expanded ? 'Collapse' : 'Expand'}
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
              onChildToggle={onChildToggle}
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
 * - Header with title, status badge, expand/collapse
 * - Checkbox tree of child actions
 */
export const CardTreeNode = memo(function CardTreeNode({
  data,
  selected,
}: CardTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(data.isExpanded ?? true);

  const handleChildToggle = useCallback((id: string, checked: boolean) => {
    // Toggle will be handled by the parent via data update
    // This is a controlled component pattern
    console.debug(`[CardTreeNode] Toggle child ${id}: ${checked}`);
  }, []);

  const handleChildExpand = useCallback((id: string) => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleAll = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const statusClass = {
    pending: styles.statusPending,
    'in-progress': styles.statusInProgress,
    done: styles.statusDone,
    error: styles.statusError,
  }[data.status] || styles.statusPending;

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      data-testid="cardtree-node"
    >
      {/* Card Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {data.icon && <span className={styles.icon}>{data.icon}</span>}
          <h3 className={styles.title}>{data.title}</h3>
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {data.status === 'in-progress' ? '进行中' : data.status === 'done' ? '完成' : data.status === 'error' ? '错误' : '待处理'}
          </span>
          {data.children.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className={styles.collapseBtn}
              aria-label={isExpanded ? 'Collapse all' : 'Expand all'}
              title={isExpanded ? '收起' : '展开'}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>

      {/* Card Body — Checkbox Tree */}
      {data.children.length > 0 ? (
        <div className={styles.body}>
          {isExpanded && data.children.map((item) => (
            <CheckboxItem
              key={item.id}
              item={item}
              depth={0}
              onToggle={handleChildToggle}
              onChildToggle={handleChildExpand}
            />
          ))}
          {!isExpanded && (
            <div className={styles.collapsedHint}>
              {data.children.filter((c) => !c.checked).length} 项待完成
            </div>
          )}
        </div>
      ) : (
        <div className={styles.empty}>暂无子操作</div>
      )}

      {/* Card Footer */}
      {data.description && (
        <div className={styles.footer}>
          {data.description}
        </div>
      )}
    </div>
  );
});
