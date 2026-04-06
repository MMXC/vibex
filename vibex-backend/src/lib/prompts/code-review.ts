import { safeError } from '@/lib/log-sanitizer';
/**
 * Code Review Prompt Templates
 * 
 * This module contains prompt templates for conducting comprehensive
 * code reviews including security, performance, best practices, and more.
 * 
 * @module lib/prompts/code-review
 */

// ============================================
// Types and Interfaces
// ============================================

/**
 * Code review type
 */
export enum CodeReviewType {
  /** Full comprehensive review */
  COMPREHENSIVE = 'comprehensive',
  /** Security-focused review */
  SECURITY = 'security',
  /** Performance-focused review */
  PERFORMANCE = 'performance',
  /** Code style and best practices */
  STYLE = 'style',
  /** Architecture and design review */
  ARCHITECTURE = 'architecture',
  /** Quick review for minor changes */
  QUICK = 'quick',
}

/**
 * Severity level for issues
 */
export enum IssueSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

/**
 * Category of code issue
 */
export enum IssueCategory {
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BUG = 'bug',
  CODE_STYLE = 'code_style',
  BEST_PRACTICE = 'best_practice',
  ARCHITECTURE = 'architecture',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  ACCESSIBILITY = 'accessibility',
  ERROR_HANDLING = 'error_handling',
}

/**
 * Programming language being reviewed
 */
export enum ProgrammingLanguage {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
  GO = 'go',
  RUST = 'rust',
  CPP = 'cpp',
  CSHARP = 'csharp',
  SQL = 'sql',
  JSON = 'json',
  YAML = 'yaml',
  MARKDOWN = 'markdown',
}

/**
 * A single code issue found during review
 */
export interface CodeIssue {
  /** Unique identifier */
  id: string;
  /** Issue title/summary */
  title: string;
  /** Detailed description */
  description: string;
  /** Severity level */
  severity: IssueSeverity;
  /** Category */
  category: IssueCategory;
  /** File path (if applicable) */
  file?: string;
  /** Line number (if applicable) */
  line?: number;
  /** Code snippet showing the issue */
  codeSnippet?: string;
  /** Suggested fix */
  suggestion?: string;
  /** External reference/link */
  reference?: string;
  /** Whether it's a false positive */
  falsePositive?: boolean;
}

/**
 * Code review result
 */
export interface CodeReviewResult {
  /** Overall score (0-100) */
  overallScore: number;
  /** Summary of findings */
  summary: string;
  /** All issues found */
  issues: CodeIssue[];
  /** Statistics */
  statistics: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  /** Positive observations */
  positives: string[];
  /** Recommendations */
  recommendations: string[];
  /** Files reviewed */
  filesReviewed: string[];
  /** Lines of code reviewed */
  linesOfCode: number;
}

/**
 * Code review configuration
 */
export interface CodeReviewConfig {
  /** Type of review */
  reviewType?: CodeReviewType;
  /** Focus areas */
  focusAreas?: IssueCategory[];
  /** Exclude patterns (glob patterns) */
  excludePatterns?: string[];
  /** Include patterns (glob patterns) */
  includePatterns?: string[];
  /** Minimum severity to report */
  minSeverity?: IssueSeverity;
  /** Whether to include code snippets */
  includeSnippets?: boolean;
  /** Whether to include suggestions */
  includeSuggestions?: boolean;
  /** Maximum issues to report */
  maxIssues?: number;
  /** Language of the code */
  language?: ProgrammingLanguage;
  /** Framework context */
  framework?: string;
  /** Custom rules to apply */
  customRules?: string[];
  /** Context about the project */
  projectContext?: string;
}

/**
 * Input for code review prompt
 */
export interface CodeReviewInput {
  /** Code to review */
  code: string;
  /** File name/path */
  fileName?: string;
  /** Review configuration */
  config?: CodeReviewConfig;
  /** Additional context */
  context?: string;
  /** Diff/patch format (optional) */
  diff?: string;
  /** Previous version (for change review) */
  previousVersion?: string;
}

