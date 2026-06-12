/**
 * AISuggestionsPanel — S89-E2: AI Design Suggestions
 *
 * Right-side slide-in drawer that shows AI-generated design suggestions.
 * Auto-generates 1-3 suggestions based on canvas content analysis.
 */

'use client';

import React, { memo, useCallback } from 'react';
import { useAIDesignSuggestionsStore } from '@/stores/dds/aiDesignSuggestionsStore';
import { useAISuggestions } from '@/hooks/dds/useAISuggestions';
import styles from './AISuggestionsPanel.module.css';

function typeTagClass(type: string): string {
  const map: Record<string, string> = {
    structure: styles.structure ?? '',
    layout: styles.layout ?? '',
    naming: styles.naming ?? '',
    connection: styles.connection ?? '',
  };
  return `${styles.typeTag} ${map[type] ?? ''}`;
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    structure: 'Structure',
    layout: 'Layout',
    naming: 'Naming',
    connection: 'Connection',
  };
  return map[type] ?? type;
}

export const AISuggestionsPanel = memo(function AISuggestionsPanel() {
  const isOpen = useAIDesignSuggestionsStore((s) => s.isOpen);
  const closePanel = useAIDesignSuggestionsStore((s) => s.closePanel);
  const applySuggestion = useAIDesignSuggestionsStore((s) => s.applySuggestion);
  const dismissSuggestion = useAIDesignSuggestionsStore((s) => s.dismissSuggestion);

  const { suggestions, stats } = useAISuggestions();

  const pendingSuggestions = suggestions.filter((sg) => sg.status === 'pending');

  const handleApply = useCallback(
    (id: string) => {
      applySuggestion(id);
    },
    [applySuggestion]
  );

  const handleDismiss = useCallback(
    (id: string) => {
      dismissSuggestion(id);
    },
    [dismissSuggestion]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) closePanel();
    },
    [closePanel]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={styles.overlay}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        data-testid="ai-suggestions-panel"
        role="dialog"
        aria-modal="true"
        aria-label="AI Design Suggestions"
        className={styles.drawer}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span aria-hidden="true">💡</span>
            AI Suggestions
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closePanel}
            aria-label="Close suggestions panel"
          >
            ✕
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalNodes}</span>
              <span className={styles.statLabel}>Nodes</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalEdges}</span>
              <span className={styles.statLabel}>Edges</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.chapterTypes.size}</span>
              <span className={styles.statLabel}>Chapters</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className={styles.body}>
          {pendingSuggestions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">
                ✨
              </div>
              <p className={styles.emptyTitle}>No suggestions</p>
              <p className={styles.emptyDescription}>
                Your canvas looks great! Add more content to get AI-powered suggestions for improving its structure.
              </p>
            </div>
          ) : (
            <ul className={styles.suggestionList} role="list">
              {suggestions.map((sg) => (
                <li
                  key={sg.id}
                  className={`${styles.suggestionCard} ${sg.status !== 'pending' ? styles[sg.status] ?? '' : ''}`}
                  data-testid={`suggestion-${sg.id}`}
                  data-status={sg.status}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon} aria-hidden="true">
                      {sg.icon}
                    </span>
                    <div className={styles.cardContent}>
                      <p className={styles.cardTitle}>{sg.title}</p>
                      <p className={styles.cardDescription}>{sg.description}</p>
                      <span className={typeTagClass(sg.type)}>{typeLabel(sg.type)}</span>
                    </div>
                  </div>

                  {sg.status === 'pending' ? (
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.applyBtn}
                        onClick={() => handleApply(sg.id)}
                        data-testid={`apply-${sg.id}`}
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        className={styles.dismissBtn}
                        onClick={() => handleDismiss(sg.id)}
                        data-testid={`dismiss-${sg.id}`}
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : sg.status === 'applied' ? (
                    <div className={styles.appliedBadge}>
                      ✓ Applied
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
});
