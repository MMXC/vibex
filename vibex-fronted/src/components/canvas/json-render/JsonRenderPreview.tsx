/**
 * JsonRenderPreview — Canvas json-render Preview Component
 * 
 * Renders Canvas component nodes using @json-render/react.
 * Wraps vibexCanvasRegistry.
 * 
 * E1: json-render integration
 */
'use client';

import React, { useMemo } from 'react';
import { Renderer, StateProvider, VisibilityProvider, ActionProvider } from '@json-render/react';
import type { Spec } from '@json-render/core';
import type { ComponentNode, ComponentType } from '@/lib/canvas/types';
import { vibexCanvasRegistry } from '@/lib/canvas-renderer/registry';

interface JsonRenderPreviewProps {
  /** Canvas component nodes to render */
  nodes: ComponentNode[];
  /** Called when a component is clicked */
  onNodeClick?: (nodeId: string, type: string) => void;
  /** Whether to show interaction highlights */
  interactive?: boolean;
}

/**
 * Map Canvas ComponentType to registry component names.
 * Canvas uses lowercase types, registry uses PascalCase names.
 */
const COMPONENT_TYPE_MAP: Record<string, string> = {
  page: 'Page',
  form: 'Form',
  list: 'DataTable',
  detail: 'DetailView',
  modal: 'Modal',
};

/**
 * Convert Canvas ComponentNode[] to json-render Spec format.
 * 
 * json-render Spec is a flat map of elementId → element.
 * We use node.nodeId as elementId.
 */
function nodesToSpec(nodes: ComponentNode[]): Spec | null {
  if (nodes.length === 0) {
    return null;
  }

  const elements: Spec['elements'] = {};
  
  for (const node of nodes) {
    if (!node.name) continue;
    
    // Map Canvas ComponentType to registry component name
    const registryType = COMPONENT_TYPE_MAP[node.type] ?? node.type;
    
    // Build element from ComponentNode
    const element: Spec['elements'][string] = {
      type: registryType,
      props: {
        ...node.props,
        title: node.name,
      },
      children: node.children ?? [],
    };
    
    elements[node.nodeId] = element;
  }

  // Use the first page component as root, or first node
  const root = nodes.find(n => n.type === 'page')?.nodeId ?? nodes[0]?.nodeId;
  
  if (!root) return null;

  return { root, elements };
}

export function JsonRenderPreview({ nodes, onNodeClick, interactive = true }: JsonRenderPreviewProps) {
  const spec = useMemo(() => nodesToSpec(nodes), [nodes]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center py-12 px-6">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <span className="text-gray-400 text-xl">📭</span>
          </div>
          <h3 className="text-sm font-medium text-gray-900">暂无组件</h3>
          <p className="mt-1 text-sm text-gray-500">请先生成组件树</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50" data-testid="json-render-preview">
      <StateProvider>
        <VisibilityProvider>
          <ActionProvider handlers={{}}>
            <Renderer spec={spec} registry={vibexCanvasRegistry} />
          </ActionProvider>
        </VisibilityProvider>
      </StateProvider>
    </div>
  );
}