// ============================================
// Constants
// ============================================

/**
 * Severity level numeric values for sorting
 */
export const SEVERITY_LEVELS: Record<IssueSeverity, number> = {
  [IssueSeverity.CRITICAL]: 5,
  [IssueSeverity.HIGH]: 4,
  [IssueSeverity.MEDIUM]: 3,
  [IssueSeverity.LOW]: 2,
  [IssueSeverity.INFO]: 1,
};

/**
 * Category display names
 */
export const CATEGORY_DISPLAY_NAMES: Record<IssueCategory, string> = {
  [IssueCategory.SECURITY]: 'Security',
  [IssueCategory.PERFORMANCE]: 'Performance',
  [IssueCategory.BUG]: 'Bug',
  [IssueCategory.CODE_STYLE]: 'Code Style',
  [IssueCategory.BEST_PRACTICE]: 'Best Practice',
  [IssueCategory.ARCHITECTURE]: 'Architecture',
  [IssueCategory.DOCUMENTATION]: 'Documentation',
  [IssueCategory.TESTING]: 'Testing',
  [IssueCategory.ACCESSIBILITY]: 'Accessibility',
  [IssueCategory.ERROR_HANDLING]: 'Error Handling',
};

/**
 * Review type descriptions
 */
export const REVIEW_TYPE_DESCRIPTIONS: Record<CodeReviewType, string> = {
  [CodeReviewType.COMPREHENSIVE]: 'Full review covering all aspects: security, performance, style, architecture, and best practices',
  [CodeReviewType.SECURITY]: 'Focused review on security vulnerabilities, injection risks, authentication, and data protection',
  [CodeReviewType.PERFORMANCE]: 'Focused review on performance issues, memory usage, algorithmic efficiency, and optimization opportunities',
  [CodeReviewType.STYLE]: 'Review of code style, formatting, naming conventions, and adherence to style guides',
  [CodeReviewType.ARCHITECTURE]: 'Review of code design, patterns, coupling, cohesion, and overall system architecture',
  [CodeReviewType.QUICK]: 'Quick review for minor changes, focusing on obvious issues and critical problems',
};

/**
 * Language-specific linting rules and patterns
 */
