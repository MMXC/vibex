/**
 * edgePath.ts — BoundedEdge / FlowEdge 贝塞尔曲线路径计算
 *
 * Epic 3 F3.2 / F3.3
 *
 * 计算从源节点中心到目标节点中心的贝塞尔路径。
 * 支持三种 anchor 方向组合，保证连线不穿越节点。
 */

import type { NodeRect, BoundedEdgeType, FlowEdgeType } from '@/lib/canvas/types';

// =============================================================================
// Constants
// =============================================================================

/** 每种 BoundedEdgeType 对应的颜色 */
export const BOUNDED_EDGE_COLORS: Record<BoundedEdgeType, string> = {
  dependency: '#6366f1',   // indigo — 依赖
  composition: '#8b5cf6',  // violet — 组合/聚合
  association: '#94a3b8',  // slate — 关联
};

/** 每种 FlowEdgeType 对应的样式 */
export const FLOW_EDGE_STYLES: Record<FlowEdgeType, { stroke: string; strokeWidth: number; dashArray?: string }> = {
  sequence: { stroke: '#3b82f6', strokeWidth: 1.5, dashArray: undefined },
  branch:   { stroke: '#f59e0b', strokeWidth: 1.5, dashArray: '5,3' },
  loop:     { stroke: '#8b5cf6', strokeWidth: 1.5, dashArray: undefined },
};

// =============================================================================
// Anchor helpers
// =============================================================================

/** 计算节点中心 */
export function nodeCenter(rect: NodeRect): { cx: number; cy: number } {
  return {
    cx: rect.x + rect.width / 2,
    cy: rect.y + rect.height / 2,
  };
}

/** 确定最佳 anchor 方向（避免连线穿过节点） */
export function bestAnchor(from: NodeRect, to: NodeRect): { fromAnchor: 'right' | 'left' | 'top' | 'bottom'; toAnchor: 'left' | 'right' | 'top' | 'bottom' } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // 改进阈值：从 absDx >= absDy 改为 absDx >= absDy * 0.5
  // 使水平锚点在 dx 较小（但 dy 更大）时也能被选中
  if (absDx >= absDy * 0.5) {
    return dx >= 0
      ? { fromAnchor: 'right', toAnchor: 'left' }
      : { fromAnchor: 'left', toAnchor: 'right' };
  }
  // 垂直锚点
  return dy >= 0
    ? { fromAnchor: 'bottom', toAnchor: 'top' }
    : { fromAnchor: 'top', toAnchor: 'bottom' };
}

/** 获取 anchor 对应的连接点坐标 */
function anchorPoint(rect: NodeRect, anchor: 'right' | 'left' | 'top' | 'bottom'): { x: number; y: number } {
  const { cx, cy } = nodeCenter(rect);
  switch (anchor) {
    case 'right':  return { x: rect.x + rect.width, y: cy };
    case 'left':   return { x: rect.x, y: cy };
    case 'bottom': return { x: cx, y: rect.y + rect.height };
    case 'top':    return { x: cx, y: rect.y };
  }
}

// =============================================================================
// BoundedEdge path computation
// =============================================================================

/**
 * 计算两个节点之间的贝塞尔曲线路径
 *
 * @param from 源节点矩形
 * @param to 目标节点矩形
 * @param fromAnchor 源节点 anchor 方向（默认自动）
 * @param toAnchor 目标节点 anchor 方向（默认自动）
 * @returns SVG path d attribute
 */
