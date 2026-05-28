/**
 * useMiniMapSearch — Hook for MiniMap search + highlight state
 * S39-P004-E1: MiniMap 搜索 + 节点高亮 + 视口边框
 *
 * Usage:
 *   const { searchTerm, highlightedNodes, onSearch, clearSearch } = useMiniMapSearch();
 */
import { useState, useCallback, useMemo } from 'react';
import type { Node } from '@xyflow/react';

interface DomainNodeData {
  entity?: { name: string };
  label?: string;
}

interface UseMiniMapSearchOptions {
  /** Nodes to search through */
  nodes?: Node[];
  /** Case-insensitive matching. Default: true */
  caseSensitive?: boolean;
}

interface UseMiniMapSearchReturn {
  /** Current search term */
  searchTerm: string;
  /** Set of node IDs that match the search term */
  highlightedNodes: Set<string>;
  /** Handler to update search term */
  onSearch: (term: string) => void;
  /** Clear search and reset highlighted nodes */
  clearSearch: () => void;
}

/**
 * useMiniMapSearch — manages search state and computes highlighted node IDs.
 *
 * Searches against node label (data.label) and entity name (data.entity.name).
 * - `searchTerm`: the current input value
 * - `highlightedNodes`: Set of node IDs matching searchTerm (empty when term is empty)
 * - `onSearch`: call with new input value
 * - `clearSearch`: resets to empty string and clears highlights
 */
export function useMiniMapSearch(
  options: UseMiniMapSearchOptions = {}
): UseMiniMapSearchReturn {
  const { nodes = [], caseSensitive = false } = options;
  const [searchTerm, setSearchTerm] = useState('');

  const highlightedNodes = useMemo(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return new Set<string>();

    const results = new Set<string>();
    const lowerTerm = caseSensitive ? trimmed : trimmed.toLowerCase();

    for (const node of nodes) {
      // Check data.label (generic node label)
      const label = (node.data as DomainNodeData)?.label;
      if (label) {
        const target = caseSensitive ? label : label.toLowerCase();
        if (target.includes(lowerTerm)) {
          results.add(node.id);
        }
      }
      // Check data.entity.name (domain entity nodes)
      const entityName = (node.data as DomainNodeData)?.entity?.name;
      if (entityName) {
        const target = caseSensitive ? entityName : entityName.toLowerCase();
        if (target.includes(lowerTerm)) {
          results.add(node.id);
        }
      }
    }
    return results;
  }, [searchTerm, nodes, caseSensitive]);

  const onSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return { searchTerm, highlightedNodes, onSearch, clearSearch };
}