export const LANGUAGE_PATTERNS: Record<ProgrammingLanguage, {
  commentStyle: { single: string; multi: [string, string] };
  commonIssues: string[];
  bestPractices: string[];
}> = {
  [ProgrammingLanguage.TYPESCRIPT]: {
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    commonIssues: [
      'any type usage',
      'non-null assertions',
      'unsafe type casts',
      'missing return types',
      'unused variables',
    ],
    bestPractices: [
      'Use strict mode',
      'Enable all strict compiler options',
      'Use type inference where appropriate',
      'Avoid any type',
      'Use interfaces over types for objects',
    ],
  },
  [ProgrammingLanguage.JAVASCRIPT]: {
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    commonIssues: [
      'implicit global variables',
      'unsafe equality checks',
      'missing error handling',
      'devLog in production',
    ],
    bestPractices: [
      'Use const/let instead of var',
      'Use strict equality (===)',
      'Handle async errors properly',
      'Avoid eval()',
      'Use ES6+ features',
    ],
  },
  [ProgrammingLanguage.PYTHON]: {
    commentStyle: { single: '#', multi: ['"""', '"""'] },
    commonIssues: [
      'bare except clauses',
      'mutable default arguments',
      'shadowing builtins',
      'missing type hints',
    ],
    bestPractices: [
      'Follow PEP 8',
      'Use type hints',
      'Use virtual environments',
      'Handle exceptions specifically',
      'Use f-strings',
    ],
  },
  [ProgrammingLanguage.JAVA]: {
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    commonIssues: [
      'null pointer exceptions',
      'resource leaks',
      'synchronization issues',
    ],
    bestPractices: [
      'Use try-with-resources',
      'Avoid null checks where possible',
      'Use Optional where appropriate',
    ],
  },
  [ProgrammingLanguage.GO]: {
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    commonIssues: [
      'error handling',
      'nil pointer dereferences',
    ],
    bestPractices: [
      'Handle all errors',
      'Use gofmt for formatting',
      'Follow Go idioms',
    ],
  },
  [ProgrammingLanguage.RUST]: {
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    commonIssues: [
      'ownership issues',
      'lifetimes',
      'unwrap usage',
    ],
    bestPractices: [
      'Use Result for error handling',
      'Follow ownership rules',
      'Use clippy',
    ],
  },
  [ProgrammingLanguage.CPP]: {
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    commonIssues: [
      'memory leaks',
      'buffer overflows',
      'raw pointer usage',
    ],
    bestPractices: [
      'Use smart pointers',
      'Follow RAII',
      'Avoid raw new/delete',
    ],
  },
  [ProgrammingLanguage.CSHARP]: {
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    commonIssues: [
      'null reference exceptions',
      'disposable resources',
      'async/await issues',
    ],
    bestPractices: [
      'Use using statements',
      'Use async/await properly',
      'Follow C# idioms',
    ],
  },
  [ProgrammingLanguage.SQL]: {
    commentStyle: { single: '--', multi: ['/*', '*/'] },
    commonIssues: [
      'SQL injection',
      'missing indexes',
      'N+1 queries',
    ],
    bestPractices: [
      'Use parameterized queries',
      'Index appropriately',
      'Avoid SELECT *',
    ],
  },
  [ProgrammingLanguage.JSON]: {
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    commonIssues: [
      'trailing commas',
      'invalid JSON',
    ],
    bestPractices: [
      'Validate JSON',
      'Use schema validation',
    ],
  },
  [ProgrammingLanguage.YAML]: {
    commentStyle: { single: '#', multi: ['/*', '*/'] },
    commonIssues: [
      'indentation errors',
      'tab vs space',
    ],
    bestPractices: [
      'Use spaces only',
      'Validate YAML',
    ],
  },
  [ProgrammingLanguage.MARKDOWN]: {
    commentStyle: { single: '<!--', multi: ['<!--', '-->'] },
    commonIssues: [
      'broken links',
      'missing images alt text',
    ],
    bestPractices: [
      'Use descriptive link text',
      'Include alt text for images',
    ],
  },
};

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for code review
 */
