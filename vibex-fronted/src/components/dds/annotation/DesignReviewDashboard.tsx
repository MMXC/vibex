'use client';

/**
 * DesignReviewDashboard — Sprint91 E2
 *
 * Dashboard showing ALL annotations across all canvases that have
 * GitHub Issues linked. Used for the Design Review workflow.
 *
 * Fetches from GET /api/canvas/annotations/github-issues
 * Shows: annotation content + canvas name + issue number + issue status + URL
 * Grouped by canvas.
 */

import React, { useEffect, useState, useCallback } from 'react';
import styles from './DesignReviewDashboard.module.css';

interface AnnotationWithCanvas {
  id: string;
  canvas_id: string;
  canvas_name?: string;
  content: string;
  x: number;
  y: number;
  type: string;
  author_id: string;
  author_name?: string;
  status: string;
  color: string;
  github_issue_url: string;
  github_issue_number: number;
  github_commit_sha?: string;
  created_at: number;
  updated_at: number;
}

interface GroupedAnnotations {
  canvasId: string;
  canvasName: string;
  annotations: AnnotationWithCanvas[];
}

export function DesignReviewDashboard() {
  const [annotations, setAnnotations] = useState<AnnotationWithCanvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAnnotations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/canvas/annotations/github-issues');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load annotations');
        return;
      }
      setAnnotations(data.annotations || []);
      setLastRefresh(new Date());
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  // Group by canvas
  const grouped: GroupedAnnotations[] = React.useMemo(() => {
    const map = new Map<string, GroupedAnnotations>();
    for (const ann of annotations) {
      const existing = map.get(ann.canvas_id);
      if (existing) {
        existing.annotations.push(ann);
      } else {
        map.set(ann.canvas_id, {
          canvasId: ann.canvas_id,
          canvasName: ann.canvas_name || ann.canvas_id,
          annotations: [ann],
        });
      }
    }
    return Array.from(map.values());
  }, [annotations]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const shortSha = (sha: string) => sha.substring(0, 7);

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Design Review</h2>
          {!loading && (
            <span className={styles.countBadge}>
              {annotations.length} issue{annotations.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          {lastRefresh && (
            <span className={styles.refreshTime}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            className={styles.refreshButton}
            onClick={fetchAnnotations}
            disabled={loading}
            aria-label="Refresh"
          >
            <svg
              className={`${styles.refreshIcon} ${loading ? styles.spinning : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10" />
              <path d="M20.49 15a9 9 0 01-14.85 3.36L1 14" />
            </svg>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className={styles.errorBanner}>
          <svg
            className={styles.errorIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && annotations.length === 0 && (
        <div className={styles.loadingState}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonGroup}>
              <div className={styles.skeletonHeader} />
              {[1, 2].map((j) => (
                <div key={j} className={styles.skeletonRow} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && annotations.length === 0 && !error && (
        <div className={styles.emptyState}>
          <svg
            className={styles.emptyIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <h3 className={styles.emptyTitle}>No GitHub Issues Yet</h3>
          <p className={styles.emptyDescription}>
            Create GitHub Issues from annotations to see them here for design review.
          </p>
        </div>
      )}

      {/* Annotation list grouped by canvas */}
      {!loading && grouped.length > 0 && (
        <div className={styles.canvasGroups}>
          {grouped.map((group) => (
            <div key={group.canvasId} className={styles.canvasGroup}>
              <div className={styles.canvasGroupHeader}>
                <h3 className={styles.canvasGroupTitle}>{group.canvasName}</h3>
                <span className={styles.canvasGroupCount}>
                  {group.annotations.length} issue{group.annotations.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className={styles.annotationList}>
                {group.annotations.map((ann) => (
                  <div key={ann.id} className={styles.annotationRow}>
                    <div className={styles.annotationRowMain}>
                      {/* Issue number badge */}
                      <div className={styles.issueBadge}>
                        <svg
                          className={styles.issueBadgeIcon}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        #{ann.github_issue_number}
                      </div>

                      {/* Annotation content */}
                      <div className={styles.annotationContent}>
                        <p className={styles.annotationText}>
                          {ann.content || '(empty annotation)'}
                        </p>
                        <div className={styles.annotationMeta}>
                          <span>{ann.author_name || ann.author_id}</span>
                          <span className={styles.metaDot}>·</span>
                          <span>{formatDate(ann.created_at)}</span>
                          <span className={styles.metaDot}>·</span>
                          <span className={`${styles.statusPill} ${styles[ann.status]}`}>
                            {ann.status}
                          </span>
                          {ann.github_commit_sha && (
                            <>
                              <span className={styles.metaDot}>·</span>
                              <code className={styles.commitCode}>
                                {shortSha(ann.github_commit_sha)}
                              </code>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Issue URL */}
                    <div className={styles.annotationRowActions}>
                      <a
                        href={ann.github_issue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.issueLink}
                        aria-label={`View issue #${ann.github_issue_number}`}
                      >
                        View Issue
                        <svg
                          className={styles.externalIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
