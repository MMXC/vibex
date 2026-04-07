/**
 * Requirement Validation Prompt Templates
 * 
 * This module provides prompt templates for validating requirements
 * in the VibeX AI Prototype Builder. It focuses on checking requirements
 * for completeness, consistency, feasibility, and testability.
 * 
 * @module lib/prompts/requirement-validation
 */

// ============================================
// Types and Interfaces
// ============================================

/**
 * Validation category
 */
export enum ValidationCategory {
  COMPLETENESS = 'completeness',
  CONSISTENCY = 'consistency',
  FEASIBILITY = 'feasibility',
  TESTABILITY = 'testability',
  CLARITY = 'clarity',
  TRACEABILITY = 'traceability',
}

/**
 * Validation severity level
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  SUGGESTION = 'suggestion',
  INFO = 'info',
}

/**
 * Validation status
 */
export enum ValidationStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning',
  SKIPPED = 'skipped',
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  id: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  title: string;
  description: string;
  location?: {
    requirementId?: string;
    field?: string;
    section?: string;
  };
  suggestion?: string;
  relatedIssues?: string[];
}

/**
 * Validation result for a single requirement
 */
export interface RequirementValidationResult {
  requirementId: string;
  status: ValidationStatus;
  score: number;
  issues: ValidationIssue[];
  passedChecks: string[];
  missingElements: string[];
  conflictingRequirements: string[];
  suggestions: string[];
}

/**
 * Overall validation summary
 */
export interface ValidationSummary {
  totalRequirements: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  overallScore: number;
  categories: Record<ValidationCategory, {
    passed: number;
    failed: number;
    warnings: number;
  }>;
  criticalIssues: ValidationIssue[];
  recommendations: string[];
}

/**
 * Configuration for requirement validation
 */
export interface RequirementValidationConfig {
  /** Validation categories to include */
  categories?: ValidationCategory[];
  /** Minimum score threshold for passing */
  minScoreThreshold?: number;
  /** Check for specific requirement types */
  requirementTypes?: string[];
  /** Include detailed suggestions */
  includeSuggestions?: boolean;
  /** Check cross-requirement consistency */
  crossCheck?: boolean;
  /** Industry-specific validation rules */
  industryContext?: string;
  /** Target platform for feasibility checks */
  targetPlatform?: string;
  /** Detail level */
  detailLevel?: 'brief' | 'standard' | 'detailed';
}

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for requirement validation
 */
export const REQUIREMENT_VALIDATION_SYSTEM_PROMPT = `You are an expert requirements validation specialist. Your role is to thoroughly validate requirements for quality, completeness, consistency, feasibility, and testability.

## Validation Categories

### 1. Completeness ( completeness )
- All necessary fields are present
- Acceptance criteria are defined
- User roles are identified
- Business rules are specified
- Constraints are documented
- Dependencies are listed
- Edge cases are considered

### 2. Consistency ( consistency )
- No contradictions within requirements
- Consistent terminology
- Consistent level of detail
- No conflicting constraints
- Aligned with existing system requirements
- Consistent priority assignments

### 3. Feasibility ( feasibility )
- Technically achievable
- Within time/resource constraints
- Compatible with target platform
- No impossible dependencies
- Realistic performance expectations
- Accessible required resources

### 4. Testability ( testability )
- Clear acceptance criteria
- Measurable outcomes
- Testable conditions
- Defined success criteria
- Identifiable test scenarios
- Verifiable behaviors

### 5. Clarity ( clarity )
- Unambiguous language
- Clear user stories
- Defined scope
- No jargon without definition
- Explicit assumptions
- Clear actors and actions

### 6. Traceability ( traceability )
- Clear source/origin
- Links to parent requirements
- Identified stakeholders
- Business justification
- Rationale documented

## Validation Severity Levels

- **ERROR**: Must fix before proceeding (requirement is invalid)
- **WARNING**: Should fix (potential issue)
- **SUGGESTION**: Consider improving (enhancement)
- **INFO**: FYI (informational)

## Output Requirements

You MUST respond with a valid JSON object in this exact format:

\`\`\`json
{
  "requirementId": "REQ-001",
  "status": "passed|failed|warning|skipped",
  "score": 0.85,
  "issues": [
    {
      "id": "VAL-001",
      "category": "completeness|consistency|feasibility|testability|clarity|traceability",
      "severity": "error|warning|suggestion|info",
      "title": "Issue title",
      "description": "Detailed description of the issue",
      "location": {
        "requirementId": "REQ-001",
        "field": "acceptanceCriteria",
        "section": "functional_requirements"
      },
      "suggestion": "How to fix this issue",
      "relatedIssues": ["VAL-002"]
    }
  ],
  "passedChecks": [
    "Clear requirement title provided",
    "Target platform specified",
    "Priority assigned"
  ],
  "missingElements": [
    "Acceptance criteria not defined",
    "No user roles specified"
  ],
  "conflictingRequirements": [],
  "suggestions": [
    "Consider adding performance requirements",
    "Add edge case scenarios"
  ]
}
\`\`\`

Provide ONLY the JSON, no additional text.`;