export const CODE_REVIEW_SYSTEM_PROMPT = `You are an expert code reviewer with deep knowledge of software security, performance optimization, code architecture, and best practices across multiple programming languages. Your role is to conduct thorough, constructive code reviews that help developers improve code quality.

## Core Principles

1. **Be Constructive**: Focus on helping improve code, not criticizing
2. **Be Specific**: Provide concrete examples and suggestions
3. **Be Comprehensive**: Consider security, performance, readability, and maintainability
4. **Prioritize**: Focus on critical issues first
5. **Explain Why**: Help developers understand the reasoning behind recommendations

## Review Categories

- **security**: Vulnerability detection, input validation, authentication, authorization, data protection
- **performance**: Algorithmic efficiency, memory usage, caching opportunities, N+1 queries
- **bug**: Logic errors, edge cases, race conditions, null handling
- **code_style**: Formatting, naming, code organization
- **best_practice**: Industry standards, modern patterns, idiomatic code
- **architecture**: Design patterns, coupling, cohesion, SOLID principles
- **documentation**: Comments, README, API docs
- **testing**: Test coverage, test quality, edge case testing
- **accessibility**: A11y compliance, screen reader support
- **error_handling**: Exception handling, error messages, logging

## Severity Levels

- **critical**: Security vulnerabilities, data loss risks, system crashes
- **high**: Significant bugs, serious performance issues, major violations
- **medium**: Code smells, minor bugs, style violations
- **low**: Minor improvements, cosmetic issues
- **info**: Suggestions, tips, educational notes

## Output Format

You MUST respond with a valid JSON object in this exact format:

\`\`\`json
{
  "overallScore": 85,
  "summary": "Brief summary of the review",
  "issues": [
    {
      "id": "unique-id",
      "title": "Issue title",
      "description": "Detailed description explaining the problem",
      "severity": "critical|high|medium|low|info",
      "category": "security|performance|bug|code_style|best_practice|architecture|documentation|testing|accessibility|error_handling",
      "file": "file.ts",
      "line": 42,
      "codeSnippet": "// problematic code",
      "suggestion": "How to fix it",
      "reference": "Optional link to docs"
    }
  ],
  "statistics": {
    "critical": 0,
    "high": 2,
    "medium": 5,
    "low": 10,
    "info": 3
  },
  "positives": [
    "Good error handling in function X",
    "Clear variable naming"
  ],
  "recommendations": [
    "Consider adding unit tests for function Y",
    "Extract method Z to improve reusability"
  ],
  "filesReviewed": ["file1.ts", "file2.ts"],
  "linesOfCode": 500
}
\`\`\`

## Guidelines

1. **Always assign severity**: Every issue must have a severity level
2. **Be specific with locations**: Include file and line numbers when available
3. **Provide actionable suggestions**: Don't just point out problems, suggest solutions
4. **Consider context**: Take into account the framework, language, and project conventions
5. **Look for positives**: Acknowledge good code alongside issues
6. **Be consistent**: Apply the same standards throughout the review`;

/**
 * Security-focused system prompt
 */
export const SECURITY_REVIEW_SYSTEM_PROMPT = `${CODE_REVIEW_SYSTEM_PROMPT}

## Security Review Focus

You are conducting a SECURITY-FOCUSED code review. Prioritize:
- Input validation and sanitization
- Authentication and authorization
- Data protection (encryption, PII)
- Injection vulnerabilities (SQL, XSS, Command)
- Dependency vulnerabilities
- Security misconfigurations
- Secrets management

## OWASP Top 10 Considerations

- A01:2021 – Broken Access Control
- A02:2021 – Cryptographic Failures
- A03:2021 – Injection
- A04:2021 – Insecure Design
- A05:2021 – Security Misconfiguration
- A06:2021 – Vulnerable Components
- A07:2021 – Auth Failures
- A08:2021 – Data Integrity Failures
- A09:2021 – Logging Failures
- A10:2021 – SSRF

Prioritize findings related to these categories.`;

/**
 * Performance-focused system prompt
 */
export const PERFORMANCE_REVIEW_SYSTEM_PROMPT = `${CODE_REVIEW_SYSTEM_PROMPT}

## Performance Review Focus

You are conducting a PERFORMANCE-FOCUSED code review. Prioritize:
- Algorithmic complexity (O(n), O(n²), etc.)
- Database query efficiency (N+1, missing indexes)
- Memory usage and leaks
- Caching opportunities
- Unnecessary computations
- Large data handling
- Network request optimization
- Bundle size (for frontend)

## Performance Red Flags

- Nested loops over large datasets
- Unoptimized database queries
- Synchronous operations blocking event loop
- Memory leaks (event listeners, closures)
- Unnecessary re-renders (frontend)
- Large bundle sizes
- Missing compression
- No pagination for large lists`;

/**
 * Architecture-focused system prompt
 */
export const ARCHITECTURE_REVIEW_SYSTEM_PROMPT = `${CODE_REVIEW_SYSTEM_PROMPT}

## Architecture Review Focus

You are conducting an ARCHITECTURE-FOCUSED code review. Prioritize:
- SOLID principles
- Design patterns usage
- Code organization
- Module boundaries
- Dependency management
- Coupling and cohesion
- Extensibility
- Testability

## Key Principles

- **S**ingle Responsibility: Each class/module does one thing
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes must be substitutable
- **I**nterface Segregation: Prefer small, specific interfaces
- **D**ependency Inversion: Depend on abstractions, not concretions

Look for:
- God classes/functions
- Tight coupling
- Missing abstractions
- Repeated code
- Unclear module boundaries`;

