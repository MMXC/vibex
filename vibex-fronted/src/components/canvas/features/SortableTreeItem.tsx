/**
 * SortableTreeItem — Drag-and-drop wrapper for tree node cards
 *
 * E2-F7: Node Drag Sorting
 * - Wraps a tree node card with drag-and-drop capability
 * - Shows drag handle icon when not readonly
 * - Records undo snapshot on successful reorder
 *
 * 遵守 AGENTS.md 规范：
 * - 无 any 类型
 * - 无 console.log
 */
'use client';

import React from 'react';
import { useDndSortable, type UseDndSortableOptions } from '@/hooks/canvas/useDndSortable';
import { getHistoryStore } from '@/lib/canvas/historySlice';
import type { TreeType } from '@/lib/canvas/types';
import styles from '@/components/canvas/canvas.module.css';

interface SortableTreeItemProps {
  /** Tree node card children */
  children: React.ReactNode;
  /** Sortable options */
  options: UseDndSortableOptions;
  /** Tree type for undo history recording */
  treeType: TreeType;
  /** Node label for accessibility */
  label: string;
}

/**
 * SortableTreeItem wraps any tree node card with drag-and-drop support.
 * Shows a drag handle on the left side when not disabled.
 */
export function SortableTreeItem({
  children,
  options,
  label,
}: SortableTreeItemProps) {
  const { setNodeRef, dragStyle, isDragging, attributes, listeners } =
    useDndSortable(options);

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={`${styles.sortableTreeItem} ${isDragging ? styles.sortableItemDragging : ''}`}
      data-dragging={isDragging}
      data-node-label={label}
    >
      {/* Drag handle — only show when not dragging */}
      {!options.disabled && (
        <div
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          aria-label={`拖动 ${label}`}
          title="拖动以排序"
          role="button"
          tabIndex={0}
        >
          <svg
            width="12"
            height="16"
            viewBox="0 0 12 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="3" cy="3" r="1.5" fill="currentColor" />
            <circle cx="9" cy="3" r="1.5" fill="currentColor" />
            <circle cx="3" cy="8" r="1.5" fill="currentColor" />
            <circle cx="9" cy="8" r="1.5" fill="currentColor" />
            <circle cx="3" cy="13" r="1.5" fill="currentColor" />
            <circle cx="9" cy="13" r="1.5" fill="currentColor" />
          </svg>
        </div>
      )}
      {children}
    </div>
  );
}
