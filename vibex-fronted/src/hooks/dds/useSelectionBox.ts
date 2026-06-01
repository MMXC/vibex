/**
 * useSelectionBox — Drag-to-select (框选) for DDS Canvas
 *
 * E4: 多选批量操作
 * Implements drag-to-select on the DDS canvas.
 * On drag end, finds all cards within the selection rect and adds them to selectedCardIds.
 *
 * Usage:
 * const { selectionBox, isSelecting, containerRef, clearSelection } = useSelectionBox();
 *
 * containerRef: ref callback — attach to the canvas scroll container
 * selectionBox: render as an overlay div
 * clearSelection: call to clear selection
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDDSCanvasStore } from '@/stores/dds';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Check if a drag-rect intersects with a DOM element rect */
function rectsIntersect(box: Rect, elementRect: DOMRect): boolean {
  const boxRight = box.left + box.width;
  const boxBottom = box.top + box.height;
  return !(
    boxRight < elementRect.left ||
    box.left > elementRect.right ||
    boxBottom < elementRect.top ||
    box.top > elementRect.bottom
  );
}

export interface UseSelectionBoxReturn {
  /** Current selection box rect (null when not selecting) */
  selectionBox: Rect | null;
  /** Whether user is currently drag-selecting */
  isSelecting: boolean;
  /** Ref callback — attach to the scrollable canvas container */
  containerRef: (el: HTMLDivElement | null) => void;
  /** Clear all selected card IDs */
  clearSelection: () => void;
}

/**
 * useSelectionBox — drag-to-select for DDS canvas
 *
 * Attaches raw mouse event listeners to the container element.
 * When a drag completes, finds all [data-card] elements within the selection rect
 * and adds their IDs to useDDSCanvasStore's selectedCardIds.
 */
export function useSelectionBox(enabled = true): UseSelectionBoxReturn {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const isMouseDown = useRef(false);
  const didDrag = useRef(false);

  const [selectionBox, setSelectionBox] = useState<Rect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Keep latest selectionBox in a ref to avoid stale closure in event listeners
  const selectionBoxRef = useRef<Rect | null>(null);
  selectionBoxRef.current = selectionBox;

  const clearSelection = useCallback(() => {
    useDDSCanvasStore.getState().deselectAll();
  }, []);

  /** Set container element and register mouse listeners */
  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    const prev = containerElRef.current;

    // Remove listeners from previous element
    if (prev) {
      prev.removeEventListener('mousedown', handleMouseDown);
    }

    containerElRef.current = el;

    // Add listeners to new element
    if (el) {
      el.addEventListener('mousedown', handleMouseDown);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — event handlers are stable

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Ignore clicks on cards or ReactFlow — those have their own selection
    const target = e.target as HTMLElement;
    if (target.closest('[data-card]') || target.closest('.react-flow__pane')) {
      return;
    }
    if (e.button !== 0) return; // left click only

    isMouseDown.current = true;
    didDrag.current = false;
    startPoint.current = { x: e.clientX, y: e.clientY };
    setIsSelecting(true);
    setSelectionBox(null);
  }, []);

  // These handlers close over containerElRef and selectionBoxRef
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDown.current || !startPoint.current) return;

    const start = startPoint.current;
    const x = Math.min(start.x, e.clientX);
    const y = Math.min(start.y, e.clientY);
    const w = Math.abs(e.clientX - start.x);
    const h = Math.abs(e.clientY - start.y);

    if (w > 5 || h > 5) {
      didDrag.current = true;
    }

    if (didDrag.current) {
      setSelectionBox({ left: x, top: y, width: w, height: h });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    setIsSelecting(false);

    if (didDrag.current) {
      const box = selectionBoxRef.current;
      const container = containerElRef.current;
      if (box && container) {
        const cardElements = container.querySelectorAll('[data-card]');
        const idsInBox: string[] = [];

        cardElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rectsIntersect(box, rect)) {
            const id = el.getAttribute('data-card-id');
            if (id) idsInBox.push(id);
          }
        });

        if (idsInBox.length > 0) {
          const store = useDDSCanvasStore.getState();
          const merged = Array.from(new Set([...store.selectedCardIds, ...idsInBox]));
          useDDSCanvasStore.setState({ selectedCardIds: merged });
        }
      }
      didDrag.current = false;
    }

    startPoint.current = null;
    setSelectionBox(null);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isMouseDown.current) {
      isMouseDown.current = false;
      didDrag.current = false;
      startPoint.current = null;
      setIsSelecting(false);
      setSelectionBox(null);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const container = containerElRef.current;
    if (!container) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleMouseMove, handleMouseUp, handleKeyDown]);

  return {
    selectionBox,
    isSelecting,
    containerRef: setContainerRef,
    clearSelection,
  };
}
