'use client';

/**
 * APIEndpointCard — S16-P1-2 Code Generator Real Components
 *
 * Renders an API endpoint with real props:
 * - method, path, summary, description
 */

import React from 'react';
import type { APIEndpointProps } from '@/types/codegen';
import styles from './APIEndpointCard.module.css';

interface APIEndpointCardProps {
  /** API endpoint data */
  endpoint: APIEndpointProps;
  selected?: boolean;
  onClick?: () => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#4ade80',
  POST: '#60a5fa',
  PUT: '#fbbf24',
  DELETE: '#f87171',
  PATCH: '#c084fc',
};

export function APIEndpointCard({
  endpoint,
  selected = false,
  onClick,
}: APIEndpointCardProps) {
  const { method, path, summary, description } = endpoint;
  const methodColor = METHOD_COLORS[method] ?? '#818cf8';

  return (
    <div
      className={`${styles.card} ${selected ? styles['card--selected'] : ''}`}
      data-testid="api-endpoint-card"
      data-method={method}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.header}>
        <span
          className={styles.method}
          data-testid="endpoint-method"
          style={{ color: methodColor, borderColor: methodColor }}
        >
          {method}
        </span>
        <code className={styles.path} data-testid="endpoint-path">
          {path}
        </code>
      </div>
      {summary && (
        <p className={styles.summary} data-testid="endpoint-summary">
          {summary}
        </p>
      )}
      {description && (
        <p className={styles.description} data-testid="endpoint-description">
          {description}
        </p>
      )}
    </div>
  );
}
