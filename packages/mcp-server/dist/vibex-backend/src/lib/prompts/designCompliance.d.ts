/**
 * Design Compliance Checker
 *
 * Checks whether canvas flows/components follow design system rules:
 * - Color: no hardcoded hex/rgba values (must use CSS variables)
 * - Typography: no literal font-size/font-family (must use CSS variables)
 * - Spacing: values must be multiples of 4px (4px grid system)
 *
 * @module lib/prompts/designCompliance
 */
/** Design compliance rules */
export interface ComplianceRules {
    /** Whether to check color compliance */
    checkColors: boolean;
    /** Whether to check typography compliance */
    checkTypography: boolean;
    /** Whether to check spacing compliance */
    checkSpacing: boolean;
}
export interface ComplianceResult {
    colors: boolean;
    colorIssues: ColorIssue[];
    typography: boolean;
    typographyIssues: TypographyIssue[];
    spacing: boolean;
    spacingIssues: SpacingIssue[];
}
export interface ColorIssue {
    nodeId: string;
    nodeName?: string;
    field: string;
    value: string;
    message: string;
}
export interface TypographyIssue {
    nodeId: string;
    nodeName?: string;
    field: string;
    value: string;
    message: string;
}
export interface SpacingIssue {
    nodeId: string;
    nodeName?: string;
    field: string;
    value: number;
    expectedMultiple: number;
    message: string;
}
/**
 * Check design compliance for a flow or component.
 *
 * @param flow - The flow/component data to check
 * @param rules - Which rules to apply (default: all)
 * @returns ComplianceResult with pass/fail for each category
 */
export declare function checkDesignCompliance(flow: Record<string, unknown>, rules?: Partial<ComplianceRules>): ComplianceResult;
