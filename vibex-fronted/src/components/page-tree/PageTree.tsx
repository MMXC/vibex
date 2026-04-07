/**
 * Page Tree Component
 * 页面树展示：树形渲染、展开、折叠
 */

'use client';

import { useState, useCallback } from 'react';
import styles from './PageTree.module.css';

export interface PageNode {
  id: string;
  name: string;
  type: 'page' | 'component' | 'section';
  children?: PageNode[];
}

export interface PageTreeProps {
  nodes: PageNode[];
  onNodeClick?: (nodeId: string) => void;
  defaultExpanded?: boolean;
}

export function PageTree({ nodes, onNodeClick, defaultExpanded = true }: PageTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    defaultExpanded ? new Set(nodes.map(n => n.id)) : new Set()
  );

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    onNodeClick?.(nodeId);
  }, [onNodeClick]);

  const renderNode = (node: PageNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);

    return (
      <li key={node.id} className={styles.nodeItem}>
        <div
          className={styles.nodeContent}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleNodeClick(node.id)}
        >
          {hasChildren ? (
            <button
              type="button"
              className={styles.expandButton}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className={styles.expandPlaceholder}>•</span>
          )}
          <span className={styles.nodeIcon}>
            {node.type === 'page' ? '📄' : node.type === 'component' ? '🔧' : '📋'}
          </span>
          <span className={styles.nodeName}>{node.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <ul className={styles.nodeList}>
            {node.children!.map(child => renderNode(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>页面结构</span>
        <button
          type="button"
          className={styles.expandAllButton}
          onClick={() => {
            if (expandedIds.size === 0) {
              setExpandedIds(new Set(nodes.map(n => n.id)));
            } else {
              setExpandedIds(new Set());
            }
          }}
        >
          {expandedIds.size > 0 ? '全部折叠' : '全部展开'}
        </button>
      </div>
      <ul className={styles.tree}>
        {nodes.map(node => renderNode(node))}
      </ul>
    </div>
  );
}

export default PageTree;
