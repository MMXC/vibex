/**
 * MermaidRenderer — Mermaid diagram visualization component
 *
 * Uses useMermaidVisualization hook to render Mermaid diagrams,
 * supports loading, error, empty states, and node click interactions.
 */

'use client';

import React, { useCallback } from 'react';
import { useMermaidVisualization } from '@/hooks/useMermaidVisualization';
import type { MermaidVisualizationData, MermaidNodeInfo } from '@/types/visualization';
import styles from './MermaidRenderer.module.css';

export interface MermaidRendererProps {
  /** Mermaid visualization data */
  data: MermaidVisualizationData | null | undefined;
  /** Node click callback */
  onNodeClick?: (node: MermaidNodeInfo) => void;
  /** Custom class name */
  className?: string;
}

function EmptyState({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.empty} ${className}`} data-testid="mermaid-empty">
      <div className={styles.emptyContent}>
        <span className={styles.emptyIcon}>📊</span>
        <p className={styles.emptyText}>No mermaid data</p>
        <p className={styles.emptySubtext}>Add mermaid code to visualize the diagram</p>
      </div>
    </div>
  );
}

function LoadingState({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.loading} ${className}`} data-testid="mermaid-loading">
      <div className={styles.skeleton} data-testid="mermaid-skeleton" />
      <span className={styles.loadingText}>Rendering diagram…</span>
    </div>
  );
}

function ErrorState({
  error,
  className = '',
}: {
  error: string;
  className?: string;
}) {
  return (
    <div className={`${styles.error} ${className}`} data-testid="mermaid-error">
      <div className={styles.errorContent}>
        <span className={styles.errorIcon}>⚠️</span>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    </div>
  );
}

/**
 * MermaidRenderer — Visualizes Mermaid diagrams
 *
 * Accepts MermaidVisualizationData (discriminated union member with type='mermaid'),
 * delegates rendering to useMermaidVisualization hook, and surfaces loading/error/empty states.
 */
export function MermaidRenderer({
  data,
  onNodeClick,
  className,
}: MermaidRendererProps) {
  const code = data?.type === 'mermaid' ? (data.raw as string) : '';

  const { svg, isRendering, error, nodeInfo } = useMermaidVisualization(code);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as SVGElement;
      // Mermaid renders nodes as <g class="node"> elements with id/data-id attributes
      const nodeElement = target.closest('[class*="node"]') as SVGElement | null;
      if (!nodeElement) return;

      // Try data-id first, then fallback to id, then title text
      const nodeId =
        (nodeElement.getAttribute('data-id') as string) ||
        (nodeElement.getAttribute('id') as string) ||
        (nodeElement.querySelector('title')?.textContent?.trim() as string) ||
        '';

      if (nodeId && onNodeClick) {
        const node = nodeInfo.find((n) => n.id === nodeId) ?? {
          id: nodeId,
          label: nodeId,
          type: 'node',
        };
        onNodeClick(node);
      }
    },
    [nodeInfo, onNodeClick]
  );

  // Empty state — no data or wrong type
  if (!data || data.type !== 'mermaid') {
    return <EmptyState className={className} />;
  }

  // Empty code
  if (!code.trim() && !isRendering) {
    return <EmptyState className={className} />;
  }

  // Loading state
  if (isRendering) {
    return <LoadingState className={className} />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} className={className} />;
  }

  // Normal render
  return (
    <div
      className={`${styles.container} ${className || ''}`}
      data-testid="mermaid-renderer"
      onClick={handleSvgClick}
    >
      <div
        className={styles.svgWrapper}
        dangerouslySetInnerHTML={{ __html: svg }}
        suppressHydrationWarning
      />
    </div>
  );
}
