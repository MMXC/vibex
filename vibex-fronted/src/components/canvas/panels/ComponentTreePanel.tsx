/**
 * ComponentTreePanel — ComponentTree wrapped in TreeErrorBoundary + TreePanel
 *
 * Isolates ComponentTree crashes from the rest of the canvas.
 * Includes HoverHotzone for edge interactions.
 *
 * Part of: vibex-architect-proposals-vibex-proposals-20260412 / A-P1-2
 */
'use client';

import React from 'react';
import { ComponentTree } from '../ComponentTree';
import { TreeErrorBoundary } from './TreeErrorBoundary';
import { TreePanel } from '../TreePanel';
import { HoverHotzone } from '../HoverHotzone';
import type { TreeNode } from '@/lib/canvas/types';

interface ComponentTreePanelProps {
  title?: string;
  nodes?: TreeNode[];
  collapsed?: boolean;
  isActive?: boolean;
  onToggleCollapse?: () => void;
  onNodeClick?: (nodeId: string) => void;
  headerActions?: React.ReactNode;
}

export function ComponentTreePanel({
  title = '组件树',
  nodes,
  collapsed,
  isActive,
  onToggleCollapse,
  onNodeClick,
  headerActions,
}: ComponentTreePanelProps) {
  return (
    <TreePanel
      tree="component"
      title={title}
      nodes={nodes ?? []}
      collapsed={collapsed ?? false}
      isActive={isActive ?? false}
      onToggleCollapse={onToggleCollapse ?? (() => {})}
      onNodeClick={onNodeClick}
      headerActions={headerActions}
    >
      <HoverHotzone position="left-edge" panel="right" />
      <TreeErrorBoundary>
        <ComponentTree />
      </TreeErrorBoundary>
      <HoverHotzone position="right-edge" panel="right" />
    </TreePanel>
  );
}
