/**
 * JsonTreeRenderer — Virtualized JSON tree visualization component
 *
 * Renders JSON data as an expandable tree with:
 * - Virtual scrolling for large datasets (1000+ nodes)
 * - Expand/collapse with animations
 * - Search with highlighting
 * - Copy path/value on click
 */

'use client';

import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { useJsonTreeVisualization } from '@/hooks/useJsonTreeVisualization';
import type { JsonTreeNode } from '@/types/visualization';
import styles from './JsonTreeRenderer.module.css';

// ==================== Constants ====================

const ROW_HEIGHT = 28; // px per node row
const VISIBLE_BUFFER = 5; // extra rows above/below viewport
const MAX_VISIBLE = 100; // cap for search results

// ==================== Sub-components ====================

interface JsonValueProps {
  value: unknown;
  type: JsonTreeNode['type'];
}

function JsonValue({ value, type }: JsonValueProps) {
  if (type === 'null') return <span className={styles.null}>null</span>;
  if (type === 'string') return <span className={styles.string}>"{String(value)}"</span>;
  if (type === 'number') return <span className={styles.number}>{String(value)}</span>;
  if (type === 'boolean') return <span className={styles.boolean}>{String(value)}</span>;
  if (type === 'array') return <span className={styles.bracket}>[...]</span>;
  if (type === 'object') return <span className={styles.bracket}>{'{...}'}</span>;
  return <span className={styles.unknown}>{String(value)}</span>;
}

interface TreeNodeRowProps {
  node: JsonTreeNode;
  isExpanded: boolean;
  hasChildren: boolean;
  isSelected: boolean;
  searchQuery: string;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onCopy: (text: string) => void;
}

function TreeNodeRow({
  node,
  isExpanded,
  hasChildren,
  isSelected,
  searchQuery,
  onToggle,
  onSelect,
  onCopy,
}: TreeNodeRowProps) {
  const indent = node.depth * 20;

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(node.id);
    },
    [node.id, onToggle]
  );

  const handleSelect = useCallback(() => {
    onSelect(node.id);
  }, [node.id, onSelect]);

  const handleCopyValue = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCopy(`${node.path.join('.')} = ${JSON.stringify(node.value)}`);
    },
    [node.path, node.value, onCopy]
  );

  // Highlight matching text
  const highlightedKey = useMemo(() => {
    if (!searchQuery) return node.key;
    const query = searchQuery.toLowerCase();
    const key = node.key;
    const idx = key.toLowerCase().indexOf(query);
    if (idx === -1) return key;
    return (
      <>
        {key.slice(0, idx)}
        <mark className={styles.highlight}>{key.slice(idx, idx + query.length)}</mark>
        {key.slice(idx + query.length)}
      </>
    );
  }, [node.key, searchQuery]);

  return (
    <div
      className={`${styles.row} ${isSelected ? styles.rowSelected : ''} ${searchQuery && node.key.toLowerCase().includes(searchQuery.toLowerCase()) ? styles.rowMatch : ''}`}
      style={{ paddingLeft: indent + 8 }}
      onClick={handleSelect}
      data-node-id={node.id}
      data-depth={node.depth}
    >
      {/* Expand/collapse toggle */}
      {hasChildren ? (
        <button
          className={`${styles.toggle} ${isExpanded ? styles.toggleOpen : ''}`}
          onClick={handleToggle}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      ) : (
        <span className={styles.togglePlaceholder} />
      )}

      {/* Key */}
      <span className={styles.key}>{highlightedKey}</span>
      <span className={styles.colon}>:</span>

      {/* Value */}
      {!node.isLeaf && (
        <span className={styles.summary}>
          {node.type === 'array'
            ? `[${node.children?.length ?? 0} items]`
            : `{${node.children?.length ?? 0} keys}`}
        </span>
      )}
      {node.isLeaf && (
        <JsonValue value={node.value} type={node.type} />
      )}

      {/* Copy button */}
      <button
        className={styles.copyBtn}
        onClick={handleCopyValue}
        aria-label="Copy"
        title="Copy path"
      >
        📋
      </button>
    </div>
  );
}

