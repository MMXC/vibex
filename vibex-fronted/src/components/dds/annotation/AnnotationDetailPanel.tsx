'use client';

/**
 * AnnotationDetailPanel — Sprint91 E2
 *
 * Detail panel/drawer showing annotation information with GitHub integration:
 * - Annotation content, author, creation date
 * - "Create GitHub Issue" button with owner/repo inputs
 * - GitHub Issue link display when linked
 * - "Link Commit" input for commit SHA
 * - Linked commit SHA display (short form)
 */

import React, { useState } from 'react';
import { type Annotation, type AnnotationUpdateInput } from './annotationStore';
import { useAnnotationStore } from './annotationStore';
import styles from './AnnotationDetailPanel.module.css';

interface AnnotationDetailPanelProps {
  annotation: Annotation;
  onClose: () => void;
  onUpdate: (id: string, patch: AnnotationUpdateInput) => void;
}

export function AnnotationDetailPanel({
  annotation,
  onClose,
  onUpdate,
}: AnnotationDetailPanelProps) {
  const { updateAnnotation } = useAnnotationStore();

  // GitHub Issue creation state
  const [issueOwner, setIssueOwner] = useState('');
  const [issueRepo, setIssueRepo] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Commit link state
  const [commitSha, setCommitSha] = useState('');
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const handleCreateGitHubIssue = async () => {
    if (!issueOwner.trim() || !issueRepo.trim()) {
      setIssueError('Owner and repo are required');
      return;
    }
    setIssueLoading(true);
    setIssueError(null);
    try {
      const res = await fetch(
        `/api/canvas/annotations/${annotation.id}/github-issue`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: issueOwner.trim(),
            repo: issueRepo.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setIssueError(data.error || 'Failed to create GitHub issue');
        return;
      }
      // Update local store
      const patch: AnnotationUpdateInput = {
        githubIssueUrl: data.issueUrl,
        githubIssueNumber: data.issueNumber,
      };
      updateAnnotation(annotation.id, patch);
      onUpdate(annotation.id, patch);
    } catch {
      setIssueError('Network error. Please try again.');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleLinkCommit = async () => {
    const sha = commitSha.trim();
    if (!sha) {
      setCommitError('Commit SHA is required');
      return;
    }
    setCommitLoading(true);
    setCommitError(null);
    try {
      const res = await fetch(
        `/api/canvas/annotations/${annotation.id}/commit-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commitSha: sha }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setCommitError(data.error || 'Failed to link commit');
        return;
      }
      // Update local store
      const patch: AnnotationUpdateInput = {
        githubCommitSha: data.commitSha,
      };
      updateAnnotation(annotation.id, patch);
      onUpdate(annotation.id, patch);
      setCommitSha('');
    } catch {
      setCommitError('Network error. Please try again.');
    } finally {
      setCommitLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const shortSha = (sha: string) => sha.substring(0, 7);

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Annotation Details</h2>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Annotation info */}
        <section className={styles.section}>
          <div className={styles.metaRow}>
            <span className={styles.label}>Author</span>
            <span className={styles.value}>
              {annotation.authorName || annotation.authorId}
            </span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.label}>Type</span>
            <span className={styles.value}>{annotation.type}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.label}>Position</span>
            <span className={styles.value}>
              ({annotation.x.toFixed(0)}, {annotation.y.toFixed(0)})
            </span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.label}>Status</span>
            <span className={`${styles.value} ${styles.statusBadge} ${styles[annotation.status]}`}>
              {annotation.status}
            </span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.label}>Created</span>
            <span className={styles.value}>{formatDate(annotation.createdAt)}</span>
          </div>
        </section>

        {/* Annotation content */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Content</h3>
          <p className={styles.annotationContent}>{annotation.content || '(empty)'}</p>
        </section>

        {/* GitHub Issue section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>GitHub Issue</h3>

          {annotation.githubIssueUrl ? (
            <div className={styles.githubLinked}>
              <div className={styles.issueInfo}>
                <svg
                  className={styles.githubIcon}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <a
                  href={annotation.githubIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.issueLink}
                >
                  Issue #{annotation.githubIssueNumber}
                </a>
              </div>
              <p className={styles.issueUrl}>{annotation.githubIssueUrl}</p>
            </div>
          ) : (
            <div className={styles.createIssueForm}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="issue-owner">
                  Owner
                </label>
                <input
                  id="issue-owner"
                  className={styles.textInput}
                  type="text"
                  placeholder="e.g., myorg"
                  value={issueOwner}
                  onChange={(e) => setIssueOwner(e.target.value)}
                  disabled={issueLoading}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="issue-repo">
                  Repo
                </label>
                <input
                  id="issue-repo"
                  className={styles.textInput}
                  type="text"
                  placeholder="e.g., myrepo"
                  value={issueRepo}
                  onChange={(e) => setIssueRepo(e.target.value)}
                  disabled={issueLoading}
                />
              </div>
              {issueError && (
                <p className={styles.errorMessage}>{issueError}</p>
              )}
              <button
                className={styles.actionButton}
                onClick={handleCreateGitHubIssue}
                disabled={issueLoading}
              >
                {issueLoading ? 'Creating...' : 'Create GitHub Issue'}
              </button>
            </div>
          )}
        </section>

        {/* Commit Link section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Linked Commit</h3>

          {annotation.githubCommitSha ? (
            <div className={styles.commitLinked}>
              <svg
                className={styles.commitIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <line x1="1.05" y1="12" x2="7" y2="12" />
                <line x1="17.01" y1="12" x2="22.96" y2="12" />
              </svg>
              <code className={styles.commitSha}>{shortSha(annotation.githubCommitSha)}</code>
              <code className={styles.commitShaFull}>{annotation.githubCommitSha}</code>
            </div>
          ) : (
            <div className={styles.linkCommitForm}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="commit-sha">
                  Commit SHA
                </label>
                <input
                  id="commit-sha"
                  className={styles.textInput}
                  type="text"
                  placeholder="e.g., a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
                  value={commitSha}
                  onChange={(e) => setCommitSha(e.target.value)}
                  disabled={commitLoading}
                />
              </div>
              {commitError && (
                <p className={styles.errorMessage}>{commitError}</p>
              )}
              <button
                className={styles.actionButton}
                onClick={handleLinkCommit}
                disabled={commitLoading}
              >
                {commitLoading ? 'Linking...' : 'Link Commit'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
