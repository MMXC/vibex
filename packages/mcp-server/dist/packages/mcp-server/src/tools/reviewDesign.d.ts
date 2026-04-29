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
/**
 * Run design review on canvas nodes.
 */
export declare function reviewDesign(input: ReviewDesignInput): Promise<DesignReviewReport>;
