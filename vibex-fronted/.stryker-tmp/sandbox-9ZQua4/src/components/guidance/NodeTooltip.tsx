/**
 * NodeTooltip — Hover tooltip for flow/component/context nodes
 *
 * E4-T3: Shows on hover for tree nodes with <200ms response time.
 * Uses React.memo + CSS transitions for performance.
 *
 * Usage:
 *   <NodeTooltip />
 *   In tree: onMouseEnter → guidanceStore.showTooltip(id, x, y, content)
 *            onMouseLeave → guidanceStore.hideTooltip()
 */
// @ts-nocheck

'use client';

import React, { memo, useEffect, useState, useCallback } from 'react';
import { useGuidanceStore } from '@/stores/guidanceStore';
import styles from './NodeTooltip.module.css';

// =============================================================================
// Types
// =============================================================================

interface TooltipPosition {
  x: number;
  y: number;
}

const TOOLTIP_OFFSET = 12; // px from cursor
const TOOLTIP_FADE_MS = 120;

// =============================================================================
// Component
// =============================================================================

export const NodeTooltip = memo(function NodeTooltip() {
  const nodeId = useGuidanceStore((s) => s.tooltipNodeId);
  const rawPosition = useGuidanceStore((s) => s.tooltipPosition);
  const content = useGuidanceStore((s) => s.tooltipContent);

  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ x: 0, y: 0 });
  const [displayContent, setDisplayContent] = useState<string | null>(null);

  // Fade in/out instead of instant show/hide for smooth UX
  useEffect(() => {
    if (nodeId && content) {
      // Position near cursor
      const x = Math.min(rawPosition.x + TOOLTIP_OFFSET, window.innerWidth - 240);
      const y = Math.min(rawPosition.y + TOOLTIP_OFFSET, window.innerHeight - 80);
      setPosition({ x, y });
      setDisplayContent(content);

      // Small delay for fade-in (debounced to avoid flicker)
      const showTimer = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(showTimer);
    } else {
      setVisible(false);
      const hideTimer = setTimeout(() => {
        setDisplayContent(null);
      }, TOOLTIP_FADE_MS);
      return () => clearTimeout(hideTimer);
    }
  }, [nodeId, content, rawPosition]);

  if (!displayContent) return null;

  return (
    <div
      className={`${styles.tooltip} ${visible ? styles.visible : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className={styles.content}>
        {displayContent}
      </div>
    </div>
  );
});

/**
 * useNodeTooltip — Hook for tree node components to enable tooltip on hover
 *
 * Returns event handlers to attach to node elements.
 * Automatically debounced for <200ms response time.
 */
export function useNodeTooltip() {
  const showTooltip = useGuidanceStore((s) => s.showTooltip);
  const hideTooltip = useGuidanceStore((s) => s.hideTooltip);
  const moveTooltip = useGuidanceStore((s) => s.moveTooltip);

  // Use a ref to track if we're currently showing a tooltip (prevents rapid flicker)
  const activeIdRef = React.useRef<string | null>(null);
  const moveThrottleRef = React.useRef<number | null>(null);

  const handleMouseEnter = useCallback(
    (nodeId: string, content: string) => (e: React.MouseEvent) => {
      activeIdRef.current = nodeId;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      showTooltip(nodeId, rect.right, rect.top, content);
    },
    [showTooltip]
  );

  const handleMouseLeave = useCallback(
    (nodeId: string) => () => {
      if (activeIdRef.current === nodeId) {
        activeIdRef.current = null;
        hideTooltip();
      }
    },
    [hideTooltip]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Throttle mousemove to ~60fps (16ms), well under 200ms budget
      if (moveThrottleRef.current) return;
      moveThrottleRef.current = window.setTimeout(() => {
        moveThrottleRef.current = null;
      }, 16);
      moveTooltip(e.clientX, e.clientY);
    },
    [moveTooltip]
  );

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseMove: handleMouseMove,
  };
}

export default NodeTooltip;
