/**
 * Component Reuse Analyzer
 *
 * Identifies structurally similar canvas nodes that could be consolidated
 * into a shared component. Uses structural similarity scoring.
 *
 * Similarity threshold: > 0.7 (70%) → candidate for component extraction.
 *
 * @module lib/prompts/componentReuse
 */
export interface ReuseCandidate {
    nodeIdA: string;
    nodeNameA?: string;
    nodeIdB: string;
    nodeNameB?: string;
    similarityScore: number;
    sharedFields: string[];
    differingFields: Array<{
        field: string;
        valueA: unknown;
        valueB: unknown;
    }>;
    recommendation: string;
}
export interface ReuseAnalysisResult {
    candidates: ReuseCandidate[];
    totalNodes: number;
    candidatesAboveThreshold: number;
    recommendations: string[];
}
/**
 * Analyze canvas nodes for component reuse opportunities.
 *
 * @param nodes - Array of canvas nodes to analyze
 * @param threshold - Similarity score threshold (default: 0.7)
 * @returns ReuseAnalysisResult with all candidate pairs
 */
export declare function analyzeComponentReuse(nodes: Array<Record<string, unknown>>, threshold?: number): ReuseAnalysisResult;