// ==================== Main Component ====================

export interface JsonTreeRendererProps {
  /** JSON data to render */
  data: unknown;
  /** Initial expanded depth */
  defaultExpandedDepth?: number;
  /** Maximum tree depth */
  maxDepth?: number;
  /** Show search bar */
  showSearch?: boolean;
  /** Show toolbar */
  showToolbar?: boolean;
  /** Callback when node is selected */
  onNodeSelect?: (node: JsonTreeNode) => void;
  /** Custom class name */
  className?: string;
}

/**
 * JsonTreeRenderer — Virtualized JSON tree with expand/collapse
 *
 * Performance: Uses windowed rendering for large trees (1000+ nodes)
 */
export function JsonTreeRenderer({
  data,
  defaultExpandedDepth = 2,
  maxDepth = 20,
  showSearch = true,
  showToolbar = true,
  onNodeSelect,
  className = '',
}: JsonTreeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const [searchInput, setSearchInput] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    flatNodes,
    totalCount,
    isReady,
    expandedIds,
    selectedId,
    searchQuery,
    toggle,
    select,
    expandAll,
    collapseAll,
    search,
    getNode,
  } = useJsonTreeVisualization(data, { defaultExpandedDepth, maxDepth });

  // Sync search input
  useEffect(() => {
    const timer = setTimeout(() => {
      search(searchInput);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // Measure container height
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Copy handler
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  // Node select handler
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);
      if (node) {
        select(nodeId);
        onNodeSelect?.(node);
      }
    },
    [getNode, select, onNodeSelect]
  );

  // Virtual scroll calculation
  const visibleStart = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - VISIBLE_BUFFER
  );
  const visibleCount = Math.min(
    flatNodes.length,
    Math.ceil(containerHeight / ROW_HEIGHT) + VISIBLE_BUFFER * 2,
    MAX_VISIBLE
  );
  const visibleNodes = flatNodes.slice(visibleStart, visibleStart + visibleCount);
  const totalHeight = flatNodes.length * ROW_HEIGHT;

  // Empty state
  if (!isReady || data == null) {
    return (
      <div className={`${styles.renderer} ${styles.empty} ${className}`} data-testid="json-tree-empty">
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>🌳</span>
          <p className={styles.emptyText}>No JSON data provided</p>
          <p className={styles.emptyHint}>Add JSON data to visualize the tree structure</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.renderer} ${className}`} data-testid="json-tree">
      {/* Toolbar */}
      {showToolbar && (
        <div className={styles.toolbar}>
          <span className={styles.stats}>
            {totalCount} nodes · {flatNodes.length} visible
          </span>
          <div className={styles.toolbarActions}>
            <button className={styles.toolbarBtn} onClick={expandAll}>
              Expand All
            </button>
            <button className={styles.toolbarBtn} onClick={collapseAll}>
              Collapse All
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div className={styles.searchBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search keys or values..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <>
              <span className={styles.searchCount}>
                {flatNodes.length} result{flatNodes.length !== 1 ? 's' : ''}
              </span>
              <button
                className={styles.searchClear}
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
              >
                ×
              </button>
            </>
          )}
        </div>
      )}

      {/* Copy feedback */}
      {copied && (
        <div className={styles.copyToast}>Copied!</div>
      )}

      {/* Virtual scroll container */}
      <div
        ref={containerRef}
        className={styles.scrollContainer}
        onScroll={handleScroll}
      >
        {/* Spacer for total height */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Render only visible rows */}
          <div
            style={{
              position: 'absolute',
              top: visibleStart * ROW_HEIGHT,
              left: 0,
              right: 0,
            }}
          >
            {visibleNodes.map((node) => (
              <TreeNodeRow
                key={node.id}
                node={node}
                isExpanded={expandedIds.has(node.id)}
                hasChildren={!!node.children && node.children.length > 0}
                isSelected={selectedId === node.id}
                searchQuery={searchQuery}
                onToggle={toggle}
                onSelect={handleNodeSelect}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JsonTreeRenderer;
