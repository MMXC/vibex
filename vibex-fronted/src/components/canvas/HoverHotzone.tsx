/**
 * HoverHotzone — 8px 展开热区组件
 * E2: CanvasExpandState
 *
 * 位于三栏面板边缘，悬停显示展开箭头，双击恢复默认
 */
'use client';

import React, { useState } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import type { PanelExpandState } from '@/lib/canvas/types';
import styles from './hoverHotzone.module.css';

interface HoverHotzoneProps {
  /** 热区位置 */
  position: 'left-edge' | 'right-edge';
  /** 所属面板: 'left' | 'center' | 'right' */
  panel: 'left' | 'center' | 'right';
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

export function HoverHotzone({ position, panel }: HoverHotzoneProps) {
  const [hovered, setHovered] = useState(false);

  const togglePanel = useCanvasStore((s) => s.togglePanel);
  const resetExpand = useCanvasStore((s) => s.resetExpand);

  const expandState = useCanvasStore((s) => {
    if (panel === 'left') return s.leftExpand;
    if (panel === 'center') return s.centerExpand;
    return s.rightExpand;
  });

  /** 当前面板展开时，箭头方向 */
  const arrowDirection = (() => {
    if (position === 'left-edge') {
      // 左边缘：展开左面板时=右箭头(往右扩)，收缩时=左箭头
      return expandState === 'default' ? 'right' : expandState === 'expand-right' ? 'left' : 'right';
    } else {
      // 右边缘：展开右面板时=左箭头(往左扩)，收缩时=右箭头
      return expandState === 'default' ? 'left' : expandState === 'expand-left' ? 'right' : 'left';
    }
  })();

  const handleClick = () => {
    if (expandState !== 'default') {
      resetExpand();
    } else {
      togglePanel(panel);
    }
  };

  const handleDoubleClick = () => {
    resetExpand();
  };

  const label =
    expandState === 'default'
      ? `展开 ${panel} 面板`
      : `收缩 ${panel} 面板`;

  return (
    <button
      type="button"
      className={`${styles.hotzone} ${position === 'left-edge' ? styles.leftEdge : styles.rightEdge}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      aria-label={label}
      title={label}
      tabIndex={0}
    >
      <div className={`${styles.indicator} ${hovered ? styles.indicatorVisible : ''}`}>
        <ExpandArrow direction={hovered && expandState !== 'default' ? 'contract' : arrowDirection} />
      </div>
    </button>
  );
}
