/**
 * useCanvasState — pan, zoom, and expand state for the canvas
 *
 * Extracts from CanvasPage.tsx:
 *  - Pan: isSpacePressed, isPanning, panOffset
 *  - Zoom: zoomLevel, zoom handlers
 *  - Expand: expandMode from uiStore
 *  - gridRef: DOM ref for CSS variable application
 *
 * All handlers are aggregated via useMemo to avoid reference churn.
 *
 * Epic: canvas-split-hooks / E1-useCanvasState
 * AGENTS.md: §2.1 Hook Template
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useUIStore } from '@/lib/canvas/stores/uiStore';

// =============================================================================
// Types
// =============================================================================

export type CanvasExpandMode = 'normal' | 'expand-both' | 'maximize';

export interface UseCanvasStateHandlers {
  /** Start pan drag — only fires when space is held */
  handleMouseDown: (e: React.MouseEvent) => void;
  /** Update pan offset during drag */
  handleMouseMove: (e: React.MouseEvent) => void;
  /** End pan drag */
  handleMouseUp: () => void;
  /** Zoom in by ZOOM_STEP */
  handleZoomIn: () => void;
  /** Zoom out by ZOOM_STEP */
  handleZoomOut: () => void;
  /** Reset zoom to 1 and clear pan offset */
  handleZoomReset: () => void;
  /** Toggle maximize / normal expand mode */
  toggleMaximize: () => void;
}

export interface UseCanvasStateReturn {
  /** Current zoom level (1 = 100%) */
  zoomLevel: number;
  /** True while space key is held down */
  isSpacePressed: boolean;
  /** True while user is dragging to pan */
  isPanning: boolean;
  /** Current pan offset in pixels */
  panOffset: { x: number; y: number };
  /** Ref to the canvas grid container */
  gridRef: React.RefObject<HTMLDivElement | null>;
  /** Current expand mode */
  expandMode: CanvasExpandMode;
  /** Set expand mode directly */
  setExpandMode: (mode: CanvasExpandMode) => void;
  /** All handlers aggregated (useMemo) */
  handlers: UseCanvasStateHandlers;
}

// =============================================================================
// Constants
// =============================================================================

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.0;

// =============================================================================
// Hook
// =============================================================================

export function useCanvasState(): UseCanvasStateReturn {
  // --- Zoom state ---
  const [zoomLevel, setZoomLevel] = useState(1);

  // --- Pan state ---
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // --- Grid ref ---
  const gridRef = useRef<HTMLDivElement>(null);

  // --- Expand state (delegated to uiStore) ---
  const expandMode = useUIStore((s) => s.expandMode) as CanvasExpandMode;
  const setExpandMode = useUIStore((s) => s.setExpandMode) as (mode: CanvasExpandMode) => void;
  const toggleMaximize = useUIStore((s) => s.toggleMaximize);

  // --- Space key listener ---
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;
        if (target.getAttribute('contenteditable') === 'true') return;
        const role = target.getAttribute('role');
        if (role === 'textbox' || role === 'searchbox' || role === 'combobox') return;
        if (target.id === 'canvas-search-input') return;
        e.preventDefault();
        setIsSpacePressed(true);
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
        lastMousePosRef.current = null;
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // --- Apply pan offset to CSS variable ---
  useEffect(() => {
    if (!gridRef.current) return;
    gridRef.current.style.setProperty('--canvas-pan-x', `${panOffset.x}px`);
    gridRef.current.style.setProperty('--canvas-pan-y', `${panOffset.y}px`);
  }, [panOffset]);

  // --- Apply zoom level to CSS variable ---
  useEffect(() => {
    if (!gridRef.current) return;
    gridRef.current.style.setProperty('--canvas-zoom', String(zoomLevel));
  }, [zoomLevel]);

  // --- Apply expand mode to grid layout ---
  useEffect(() => {
    if (!gridRef.current) return;
    const grid = gridRef.current;
    if (expandMode === 'expand-both' || expandMode === 'maximize') {
      grid.style.setProperty('--grid-left', '1fr');
      grid.style.setProperty('--grid-center', '1fr');
      grid.style.setProperty('--grid-right', '1fr');
    } else {
      grid.style.setProperty('--grid-left', '1fr');
      grid.style.setProperty('--grid-center', '1fr');
      grid.style.setProperty('--grid-right', '1fr');
    }
  }, [expandMode]);

  // --- Panning handlers ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isSpacePressed) return;
      const target = e.target as HTMLElement;
      const tagName = target.tagName;
      if (tagName === 'BUTTON' || tagName === 'INPUT' || tagName === 'TEXTAREA') return;
      e.preventDefault();
      setIsPanning(true);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    },
    [isSpacePressed]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !lastMousePosRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      lastMousePosRef.current = null;
    }
  }, [isPanning]);

  // --- Zoom handlers ---
  const handleZoomIn = useCallback(
    () => setZoomLevel((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM)),
    []
  );

  const handleZoomOut = useCallback(
    () => setZoomLevel((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM)),
    []
  );

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // --- Aggregated handlers (AGENTS.md: useMemo) ---
  const handlers = useMemo<UseCanvasStateHandlers>(
    () => ({
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleZoomIn,
      handleZoomOut,
      handleZoomReset,
      toggleMaximize,
    }),
    [handleMouseDown, handleMouseMove, handleMouseUp, handleZoomIn, handleZoomOut, handleZoomReset, toggleMaximize]
  );

  return {
    zoomLevel,
    isSpacePressed,
    isPanning,
    panOffset,
    gridRef,
    expandMode,
    setExpandMode,
    handlers,
  };
}
