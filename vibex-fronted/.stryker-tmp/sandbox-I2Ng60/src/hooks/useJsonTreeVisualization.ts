/**
 * useJsonTreeVisualization — Hook for JSON tree visualization data management
 *
 * Parses JSON data into a tree structure with expand/collapse state,
 * virtual scrolling support, and search functionality.
 */
// @ts-nocheck


'use client';

import { useState, useMemo, useCallback } from 'react';
import { useVisualizationStore } from '@/stores/visualizationStore';
import type { JsonTreeNode, JsonTreeVisualizationData, VisualizationStore } from '@/types/visualization';

// ==================== Return Type ====================

export interface UseJsonTreeVisualizationReturn {
  /** Parsed tree nodes (flat list with depth for virtual scrolling) */
  flatNodes: JsonTreeNode[];
  /** Total node count */
  totalCount: number;
  /** Root node */
  root: JsonTreeNode | null;
  /** Whether data is ready */
  isReady: boolean;
  /** Currently expanded node IDs */
  expandedIds: Set<string>;
  /** Selected node ID */
  selectedId: string | null;
  /** Search query */
  searchQuery: string;
  /** Expand a node */
  expand: (nodeId: string) => void;
  /** Collapse a node */
  collapse: (nodeId: string) => void;
  /** Toggle expand/collapse */
  toggle: (nodeId: string) => void;
  /** Expand all nodes */
  expandAll: () => void;
  /** Collapse all nodes */
  collapseAll: () => void;
  /** Select a node */
  select: (nodeId: string | null) => void;
  /** Set search query */
  search: (query: string) => void;
  /** Get path from root to a node */
  getPath: (nodeId: string) => JsonTreeNode[];
  /** Get node by ID */
  getNode: (nodeId: string) => JsonTreeNode | undefined;
}

// ==================== Helpers ====================

let nodeIdCounter = 0;
function generateNodeId(): string {
  return `json-node-${++nodeIdCounter}`;
}

/**
 * Determine the type of a JSON value
 */
function getValueType(value: unknown): JsonTreeNode['type'] {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as JsonTreeNode['type'];
}

/**
 * Recursively parse a JSON object into tree nodes
 */
function parseJsonToTree(
  key: string,
  value: unknown,
  depth: number,
  path: string[],
  maxDepth: number = 20
): JsonTreeNode {
  const nodePath = [...path, key];
  const type = getValueType(value);
  const id = generateNodeId();

  const node: JsonTreeNode = {
    id,
    key,
    value,
    type,
    depth,
    path: nodePath,
    isLeaf: type !== 'object' && type !== 'array',
  };

  if ((type === 'object' || type === 'array') && depth < maxDepth) {
    const entries: [string, unknown][] = type === 'array' ? (value as unknown[]).map((v, i) => [String(i), v]) : Object.entries(value as object);
    node.children = entries.map((entry, index) => {
      const [childKey, childValue] = type === 'array'
        ? [String(index), entry[1]]
        : [entry[0], entry[1]];
      return parseJsonToTree(childKey, childValue, depth + 1, nodePath, maxDepth);
    });
    node.isLeaf = false;
    node.isExpanded = depth < 2; // Auto-expand first 2 levels
  }

  return node;
}

/**
 * Flatten tree to array for virtual scrolling, respecting expanded state
 */
function flattenTree(
  root: JsonTreeNode | null,
  expandedIds: Set<string>,
  searchQuery: string
): JsonTreeNode[] {
  if (!root) return [];

  const result: JsonTreeNode[] = [];

  function traverse(node: JsonTreeNode) {
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const keyMatch = node.key.toLowerCase().includes(query);
      const valueMatch =
        node.isLeaf &&
        String(node.value).toLowerCase().includes(query);
      if (!keyMatch && !valueMatch) {
        // Check if any descendant matches
        const hasMatch = hasMatchingDescendant(node, query);
        if (!hasMatch) return;
      }
    }

    result.push(node);

    if (
      node.children &&
      node.children.length > 0 &&
      expandedIds.has(node.id)
    ) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return result;
}

/**
 * Check if a node or any descendant matches a search query
 */
function hasMatchingDescendant(node: JsonTreeNode, query: string, visited = new Set<string>()): boolean {
  if (!node || visited.has(node.id)) return false;
  visited.add(node.id);
  if (node.key.toLowerCase().includes(query)) return true;
  if (
    node.isLeaf &&
    String(node.value).toLowerCase().includes(query)
  )
    return true;
  if (node.children) {
    return node.children.some((child) =>
      hasMatchingDescendant(child, query, visited)
    );
  }
  return false;
}

