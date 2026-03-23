/**
 * CardTreeView — Integration component for CardTree
 *
 * - Connects useProjectTree() data to CardTreeRenderer
 * - Manages expand/collapse state
 * - Shows skeleton during loading, error on failure
 * - Supports Feature Flag via environment variable
 */

'use client';

import React, { useCallback, useState } from 'react';
import { CardTreeRenderer } from '@/components/visualization/CardTreeRenderer/CardTreeRenderer';
import { useProjectTree } from '@/hooks/useProjectTree';
import { CardTreeSkeleton } from './CardTreeSkeleton';
import type { CardTreeVisualizationRaw } from '@/types/visualization';
import styles from './CardTree.module.css';

// ==================== Feature Flag ====================

/** Feature Flag: Controls CardTree vs GridLayout rendering */
export const IS_CARD_TREE_ENABLED =
  process.env.NEXT_PUBLIC_USE_CARD_TREE === 'true';

// ==================== Props ====================

export interface CardTreeViewProps {
  /** Project ID to load data for */
  projectId?: string | null;
  /** Override feature flag (for testing/debug) */
  forceEnabled?: boolean;
  /** Callback: node clicked */
  onCardClick?: (cardId: string) => void;
  /** Callback: checkbox toggled */
  onCheckboxToggle?: (cardId: string, childId: string, checked: boolean) => void;
  /** Custom class name */
  className?: string;
  'data-testid'?: string;
}

// ==================== Error View ====================

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

function CardTreeError({ message, onRetry }: ErrorViewProps) {
  return (
    <div className={styles.error} data-testid="cardtree-error">
      <span className={styles.errorIcon}>⚠️</span>
      <p className={styles.errorText}>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={styles.retryButton}
        data-testid="retry-button"
      >
        重试
      </button>
    </div>
  );
}

// ==================== Main Component ====================

/**
 * CardTreeView — Main card tree view with data integration
 *
 * Renders CardTree when feature flag is enabled, shows skeleton during
 * loading, error state on failure, and empty state when no data.
 */
export function CardTreeView({
  projectId = null,
  forceEnabled,
  onCardClick,
  onCheckboxToggle,
  className,
  ...props
}: CardTreeViewProps) {
  // Feature flag: use prop override or env variable
  const isEnabled = forceEnabled ?? IS_CARD_TREE_ENABLED;

  // Expand/collapse state — tracked by node title
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Fetch data from useProjectTree
  const {
    data,
    isLoading,
    error,
    isMockData,
    refetch,
  } = useProjectTree({ projectId });

  // Toggle expand/collapse for a node
  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Initialize expanded state from data
  React.useEffect(() => {
    if (data?.nodes) {
      const initiallyExpanded = new Set<string>();
      data.nodes.forEach((node) => {
        if (node.isExpanded !== false) {
          initiallyExpanded.add(node.title);
        }
      });
      setExpandedIds(initiallyExpanded);
    }
  }, [data]);

  // Not enabled — render null (caller should show GridLayout)
  if (!isEnabled) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return <CardTreeSkeleton className={className} data-testid={props['data-testid']} />;
  }

  // Error state
  if (error) {
    return (
      <CardTreeError
        message={error.message || '加载失败，请重试'}
        onRetry={refetch}
      />
    );
  }

  // Empty state
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div
        className={`${styles.empty} ${className ? ` ${className}` : ''}`}
        data-testid="cardtree-empty"
      >
        <span className={styles.emptyIcon}>📋</span>
        <p className={styles.emptyText}>暂无卡片数据</p>
        <p className={styles.emptySubtext}>
          {isMockData ? '使用演示数据' : '开始分析需求后会自动生成卡片'}
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${className ? ` ${className}` : ''}`} data-testid={props['data-testid'] || 'cardtree-view'}>
      {/* Mock data indicator */}
      {isMockData && (
        <div className={styles.mockIndicator} data-testid="mock-data-indicator">
          演示数据
        </div>
      )}

      <CardTreeRenderer
        data={data}
        expandedIds={expandedIds}
        onToggleExpand={handleToggleExpand}
        onCardClick={onCardClick}
        onCheckboxToggle={onCheckboxToggle}
        fitView
        showMinimap
        showControls
        showBackground
      />
    </div>
  );
}

// ==================== Exports ====================

export { CardTreeSkeleton } from './CardTreeSkeleton';
export type { CardTreeSkeletonProps } from './CardTreeSkeleton';
