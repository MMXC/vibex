/**
 * PRStatusBadge.tsx — GitHub PR Status Badge
 * Sprint89 E4: GitHub Integration Deep Link
 *
 * Displays a GitHub PR/Issue status badge with:
 * - State icon (open ✓ green, merged ✓ purple, closed ✗ red)
 * - PR title + number
 * - Click to open GitHub in new tab
 *
 * AC5: 点击徽章跳转 GitHub PR 页面
 */
'use client';

import React from 'react';
import type { GitHubPR } from '@/hooks/useGitHubPR';
import styles from './PRStatusBadge.module.css';

interface PRStatusBadgeProps {
  /** The PR data from GitHub API */
  pr: GitHubPR;
  /** Optional: custom click handler. Default: window.open(pr.htmlUrl, '_blank') */
  onClick?: (pr: GitHubPR) => void;
  /** Show a loading spinner while fetching */
  isLoading?: boolean;
  className?: string;
}

const STATE_CONFIG = {
  open: {
    icon: '🟢',
    label: 'Open',
    color: '#238636',
    bgClass: styles.stateOpen,
  },
  merged: {
    icon: '🟣',
    label: 'Merged',
    color: '#8250df',
    bgClass: styles.stateMerged,
  },
  closed: {
    icon: '🔴',
    label: 'Closed',
    color: '#da3633',
    bgClass: styles.stateClosed,
  },
} as const;

export function PRStatusBadge({ pr, onClick, isLoading, className = '' }: PRStatusBadgeProps) {
  const config = STATE_CONFIG[pr.state];

  const handleClick = () => {
    if (onClick) {
      onClick(pr);
    } else {
      window.open(pr.htmlUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      className={`${styles.badge} ${config.bgClass} ${className}`}
      data-testid="pr-status-badge"
      onClick={handleClick}
      title={`${pr.title} — Click to open on GitHub`}
      aria-label={`GitHub PR #${pr.number}: ${pr.title} (${config.label})`}
    >
      {isLoading && (
        <span className={styles.spinner} aria-hidden="true" />
      )}
      <span className={styles.icon} aria-hidden="true">{config.icon}</span>
      <span className={styles.title} title={pr.title}>
        #{pr.number} {pr.title}
      </span>
      <span className={styles.author}>@{pr.user.login}</span>
      <svg
        className={styles.externalIcon}
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </button>
  );
}