/**
 * Brief validation prompt
 */
export const BRIEF_REQUIREMENT_VALIDATION_PROMPT = `Validate the following requirement quickly:

Requirement: {requirement}

Check for:
1. Completeness (all needed parts present)
2. Clarity (unambiguous)
3. Testability (can verify)

Output as JSON with:
- status: passed|failed|warning
- score: 0-1
- issues: array of problems found
- missingElements: what's missing
- suggestions: how to improve`;

/**
 * Detailed validation prompt with cross-requirement checking
 */
export const DETAILED_REQUIREMENT_VALIDATION_PROMPT = `Perform a comprehensive validation of the following requirements. Check all aspects including cross-requirement consistency.

Requirements:
{requirements}

{context}

{platform}

Provide a complete validation report in JSON format:
- For each requirement: id, status, score, issues, passedChecks, missingElements, conflictingRequirements, suggestions
- Summary: totalRequirements, passedCount, failedCount, overallScore, criticalIssues, recommendations

Output as JSON.`;

// ============================================
// Prompt Generation Functions
// ============================================

/**
 * Generate requirement validation prompt
 */
export function generateRequirementValidationPrompt(
  requirement: string,
  config?: RequirementValidationConfig
): string {
  const categories = config?.categories || Object.values(ValidationCategory);
  const detailLevel = config?.detailLevel || 'standard';
  const categoriesText = categories.join(', ');
  
  const systemPrompt = REQUIREMENT_VALIDATION_SYSTEM_PROMPT;
  
  const contextSection = config?.industryContext 
    ? `Industry Context: ${config.industryContext}\n` 
    : '';
  
  const platformSection = config?.targetPlatform 
    ? `Target Platform: ${config.targetPlatform}\n` 
    : '';
  
  const crossCheckSection = config?.crossCheck 
    ? `Perform cross-requirement consistency checking.\n` 
    : '';
  
  let userPrompt: string;
  
  switch (detailLevel) {
    case 'brief':
      userPrompt = BRIEF_REQUIREMENT_VALIDATION_PROMPT.replace(
        '{requirement}',
        requirement
      );
      break;
    case 'detailed':
      userPrompt = DETAILED_REQUIREMENT_VALIDATION_PROMPT
        .replace('{requirements}', requirement)
        .replace('{context}', contextSection)
        .replace('{platform}', platformSection + crossCheckSection);
      break;
    default:
      userPrompt = `${systemPrompt}

## Requirement to Validate

Focus areas: ${categoriesText}

${requirement}

${contextSection}${platformSection}${crossCheckSection}Provide validation results in the specified JSON format.`;
  }
  
  return userPrompt;
}

/**
 * Generate completeness check prompt
 */
export function generateCompletenessCheckPrompt(requirement: string): string {
  return `Check if the following requirement is complete:

${requirement}

Verify presence of:
- Clear title
- Detailed description
- User roles involved
- Functional requirements
- Acceptance criteria
- Constraints
- Dependencies
- Priority level

Output as JSON with keys: isComplete, missingElements (array), score (0-1).`;
}

