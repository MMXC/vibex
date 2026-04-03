/**
 * OverlapHighlightLayer — SVG Layer for Bounded Group Intersection Highlights
 *
 * Epic 3 (Phase2b): F2.1 — 虚线框交集高亮
 *
 * Renders semi-transparent overlays where bounded group rectangles intersect,
 * providing visual feedback for domain coupling.
 *
 * Architecture:
 * - Absolutely positioned SVG over the canvas (pointer-events: none)
 * - Uses Cohen-Sutherland rectangle intersection algorithm
 * - Cached via useMemo — only recomputes when group positions change
 * - z-index: 20 (above BoundedGroupOverlay at z-index 10)
 *
 * Usage:
 *   <OverlapHighlightLayer
 *     groups={boundedGroups}
 *     zoom={viewport.zoom}
 *     pan={{ x: viewport.x, y: viewport.y }}
 *   />
 *
 * Constraint (AGENTS.md红线): pointer-events: none on SVG root
 */
// @ts-nocheck


'use client';

import React, { useMemo, memo } from 'react';
import type { BoundedGroup, BoundedGroupBBox } from '@/lib/canvas/types';

// =============================================================================
// Constants
// =============================================================================

const OVERLAP_FILL = '#6366f1';
const OVERLAP_FILL_OPACITY = 0.15;

// =============================================================================
// Types
// =============================================================================

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IntersectionRect extends Rect {
  groupA: string;
  groupB: string;
}

// =============================================================================
// Rectangle Intersection Utilities
// =============================================================================

/** Check if two rectangles intersect (Cohen-Sutherland simplified) */
function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/**
 * Compute the intersection rectangle of two overlapping rectangles.
 * Returns null if they don't intersect.
 */
function getIntersectionRect(a: Rect, b: Rect): Rect | null {
  if (!rectsIntersect(a, b)) return null;

  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const width = right - x;
  const height = bottom - y;

  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
}

// =============================================================================
// Intersection Computation
// =============================================================================

/**
 * Compute all intersection rectangles between bounded groups.
 * O(n²) — acceptable since n is typically small (≤ 20 groups).
 * Result is memoized in the component.
 */
function computeIntersections(bboxes: BoundedGroupBBox[]): IntersectionRect[] {
  const intersections: IntersectionRect[] = [];

  for (let i = 0; i < bboxes.length; i++) {
    for (let j = i + 1; j < bboxes.length; j++) {
      const a = bboxes[i];
      const b = bboxes[j];
      const rect = getIntersectionRect(a, b);
      if (rect) {
        intersections.push({
          ...rect,
          groupA: a.groupId,
          groupB: b.groupId,
        });
      }
    }
  }

  return intersections;
}

// =============================================================================
// Component Props
// =============================================================================

interface OverlapHighlightLayerProps {
  /**
   * Bounded groups from canvasStore — used to compute bounding boxes.
   * Pass the same array as BoundedGroupOverlay.
   */
  groups: BoundedGroup[];
  /**
   * Pre-computed bounding boxes (from BoundedGroupOverlay.computeGroupBBoxes).
   * If not provided, computes internally.
   */
  bboxes?: BoundedGroupBBox[];
  /** Current zoom level from ReactFlow viewport */
  zoom?: number;
  /** Current pan offset from ReactFlow viewport */
  pan?: { x: number; y: number };
  /** Minimum intersection area to render (px²). Small flashes are ignored. */
  minArea?: number;
}

// =============================================================================
// Component
// =============================================================================

function OverlapHighlightLayerComponent({
  groups,
  bboxes: providedBboxes,
  zoom = 1,
  pan = { x: 0, y: 0 },
  minArea = 4,
}: OverlapHighlightLayerProps) {
  // Compute bboxes if not provided (same logic as BoundedGroupOverlay)
  const bboxes = useMemo(() => {
    if (providedBboxes) return providedBboxes;

    const CARD_HEIGHT = 200;
    const CARD_WIDTH = 240;
    const PAD = 12;
    const LABEL_HEIGHT = 19;

    return groups
      .filter((g) => g.visible !== false && g.nodeIds.length > 0)
      .map((group) => {
        // Note: real positions come from ReactFlow nodes — this is a fallback
        // for standalone use. Pass pre-computed bboxes when used with ReactFlow.
        const width = group.nodeIds.length * CARD_WIDTH + PAD * 2;
        const height = CARD_HEIGHT + PAD * 2;
        return {
          groupId: group.groupId,
          x: 0,
          y: 0,
          width,
          height,
          nodeIds: group.nodeIds,
        } as BoundedGroupBBox;
      });
  }, [groups, providedBboxes]);

  // Compute intersections — cached, only recomputes when bboxes change
  const intersections = useMemo(() => {
    return computeIntersections(bboxes);
  }, [bboxes]);

  // Filter out tiny intersections (noise)
  const significantIntersections = useMemo(
    () => intersections.filter((r) => r.width * r.height >= minArea),
    [intersections, minArea]
  );

  if (significantIntersections.length === 0) {
    return null;
  }

  // SVG size — needs to cover the full canvas area
  const svgWidth = useMemo(() => {
    if (bboxes.length === 0) return 2000;
    return Math.max(...bboxes.map((b) => b.x + b.width + 100)) * zoom + Math.abs(pan.x);
  }, [bboxes, zoom, pan.x]);

  const svgHeight = useMemo(() => {
    if (bboxes.length === 0) return 2000;
    return Math.max(...bboxes.map((b) => b.y + b.height + 100)) * zoom + Math.abs(pan.y);
  }, [bboxes, zoom, pan.y]);

  const svgOffsetX = pan.x;
  const svgOffsetY = pan.y;

  return (
    <svg
      aria-hidden="true"
      className="overlap-highlight-layer"
      data-testid="highlight-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 20,
      }}
    >
      {/* Transform group to match ReactFlow viewport */}
      <g transform={`translate(${svgOffsetX}, ${svgOffsetY}) scale(${zoom})`}>
        <defs>
          <clipPath id="overlap-highlight-clip">
            <rect
              x={-svgOffsetX / zoom}
              y={-svgOffsetY / zoom}
              width={svgWidth / zoom}
              height={svgHeight / zoom}
            />
          </clipPath>
        </defs>

        {significantIntersections.map((rect, i) => (
          <rect
            key={`${rect.groupA}-${rect.groupB}-${i}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill={OVERLAP_FILL}
            fillOpacity={OVERLAP_FILL_OPACITY}
            stroke={OVERLAP_FILL}
            strokeWidth={0.5}
            strokeOpacity={0.3}
            rx={2}
            className="overlap-highlight"
            clipPath="url(#overlap-highlight-clip)"
          />
        ))}
      </g>
    </svg>
  );
}

export const OverlapHighlightLayer = memo(OverlapHighlightLayerComponent);

// Export utilities for testing
export { computeIntersections, getIntersectionRect, rectsIntersect };
