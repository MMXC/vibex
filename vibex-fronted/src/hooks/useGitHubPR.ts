/**
 * useGitHubPR — Hook for fetching GitHub PR/Issue status for a canvas
 * Sprint89 E4: GitHub Integration Deep Link
 *
 * Usage:
 *   const { prUrl, prStatus, isLoading, error, saveUrl } = useGitHubPR(canvasId);
 *
 * saveUrl(value) — saves the GitHub PR/Issue URL to the canvas
 * prStatus — null | { number, title, state, htmlUrl, user, ... }
 */
'use client';

import { useState, useCallback, useEffect } from 'react';

export interface GitHubPR {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  htmlUrl: string;
  user: {
    login: string;
    avatarUrl: string;
  };
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions?: number;
  deletions?: number;
  draft?: boolean;
}

// ============================================
// GitHub PR URL parser
// ============================================
const GITHUB_PR_REGEX = /^https?:\/\/github\.com\/([^/]+\/[^/]+)\/(pull|issues)\/(\d+)/i;

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  number: number;
  type: 'pull' | 'issue';
}

export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  const trimmed = url.trim();
  const match = trimmed.match(GITHUB_PR_REGEX);
  if (!match) return null;
  const [owner, repo] = match[1].split('/');
  return {
    owner,
    repo,
    number: parseInt(match[3], 10),
    type: match[2].toLowerCase() === 'pull' ? 'pull' : 'issue',
  };
}

// ============================================
// Hook
// ============================================
interface UseGitHubPROptions {
  /** GitHub OAuth token for API calls */
  githubToken?: string;
}

interface UseGitHubPRReturn {
  /** Currently saved GitHub PR/Issue URL for this canvas */
  prUrl: string | null;
  /** Parsed PR status from GitHub API */
  prStatus: GitHubPR | null;
  /** True while fetching PR status */
  isLoading: boolean;
  /** Error message if any fetch failed */
  error: string | null;
  /** Save a new GitHub PR/Issue URL to the canvas */
  saveUrl: (url: string) => Promise<void>;
  /** Clear the GitHub PR URL */
  clearUrl: () => Promise<void>;
  /** Reload PR status (useful after saving a new URL) */
  refresh: () => Promise<void>;
}

export function useGitHubPR(
  canvasId: string,
  options: UseGitHubPROptions = {}
): UseGitHubPRReturn {
  const { githubToken } = options;
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [prStatus, setPrStatus] = useState<GitHubPR | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load PR status whenever prUrl changes
  const loadPRStatus = useCallback(
    async (url: string | null) => {
      if (!url) {
        setPrStatus(null);
        return;
      }
      const parsed = parseGitHubUrl(url);
      if (!parsed || parsed.type !== 'pull') {
        // Issues don't have status — just store the URL
        setPrStatus(null);
        return;
      }
      if (!githubToken) {
        // No token — can't fetch PR status, but URL is still valid
        setPrStatus(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/github/pr/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/${parsed.number}`,
          { headers: { Authorization: `Bearer ${githubToken}` } }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to fetch PR status');
        }
        setPrStatus(data.pr);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PR status');
        setPrStatus(null);
      } finally {
        setIsLoading(false);
      }
    },
    [githubToken]
  );

  // Fetch stored URL on mount
  const fetchStoredUrl = useCallback(async () => {
    try {
      const response = await fetch(`/api/canvas/${canvasId}/github`);
      const data = await response.json();
      if (data.ok && data.githubPrUrl) {
        setPrUrl(data.githubPrUrl);
        await loadPRStatus(data.githubPrUrl);
      }
    } catch {
      // Silently fail — canvas might not support github link yet
    }
  }, [canvasId, loadPRStatus]);

  useEffect(() => {
    if (canvasId) {
      fetchStoredUrl();
    }
  }, [canvasId, fetchStoredUrl]);

  const saveUrl = useCallback(
    async (url: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/canvas/${canvasId}/github`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ githubPrUrl: url }),
        });
        const data = await response.json();
        if (!data.ok) {
          throw new Error(data.error ?? 'Failed to save URL');
        }
        setPrUrl(url);
        await loadPRStatus(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save URL');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [canvasId, loadPRStatus]
  );

  const clearUrl = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/canvas/${canvasId}/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubPrUrl: null }),
      });
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error ?? 'Failed to clear URL');
      }
      setPrUrl(null);
      setPrStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear URL');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [canvasId]);

  const refresh = useCallback(async () => {
    if (prUrl) {
      await loadPRStatus(prUrl);
    }
  }, [prUrl, loadPRStatus]);

  return { prUrl, prStatus, isLoading, error, saveUrl, clearUrl, refresh };
}
