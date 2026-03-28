/**
 * useDragSelection — Drag selection (框选) for canvas tree panels
 *
 * Implements F4: 用户可通过框选选中多个节点
 *
 * Usage:
 * const { selectionBox, isSelecting, containerRef, isNodeInBox } = useDragSelection({
 *   onSelectionChange: (nodeIds) => { ... },
 *   getNodePositions: () => [{ id, rect }, ...],
 * });
 *
 * Then render the selection box:
 * {selectionBox && <div className={styles.dragSelectionBox} style={{ ...selectionBox }} />}
 *
 * And set ref on the scrollable container:
 * <div ref={containerRef} className={styles.contextNodeList} />
 *
 * For keyboard Ctrl/Cmd+click support, also provides:
 * const isModifierHeld = useModifierKey();
 */
'use client';

import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface UseDragSelectionOptions {
  /** Called when the selection changes (array of node IDs within box) */
  onSelectionChange: (nodeIds: string[]) => void;
  /** Return node IDs and their bounding rects */
  getNodePositions: () => Array<{ id: string; rect: DOMRect }>;
  /** Whether drag selection is enabled */
  enabled?: boolean;
}

interface UseDragSelectionReturn {
  /** Current selection box rect (null when not selecting) */
  selectionBox: Rect | null;
  /** Whether user is currently drag-selecting */
  isSelecting: boolean;
  /** Ref to attach to the scrollable container */
  containerRef: RefObject<HTMLElement | null>;
}

/**
 * Hook for drag-to-select (框选) functionality.
 *
 * Works by:
 * 1. Tracking mousedown on the container → record start point
 * 2. Tracking mousemove → update selection box rect
 * 3. On mouseup → compute which nodes are inside box → call onSelectionChange
 */
export function useDragSelection({
  onSelectionChange,
  getNodePositions,
  enabled = true,
}: UseDragSelectionOptions): UseDragSelectionReturn {
  const containerRef = useRef<HTMLElement | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const isMouseDown = useRef(false);
  const didDrag = useRef(false); // distinguish click from drag

  const [selectionBox, setSelectionBox] = useState<Rect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  /** Check if a point is inside the selection box */
  const isPointInBox = useCallback(
    (px: number, py: number, box: Rect): boolean => {
      const minX = box.left;
      const maxX = box.left + box.width;
      const minY = box.top;
      const maxY = box.top + box.height;
      return px >= minX && px <= maxX && py >= minY && py <= maxY;
    },
    []
  );

  /** Check if a node rect intersects with the selection box */
  const doesNodeIntersectBox = useCallback(
    (nodeRect: DOMRect, box: Rect): boolean => {
      const nodeLeft = nodeRect.left;
      const nodeRight = nodeRect.right;
      const nodeTop = nodeRect.top;
      const nodeBottom = nodeRect.bottom;

      const boxLeft = box.left;
      const boxRight = box.left + box.width;
      const boxTop = box.top;
      const boxBottom = box.top + box.height;

      // Intersection: check if the two rectangles overlap
      return !(nodeRight < boxLeft || nodeLeft > boxRight || nodeBottom < boxTop || nodeTop > boxBottom);
    },
    []
  );

  /** Compute which nodes are inside the current selection box */
  const computeSelectedNodes = useCallback(
    (box: Rect): string[] => {
      const nodes = getNodePositions();
      return nodes
        .filter(({ rect }) => doesNodeIntersectBox(rect, box))
        .map(({ id }) => id);
    },
    [getNodePositions, doesNodeIntersectBox]
  );

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only left mouse button
      if (e.button !== 0) return;
      // Don't start if clicking on a button/checkbox/input (they have their own handlers)
      const target = e.target as HTMLElement;
      const tagName = target.tagName;
      if (tagName === 'BUTTON' || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;
      if (target.getAttribute('contenteditable') === 'true') return;
      const role = target.getAttribute('role');
      if (role === 'textbox' || role === 'searchbox' || role === 'combobox') return;
      // Don't start if clicking on checkbox (it handles its own)
      if (tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') return;
      // Don't start if clicking on drag handle
      if (target.classList.contains('stepDragHandle')) return;

      // Ctrl/Cmd click should not start box select (it's handled separately)
      if (e.ctrlKey || e.metaKey) return;

      e.preventDefault();
      isMouseDown.current = true;
      didDrag.current = false;

      // Get container rect for coordinate conversion
      const containerRect = container.getBoundingClientRect();
      const startX = e.clientX - containerRect.left + container.scrollLeft;
      const startY = e.clientY - containerRect.top + container.scrollTop;

      startPoint.current = { x: startX, y: startY };
      setSelectionBox({ left: startX, top: startY, width: 0, height: 0 });
      setIsSelecting(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown.current || !startPoint.current) return;

      const containerRect = container.getBoundingClientRect();
      const currentX = e.clientX - containerRect.left + container.scrollLeft;
      const currentY = e.clientY - containerRect.top + container.scrollTop;

      const { x: startX, y: startY } = startPoint.current;

      // If moved more than 3px, consider it a drag
      if (Math.abs(currentX - startX) > 3 || Math.abs(currentY - startY) > 3) {
        didDrag.current = true;
      }

      // Compute box rect (always positive width/height)
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      setSelectionBox({ left, top, width, height });
    };

    const handleMouseUp = () => {
      if (!isMouseDown.current) return;
      isMouseDown.current = false;

      if (selectionBox && didDrag.current) {
        // Only fire selection change if it was a real drag (not a click)
        const selectedIds = computeSelectedNodes(selectionBox);
        if (selectedIds.length > 0) {
          onSelectionChange(selectedIds);
        }
      }

      startPoint.current = null;
      didDrag.current = false;
      setSelectionBox(null);
      setIsSelecting(false);
    };

    // Cancel on Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelecting) {
        isMouseDown.current = false;
        startPoint.current = null;
        didDrag.current = false;
        setSelectionBox(null);
        setIsSelecting(false);
      }
    };

    // Also handle document-level mouse up (in case mouse up is outside container)
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    container.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enabled, selectionBox, isSelecting, computeSelectedNodes, onSelectionChange]);

  return { selectionBox, isSelecting, containerRef };
}

/**
 * useModifierKey — Track if Ctrl (Windows/Linux) or Cmd (Mac) is held
 *
 * Returns a boolean ref that is updated on keydown/keyup.
 * The ref is stable across renders so consumers don't need it in deps arrays.
 */
export function useModifierKey(): RefObject<boolean> {
  const isModifierRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        isModifierRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        isModifierRef.current = false;
      }
    };
    const handleBlur = () => {
      isModifierRef.current = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return isModifierRef;
}
