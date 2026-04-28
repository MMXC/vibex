'use client';

import { useCallback, useState } from 'react';

export interface DesignReviewIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'compliance' | 'accessibility' | 'reuse';
  message: string;
  location?: string;
}

export interface DesignReviewRecommendation {
  id: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DesignReviewResult {
  compliance: DesignReviewIssue[];
  accessibility: DesignReviewIssue[];
  reuse: DesignReviewRecommendation[];
}

// Mock implementation — replace with real MCP call when review_design tool is available
async function callReviewDesignMCP(_figmaUrl: string, _designTokens: unknown[]): Promise<DesignReviewResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  // Return mock data
  return {
    compliance: [
      { id: 'c1', severity: 'critical', category: 'compliance', message: 'Primary color does not meet WCAG AA contrast ratio (3.2:1, required 4.5:1)', location: '--color-primary' },
      { id: 'c2', severity: 'warning', category: 'compliance', message: 'Spacing token inconsistency: 12px vs 16px for same component type', location: '.button' },
      { id: 'c3', severity: 'info', category: 'compliance', message: 'Font size 13px used instead of design system token var(--text-sm)', location: 'DDSToolbar' },
    ],
    accessibility: [
      { id: 'a1', severity: 'critical', category: 'accessibility', message: 'Icon button missing aria-label', location: 'exportBtn' },
      { id: 'a2', severity: 'warning', category: 'accessibility', message: 'Focus ring uses #00ffff on cyan background — low contrast', location: ':focus-visible' },
      { id: 'a3', severity: 'info', category: 'accessibility', message: 'Color alone used to indicate state (exportBtn hover)', location: 'DDSToolbar' },
    ],
    reuse: [
      { id: 'r1', message: 'Consider extracting common button styles to .actionButton component', priority: 'high' },
      { id: 'r2', message: 'ChapterTab and exportBtn share 80% identical CSS — factor out .pillButton', priority: 'medium' },
      { id: 'r3', message: 'Glassmorphism pattern (backdrop-filter) duplicated in toolbar and modal — create .glass utility', priority: 'low' },
    ],
  };
}

interface UseDesignReviewOptions {
  /** Trigger review on mount */
  autoTrigger?: boolean;
}

export function useDesignReview(_options: UseDesignReviewOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DesignReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runReview = useCallback(async (figmaUrl?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await callReviewDesignMCP(figmaUrl ?? '', []);
      setResult(data);
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Design review failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    isLoading,
    result,
    error,
    runReview,
    open,
    close,
  };
}
