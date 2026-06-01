'use client';

/**
 * MiniMapPanel — P005-E3: MiniMap in collapsible left panel
 *
 * - Toggle button always visible at bottom-left of canvas
 * - When panelOpen: shows MiniMap with click-to-navigate + viewport border
 * - Clicking MiniMap → smooth scroll to corresponding viewport position
 * - Viewport border rectangle follows viewportBounds in real-time
 */
import React, { memo, useCallback } from 'react';
import { MiniMap, useReactFlow, useNodes } from '@xyflow/react';
import { useMiniMapStore } from '@/lib/canvas/stores/miniMapStore';
import { getMiniMapNodeColor } from '@/lib/canvas/miniMapUtils';
import styles from './MiniMapPanel.module.css';

interface MiniMapPanelProps {
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 180;
const DEFAULT_HEIGHT = 120;

export const MiniMapPanel = memo(function MiniMapPanel({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: MiniMapPanelProps) {
  const rf = useReactFlow();
  const nodes = useNodes();

  const { panelOpen, togglePanel, viewport } = useMiniMapStore();

  /** Convert MiniMap click to flow viewport coordinates and navigate */
  const handleMiniMapClick = useCallback(
    (event: React.MouseEvent) => {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

      // Normalize click position to 0..1 within minimap
      const ratioX = (event.clientX - rect.left) / rect.width;
      const ratioY = (event.clientY - rect.top) / rect.height;

      const allNodes = rf.getNodes();
      if (!allNodes || allNodes.length === 0) return;

      // Compute node extent in flow coordinates
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const node of allNodes) {
        const nw = (node.measured?.width ?? node.width ?? 200);
        const nh = (node.measured?.height ?? node.height ?? 60);
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + nw);
        maxY = Math.max(maxY, node.position.y + nh);
      }

      const padding = 200;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const flowW = maxX - minX;
      const flowH = maxY - minY;

      // Get current viewport dimensions from ReactFlow
      const vp = rf.getViewport();
      const vpWidth = 800; // fallback
      const vpHeight = 600; // fallback

      // Target center in flow coordinates
      const targetX = ratioX * flowW - vpWidth / 2 / vp.zoom;
      const targetY = ratioY * flowH - vpHeight / 2 / vp.zoom;

      rf.setViewport({ x: targetX, y: targetY, zoom: vp.zoom }, { duration: 400 });
    },
    [rf]
  );

  /** Compute viewport border rect in minimap coordinates */
  const viewportBorderStyle = (() => {
    const allNodes = rf.getNodes();
    if (!allNodes || allNodes.length === 0 || allNodes.every(n => !n.width && !n.measured?.width)) {
      return null;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of allNodes) {
      const nw = (node.measured?.width ?? node.width ?? 200);
      const nh = (node.measured?.height ?? node.height ?? 60);
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nw);
      maxY = Math.max(maxY, node.position.y + nh);
    }

    const padding = 200;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const flowW = maxX - minX;
    const flowH = maxY - minY;
    if (flowW <= 0 || flowH <= 0) return null;

    // Viewport top-left in flow coordinates
    const vpX = -viewport.x / viewport.zoom;
    const vpY = -viewport.y / viewport.zoom;
    const vpW = 800 / viewport.zoom; // approximate canvas width
    const vpH = 600 / viewport.zoom; // approximate canvas height

    // Map to minimap 0..1 space
    const rLeft = (vpX - minX) / flowW;
    const rTop = (vpY - minY) / flowH;
    const rRight = (vpX + vpW - minX) / flowW;
    const rBottom = (vpY + vpH - minY) / flowH;

    return {
      left: `${Math.max(0, rLeft) * width}px`,
      top: `${Math.max(0, rTop) * height}px`,
      width: `${Math.min(width - Math.max(0, rLeft) * width, (Math.min(1, rRight) - Math.max(0, rLeft)) * width)}px`,
      height: `${Math.min(height - Math.max(0, rTop) * height, (Math.min(1, rBottom) - Math.max(0, rTop)) * height)}px`,
    };
  })();

  return (
    <>
      {/* Toggle button — always visible at bottom-left */}
      <button
        className={styles.toggleBtn}
        onClick={togglePanel}
        title={panelOpen ? '关闭 MiniMap' : '打开画布缩略图'}
        aria-label={panelOpen ? '关闭 MiniMap' : '打开画布缩略图'}
        data-testid="minimap-toggle"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="rgba(59,130,246,0.3)" />
          <path d="M7 4H9M7 12H9M4 7V9M12 7V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* MiniMap panel — collapsible left panel */}
      {panelOpen && (
        <div className={styles.panel} data-testid="minimap-panel">
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>画布缩略图</span>
            <button
              className={styles.closeBtn}
              onClick={togglePanel}
              aria-label="关闭"
              data-testid="minimap-close"
            >
              ×
            </button>
          </div>

          {/* MiniMap with click-to-navigate */}
          <div
            className={styles.minimapContainer}
            data-testid="minimap-canvas"
          >
            <MiniMap
              nodeColor={getMiniMapNodeColor}
              maskColor="rgba(0,0,0,0.5)"
              style={{ width, height }}
              onClick={handleMiniMapClick}
              pannable
              zoomable
            />

            {/* Viewport border — blue rectangle showing current view */}
            {viewportBorderStyle && (
              <div
                className={styles.viewportBorder}
                style={viewportBorderStyle}
                data-testid="minimap-viewport-border"
              />
            )}
          </div>

          <div className={styles.hint}>点击缩略图跳转 · 拖动缩放</div>
        </div>
      )}
    </>
  );
});
