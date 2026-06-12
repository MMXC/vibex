/**
 * MobilePreviewCanvas.tsx — S92-E4: Mobile-First Preview
 *
 * E4-F1: Mobile UA preview mode.
 * Read-only canvas view that supports pinch-to-zoom and pan.
 * No editing controls displayed.
 * Shows canvas name + "桌面端编辑" hint at the top.
 */

'use client';

import React, {
  memo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import type { CanvasNode } from '@xyflow/react';
import { useCanvasViewportStore } from '@/lib/canvas/stores/canvasViewportStore';
import styles from './MobilePreviewCanvas.module.css';

interface MobilePreviewCanvasProps {
  /** Canvas ID */
  canvasId: string;
  /** Canvas name displayed in header */
  canvasName?: string;
  /** Initial nodes from canvas data */
  nodes?: CanvasNode[];
  /** Callback when zoom level changes */
  onZoomChange?: (zoom: number) => void;
}

/** Minimum scale for pinch zoom */
const MIN_SCALE = 0.25;
/** Maximum scale for pinch zoom */
const MAX_SCALE = 3.0;

export const MobilePreviewCanvas = memo(function MobilePreviewCanvas({
  canvasId,
  canvasName = '画布',
  nodes = [],
  onZoomChange,
}: MobilePreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform state (simulates CSS transform)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  // Touch gesture state
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
  const transformStart = useRef({ x: 0, y: 0, scale: 1 });

  // ---- Pinch to Zoom + Pan ----
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastPinchCenter.current = getTouchCenter(e.touches);
      transformStart.current = { ...transform };
    } else if (e.touches.length === 1) {
      lastTouchCenter.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      transformStart.current = { ...transform };
    }
  }, [transform]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);

      if (lastTouchDistance.current !== null && lastPinchCenter.current) {
        const scaleDelta = distance / lastTouchDistance.current;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, transformStart.current.scale * scaleDelta));

        // Pan adjustment during pinch
        const dx = center.x - lastPinchCenter.current.x;
        const dy = center.y - lastPinchCenter.current.y;

        setTransform((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
          scale: newScale,
        }));

        lastPinchCenter.current = center;
        lastTouchDistance.current = distance;
      }
    } else if (e.touches.length === 1 && lastTouchCenter.current) {
      // Single finger pan
      const dx = e.touches[0].clientX - lastTouchCenter.current.x;
      const dy = e.touches[0].clientY - lastTouchCenter.current.y;

      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastTouchCenter.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
    lastPinchCenter.current = null;
  }, []);

  // Wheel zoom on desktop (for tablet hybrid)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * delta));
      return { ...prev, scale: newScale };
    });
  }, []);

  // Notify zoom change
  useEffect(() => {
    onZoomChange?.(transform.scale);
  }, [transform.scale, onZoomChange]);

  // Sync with viewport store
  const { zoom, panX, panY, setViewport } = useCanvasViewportStore();

  useEffect(() => {
    setViewport(transform.x, transform.y, transform.scale);
  }, [transform.x, transform.y, transform.scale, setViewport]);

  return (
    <div className={styles.wrapper}>
      {/* Mobile Preview Header */}
      <div className={styles.header}>
        <div className={styles.canvasName}>{canvasName}</div>
        <div className={styles.hint}>📱 移动端预览 · 桌面端编辑体验更佳</div>
      </div>

      {/* Canvas viewport */}
      <div
        ref={containerRef}
        className={styles.viewport}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        data-testid="mobile-preview-canvas"
      >
        <div
          className={styles.canvasContent}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Render nodes as simplified preview */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={styles.node}
              style={{
                left: (node.position?.x ?? 0),
                top: (node.position?.y ?? 0),
                width: node.measured?.width ?? 160,
                height: node.measured?.height ?? 60,
              }}
            >
              <span className={styles.nodeLabel}>
                {typeof node.data === 'object' && node.data !== null
                  ? (node.data as { label?: string }).label ?? node.type ?? '组件'
                  : node.type ?? '组件'}
              </span>
            </div>
          ))}
        </div>

        {/* Zoom indicator */}
        <div className={styles.zoomIndicator} data-testid="zoom-indicator">
          {Math.round(transform.scale * 100)}%
        </div>
      </div>
    </div>
  );
});