/**
 * Generate consistency check prompt
 */
export function generateConsistencyCheckPrompt(requirements: string[]): string {
  const requirementsText = requirements.map((r, i) => `Req ${i + 1}: ${r}`).join('\n\n');
  
  return `Check for consistency issues across these requirements:

${requirementsText}

Look for:
- Contradictory statements
- Inconsistent terminology
- Conflicting constraints
- Inconsistent priority levels
- Conflicting data requirements

Output as JSON with keys: hasConflicts (boolean), conflicts (array with requirements, type, description), suggestions (array).`;
}

/**
 * Generate feasibility check prompt
 */
export function generateFeasibilityCheckPrompt(
  requirement: string,
  platform?: string
): string {
  const platformText = platform ? `Target Platform: ${platform}` : '';
  
  return `Assess the feasibility of implementing this requirement:

${requirement}

${platformText}

Consider:
- Technical complexity
- Required resources
- Dependencies feasibility
- Performance feasibility
- Integration challenges
- Time estimation

Output as JSON with keys: isFeasible, complexity (low/medium/high), risks (array), recommendations (array), estimatedEffort.`;
}

/**
 * Generate testability check prompt
 */
export function generateTestabilityCheckPrompt(requirement: string): string {
  return `Assess the testability of this requirement:

${requirement}

Check for:
- Clear acceptance criteria
- Measurable outcomes
- Testable conditions
- Identifiable test scenarios
- Verifiable behaviors
- Edge cases defined

Output as JSON with keys: isTestable, score (0-1), testScenarios (array), gaps (array), suggestions (array).`;
}

/**
 * Generate clarity check prompt
 */
export function generateClarityCheckPrompt(requirement: string): string {
  return `Assess the clarity of this requirement:

${requirement}

Check for:
- Ambiguous language
- Undefined terms
- Vague descriptions
- Implicit assumptions
- Unclear scope
- Missing context

Output as JSON with keys: isClear, clarityScore, ambiguousPhrases (array), unclearPoints (array), suggestions (array).`;
}

/**
 * Generate validation summary prompt
 */
export function generateValidationSummaryPrompt(
  results: RequirementValidationResult[]
): string {
  return `Generate a summary of these validation results:

${JSON.stringify(results, null, 2)}

Provide:
- Total requirements count
- Passed/failed/warning counts
- Overall score
- Critical issues requiring immediate attention
- Recommendations for improvement

Output as JSON with keys: summary object as described.`;
}

/**
 * Generate batch validation prompt
 */
