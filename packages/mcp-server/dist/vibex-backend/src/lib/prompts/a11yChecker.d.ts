/**
 * Accessibility (a11y) Checker
 *
 * Checks WCAG 2.1 AA compliance issues in canvas flows/components:
 * - Images without alt text
 * - Interactive elements without keyboard hints
 * - Color contrast issues (foreground/background pairs with contrast < 4.5:1)
 * - Missing ARIA labels
 *
 * @module lib/prompts/a11yChecker
 */
export interface A11yIssue {
    nodeId: string;
    nodeName?: string;
    issueType: 'missing-alt' | 'missing-keyboard-hint' | 'low-contrast' | 'missing-aria-label';
    severity: 'critical' | 'high' | 'medium' | 'low';
    element: string;
    message: string;
    wcagCriteria: string;
}
export interface A11yCheckResult {
    passed: boolean;
    issues: A11yIssue[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}
/**
 * Check accessibility compliance for a canvas flow or component.
 *
 * @param nodes - Array of canvas nodes to check
 * @returns A11yCheckResult with issues categorized by severity
 */
export declare function checkA11yCompliance(nodes: Array<Record<string, unknown>>): A11yCheckResult;