/**
 * Count total nodes in tree
 */
function countNodes(node: JsonTreeNode | null, visited = new Set<string>()): number {
  if (!node || visited.has(node.id)) return 0;
  visited.add(node.id);
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child, visited);
    }
  }
  return count;
}

/**
 * Get path from root to target node
 */
function getNodePath(
  root: JsonTreeNode | null,
  targetId: string
): JsonTreeNode[] {
  if (!root) return [];

  if (root.id === targetId) return [root];

  if (root.children) {
    for (const child of root.children) {
      const path = getNodePath(child, targetId);
      if (path.length > 0) {
        return [root, ...path];
      }
    }
  }

  return [];
}

/**
 * Get all expandable node IDs for expandAll
 */
function getAllExpandableIds(node: JsonTreeNode | null, visited = new Set<string>()): string[] {
  if (!node || visited.has(node.id)) return [];
  visited.add(node.id);
  const ids: string[] = [];
  if (node.children && node.children.length > 0) {
    ids.push(node.id);
    for (const child of node.children) {
      ids.push(...getAllExpandableIds(child, visited));
    }
  }
  return ids;
}

// ==================== Hook ====================

/**
 * useJsonTreeVisualization — Manages JSON tree visualization
 *
 * @param rawData - JSON data object (from store or props)
 * @param options - Configuration options
 * @returns Parsed tree, helper functions, and state
 */
export function useJsonTreeVisualization(
  rawData: unknown,
  options?: {
    defaultExpandedDepth?: number;
    maxDepth?: number;
  }
): UseJsonTreeVisualizationReturn {
  const { defaultExpandedDepth = 2, maxDepth = 20 } = options ?? {};

  // Parse JSON into tree
  const root = useMemo<JsonTreeNode | null>(() => {
    if (rawData == null) return null;
    try {
      const tree = parseJsonToTree('root', rawData, 0, [], maxDepth);
      return tree;
    } catch {
      return null;
    }
  }, [rawData, maxDepth]);

  const totalCount = useMemo(() => countNodes(root), [root]);

  // State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (!root) return new Set();
    const initial = new Set<string>();
    // Auto-expand to default depth
    function expandToDepth(node: JsonTreeNode, currentDepth: number) {
      if (currentDepth < defaultExpandedDepth && node.children) {
        initial.add(node.id);
        node.children.forEach((child) =>
          expandToDepth(child, currentDepth + 1)
        );
      }
    }
    expandToDepth(root, 0);
    return initial;
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten tree for rendering
  const flatNodes = useMemo(
    () => flattenTree(root, expandedIds, searchQuery),
    [root, expandedIds, searchQuery]
  );

  // Actions
  const expand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });
  }, []);

  const collapse = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (nodeId: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    },
    []
  );

  const expandAll = useCallback(() => {
    const allIds = getAllExpandableIds(root);
    setExpandedIds(new Set(allIds));
  }, [root]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const select = useCallback((nodeId: string | null) => {
    setSelectedId(nodeId);
  }, []);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const getPath = useCallback(
    (nodeId: string) => getNodePath(root, nodeId),
    [root]
  );

  const getNode = useCallback(
    (nodeId: string): JsonTreeNode | undefined => {
      function find(node: JsonTreeNode | null): JsonTreeNode | undefined {
        if (!node) return undefined;
        if (node.id === nodeId) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = find(child);
            if (found) return found;
          }
        }
        return undefined;
      }
      return find(root);
    },
    [root]
  );

  return {
    flatNodes,
    totalCount,
    root,
    isReady: root !== null,
    expandedIds,
    selectedId,
    searchQuery,
    expand,
    collapse,
    toggle,
    expandAll,
    collapseAll,
    select,
    search,
    getPath,
    getNode,
  };
}

// ==================== Sync with Store ====================

/**
 * useJsonTreeVisualizationWithStore — Hook that syncs with visualizationStore
 */
export function useJsonTreeVisualizationWithStore() {
  const { visualizationData, setOption } = useVisualizationStore();

  const rawData = useMemo(
    () =>
      visualizationData?.type === 'json'
        ? (visualizationData.raw as unknown)
        : null,
    [visualizationData]
  );

  const jsonTree = useJsonTreeVisualization(rawData);

  return {
    ...jsonTree,
    selectedNodeId: jsonTree.selectedId,
    zoom: 1,
    showMinimap: false,
    handleNodeClick: (nodeId: string) => {
      jsonTree.select(nodeId);
      setOption('selectedNodeId', nodeId);
    },
  };
}
