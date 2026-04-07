/**
 * ContextTreePanel — BoundedContextTree wrapped in TreeErrorBoundary + TreePanel
 *
 * Isolates BoundedContextTree crashes from the rest of the canvas.
 * Includes HoverHotzone for edge interactions.
 *
 * Part of: vibex-architect-proposals-vibex-proposals-20260412 / A-P1-2
 */
'use client';

import React from 'react';
import { BoundedContextTree } from '../BoundedContextTree';
import { TreeErrorBoundary } from './TreeErrorBoundary';
import { TreePanel } from '../TreePanel';
import { HoverHotzone } from '../HoverHotzone';
import type { TreeNode } from '@/lib/canvas/types';

interface ContextTreePanelProps {
  title?: string;
  nodes?: TreeNode[];
  collapsed?: boolean;
  isActive?: boolean;
  onToggleCollapse?: () => void;
  onNodeClick?: (nodeId: string) => void;
  headerActions?: React.ReactNode;
}

export function ContextTreePanel({
  title = '限界上下文树',
  nodes,
  collapsed,
  isActive,
  onToggleCollapse,
  onNodeClick,
  headerActions,
}: ContextTreePanelProps) {
  return (
    <TreePanel
      tree="context"
      title={title}
      nodes={nodes ?? []}
      collapsed={collapsed ?? false}
      isActive={isActive ?? false}
      onToggleCollapse={onToggleCollapse ?? (() => {})}
      onNodeClick={onNodeClick}
      headerActions={headerActions}
    >
      <HoverHotzone position="left-edge" panel="left" />
      <TreeErrorBoundary>
        <BoundedContextTree />
      </TreeErrorBoundary>
      <HoverHotzone position="right-edge" panel="left" />
    </TreePanel>
  );
}