export function computeBoundedEdgePath(
  from: NodeRect,
  to: NodeRect,
  fromAnchor: 'right' | 'left' | 'top' | 'bottom' = 'right',
  toAnchor: 'left' | 'right' | 'top' | 'bottom' = 'left'
): string {
  const sp = anchorPoint(from, fromAnchor);
  const tp = anchorPoint(to, toAnchor);

  const sx = sp.x;
  const sy = sp.y;
  const tx = tp.x;
  const ty = tp.y;

  const dx = Math.abs(tx - sx);
  const dy = Math.abs(ty - sy);

  // 水平连线：用水平控制点
  if ((fromAnchor === 'right' || fromAnchor === 'left') && (toAnchor === 'left' || toAnchor === 'right')) {
    const cpOffset = Math.min(dx * 0.5, 80);
    return `M ${sx} ${sy} C ${sx + (fromAnchor === 'right' ? cpOffset : -cpOffset)} ${sy}, ${tx + (toAnchor === 'left' ? -cpOffset : cpOffset)} ${ty}, ${tx} ${ty}`;
  }

  // 垂直连线：用垂直控制点
  if ((fromAnchor === 'top' || fromAnchor === 'bottom') && (toAnchor === 'top' || toAnchor === 'bottom')) {
    const cpOffset = Math.min(dy * 0.5, 80);
    return `M ${sx} ${sy} C ${sx} ${sy + (fromAnchor === 'bottom' ? cpOffset : -cpOffset)}, ${tx} ${ty + (toAnchor === 'top' ? -cpOffset : cpOffset)}, ${tx} ${ty}`;
  }

  // 混合方向（从右到上等）
  const cpOffset = Math.min(Math.max(dx, dy) * 0.4, 60);
  const cp1x = fromAnchor === 'right' ? sx + cpOffset : fromAnchor === 'left' ? sx - cpOffset : sx;
  const cp1y = fromAnchor === 'bottom' ? sy + cpOffset : fromAnchor === 'top' ? sy - cpOffset : sy;
  const cp2x = toAnchor === 'left' ? tx - cpOffset : toAnchor === 'right' ? tx + cpOffset : tx;
  const cp2y = toAnchor === 'top' ? ty - cpOffset : toAnchor === 'bottom' ? ty + cpOffset : ty;
  return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
}

/**
 * 计算两点之间的贝塞尔曲线路径（通用版本）
 */
export function computeEdgePath(from: NodeRect, to: NodeRect): string {
  const { fromAnchor, toAnchor } = bestAnchor(from, to);
  return computeBoundedEdgePath(from, to, fromAnchor as 'right' | 'left' | 'top' | 'bottom', toAnchor as 'left' | 'right' | 'top' | 'bottom');
}

// =============================================================================
// FlowEdge path computation
// =============================================================================

/**
 * 计算流程节点之间的连线路径
 *
 * sequence: 直线贝塞尔
 * branch:   虚线贝塞尔
 * loop:     回环曲线（从节点底部绕回）
 */
export function computeFlowEdgePath(from: NodeRect, to: NodeRect, type: FlowEdgeType): string {
  const { cx: sx, cy: sy } = nodeCenter(from);
  const { cx: tx, cy: ty } = nodeCenter(to);

  if (type === 'loop') {
    // 回环：从节点底部中心绕回目标节点顶部
    const bottomY = from.y + from.height;
    const topY = to.y;
    const leftX = Math.min(from.x, to.x);
    const rightX = Math.max(from.x + from.width, to.x + to.width);
    const loopW = Math.max(40, (rightX - leftX) * 0.3);
    const loopH = Math.max(30, Math.abs(ty - sy) * 0.5);

    return [
      `M ${sx} ${bottomY}`,
      `C ${sx + loopW} ${bottomY + loopH}`,
      ` ${tx + loopW} ${topY - loopH}`,
      ` ${tx} ${topY}`,
    ].join(' ');
  }

  // sequence / branch: 贝塞尔曲线
  const dx = Math.abs(tx - sx);
  const cp = Math.min(dx * 0.4, 60);
  const cp1x = tx > sx ? sx + cp : sx - cp;
  const cp2x = tx > sx ? tx - cp : tx + cp;
  return `M ${sx} ${sy} C ${cp1x} ${sy}, ${cp2x} ${ty}, ${tx} ${ty}`;
}

// =============================================================================
// Label position
// =============================================================================

/** 获取连线中点坐标（用于放置 label） */
export function edgeMidpoint(from: NodeRect, to: NodeRect): { x: number; y: number } {
  const fp = nodeCenter(from);
  const tp = nodeCenter(to);
  return { x: (fp.cx + tp.cx) / 2, y: (fp.cy + tp.cy) / 2 };
}
