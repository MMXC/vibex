/**
 * CanvasThumbnail — Mini canvas navigator for ReactFlow
 * Epic: F1.1-U1 Canvas缩略图导航
 *
 * Renders a downscaled SVG overview of all nodes with a viewport indicator.
 * Clicking the indicator navigates the canvas to that region.
 *
 * @module components/dds/canvas/CanvasThumbnail
 */

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import type { Node, Viewport } from '@xyflow/react';
import styles from './CanvasThumbnail.module.css';

// ==================== Constants ====================

const THUMBNAIL_WIDTH = 148; // 160px panel - 12px padding
const THUMBNAIL_HEIGHT = 100;
const THRESHOLD_DEFAULT = 50;
const PADDING = 8;

// ==================== Types ====================

export interface CanvasThumbnailProps {
  /** Minimum node count before showing thumbnail */
  threshold?: number;
  /** Additional class name */
  className?: string;
}

// ==================== Helpers ====================

/** Throttle using requestAnimationFrame */
function throttleRAF<T extends (...args: unknown[]) => void>(fn: T): T {
  let rafId: number | null = null;
  return ((...args: unknown[]) => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      fn(...args);
      rafId = null;
    });
  }) as T;
}

/** Scale world coords to thumbnail coords */
function worldToThumbnail(
  x: number,
  y: number,
  bounds: { x: number; y: number; width: number; height: number },
  thumbW: number,
  thumbH: number
): { x: number; y: number } {
  const scaleX = (thumbW - PADDING * 2) / (bounds.width || 1);
  const scaleY = (thumbH - PADDING * 2) / (bounds.height || 1);
  const scale = Math.min(scaleX, scaleY);
  return {
    x: (x - bounds.x) * scale + PADDING,
    y: (y - bounds.y) * scale + PADDING,
  };
}

// ==================== Component ====================

export function CanvasThumbnail({ threshold = THRESHOLD_DEFAULT, className }: CanvasThumbnailProps) {
  const { getNodes, screenToFlowPosition, getViewport } = useReactFlow();
  const svgRef = useRef<SVGSVGElement>(null);

  const [indicatorRect, setIndicatorRect] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);

  // Update indicator rect on viewport change, throttled with RAF
  const updateIndicator = useCallback(
    throttleRAF(() => {
      const nodes = getNodes();
      if (nodes.length < threshold) {
        setIndicatorRect(null);
        return;
      }

      const viewport = getViewport();
      const bounds = getNodesBounds(nodes);
      if (!bounds) {
        setIndicatorRect(null);
        return;
      }

      // Canvas container dimensions (approximate — we use the transform to derive)
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;

      // World coords of current viewport top-left
      const worldX = -viewport.x / viewport.zoom;
      const worldY = -viewport.y / viewport.zoom;
      const worldW = canvasWidth / viewport.zoom;
      const worldH = canvasHeight / viewport.zoom;

      // Convert world viewport to thumbnail coords
      const topLeft = worldToThumbnail(worldX, worldY, bounds, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      const bottomRight = worldToThumbnail(
        worldX + worldW,
        worldY + worldH,
        bounds,
        THUMBNAIL_WIDTH,
        THUMBNAIL_HEIGHT
      );

      setIndicatorRect({
        x: topLeft.x,
        y: topLeft.y,
        width: Math.max(bottomRight.x - topLeft.x, 4),
        height: Math.max(bottomRight.y - topLeft.y, 4),
      });
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Subscribe to viewport changes via the flow instance
  React.useEffect(() => {
    const nodes = getNodes();
    if (nodes.length < threshold) return;

    // Initial update
    updateIndicator();

    // Listen to viewport changes — use a simple interval to poll (lightweight)
    // Alternatively, we could use onViewportChange but that requires props drilling
    const intervalId = setInterval(updateIndicator, 100);
    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold]);

  // Handle click: convert click position to world coords → setViewport
  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert thumbnail coords → world coords
      const nodes = getNodes();
      if (nodes.length < threshold) return;

      const bounds = getNodesBounds(nodes);
      if (!bounds) return;

      const scaleX = (THUMBNAIL_WIDTH - PADDING * 2) / (bounds.width || 1);
      const scaleY = (THUMBNAIL_HEIGHT - PADDING * 2) / (bounds.height || 1);
      const scale = Math.min(scaleX, scaleY);

      const worldX = (clickX - PADDING) / scale + bounds.x;
      const worldY = (clickY - PADDING) / scale + bounds.y;

      // Convert to screen position for setViewport
      const screenPos = { x: worldX, y: worldY };
      const flowPos = screenToFlowPosition(screenPos);
      const { setViewport } = useReactFlow();
      setViewport({ x: -flowPos.x, y: -flowPos.y, zoom: getViewport().zoom });
    },
    [getNodes, threshold, getNodesBounds, screenToFlowPosition, getViewport]
  );

  const nodes = getNodes();
  if (nodes.length < threshold) return null;

  // Render thumbnail SVG
  const nodesRect = (() => {
    const bounds = getNodesBounds(nodes);
    if (!bounds) return null;
    return bounds;
  })();

  if (!nodesRect) return null;

  return (
    <div className={`${styles.container} ${className ?? ''}`} aria-label="画布缩略图">
      <svg
        ref={svgRef}
        className={styles.svg}
        width={THUMBNAIL_WIDTH}
        height={THUMBNAIL_HEIGHT}
        viewBox={`0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}`}
        onClick={handleClick}
        role="img"
        aria-label="点击跳转到对应区域"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent<SVGSVGElement>);
          }
        }}
      >
        {/* Node bounding boxes */}
        {nodes.map((node) => {
          const posX = (node.position.x - nodesRect.x) * Math.min(
            (THUMBNAIL_WIDTH - PADDING * 2) / (nodesRect.width || 1),
            (THUMBNAIL_HEIGHT - PADDING * 2) / (nodesRect.height || 1)
          ) + PADDING;
          const posY = (node.position.y - nodesRect.y) * Math.min(
            (THUMBNAIL_WIDTH - PADDING * 2) / (nodesRect.width || 1),
            (THUMBNAIL_HEIGHT - PADDING * 2) / (nodesRect.height || 1)
          ) + PADDING;
          const w = Math.max((node.width ?? 100) * Math.min(
            (THUMBNAIL_WIDTH - PADDING * 2) / (nodesRect.width || 1),
            (THUMBNAIL_HEIGHT - PADDING * 2) / (nodesRect.height || 1)
          ), 4);
          const h = Math.max((node.height ?? 40) * Math.min(
            (THUMBNAIL_WIDTH - PADDING * 2) / (nodesRect.width || 1),
            (THUMBNAIL_HEIGHT - PADDING * 2) / (nodesRect.height || 1)
          ), 3);
          return (
            <rect
              key={node.id}
              x={posX}
              y={posY}
              width={w}
              height={h}
              rx={2}
              className={styles.nodeRect}
            />
          );
        })}

        {/* Viewport indicator */}
        {indicatorRect && (
          <rect
            x={indicatorRect.x}
            y={indicatorRect.y}
            width={indicatorRect.width}
            height={indicatorRect.height}
            rx={2}
            className={styles.indicator}
          />
        )}
      </svg>
    </div>
  );
}

// ==================== Types (exported) ====================

export type { Node, Viewport };
