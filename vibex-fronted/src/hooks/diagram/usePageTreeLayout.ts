/**
 * usePageTreeLayout - 布局计算 Hook
 * 支持 TB (从上到下) 和 LR (从左到右) 两种布局方向
 */

import { useMemo } from 'react';

export type LayoutDirection = 'TB' | 'LR';

interface LayoutOptions {
  direction?: LayoutDirection;
  horizontalSpacing?: number;
  verticalSpacing?: number;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function usePageTreeLayout(
  nodeCount: number,
  options: LayoutOptions = {}
): {
  direction: LayoutDirection;
  horizontalSpacing: number;
  verticalSpacing: number;
  estimatedWidth: number;
  estimatedHeight: number;
} {
  const {
    direction = 'TB',
    horizontalSpacing = 180,
    verticalSpacing = 100,
  } = options;

  return useMemo(() => {
    // 估算布局尺寸
    // 假设每个节点平均宽度约 100px，高度约 50px
    const nodeWidth = 100;
    const nodeHeight = 50;

    let estimatedWidth: number;
    let estimatedHeight: number;

    if (direction === 'TB') {
      // 垂直布局：宽度较窄，高度较高
      estimatedWidth = Math.max(nodeWidth * 2, horizontalSpacing);
      estimatedHeight = nodeCount * (nodeHeight + verticalSpacing);
    } else {
      // 水平布局：宽度较高，高度较窄
      estimatedWidth = nodeCount * (nodeWidth + horizontalSpacing);
      estimatedHeight = Math.max(nodeHeight * 2, verticalSpacing);
    }

    return {
      direction,
      horizontalSpacing,
      verticalSpacing,
      estimatedWidth,
      estimatedHeight,
    };
  }, [direction, horizontalSpacing, verticalSpacing, nodeCount]);
}

export default usePageTreeLayout;
