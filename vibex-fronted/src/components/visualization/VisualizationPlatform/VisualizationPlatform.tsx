/**
 * VisualizationPlatform — Unified visualization container
 *
 * Orchestrates FlowRenderer, MermaidRenderer, and JsonTreeRenderer
 * with ViewSwitcher, state management, and URL sync.
 */

'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { ViewSwitcher } from '../ViewSwitcher';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { FlowRenderer } from '../FlowRenderer';
import type { FlowVisualizationRaw, VisualizationType } from '@/types/visualization';
import styles from './VisualizationPlatform.module.css';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// Lazy-loaded renderers for code-splitting
const LazyMermaidRenderer = React.lazy(
  () =>
    import('../MermaidRenderer').then((m) => ({
      default: m.MermaidRenderer,
    }))
);
const LazyJsonTreeRenderer = React.lazy(
  () =>
    import('../JsonTreeRenderer').then((m) => ({
      default: m.JsonTreeRenderer,
    }))
);

// ==================== Skeleton ====================

function LoadingSkeleton() {
  return (
    <div className={styles.skeleton} data-testid="visualization-loading">
      <div className={styles.skeletonPulse} />
      <span className={styles.skeletonText}>Loading visualization...</span>
    </div>
  );
}

function ErrorFallback({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className={styles.errorFallback} data-testid="visualization-error">
      <span className={styles.errorIcon}>⚠️</span>
      <p className={styles.errorMessage}>{message}</p>
      {onRetry && (
        <button className={styles.errorRetry} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

// ==================== Props ====================

export interface VisualizationPlatformProps {
  /** Initial view type (from URL or default) */
  initialType?: VisualizationType;
  /** Flow data for 'flow' view */
  flowData?: FlowVisualizationRaw | null;
  /** Mermaid code for 'mermaid' view */
  mermaidCode?: string | null;
  /** JSON data for 'json' view */
  jsonData?: unknown;
  /** Whether to sync with URL */
  syncWithUrl?: boolean;
  /** Show toolbar (ViewSwitcher + controls) */
  showToolbar?: boolean;
  /** Show minimap for flow view */
  showMinimap?: boolean;
  /** Callback when view type changes */
  onViewChange?: (type: VisualizationType) => void;
  /** Callback when node is selected */
  onNodeSelect?: (nodeId: string, type: VisualizationType) => void;
  /** Custom class name */
  className?: string;
}

// ==================== Platform Component ====================

export function VisualizationPlatform({
  initialType = 'flow',
  flowData = null,
  mermaidCode = null,
  jsonData = null,
  syncWithUrl = true,
  showToolbar = true,
  showMinimap = true,
  onViewChange,
  onNodeSelect,
  className = '',
}: VisualizationPlatformProps) {
  const searchParams = useSearchParams();
  const [currentType, setCurrentType] = useState<VisualizationType>(initialType);
  const [transitioning, setTransitioning] = useState(false);
  const [startTime] = useState(Date.now());

  // Sync initial type from URL
  useEffect(() => {
    if (!syncWithUrl) return;
    const viewParam = searchParams.get('view');
    if (
      viewParam &&
      ['flow', 'mermaid', 'json'].includes(viewParam)
    ) {
      setCurrentType(viewParam as VisualizationType);
    }
  }, [syncWithUrl, searchParams]);

  // Sync type to URL
  useEffect(() => {
    if (!syncWithUrl) return;
    const url = new URL(window.location.href);
    url.searchParams.set('view', currentType);
    window.history.replaceState({}, '', url.toString());
  }, [currentType, syncWithUrl]);

  // Handle view switch with animation
  const handleViewChange = useCallback(
    (newType: VisualizationType) => {
      if (newType === currentType) return;

      setTransitioning(true);
      setTimeout(() => {
        setCurrentType(newType);
        setTransitioning(false);
        onViewChange?.(newType);
      }, 150); // Half of CSS transition
    },
    [currentType, onViewChange]
  );

  // Measure transition time
  useEffect(() => {
    const duration = Date.now() - startTime;
    if (duration > 500) {
      canvasLogger.default.warn(
        `[VisualizationPlatform] Transition exceeded 500ms: ${duration}ms`
      );
    }
  }, [currentType, startTime]);

  // Get data for current view
  const currentData = useMemo(() => {
    switch (currentType) {
      case 'flow':
        return flowData;
      case 'mermaid':
        return mermaidCode;
      case 'json':
        return jsonData;
      default:
        return null;
    }
  }, [currentType, flowData, mermaidCode, jsonData]);

  // Node select handler
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      onNodeSelect?.(nodeId, currentType);
    },
    [currentType, onNodeSelect]
  );

  return (
    <div
      className={`${styles.platform} ${transitioning ? styles.transitioning : ''} ${className}`}
      data-testid="visualization-platform"
      data-view={currentType}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className={styles.toolbar}>
          <ViewSwitcher
            value={currentType}
            onChange={handleViewChange}
          />
          {transitioning && (
            <span className={styles.transitioningLabel}>Switching...</span>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`${styles.content} ${transitioning ? styles.contentFading : ''}`}>
        <ErrorBoundary
          fallback={
            <ErrorFallback message="Failed to load visualization" />
          }
        >
          <Suspense fallback={<LoadingSkeleton />}>
            {currentType === 'flow' && flowData && (
              <FlowRenderer
                data={flowData}
                showMinimap={showMinimap}
                onNodeClick={(node) => handleNodeSelect(node.id)}
              />
            )}

            {currentType === 'mermaid' && mermaidCode && (
              <LazyMermaidRenderer
                data={{ type: 'mermaid', raw: mermaidCode }}
              />
            )}

            {currentType === 'json' && jsonData !== undefined && (
              <LazyJsonTreeRenderer
                data={jsonData}
                showSearch
                showToolbar
                onNodeSelect={(node) => handleNodeSelect(node.id)}
              />
            )}

            {/* Empty state */}
            {!currentData && (
              <div className={styles.emptyState} data-testid="visualization-empty">
                <span className={styles.emptyIcon}>
                  {currentType === 'flow' ? '🔗' : currentType === 'mermaid' ? '📊' : '🌳'}
                </span>
                <p className={styles.emptyText}>
                  No {currentType} data available
                </p>
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default VisualizationPlatform;
