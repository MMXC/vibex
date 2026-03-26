/**
 * CardTreeNode — ReactFlow custom node for CardTree visualization
 *
 * Renders a card with:
 * - Title (editable)
 * - Checkbox tree of children (lazy-loaded via IntersectionObserver)
 * - Collapse/expand button
 * - Status indicator
 *
 * Performance: Non-visible cards show a placeholder until scrolled into view.
 */

'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { CardTreeNodeData, CardTreeChild, CardTreeNodeFull } from '@/types/visualization';
import styles from './CardTreeNode.module.css';

// ==================== IntersectionObserver Hook ====================

/**
 * useIntersectionObserver — tracks whether element is visible in viewport
 *
 * Used for lazy loading card content: only render full checkbox tree
 * when the card is scrolled into view.
 */
function useIntersectionObserver(threshold = 0.1): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // In SSR or unsupported environments, show content immediately
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing (no need to keep watching)
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

// ==================== CheckboxItem ====================

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
 * CardTreeNode — ReactFlow node component with lazy loading
 *
 * Displays a single card in the card tree:
 * - Header with title, status badge, expand/collapse toggle
 * - Checkbox tree of child actions (lazy-loaded via IntersectionObserver)
 *
 * Non-visible cards show a skeleton placeholder for performance.
 */
export const CardTreeNode = memo(function CardTreeNode(props: NodeProps<CardTreeNodeFull>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, selected } = props as any as { data: CardTreeNodeData; selected: boolean };
  const isExpanded = data.isExpanded !== false; // default to expanded
  const hasChildren = data.children.length > 0;
  const uncheckedCount = data.children.filter((c: CardTreeChild) => !c.checked).length;
  const [containerRef, isVisible] = useIntersectionObserver(0.1);

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
      ref={containerRef}
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      data-testid="cardtree-node"
      data-visible={isVisible}
    >
      {/* Card Header — always visible */}
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

      {/* Card Body — lazy loaded based on visibility */}
      {hasChildren ? (
        <div className={styles.body} data-testid="node-body">
          {!isVisible ? (
            /* Skeleton placeholder for non-visible cards */
            <div className={styles.lazyPlaceholder} data-testid="lazy-placeholder">
              <div className={styles.lazyBar} style={{ width: '60%' }} />
              <div className={styles.lazyBar} style={{ width: '80%' }} />
              <div className={styles.lazyBar} style={{ width: '40%' }} />
            </div>
          ) : isExpanded ? (
            /* Full content when visible */
            data.children.map((item) => (
              <CheckboxItem
                key={item.id}
                item={item}
                depth={0}
                onToggle={handleCheckboxToggle}
              />
            ))
          ) : (
            /* Collapsed hint when visible but collapsed */
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