// ============================================
// User Prompt Templates
// ============================================

/**
 * Generate user prompt for code review
 */
export function generateCodeReviewUserPrompt(
  input: CodeReviewInput
): string {
  const { code, fileName, config, context, diff, previousVersion } = input;
  const {
    reviewType = CodeReviewType.COMPREHENSIVE,
    focusAreas,
    minSeverity = IssueSeverity.INFO,
    includeSnippets = true,
    includeSuggestions = true,
    maxIssues = 50,
    language = ProgrammingLanguage.TYPESCRIPT,
    framework,
    customRules,
    projectContext,
  } = config || {};

  let prompt = `## Code Review Request

### Code to Review
`;

  // Add diff or full code
  if (diff) {
    prompt += `### Diff/Patch
\`\`\`diff
${diff}
\`\`\`
`;
  } else {
    prompt += `\`\`\`${language}
${code}
\`\`\`
`;
  }

  // Add file information
  if (fileName) {
    prompt += `
### File Information
- **File Name**: ${fileName}
`;
  }

  // Add previous version if available
  if (previousVersion) {
    prompt += `
### Previous Version
\`\`\`${language}
${previousVersion}
\`\`\`
`;
  }

  // Add review configuration
  prompt += `
### Review Configuration
- **Review Type**: ${reviewType} - ${REVIEW_TYPE_DESCRIPTIONS[reviewType]}
- **Language**: ${language}
- **Minimum Severity**: ${minSeverity}
- **Max Issues**: ${maxIssues}
`;

  if (framework) {
    prompt += `- **Framework**: ${framework}\n`;
  }

  // Add focus areas
  if (focusAreas && focusAreas.length > 0) {
    prompt += `- **Focus Areas**: ${focusAreas.map(a => CATEGORY_DISPLAY_NAMES[a]).join(', ')}\n`;
  }

  // Add custom rules
  if (customRules && customRules.length > 0) {
    prompt += `
### Custom Rules
${customRules.map(r => `- ${r}`).join('\n')}
`;
  }

  // Add project context
  if (projectContext) {
    prompt += `
### Project Context
${projectContext}
`;
  }

  // Add additional context
  if (context) {
    prompt += `
### Additional Context
${context}
`;
  }

  // Add output instructions
  prompt += `
### Output Instructions

1. Review the code thoroughly based on the review type
2. Identify issues and categorize them appropriately
3. Assign severity levels based on impact
4. Provide specific code snippets showing problems
5. Suggest concrete improvements
6. Note positive aspects of the code
7. Provide overall score and summary

Respond with the JSON format specified in the system prompt.`;

  return prompt;
}

/**
 * Generate security review prompt
 */
export function generateSecurityReviewPrompt(
  code: string,
  options?: {
    fileName?: string;
    language?: ProgrammingLanguage;
    framework?: string;
    projectContext?: string;
  }
): string {
  const config: CodeReviewConfig = {
    reviewType: CodeReviewType.SECURITY,
    focusAreas: [IssueCategory.SECURITY],
    minSeverity: IssueSeverity.LOW,
    language: options?.language || ProgrammingLanguage.TYPESCRIPT,
    framework: options?.framework,
    projectContext: options?.projectContext,
  };

  return generateCodeReviewUserPrompt({
    code,
    fileName: options?.fileName,
    config,
  });
}

/**
 * Generate performance review prompt
 */
