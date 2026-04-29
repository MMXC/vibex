/**
 * useMermaidVisualization — Hook for Mermaid diagram visualization
 *
 * Manages Mermaid code rendering with debouncing, error handling,
 * and integration with visualizationStore.
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { mermaidManager } from '@/lib/mermaid/MermaidManager';
import { useVisualizationStore } from '@/stores/visualizationStore';
import type { VisualizationStore, MermaidVisualizationData, MermaidNodeInfo } from '@/types/visualization';

// ==================== Return Type ====================

export interface UseMermaidVisualizationReturn {
  /** Rendered SVG string */
  svg: string;
  /** Whether currently rendering */
  isRendering: boolean;
  /** Error message if rendering failed */
  error: string | null;
  /** Raw mermaid code */
  code: string;
  /** Re-render the diagram */
  rerender: () => void;
  /** Clear the diagram */
  clear: () => void;
  /** Parsed node info for click interactions */
  nodeInfo: MermaidNodeInfo[];
  /** Click a node by ID */
  clickNode: (nodeId: string) => void;
  /** Click callback */
  onNodeClick?: (node: MermaidNodeInfo) => void;
}

// ==================== Helpers ====================

/**
 * Parse Mermaid code to extract node IDs for click interactions.
 * Supports: graph TD/LR/RL/BT, flowchart, pie, sequence, class, state, ER
 */
function parseMermaidNodes(code: string): MermaidNodeInfo[] {
  if (!code?.trim()) return [];

  const nodes: MermaidNodeInfo[] = [];

  // Match node definitions: nodeId[label] or nodeId(label) etc.
  // Handles: A, A[Label], A(Label), A{Label}, A-.->B, A-->B
  const nodePattern = /([A-Za-z0-9_]+)\s*(?:\[|\(|\{)/g;
  let match;
  const seen = new Set<string>();

  while ((match = nodePattern.exec(code)) !== null) {
    const nodeId = match[1]!;
    if (!seen.has(nodeId)) {
      seen.add(nodeId);
      nodes.push({
        id: nodeId,
        label: nodeId,
        type: 'node',
        raw: match[0],
      });
    }
  }

  return nodes;
}

// ==================== Hook ====================

/**
 * useMermaidVisualization — Manages Mermaid diagram rendering
 *
 * @param rawCode - Mermaid code string (from store or props)
 * @returns SVG, rendering state, and helper functions
 */
export function useMermaidVisualization(
  rawCode: string | null | undefined
): UseMermaidVisualizationReturn {
  const [svg, setSvg] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodeInfo, setNodeInfo] = useState<MermaidNodeInfo[]>([]);

  // Store for syncing selected node
  const setOption = useVisualizationStore((state: VisualizationStore) => state.setOption);

  // Use ref to avoid stale closure in debounce
  const codeRef = useRef(rawCode ?? '');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    codeRef.current = rawCode ?? '';
  }, [rawCode]);

  // Parse node info when code changes
  useEffect(() => {
    const nodes = parseMermaidNodes(rawCode ?? '');
    setNodeInfo(nodes);
  }, [rawCode]);

  // Debounced render
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const code = rawCode ?? '';

    if (!code.trim()) {
      setSvg('');
      setError(null);
      setIsRendering(false);
      return;
    }

    setIsRendering(true);
    setError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const rendered = await mermaidManager.render(code);
        setSvg(rendered);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setSvg('');
      } finally {
        setIsRendering(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [rawCode]);

  // Re-render on demand
  const rerender = useCallback(async () => {
    const code = codeRef.current;
    if (!code.trim()) return;

    setIsRendering(true);
    setError(null);

    try {
      // Clear cache for this code to force re-render
      const rendered = await mermaidManager.render(code);
      setSvg(rendered);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setSvg('');
    } finally {
      setIsRendering(false);
    }
  }, []);

  // Clear diagram
  const clear = useCallback(() => {
    setSvg('');
    setError(null);
    setIsRendering(false);
    setNodeInfo([]);
  }, []);

  // Click a node
  const clickNode = useCallback(
    (nodeId: string) => {
      const node = nodeInfo.find((n) => n.id === nodeId);
      if (node) {
        setOption('selectedNodeId', nodeId);
      }
    },
    [nodeInfo]
  );

  return {
    svg,
    isRendering,
    error,
    code: rawCode ?? '',
    rerender,
    clear,
    nodeInfo,
    clickNode,
  };
}

// ==================== Sync with Store ====================

/**
 * useMermaidVisualizationWithStore — Hook that syncs with visualizationStore
 */
export function useMermaidVisualizationWithStore() {
  const { visualizationData, setOption } = useVisualizationStore();

  const rawCode = useMemo(
    () =>
      visualizationData?.type === 'mermaid'
        ? (visualizationData.raw as string)
        : '',
    [visualizationData]
  );

  const mermaid = useMermaidVisualization(rawCode);

  // Sync selected node to store
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setOption('selectedNodeId', nodeId);
    },
    [setOption]
  );

  return {
    ...mermaid,
    selectedNodeId: undefined, // resolved via store
    handleNodeClick,
  };
}
