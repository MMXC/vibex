/**
 * HoverHotzone — 8px 展开热区组件
 * E2: CanvasExpandState
 *
 * 位于三栏面板边缘，悬停显示展开箭头，双击恢复默认
 */
// @ts-nocheck

'use client';

import React, { useState } from 'react';

import styles from './hoverHotzone.module.css';

interface HoverHotzoneProps {
  /** 热区位置 */
  position: 'left-edge' | 'right-edge';
  /** 所属面板: 'left' | 'center' | 'right' */
  panel: 'left' | 'center' | 'right';
  /** 中间面板专用：指定展开方向 */
  centerExpandDirection?: 'left' | 'right';
}

/** 展开箭头 SVG 图标 */
function ExpandArrow({ direction }: { direction: 'left' | 'right' | 'contract' }) {
  if (direction === 'left') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (direction === 'right') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // contract (double arrow)
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 3L2 8L5 13M11 3L14 8L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function HoverHotzone({ position, panel, centerExpandDirection }: HoverHotzoneProps) {
  const [hovered, setHovered] = useState(false);

  const togglePanel = useUIStore((s) => s.togglePanel);
  const setCenterExpand = useUIStore((s) => s.setCenterExpand);
  const resetExpand = useUIStore((s) => s.resetExpand);
  const isDragging = useUIStore((s) => s.isDragging);

  const expandState = useUIStore((s) => {
    if (panel === 'left') return s.leftExpand;
    if (panel === 'center') return s.centerExpand;
    return s.rightExpand;
  });

  // E2-3: Highlight hotzone when adjacent panels are expanded
  const leftExpand = useUIStore((s) => s.leftExpand);
  const rightExpand = useUIStore((s) => s.rightExpand);
  const centerExpand = useUIStore((s) => s.centerExpand);

  // Determine if this hotzone should be visually highlighted
  // (adjacent panel is expanded, indicating content is available)
  const isHighlighted = (() => {
    if (position === 'left-edge') {
      // Left edge: between left and center panels
      // Highlight when center panel is expanded left OR left panel is collapsed
      return centerExpand === 'expand-left' || leftExpand === 'default';
    } else {
      // Right edge: between center and right panels
      // Highlight when center panel is expanded right OR right panel is collapsed
      return centerExpand === 'expand-right' || rightExpand === 'default';
    }
  })();

  /** 当前面板展开时，箭头方向 */
  const arrowDirection = (() => {
    if (panel === 'center') {
      // 中间面板：根据 centerExpandDirection 和当前状态决定箭头方向
      if (centerExpandDirection === 'left') {
        return expandState === 'expand-left' ? 'left' : 'right';
      } else {
        return expandState === 'expand-right' ? 'right' : 'left';
      }
    }
    if (position === 'left-edge') {
      // 左边缘：展开左面板时=右箭头(往右扩)，收缩时=左箭头
      return expandState === 'default' ? 'right' : expandState === 'expand-right' ? 'left' : 'right';
    } else {
      // 右边缘：展开右面板时=左箭头(往左扩)，收缩时=右箭头
      return expandState === 'default' ? 'left' : expandState === 'expand-left' ? 'right' : 'left';
    }
  })();

  const handleClick = () => {
    if (isDragging) return; // E3: disable expand during drag
    if (panel === 'center' && centerExpandDirection) {
      // 中间面板：根据热区位置直接设置展开方向
      const targetState = centerExpandDirection === 'left' ? 'expand-left' : 'expand-right';
      if (expandState === targetState) {
        // 已展开，取消展开
        setCenterExpand('default');
      } else {
        // 展开到指定方向
        setCenterExpand(targetState);
      }
    } else if (expandState !== 'default') {
      resetExpand();
    } else {
      togglePanel(panel);
    }
  };

  const handleDoubleClick = () => {
    if (isDragging) return;
    resetExpand();
  };

  const label = isDragging
    ? '拖拽中禁用'
    : expandState === 'default'
      ? `展开 ${panel} 面板`
      : `收缩 ${panel} 面板`;

  return (
    <button
      type="button"
      className={`${styles.hotzone} ${position === 'left-edge' ? styles.leftEdge : styles.rightEdge} ${isDragging ? styles.hotzoneDisabled : ''} ${isHighlighted && !isDragging ? styles.hotzoneActive : ''}`}
      onMouseEnter={() => !isDragging && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      aria-label={label}
      title={label}
      tabIndex={isDragging ? -1 : 0}
      disabled={isDragging}
    >
      <div className={`${styles.indicator} ${hovered ? styles.indicatorVisible : ''}`}>
        <ExpandArrow direction={hovered && expandState !== 'default' ? 'contract' : arrowDirection} />
      </div>
    </button>
  );
}