export function generateBatchValidationPrompt(
  requirements: Array<{ id: string; content: string }>,
  config?: RequirementValidationConfig
): string {
  const requirementsText = requirements
    .map(r => `ID: ${r.id}\n${r.content}`)
    .join('\n\n---\n\n');
  
  const categories = config?.categories?.join(', ') || 'all';
  const crossCheck = config?.crossCheck ? 'Include cross-requirement consistency checking.' : '';
  
  return `Validate all requirements:

${requirementsText}

Categories to check: ${categories}
${crossCheck}

For each requirement provide validation result in JSON format with:
- requirementId
- status
- score
- issues
- passedChecks
- missingElements
- suggestions

Also provide overall summary with counts and recommendations.

Output as JSON.`;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Validate validation result structure
 */
export function validateValidationResult(output: unknown): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!output || typeof output !== 'object') {
    errors.push('Output must be an object');
    return { isValid: false, errors, warnings };
  }
  
  const obj = output as Record<string, unknown>;
  
  // Required fields
  const requiredFields = ['requirementId', 'status', 'score', 'issues'];
  for (const field of requiredFields) {
    if (!(field in obj)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Status validation
  const validStatuses = Object.values(ValidationStatus);
  if (obj.status && !validStatuses.includes(obj.status as ValidationStatus)) {
    warnings.push(`Invalid status: ${obj.status}`);
  }
  
  // Score range
  if (typeof obj.score === 'number' && (obj.score < 0 || obj.score > 1)) {
    errors.push('Score must be between 0 and 1');
  }
  
  // Issues should be array
  if (obj.issues !== undefined && !Array.isArray(obj.issues)) {
    errors.push('Issues must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get default validation result
 */
export function getDefaultValidationResult(requirementId: string): RequirementValidationResult {
  return {
    requirementId,
    status: ValidationStatus.SKIPPED,
    score: 0,
    issues: [],
    passedChecks: [],
    missingElements: ['Requirement content not provided'],
    conflictingRequirements: [],
    suggestions: ['Provide requirement content for validation'],
  };
}

/**
 * Calculate overall validation score
 */
export function calculateOverallScore(results: RequirementValidationResult[]): number {
  if (results.length === 0) return 0;
  
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  return Math.round((totalScore / results.length) * 100) / 100;
}

/**
 * Get critical issues from results
 */
export function getCriticalIssues(results: RequirementValidationResult[]): ValidationIssue[] {
  const criticalIssues: ValidationIssue[] = [];
  
  for (const result of results) {
    for (const issue of result.issues) {
      if (issue.severity === ValidationSeverity.ERROR) {
        criticalIssues.push(issue);
      }
    }
  }
  
  return criticalIssues;
}

/**
 * Group issues by category
 */
export function groupIssuesByCategory(
  results: RequirementValidationResult[]
): Record<ValidationCategory, ValidationIssue[]> {
  const grouped: Record<ValidationCategory, ValidationIssue[]> = {
    [ValidationCategory.COMPLETENESS]: [],
    [ValidationCategory.CONSISTENCY]: [],
    [ValidationCategory.FEASIBILITY]: [],
    [ValidationCategory.TESTABILITY]: [],
    [ValidationCategory.CLARITY]: [],
    [ValidationCategory.TRACEABILITY]: [],
  };
  
  for (const result of results) {
    for (const issue of result.issues) {
      if (grouped[issue.category]) {
        grouped[issue.category].push(issue);
      }
    }
  }
  
  return grouped;
}

/**
 * Generate issue ID
 */
export function generateIssueId(category: ValidationCategory, index: number): string {
  const prefix = {
    [ValidationCategory.COMPLETENESS]: 'COMP',
    [ValidationCategory.CONSISTENCY]: 'CONS',
    [ValidationCategory.FEASIBILITY]: 'FEAS',
    [ValidationCategory.TESTABILITY]: 'TEST',
    [ValidationCategory.CLARITY]: 'CLAR',
    [ValidationCategory.TRACEABILITY]: 'TRACE',
  };
  
  return `${prefix[category]}-${String(index + 1).padStart(3, '0')}`;
}

/**
 * Determine status based on issues
 */
export function determineStatus(issues: ValidationIssue[]): ValidationStatus {
  const hasErrors = issues.some(i => i.severity === ValidationSeverity.ERROR);
  const hasWarnings = issues.some(i => i.severity === ValidationSeverity.WARNING);
  
  if (hasErrors) {
    return ValidationStatus.FAILED;
  }
  if (hasWarnings) {
    return ValidationStatus.WARNING;
  }
  
  return ValidationStatus.PASSED;
}

/**
 * Calculate score based on issues
 */
export function calculateScore(issues: ValidationIssue[], maxScore = 1): number {
  const errorWeight = 0.2;
  const warningWeight = 0.1;
  const suggestionWeight = 0.05;
  
  const errorCount = issues.filter(i => i.severity === ValidationSeverity.ERROR).length;
  const warningCount = issues.filter(i => i.severity === ValidationSeverity.WARNING).length;
  const suggestionCount = issues.filter(i => i.severity === ValidationSeverity.SUGGESTION).length;
  
  const deduction = 
    (errorCount * errorWeight) + 
    (warningCount * warningWeight) + 
    (suggestionCount * suggestionWeight);
  
  return Math.max(0, Math.round((maxScore - deduction) * 100) / 100);
}