export function generatePerformanceReviewPrompt(
  code: string,
  options?: {
    fileName?: string;
    language?: ProgrammingLanguage;
    framework?: string;
    projectContext?: string;
  }
): string {
  const config: CodeReviewConfig = {
    reviewType: CodeReviewType.PERFORMANCE,
    focusAreas: [IssueCategory.PERFORMANCE],
    minSeverity: IssueSeverity.LOW,
    language: options?.language || ProgrammingLanguage.TYPESCRIPT,
    framework: options?.framework,
    projectContext: options?.projectContext,
  };

  return generateCodeReviewUserPrompt({
    code,
    fileName: options?.fileName,
    config,
  });
}

/**
 * Generate quick review prompt
 */
export function generateQuickReviewPrompt(
  code: string,
  options?: {
    fileName?: string;
    language?: ProgrammingLanguage;
  }
): string {
  const config: CodeReviewConfig = {
    reviewType: CodeReviewType.QUICK,
    focusAreas: [IssueCategory.SECURITY, IssueCategory.BUG],
    minSeverity: IssueSeverity.MEDIUM,
    maxIssues: 10,
    language: options?.language || ProgrammingLanguage.TYPESCRIPT,
  };

  return generateCodeReviewUserPrompt({
    code,
    fileName: options?.fileName,
    config,
  });
}

/**
 * Generate multi-file review prompt
 */
export function generateMultiFileReviewPrompt(
  files: Array<{
    code: string;
    fileName: string;
  }>,
  config?: CodeReviewConfig
): string {
  const combinedCode = files.map(f => `// File: ${f.fileName}\n${f.code}`).join('\n\n');

  const defaultConfig: CodeReviewConfig = {
    reviewType: CodeReviewType.COMPREHENSIVE,
    language: ProgrammingLanguage.TYPESCRIPT,
    maxIssues: 100,
  };

  return generateCodeReviewUserPrompt({
    code: combinedCode,
    config: { ...defaultConfig, ...config },
    context: `Files being reviewed: ${files.map(f => f.fileName).join(', ')}`,
  });
}

/**
 * Generate diff review prompt
 */
export function generateDiffReviewPrompt(
  diff: string,
  options?: {
    fileName?: string;
    language?: ProgrammingLanguage;
    projectContext?: string;
  }
): string {
  return generateCodeReviewUserPrompt({
    code: '',
    diff,
    fileName: options?.fileName,
    config: {
      reviewType: CodeReviewType.COMPREHENSIVE,
      language: options?.language || ProgrammingLanguage.TYPESCRIPT,
      projectContext: options?.projectContext,
    },
  });
}

// ============================================
// Prompt Composition Functions
// ============================================

/**
 * Compose full code review prompt
 */
