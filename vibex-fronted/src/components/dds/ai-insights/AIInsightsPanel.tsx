/**
 * AIInsightsPanel — S94-E1: Canvas AI Insights
 *
 * Right-side slide-in panel showing canvas health score,
 * top 3 layout optimization suggestions, and isolated node highlighting.
 * Includes "Apply" button to trigger auto-layout.
 */

'use client';

import React, { memo, useCallback, useEffect, useState } from 'react';
import { useCanvasAIStore } from '@/stores/canvasAIStore';
import { useCanvasAIInsights } from '@/hooks/canvas/useCanvasAIInsights';
import styles from './AIInsightsPanel.module.css';

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--color-success, #22c55e)';
  if (score >= 60) return 'var(--color-info, #3b82f6)';
  if (score >= 40) return 'var(--color-warning, #f59e0b)';
  return 'var(--color-error, #ef4444)';
}

interface AIInsightsPanelProps {
  /** Canvas ID to fetch insights for */
  canvasId: string;
  /** Callback to highlight specific node IDs */
  onHighlightNodes?: (nodeIds: string[]) => void;
  /** Callback when node positions are updated (to refresh canvas) */
  onNodesUpdated?: (positions: Array<{ id: string; x: number; y: number }>) => void;
}

export const AIInsightsPanel = memo(function AIInsightsPanel({
  canvasId,
  onHighlightNodes,
  onNodesUpdated,
}: AIInsightsPanelProps) {
  const isOpen = useCanvasAIStore((s) => s.isOpen);
  const closePanel = useCanvasAIStore((s) => s.closePanel);

  const { insights, isLoading, error, isOptimizing, fetchInsights, applyOptimize } =
    useCanvasAIInsights(canvasId);

  const [selectedLayout, setSelectedLayout] = useState<'hierarchical' | 'force-directed'>(
    'hierarchical'
  );

  // Auto-fetch insights when panel opens
  useEffect(() => {
    if (isOpen && !insights && !isLoading) {
      fetchInsights();
    }
  }, [isOpen, insights, isLoading, fetchInsights]);

  const handleHighlightIsolated = useCallback(() => {
    if (insights?.isolatedNodes.length) {
      onHighlightNodes?.(insights.isolatedNodes);
    }
  }, [insights, onHighlightNodes]);

  const handleApply = useCallback(async () => {
    const result = await applyOptimize(selectedLayout);
    if (result?.nodePositions) {
      onNodesUpdated?.(result.nodePositions);
    }
  }, [applyOptimize, selectedLayout, onNodesUpdated]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.panel}
      role="dialog"
      aria-label="AI Canvas Insights"
      aria-modal="true"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon} aria-hidden="true">🔬</span>
          <span>AI Canvas Insights</span>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={closePanel}
          aria-label="Close AI Insights"
          data-testid="close-ai-insights"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Loading state */}
        {isLoading && (
          <div className={styles.loading} data-testid="insights-loading">
            <div className={styles.spinner} aria-hidden="true" />
            <span>Analyzing canvas...</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className={styles.errorState} data-testid="insights-error">
            <span>⚠️</span>
            <span>{error}</span>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={fetchInsights}
              data-testid="insights-retry"
            >
              Retry
            </button>
          </div>
        )}

        {/* Insights data */}
        {insights && !isLoading && (
          <>
            {/* Health Score */}
            <section className={styles.scoreSection} aria-label="Canvas health score">
              <div className={styles.scoreLabel}>Canvas Health</div>
              <div className={styles.scoreRow}>
                <div
                  className={styles.scoreRing}
                  style={
                    {
                      '--score-color': scoreColor(insights.score),
                      '--score-percent': `${insights.score}%`,
                    } as React.CSSProperties
                  }
                  role="meter"
                  aria-valuenow={insights.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Health score: ${insights.score} out of 100`}
                  data-testid="health-score-ring"
                >
                  <div className={styles.scoreRingInner}>
                    <span className={styles.scoreNumber} data-testid="health-score-number">
                      {insights.score}
                    </span>
                    <span className={styles.scoreMax}>/100</span>
                  </div>
                </div>
                <div className={styles.scoreInfo}>
                  <div
                    className={styles.scoreLabel2}
                    style={{ color: scoreColor(insights.score) }}
                    data-testid="health-score-label"
                  >
                    {scoreLabel(insights.score)}
                  </div>
                  <div className={styles.scoreSubtext}>
                    {insights.isolatedNodes.length > 0
                      ? `${insights.isolatedNodes.length} isolated node${insights.isolatedNodes.length > 1 ? 's' : ''}`
                      : 'No isolated nodes'}
                  </div>
                </div>
              </div>
            </section>

            {/* Suggestions */}
            <section className={styles.suggestionsSection} aria-label="Optimization suggestions">
              <div className={styles.sectionTitle}>Suggestions</div>
              {insights.suggestions.length === 0 ? (
                <p className={styles.emptySuggestions}>No suggestions at this time.</p>
              ) : (
                <ul className={styles.suggestionsList} data-testid="suggestions-list">
                  {insights.suggestions.map((suggestion, idx) => (
                    <li key={idx} className={styles.suggestionItem}>
                      <span className={styles.suggestionBullet} aria-hidden="true">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Isolated nodes highlight */}
            {insights.isolatedNodes.length > 0 && (
              <section className={styles.isolatedSection}>
                <div className={styles.sectionTitle}>Isolated Nodes</div>
                <button
                  type="button"
                  className={styles.highlightBtn}
                  onClick={handleHighlightIsolated}
                  data-testid="highlight-isolated-nodes"
                >
                  🔍 Highlight {insights.isolatedNodes.length} isolated node
                  {insights.isolatedNodes.length > 1 ? 's' : ''}
                </button>
              </section>
            )}

            {/* Optimize */}
            <section className={styles.optimizeSection} aria-label="Layout optimization">
              <div className={styles.sectionTitle}>Apply Layout</div>
              <div className={styles.layoutOptions} data-testid="layout-options">
                <label className={styles.layoutOption}>
                  <input
                    type="radio"
                    name="layout"
                    value="hierarchical"
                    checked={selectedLayout === 'hierarchical'}
                    onChange={() => setSelectedLayout('hierarchical')}
                    className={styles.layoutRadio}
                  />
                  <span>Hierarchical</span>
                  <span className={styles.layoutHint}>Top-down tree layout</span>
                </label>
                <label className={styles.layoutOption}>
                  <input
                    type="radio"
                    name="layout"
                    value="force-directed"
                    checked={selectedLayout === 'force-directed'}
                    onChange={() => setSelectedLayout('force-directed')}
                    className={styles.layoutRadio}
                  />
                  <span>Force-Directed</span>
                  <span className={styles.layoutHint}>Auto-distributed nodes</span>
                </label>
              </div>
              <button
                type="button"
                className={styles.applyBtn}
                onClick={handleApply}
                disabled={isOptimizing}
                data-testid="apply-optimize-btn"
              >
                {isOptimizing ? (
                  <>
                    <span className={styles.spinnerSmall} aria-hidden="true" />
                    Applying...
                  </>
                ) : (
                  '🚀 Apply Layout'
                )}
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
});
