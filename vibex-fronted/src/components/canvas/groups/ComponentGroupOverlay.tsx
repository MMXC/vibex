'use client';

import React, { useEffect, useState, useRef, memo, useCallback } from 'react';

interface ComponentGroupBBox {
  groupId: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** E2: Whether this is a common component group */
  isCommon?: boolean;
}

interface ComponentGroupOverlayProps {
  /** Ref to the component tree container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Group bounding boxes */
  groups: ComponentGroupBBox[];
  /** Stroke color for dashed border */
  strokeColor?: string;
}

const STROKE_DASHARRAY = '5 3';
const STROKE_WIDTH = 1.5;
// E2: Common component dashed border style
const COMMON_STROKE_DASHARRAY = '2 2';
const COMMON_STROKE_WIDTH = 2;
const LABEL_FONT_SIZE = 11;
const LABEL_PADDING = 4;
const LABEL_HEIGHT = LABEL_FONT_SIZE + LABEL_PADDING * 2;

/** Compute DOM bounding boxes for each group by querying data-group attribute */
function computeGroupBBoxes(container: HTMLElement, groups: ComponentGroupBBox[]): ComponentGroupBBox[] {
  return groups
    .filter((g) => g.width > 0 && g.height > 0)
    .map((group) => {
      const firstEl = container.querySelector(`[data-component-group="${group.groupId}"]`);
      if (!firstEl) return null;

      // Get the group container element
      const groupEl = firstEl.closest('[data-component-group-wrapper]') as HTMLElement | null;
      const el = groupEl ?? firstEl;

      const rect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Convert to position relative to container
      return {
        ...group,
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
      };
    })
    .filter((b): b is ComponentGroupBBox => b !== null && b.width > 0 && b.height > 0);
}

function ComponentGroupOverlayComponent({
  containerRef,
  groups,
  strokeColor = '#10b981',
}: ComponentGroupOverlayProps) {
  const [bboxes, setBboxes] = useState<ComponentGroupBBox[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateBBoxes = useCallback(() => {
    if (!containerRef.current) return;
    const computed = computeGroupBBoxes(containerRef.current, groups);
    setBboxes(computed);
  }, [containerRef, groups]);

  // Debounced update to avoid excessive recalculations
  const debouncedUpdate = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(updateBBoxes, 100);
  }, [updateBBoxes]);

  // Initial computation + re-compute when groups change
  useEffect(() => {
    debouncedUpdate();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [debouncedUpdate]);

  // Listen to resize/scroll within container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(debouncedUpdate);
    observer.observe(container);

    // Also listen for scroll events
    const onScroll = () => debouncedUpdate();
    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', onScroll);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [containerRef, debouncedUpdate]);

  if (bboxes.length === 0) return null;

  // Compute SVG dimensions
  const svgWidth = Math.max(...bboxes.map((b) => b.x + b.width)) + 20;
  const svgHeight = Math.max(...bboxes.map((b) => b.y + b.height)) + 20;

  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 1,
      }}
    >
      <defs>
        <clipPath id="component-group-clip">
          <rect x={0} y={0} width={svgWidth} height={svgHeight} />
        </clipPath>
      </defs>
      <g clipPath="url(#component-group-clip)">
        {bboxes.map((bbox) => {
          const labelWidth = bbox.label.length * LABEL_FONT_SIZE * 0.6 + LABEL_PADDING * 2;
          const rectX = bbox.x;
          const rectY = bbox.y + LABEL_HEIGHT;
          const rectWidth = bbox.width;
          const rectHeight = Math.max(bbox.height - LABEL_HEIGHT, 0);

          // E2: Use different stroke style for common components
          const isCommon = bbox.isCommon ?? false;
          const strokeDasharray = isCommon ? COMMON_STROKE_DASHARRAY : STROKE_DASHARRAY;
          const strokeWidth = isCommon ? COMMON_STROKE_WIDTH : STROKE_WIDTH;

          return (
            <g
              key={bbox.groupId}
              data-group-overlay={bbox.groupId}
              style={{ pointerEvents: 'none' }}
            >
              {/* Main dashed rect (E2: different style for common components) */}
              <rect
                x={rectX}
                y={rectY}
                width={rectWidth}
                height={rectHeight}
                fill="transparent"
                stroke={bbox.color || strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                rx={isCommon ? 6 : 4}
              />
              {/* Label background */}
              <rect
                x={rectX}
                y={rectY}
                width={Math.min(labelWidth, rectWidth)}
                height={LABEL_HEIGHT}
                fill={bbox.color || strokeColor}
                fillOpacity={isCommon ? 0.15 : 0.1}
                stroke={bbox.color || strokeColor}
                strokeWidth={1}
                strokeOpacity={0.4}
                rx={3}
              />
              {/* Label text */}
              <text
                x={rectX + LABEL_PADDING + 2}
                y={rectY + LABEL_FONT_SIZE + LABEL_PADDING - 1}
                fill={bbox.color || strokeColor}
                fontSize={LABEL_FONT_SIZE}
                fontWeight={isCommon ? 600 : 500}
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{ userSelect: 'none' }}
              >
                {bbox.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export const ComponentGroupOverlay = memo(ComponentGroupOverlayComponent);
export type { ComponentGroupBBox };
