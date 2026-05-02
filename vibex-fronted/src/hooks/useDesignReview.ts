'use client';

import { useCallback, useState } from 'react';
import { computeReviewDiff, type ReviewDiff } from '@/lib/reviewDiff';

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

interface DesignReviewReport {
  canvasId: string;
  summary: {
    compliance: 'pass' | 'warn' | 'fail';
    a11y: 'pass' | 'warn' | 'fail';
    reuseCandidates: number;
    totalNodes: number;
  };
  designCompliance?: {
    colors: boolean;
    colorIssues: unknown[];
    typography: boolean;
    typographyIssues: unknown[];
    spacing: boolean;
    spacingIssues: unknown[];
  };
  a11y?: {
    passed: boolean;
    critical: number;
    high: number;
    medium: number;
    low: number;
    issues: unknown[];
  };
  reuse?: {
    candidatesAboveThreshold: number;
    candidates: unknown[];
    recommendations: string[];
  };
}

// E19-1-S2: Real API call — replaces setTimeout mock
async function callReviewDesignMCP(canvasId: string, _figmaUrl: string, _designTokens: unknown[]): Promise<DesignReviewResult> {
  const response = await fetch('/api/mcp/review_design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      canvasId,
      nodes: [],
      checkCompliance: true,
      checkA11y: true,
      checkReuse: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Design review failed: ${response.statusText}`);
  }

  const report: DesignReviewReport = await response.json();

  // Adapter: DesignReviewReport → DesignReviewResult
  return {
    compliance: (report.designCompliance?.colorIssues ?? []).map((issue: unknown, idx: number) => {
      const typed = issue as { type?: string; message?: string; location?: string };
      return {
        id: `c-${idx}`,
        severity: (typed.type === 'color' ? 'critical' : 'warning') as DesignReviewIssue['severity'],
        category: 'compliance' as const,
        message: typed.message ?? String(issue),
        location: typed.location,
      };
    }).concat(
      (report.designCompliance?.typographyIssues ?? []).map((issue: unknown, idx: number) => {
        const typed = issue as { type?: string; message?: string; location?: string };
        return {
          id: `ct-${idx}`,
          severity: 'warning' as DesignReviewIssue['severity'],
          category: 'compliance' as const,
          message: typed.message ?? String(issue),
          location: typed.location,
        };
      }),
      (report.designCompliance?.spacingIssues ?? []).map((issue: unknown, idx: number) => {
        const typed = issue as { type?: string; message?: string; location?: string };
        return {
          id: `cs-${idx}`,
          severity: 'info' as DesignReviewIssue['severity'],
          category: 'compliance' as const,
          message: typed.message ?? String(issue),
          location: typed.location,
        };
      })
    ),
    accessibility: (report.a11y?.issues ?? []).map((issue: unknown, idx: number) => {
      const typed = issue as { issueType?: string; description?: string; nodeId?: string };
      return {
        id: `a-${idx}`,
        severity: (typed.issueType === 'missing-alt' || typed.issueType === 'missing-aria-label') ? 'critical' : 'warning' as DesignReviewIssue['severity'],
        category: 'accessibility' as const,
        message: typed.description ?? String(issue),
        location: typed.nodeId,
      };
    }),
    reuse: (report.reuse?.recommendations ?? []).map((rec: unknown, idx: number) => {
      const typed = rec as { message?: string; priority?: string };
      return {
        id: `r-${idx}`,
        message: typed.message ?? String(rec),
        priority: (typed.priority ?? 'medium') as DesignReviewRecommendation['priority'],
      };
    }),
  };
}

export interface UseDesignReviewOptions {
  /** Trigger review on mount */
  autoTrigger?: boolean;
  /** Previous report ID to compute diff against */
  previousReportId?: string | null;
}

export function useDesignReview(_options: UseDesignReviewOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DesignReviewResult | null>(null);
  const [diffResult, setDiffResult] = useState<ReviewDiff | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runReview = useCallback(async (figmaUrl?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // E19-1-S2: call real API with canvasId extracted from figmaUrl or default
      const canvasId = figmaUrl ? figmaUrl.split('/').pop() ?? 'default' : 'default';
      const data = await callReviewDesignMCP(canvasId, figmaUrl ?? '', []);
      const prev = result;
      const diff = prev ? computeReviewDiff(data, prev) : null;
      setDiffResult(diff);
      setResult(data);
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Design review failed');
    } finally {
      setIsLoading(false);
    }
  }, [result]);

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
    diffResult,
    error,
    runReview,
    open,
    close,
  };
}
