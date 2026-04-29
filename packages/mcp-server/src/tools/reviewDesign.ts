/**
 * review_design — MCP Tool for AI Design Review
 *
 * Performs automated design review on canvas nodes:
 * - Design compliance: color/typography/spacing rules
 * - Accessibility: WCAG 2.1 AA checks
 * - Component reuse: structural similarity detection
 *
 * @module tools/reviewDesign
 */

import { checkDesignCompliance } from '../../../../vibex-backend/src/lib/prompts/designCompliance.js';
import { checkA11yCompliance } from '../../../../vibex-backend/src/lib/prompts/a11yChecker.js';
import { analyzeComponentReuse } from '../../../../vibex-backend/src/lib/prompts/componentReuse.js';

// =============================================================================
// Types
// =============================================================================

export interface DesignReviewReport {
  canvasId: string;
  reviewedAt: string;
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

export interface ReviewDesignInput {
  canvasId: string;
  nodes?: Array<Record<string, unknown>>;
  checkCompliance?: boolean;
  checkA11y?: boolean;
  checkReuse?: boolean;
}

// =============================================================================
// Review Logic
// =============================================================================

/**
 * Run design review on canvas nodes.
 */
export async function reviewDesign(input: ReviewDesignInput): Promise<DesignReviewReport> {
  const {
    canvasId,
    nodes = [],
    checkCompliance = true,
    checkA11y = true,
    checkReuse = true,
  } = input;

  const report: DesignReviewReport = {
    canvasId,
    reviewedAt: new Date().toISOString(),
    summary: {
      compliance: 'pass',
      a11y: 'pass',
      reuseCandidates: 0,
      totalNodes: nodes.length,
    },
  };

  // --- Design Compliance ---
  if (checkCompliance && nodes.length > 0) {
    const complianceResults = nodes.map((node) =>
      checkDesignCompliance(node, {
        checkColors: true,
        checkTypography: true,
        checkSpacing: true,
      })
    );

    const hasColorIssues = complianceResults.some((r) => !r.colors);
    const hasTypographyIssues = complianceResults.some((r) => !r.typography);
    const hasSpacingIssues = complianceResults.some((r) => !r.spacing);

    if (hasColorIssues || hasTypographyIssues || hasSpacingIssues) {
      report.summary.compliance = 'warn';
    }

    report.designCompliance = {
      colors: !hasColorIssues,
      colorIssues: complianceResults.flatMap((r) => r.colorIssues),
      typography: !hasTypographyIssues,
      typographyIssues: complianceResults.flatMap((r) => r.typographyIssues),
      spacing: !hasSpacingIssues,
      spacingIssues: complianceResults.flatMap((r) => r.spacingIssues),
    };
  }

  // --- Accessibility ---
  if (checkA11y && nodes.length > 0) {
    const a11yResult = checkA11yCompliance(nodes);

    if (a11yResult.summary.critical > 0 || a11yResult.summary.high > 0) {
      report.summary.a11y = 'fail';
    } else if (a11yResult.issues.length > 0) {
      report.summary.a11y = 'warn';
    }

    report.a11y = {
      passed: a11yResult.passed,
      critical: a11yResult.summary.critical,
      high: a11yResult.summary.high,
      medium: a11yResult.summary.medium,
      low: a11yResult.summary.low,
      issues: a11yResult.issues,
    };
  }

  // --- Component Reuse ---
  if (checkReuse && nodes.length > 0) {
    const reuseResult = analyzeComponentReuse(nodes);

    report.summary.reuseCandidates = reuseResult.candidatesAboveThreshold;
    report.reuse = {
      candidatesAboveThreshold: reuseResult.candidatesAboveThreshold,
      candidates: reuseResult.candidates.slice(0, 10), // top 10
      recommendations: reuseResult.recommendations,
    };
  }

  return report;
}