export function composeCodeReviewPrompt(
  input: CodeReviewInput,
  options?: {
    customSystemPrompt?: string;
  }
): { systemPrompt: string; userPrompt: string } {
  const { config } = input;
  let systemPrompt = CODE_REVIEW_SYSTEM_PROMPT;

  // Use specialized system prompt based on review type
  if (config?.reviewType === CodeReviewType.SECURITY) {
    systemPrompt = SECURITY_REVIEW_SYSTEM_PROMPT;
  } else if (config?.reviewType === CodeReviewType.PERFORMANCE) {
    systemPrompt = PERFORMANCE_REVIEW_SYSTEM_PROMPT;
  } else if (config?.reviewType === CodeReviewType.ARCHITECTURE) {
    systemPrompt = ARCHITECTURE_REVIEW_SYSTEM_PROMPT;
  }

  // Allow custom override
  if (options?.customSystemPrompt) {
    systemPrompt = options.customSystemPrompt;
  }

  const userPrompt = generateCodeReviewUserPrompt(input);

  return { systemPrompt, userPrompt };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a unique issue ID
 */
export function generateIssueId(): string {
  return `issue_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Parse LLM response to code review result
 */
export function parseCodeReviewResponse(content: string): CodeReviewResult | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (typeof parsed.overallScore !== 'number' || !Array.isArray(parsed.issues)) {
      return null;
    }

    // Transform issues to ensure proper format
    const issues: CodeIssue[] = parsed.issues.map((issue: any) => ({
      id: issue.id || generateIssueId(),
      title: issue.title || 'Untitled Issue',
      description: issue.description || '',
      severity: Object.values(IssueSeverity).includes(issue.severity)
        ? issue.severity
        : IssueSeverity.MEDIUM,
      category: Object.values(IssueCategory).includes(issue.category)
        ? issue.category
        : IssueCategory.BEST_PRACTICE,
      file: issue.file,
      line: issue.line,
      codeSnippet: issue.codeSnippet,
      suggestion: issue.suggestion,
      reference: issue.reference,
      falsePositive: issue.falsePositive,
    }));

    // Calculate statistics
    const statistics = {
      critical: issues.filter(i => i.severity === IssueSeverity.CRITICAL).length,
      high: issues.filter(i => i.severity === IssueSeverity.HIGH).length,
      medium: issues.filter(i => i.severity === IssueSeverity.MEDIUM).length,
      low: issues.filter(i => i.severity === IssueSeverity.LOW).length,
      info: issues.filter(i => i.severity === IssueSeverity.INFO).length,
    };

    return {
      overallScore: parsed.overallScore,
      summary: parsed.summary || '',
      issues,
      statistics,
      positives: Array.isArray(parsed.positives) ? parsed.positives : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      filesReviewed: Array.isArray(parsed.filesReviewed) ? parsed.filesReviewed : [],
      linesOfCode: parsed.linesOfCode || 0,
    };
  } catch (error) {
    safeError('Failed to parse code review response:', error);
    return null;
  }
}

/**
 * Filter issues by severity
 */
export function filterBySeverity(
  issues: CodeIssue[],
  minSeverity: IssueSeverity
): CodeIssue[] {
  return issues.filter(
    issue => SEVERITY_LEVELS[issue.severity] >= SEVERITY_LEVELS[minSeverity]
  );
}

/**
 * Filter issues by category
 */
export function filterByCategory(
  issues: CodeIssue[],
  categories: IssueCategory[]
): CodeIssue[] {
  return issues.filter(issue => categories.includes(issue.category));
}

/**
 * Sort issues by severity
 */
export function sortBySeverity(
  issues: CodeIssue[],
  order: 'desc' | 'asc' = 'desc'
): CodeIssue[] {
  return [...issues].sort((a, b) => {
    const diff = SEVERITY_LEVELS[b.severity] - SEVERITY_LEVELS[a.severity];
    return order === 'desc' ? diff : -diff;
  });
}

/**
 * Group issues by category
 */
export function groupByCategory(
  issues: CodeIssue[]
): Record<IssueCategory, CodeIssue[]> {
  return issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<IssueCategory, CodeIssue[]>);
}

/**
 * Group issues by file
 */
export function groupByFile(issues: CodeIssue[]): Record<string, CodeIssue[]> {
  return issues.reduce((acc, issue) => {
    const file = issue.file || 'unknown';
    if (!acc[file]) {
      acc[file] = [];
    }
    acc[file].push(issue);
    return acc;
  }, {} as Record<string, CodeIssue[]>);
}

/**
 * Calculate review summary
 */
export function calculateReviewSummary(result: CodeReviewResult): {
  status: 'excellent' | 'good' | 'needs_work' | 'critical';
  mainIssues: string[];
  priorityFixes: CodeIssue[];
} {
  let status: 'excellent' | 'good' | 'needs_work' | 'critical';
  const mainIssues: string[] = [];
  let priorityFixes: CodeIssue[] = [];

  if (result.overallScore >= 90 && result.statistics.critical === 0) {
    status = 'excellent';
  } else if (result.overallScore >= 70 && result.statistics.critical === 0) {
    status = 'good';
  } else if (result.statistics.critical > 0) {
    status = 'critical';
    mainIssues.push(`${result.statistics.critical} critical issue(s) found`);
  } else {
    status = 'needs_work';
  }

  if (result.statistics.high > 0) {
    mainIssues.push(`${result.statistics.high} high severity issue(s)`);
  }

  // Priority fixes are critical + high severity
  priorityFixes = result.issues.filter(
    i => i.severity === IssueSeverity.CRITICAL || i.severity === IssueSeverity.HIGH
  ).slice(0, 5);

  return { status, mainIssues, priorityFixes };
}

/**
 * Generate markdown report
 */
export function generateMarkdownReport(result: CodeReviewResult): string {
  const { status, mainIssues, priorityFixes } = calculateReviewSummary(result);

  const report = `# Code Review Report

## Summary
- **Overall Score**: ${result.overallScore}/100
- **Status**: ${status.toUpperCase()}
- **Lines of Code**: ${result.linesOfCode}
- **Files Reviewed**: ${result.filesReviewed.join(', ')}

## Statistics
- 🔴 Critical: ${result.statistics.critical}
- 🟠 High: ${result.statistics.high}
- 🟡 Medium: ${result.statistics.medium}
- 🔵 Low: ${result.statistics.low}
- ℹ️ Info: ${result.statistics.info}

${mainIssues.length > 0 ? `## Main Issues
${mainIssues.map(i => `- ${i}`).join('\n')}
` : ''}

${priorityFixes.length > 0 ? `## Priority Fixes
${priorityFixes.map(issue => `
### ${issue.title}
- **Severity**: ${issue.severity}
- **Category**: ${CATEGORY_DISPLAY_NAMES[issue.category]}
${issue.file ? `- **File**: ${issue.file}${issue.line ? `:${issue.line}` : ''}` : ''}
- **Description**: ${issue.description}
${issue.suggestion ? `- **Suggestion**: ${issue.suggestion}` : ''}
`).join('\n')}
` : ''}

${result.positives.length > 0 ? `## Positives
${result.positives.map(p => `- ${p}`).join('\n')}
` : ''}

${result.recommendations.length > 0 ? `## Recommendations
${result.recommendations.map(r => `- ${r}`).join('\n')}
` : ''}

## All Issues
${result.issues.map(issue => `
### ${issue.title}
| Field | Value |
|-------|-------|
| Severity | ${issue.severity} |
| Category | ${CATEGORY_DISPLAY_NAMES[issue.category]} |
${issue.file ? `| File | ${issue.file}${issue.line ? `:${issue.line}` : ''} |` : ''}
| Description | ${issue.description} |
${issue.suggestion ? `| Suggestion | ${issue.suggestion} |` : ''}
`).join('\n')}
`;

  return report;
}

// ============================================
// Export
// ============================================

export default {
  // Enums
  CodeReviewType,
  IssueSeverity,
  IssueCategory,
  ProgrammingLanguage,

  // Constants
  SEVERITY_LEVELS,
  CATEGORY_DISPLAY_NAMES,
  REVIEW_TYPE_DESCRIPTIONS,
  LANGUAGE_PATTERNS,

  // System prompts
  CODE_REVIEW_SYSTEM_PROMPT,
  SECURITY_REVIEW_SYSTEM_PROMPT,
  PERFORMANCE_REVIEW_SYSTEM_PROMPT,
  ARCHITECTURE_REVIEW_SYSTEM_PROMPT,

  // Prompt generation
  generateCodeReviewUserPrompt,
  generateSecurityReviewPrompt,
  generatePerformanceReviewPrompt,
  generateQuickReviewPrompt,
  generateMultiFileReviewPrompt,
  generateDiffReviewPrompt,
  composeCodeReviewPrompt,

  // Utilities
  generateIssueId,
  parseCodeReviewResponse,
  filterBySeverity,
  filterByCategory,
  sortBySeverity,
  groupByCategory,
  groupByFile,
  calculateReviewSummary,
  generateMarkdownReport,
};
