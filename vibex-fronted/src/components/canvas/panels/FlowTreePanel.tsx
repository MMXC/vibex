/**
 * FlowTreePanel — BusinessFlowTree wrapped in TreeErrorBoundary + TreePanel
 *
 * Isolates BusinessFlowTree crashes from the rest of the canvas.
 * Includes HoverHotzone for edge interactions.
 *
 * Part of: vibex-architect-proposals-vibex-proposals-20260412 / A-P1-2
 */
'use client';

import React from 'react';
import { BusinessFlowTree } from '../BusinessFlowTree';
import { TreeErrorBoundary } from './TreeErrorBoundary';
import { TreePanel } from '../TreePanel';
import { HoverHotzone } from '../HoverHotzone';
import type { TreeNode } from '@/lib/canvas/types';

interface FlowTreePanelProps {
  title?: string;
  nodes?: TreeNode[];
  collapsed?: boolean;
  isActive?: boolean;
  onToggleCollapse?: () => void;
  onNodeClick?: (nodeId: string) => void;
  headerActions?: React.ReactNode;
}

export function FlowTreePanel({
  title = '业务流程树',
  nodes,
  collapsed,
  isActive,
  onToggleCollapse,
  onNodeClick,
  headerActions,
}: FlowTreePanelProps) {
  return (
    <TreePanel
      tree="flow"
      title={title}
      nodes={nodes ?? []}
      collapsed={collapsed ?? false}
      isActive={isActive ?? false}
      onToggleCollapse={onToggleCollapse ?? (() => {})}
      onNodeClick={onNodeClick}
      headerActions={headerActions}
    >
      <HoverHotzone position="left-edge" panel="center" centerExpandDirection="left" />
      <TreeErrorBoundary>
        <BusinessFlowTree isActive={isActive ?? false} />
      </TreeErrorBoundary>
      <HoverHotzone position="right-edge" panel="center" centerExpandDirection="right" />
    </TreePanel>
  );
}
