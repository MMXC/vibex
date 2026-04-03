/**
 * useDndSortable — Drag-and-drop sorting hook for canvas tree nodes
 *
 * E2-F7: Node Drag Sorting
 * - Wraps @dnd-kit useSortable with canvas-specific defaults
 * - Disabled when readonly
 * - Returns ref, transform, transition, isDragging for styling
 *
 * 遵守 AGENTS.md 规范：
 * - 无 any 类型
 * - 无 console.log
 */
// @ts-nocheck

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
export interface UseDndSortableResult {
  /** Ref to attach to the sortable element */
  setNodeRef: ReturnType<typeof useSortable>['setNodeRef'];
  /** Transform style for drag animation */
  transform: ReturnType<typeof useSortable>['transform'];
  /** Transition style for smooth animation */
  transition: ReturnType<typeof useSortable>['transition'];
  /** Whether the item is currently being dragged */
  isDragging: boolean;
  /** @dnd-kit drag handle attributes */
  attributes: ReturnType<typeof useSortable>['attributes'];
  /** @dnd-kit drag handle listeners */
  listeners: ReturnType<typeof useSortable>['listeners'];
  /** CSS transform string for inline style */
  dragStyle: React.CSSProperties;
}

export interface UseDndSortableOptions {
  /** Unique ID of the sortable item */
  id: string;
  /** Whether drag is disabled (e.g., readonly mode) */
  disabled?: boolean;
}

/**
 * useDndSortable — returns all needed props for a sortable tree node item
 *
 * @example
 * const { setNodeRef, dragStyle, isDragging, attributes, listeners } = useDndSortable({
 *   id: node.nodeId,
 *   disabled: readonly,
 * });
 */
export function useDndSortable({
  id,
  disabled = false,
}: UseDndSortableOptions): UseDndSortableResult {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id,
    disabled,
  });

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
    dragStyle,
  };
}
