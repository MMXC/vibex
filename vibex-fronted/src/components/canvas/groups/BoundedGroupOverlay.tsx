/**
 * BoundedGroupOverlay — SVG Dashed Rect Overlay for VibeX Canvas
 *
 * Epic E4: vibex-canvas-expandable-20260327
 *
 * Renders SVG dashed rectangles (虚线领域框) that wrap groups of related cards.
 * Uses the ReactFlow viewport transform to position rectangles correctly at any
 * zoom/pan level.
 *
 * Architecture:
 * - Renders as an absolutely-positioned SVG layer over the ReactFlow canvas
 * - pointer-events: none — does not block node interactions
 * - Subscribes to canvasStore boundedGroups + uses passed-in nodes to compute bboxes
 * - Repaints on zoom/pan via CSS transform matching ReactFlow's transform
 *
 * Usage:
 *   <BoundedGroupOverlay
 *     nodes={nodes}
 *     containerRef={containerRef}
 *     viewportTransform={viewport}
 *   />
 */

'use client';

import React, { useMemo, memo } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import type { Node } from '@xyflow/react';
import type { BoundedGroup, BoundedGroupBBox } from '@/lib/canvas/types';
import { BOUNDED_GROUP_COLORS, DEFAULT_GROUP_STROKE_DASHARRAY, DEFAULT_GROUP_STROKE_WIDTH, DEFAULT_GROUP_PADDING } from '@/lib/canvas/types';

const CARD_HEIGHT = 200; // matches CARD_HEIGHT in CardTreeRenderer
const CARD_WIDTH = 240; // approximate card width for bounding box

// SVG label font
const LABEL_FONT_SIZE = 11;
const LABEL_PADDING = 4;
const LABEL_HEIGHT = LABEL_FONT_SIZE + LABEL_PADDING * 2;

/** Compute bounding boxes for each group based on current node positions */
function computeGroupBBoxes(
  nodes: Node[],
  groups: BoundedGroup[]
): BoundedGroupBBox[] {
  return groups
    .filter((g) => g.visible !== false && g.nodeIds.length > 0)
    .map((group) => {
      const groupNodes = nodes.filter((n) => group.nodeIds.includes(n.id));
      if (groupNodes.length === 0) {
        return null;
      }

      // Compute bounding box from node positions
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const node of groupNodes) {
        const { x, y } = node.position;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + CARD_WIDTH);
        maxY = Math.max(maxY, y + CARD_HEIGHT);
      }

      const pad = DEFAULT_GROUP_PADDING;
      return {
        groupId: group.groupId,
        x: minX - pad,
        y: minY - pad - LABEL_HEIGHT, // extra space above for label
        width: maxX - minX + pad * 2,
        height: maxY - minY + pad * 2,
        nodeIds: group.nodeIds,
      };
    })
    .filter((b): b is BoundedGroupBBox => b !== null);
}

interface BoundedGroupOverlayProps {
  /** Current ReactFlow nodes */
  nodes: Node[];
  /** Ref to the ReactFlow container (for absolute positioning) */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /** CSS transform from ReactFlow viewport (e.g., "translate(100, 50) scale(1)") */
  viewportTransform?: string;
  /** Override zoom level (extracted from transform) */
  zoom?: number;
  /** Override pan offset (extracted from transform) */
  pan?: { x: number; y: number };
}

function BoundedGroupOverlayComponent({
  nodes,
  containerRef,
  viewportTransform,
  zoom = 1,
  pan = { x: 0, y: 0 },
}: BoundedGroupOverlayProps) {
  const boundedGroups = useCanvasStore((s) => s.boundedGroups);

  const bboxes = useMemo(
    () => computeGroupBBoxes(nodes, boundedGroups),
    [nodes, boundedGroups]
  );

  // Determine the SVG canvas size — use a large enough viewport to cover all groups
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

  if (bboxes.length === 0) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="bounded-group-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 0,
      }}
    >
      {/* Transform group to match ReactFlow viewport */}
      <g transform={`translate(${svgOffsetX}, ${svgOffsetY}) scale(${zoom})`}>
        <defs>
          <clipPath id="bounded-group-clip">
            <rect x={-svgOffsetX / zoom} y={-svgOffsetY / zoom} width={svgWidth / zoom} height={svgHeight / zoom} />
          </clipPath>
        </defs>

        {bboxes.map((bbox) => {
          const group = boundedGroups.find((g) => g.groupId === bbox.groupId);
          const color = group?.color ?? BOUNDED_GROUP_COLORS[group?.treeType ?? 'context'];
          const label = group?.label ?? bbox.groupId;

          return (
            <g
              key={bbox.groupId}
              data-group-id={bbox.groupId}
              style={{ pointerEvents: 'none' }}
            >
              {/* Main dashed rect */}
              <rect
                x={bbox.x}
                y={bbox.y + LABEL_HEIGHT}
                width={bbox.width}
                height={bbox.height - LABEL_HEIGHT}
                fill="transparent"
                stroke={color}
                strokeWidth={DEFAULT_GROUP_STROKE_WIDTH}
                strokeDasharray={DEFAULT_GROUP_STROKE_DASHARRAY}
                rx={4}
              />

              {/* Label badge (top-left corner of the rect) */}
              <g>
                {/* Label background */}
                <rect
                  x={bbox.x}
                  y={bbox.y}
                  width={label.length * LABEL_FONT_SIZE * 0.6 + LABEL_PADDING * 2}
                  height={LABEL_HEIGHT}
                  fill={color}
                  fillOpacity={0.12}
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  rx={3}
                />
                {/* Label text */}
                <text
                  x={bbox.x + LABEL_PADDING + 2}
                  y={bbox.y + LABEL_FONT_SIZE + LABEL_PADDING - 1}
                  fill={color}
                  fontSize={LABEL_FONT_SIZE}
                  fontWeight={500}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{ userSelect: 'none' }}
                >
                  {label}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export const BoundedGroupOverlay = memo(BoundedGroupOverlayComponent);
export { computeGroupBBoxes };
