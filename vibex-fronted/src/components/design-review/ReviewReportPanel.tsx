'use client';

/**
 * ReviewReportPanel — S16-P0-1 Design Review UI
 *
 * Three-tab panel showing design review results:
 * - Compliance: Design system compliance issues
 * - Accessibility: A11y issues
 * - Reuse: Code reuse recommendations
 *
 * Cyberpunk glassmorphism styling consistent with DDS design system.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDesignReview, type DesignReviewIssue, type DesignReviewRecommendation } from '@/hooks/useDesignReview';
import styles from './ReviewReportPanel.module.css';

// ============================================================================
// Types
// ============================================================================

type TabId = 'compliance' | 'accessibility' | 'reuse';

interface ReviewReportPanelProps {
  /** Auto-open when review completes */
  autoOpen?: boolean;
}

// ============================================================================
// Sub-components
// ============================================================================

function SeverityBadge({ severity }: { severity: DesignReviewIssue['severity'] }) {
  const label = { critical: 'Critical', warning: 'Warning', info: 'Info' }[severity];
  return (
    <span className={`${styles.badge} ${styles[`badge--${severity}`]}`} data-testid={`badge-${severity}`}>
      {label}
    </span>
  );
}

function IssueCard({ issue }: { issue: DesignReviewIssue }) {
  return (
    <div className={styles.issueCard} data-testid={`issue-${issue.id}`}>
      <div className={styles.issueHeader}>
        <SeverityBadge severity={issue.severity} />
        {issue.location && (
          <code className={styles.location} data-testid={`location-${issue.id}`}>{issue.location}</code>
        )}
      </div>
      <p className={styles.issueMessage} data-testid={`message-${issue.id}`}>{issue.message}</p>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: DesignReviewRecommendation }) {
  return (
    <div className={styles.recCard} data-testid={`rec-${rec.id}`}>
      <div className={styles.recHeader}>
        <span className={`${styles.priorityBadge} ${styles[`priority--${rec.priority}`]}`} data-testid={`priority-${rec.id}`}>
          {rec.priority}
        </span>
      </div>
      <p className={styles.recMessage} data-testid={`rec-message-${rec.id}`}>{rec.message}</p>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function ReviewReportPanel({ autoOpen = false }: ReviewReportPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('compliance');
  const { isOpen, isLoading, result, error, runReview, close } = useDesignReview();

  // Listen for design-review:open event
  useEffect(() => {
    const handler = () => {
      void runReview();
    };
    window.addEventListener('design-review:open', handler);
    return () => window.removeEventListener('design-review:open', handler);
  }, [runReview]);

  // Auto-open on mount if requested
  useEffect(() => {
    if (autoOpen) {
      void runReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  if (!isOpen && !isLoading) return null;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'compliance', label: 'Compliance', count: result?.compliance.length ?? 0 },
    { id: 'accessibility', label: 'Accessibility', count: result?.accessibility.length ?? 0 },
    { id: 'reuse', label: 'Reuse', count: result?.reuse.length ?? 0 },
  ];

  return (
    <div className={styles.overlay} data-testid="review-report-panel" role="dialog" aria-modal="true" aria-label="Design Review Report">
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title} data-testid="panel-title">Design Review Report</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={close}
            data-testid="panel-close"
            aria-label="Close review panel"
          >
            ✕
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className={styles.loading} data-testid="panel-loading">
            <div className={styles.spinner} aria-label="Analyzing design..." />
            <p>Analyzing design compliance...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className={styles.errorState} role="alert" data-testid="panel-error">
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && !isLoading && (
          <>
            {/* Tab navigation */}
            <div className={styles.tabs} role="tablist" aria-label="Review categories" data-testid="panel-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                  <span className={styles.tabCount} data-testid={`count-${tab.id}`}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className={styles.tabContent} role="tabpanel" id={`tabpanel-${activeTab}`} data-testid="tab-content">
              {activeTab === 'compliance' && (
                <div className={styles.issueList}>
                  {result.compliance.length === 0 ? (
                    <p className={styles.emptyState} data-testid="empty-compliance">No compliance issues found.</p>
                  ) : (
                    result.compliance.map((issue) => <IssueCard key={issue.id} issue={issue} />)
                  )}
                </div>
              )}
              {activeTab === 'accessibility' && (
                <div className={styles.issueList}>
                  {result.accessibility.length === 0 ? (
                    <p className={styles.emptyState} data-testid="empty-accessibility">No accessibility issues found.</p>
                  ) : (
                    result.accessibility.map((issue) => <IssueCard key={issue.id} issue={issue} />)
                  )}
                </div>
              )}
              {activeTab === 'reuse' && (
                <div className={styles.recList}>
                  {result.reuse.length === 0 ? (
                    <p className={styles.emptyState} data-testid="empty-reuse">No reuse recommendations.</p>
                  ) : (
                    result.reuse.map((rec) => <RecommendationCard key={rec.id} rec={rec} />)
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
