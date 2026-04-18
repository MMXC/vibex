/**
 * APIEndpointCard — API Endpoint Node Component
 * E1-U2
 */

'use client';

import React, { memo } from 'react';
import type { APIEndpointCard as APIEndpointCardType } from '@/types/dds';
import styles from './APIEndpointCard.module.css';

export interface APIEndpointCardProps {
  card: APIEndpointCardType;
  selected?: boolean;
}

/** P0-001/P0-002: Use CSS token variables for method colors */
const METHOD_COLORS: Record<string, string> = {
  GET: 'var(--color-method-get, #10b981)',
  POST: 'var(--color-method-post, #3b82f6)',
  PUT: 'var(--color-method-put, #f59e0b)',
  DELETE: 'var(--color-method-delete, #ef4444)',
  PATCH: '#8b5cf6',
  OPTIONS: "var(--color-method-options, #6b7280)",
  HEAD: "var(--color-method-options, #6b7280)",
};

export const APIEndpointCard = memo(function APIEndpointCard({
  card,
  selected = false,
}: APIEndpointCardProps) {
  const methodColor = METHOD_COLORS[card.method] ?? "var(--color-method-options, #6b7280)";

  return (
    <div className={`${styles.card} ${selected ? styles.selected : ''}`}>
      {/* Method badge + path */}
      <div className={styles.header}>
        <span
          className={styles.methodBadge}
          style={{ backgroundColor: methodColor }}
        >
          {card.method}
        </span>
        <span className={styles.path}>{card.path}</span>
      </div>

      {/* Summary */}
      {card.summary && (
        <div className={styles.summary}>{card.summary}</div>
      )}

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className={styles.tags}>
          {card.tags.map((tag: string) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Parameters count */}
      {card.parameters && card.parameters.length > 0 && (
        <div className={styles.meta}>
          <span>参数 {card.parameters.length}</span>
        </div>
      )}

      {/* Responses */}
      {card.responses && card.responses.length > 0 && (
        <div className={styles.responses}>
          {card.responses.slice(0, 3).map((r: { status: number; description: string }) => (
            <span
              key={r.status}
              className={`${styles.statusCode} ${r.status >= 400 ? styles.error : styles.success}`}
            >
              {r.status}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
