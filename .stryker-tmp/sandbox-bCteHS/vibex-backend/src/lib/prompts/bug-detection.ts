/**
 * Bug Detection Prompt Templates
 * 
 * This module contains prompt templates for detecting bugs in code,
 * including logic errors, edge cases, null handling, race conditions, and more.
 * 
 * @module lib/prompts/bug-detection
 */
// @ts-nocheck


// ============================================
// Types and Interfaces
// ============================================

/**
 * Bug detection type
 */
export enum BugDetectionType {
  /** Full comprehensive bug detection */
  COMPREHENSIVE = 'comprehensive',
  /** Focus on logic errors */
  LOGIC = 'logic',
  /** Focus on edge cases and boundary conditions */
  EDGE_CASE = 'edge_case',
  /** Focus on null/undefined handling */
  NULL_SAFETY = 'null_safety',
  /** Focus on concurrency issues */
  CONCURRENCY = 'concurrency',
  /** Focus on error handling bugs */
  ERROR_HANDLING = 'error_handling',
  /** Focus on security-related bugs */
  SECURITY_BUG = 'security_bug',
  /** Quick scan for obvious bugs */
  QUICK = 'quick',
}

/**
 * Bug severity level
 */
export enum BugSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

/**
 * Bug category
 */
export enum BugCategory {
  LOGIC_ERROR = 'logic_error',
  EDGE_CASE = 'edge_case',
  NULL_UNDEFINED = 'null_undefined',
  RACE_CONDITION = 'race_condition',
  DEADLOCK = 'deadlock',
  MEMORY_LEAK = 'memory_leak',
  RESOURCE_LEAK = 'resource_leak',
  OFF_BY_ONE = 'off_by_one',
  INFINITE_LOOP = 'infinite_loop',
  RECURSION_ISSUE = 'recursion_issue',
  TYPE_MISMATCH = 'type_mismatch',
  BOOLEAN_LOGIC = 'boolean_logic',
  COMPARISON_ERROR = 'comparison_error',
  UNHANDLED_ERROR = 'unhandled_error',
  INCORRECT_EXCEPTION = 'incorrect_exception',
  BOUNDARY_ERROR = 'boundary_error',
  DATA_RACE = 'data_race',
  TIMING_ISSUE = 'timing_issue',
  STATE_INCONSISTENCY = 'state_inconsistency',
  BUSINESS_LOGIC = 'business_logic',
  VALIDATION_ERROR = 'validation_error',
  SECURITY_BUG = 'security_bug',
  PERFORMANCE_BUG = 'performance_bug',
  OTHER = 'other',
}

/**
 * A single bug found during detection
 */
export interface BugIssue {
  /** Unique identifier */
  id: string;
  /** Bug title/summary */
  title: string;
  /** Detailed description of the bug */
  description: string;
  /** Severity level */
  severity: BugSeverity;
  /** Bug category */
  category: BugCategory;
  /** File path (if applicable) */
  file?: string;
  /** Line number (if applicable) */
  line?: number;
  /** Code snippet showing the bug */
  codeSnippet?: string;
  /** Expected behavior */
  expected?: string;
  /** Actual behavior */
  actual?: string;
  /** How to reproduce */
  reproduction?: string;
  /** Suggested fix */
  fix?: string;
  /** Related bugs */
  relatedBugs?: string[];
  /** Whether it's a known limitation */
  knownLimitation?: boolean;
}

/**
 * Bug detection result
 */
export interface BugDetectionResult {
  /** Total bugs found */
  totalBugs: number;
  /** Summary of findings */
  summary: string;
  /** All bugs found */
  bugs: BugIssue[];
  /** Statistics by severity */
  statistics: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  /** Statistics by category */
  categoryStatistics: Record<BugCategory, number>;
  /** Files analyzed */
  filesAnalyzed: string[];
  /** Lines of code analyzed */
  linesOfCode: number;
  /** Confidence score (0-100) */
  confidenceScore: number;
  /** Recommendations */
  recommendations: string[];
}

/**
 * Bug detection configuration
 */
export interface BugDetectionConfig {
  /** Type of bug detection */
  detectionType?: BugDetectionType;
  /** Focus categories */
  focusCategories?: BugCategory[];
  /** Exclude patterns (glob patterns) */
  excludePatterns?: string[];
  /** Include patterns (glob patterns) */
  includePatterns?: string[];
  /** Minimum severity to report */
  minSeverity?: BugSeverity;
  /** Whether to include code snippets */
  includeSnippets?: boolean;
  /** Whether to include reproduction steps */
  includeReproduction?: boolean;
  /** Maximum bugs to report */
  maxBugs?: number;
  /** Language of the code */
  language?: string;
  /** Framework context */
  framework?: string;
  /** Test coverage context */
  hasTests?: boolean;
  /** Context about the project */
  projectContext?: string;
  /** Previous bug reports for comparison */
  previousBugs?: string[];
}

/**
 * Input for bug detection prompt
 */
export interface BugDetectionInput {
  /** Code to analyze */
  code: string;
  /** File name/path */
  fileName?: string;
  /** Detection configuration */
  config?: BugDetectionConfig;
  /** Additional context */
  context?: string;
  /** Diff/patch format (optional) */
  diff?: string;
  /** Stack trace (optional) */
  stackTrace?: string;
  /** Error message (optional) */
  errorMessage?: string;
  /** Test cases (optional) */
  testCases?: string;
}

// ============================================
// Constants
// ============================================

/**
 * Severity level numeric values for sorting
 */
export const SEVERITY_LEVELS: Record<BugSeverity, number> = {
  [BugSeverity.CRITICAL]: 5,
  [BugSeverity.HIGH]: 4,
  [BugSeverity.MEDIUM]: 3,
  [BugSeverity.LOW]: 2,
  [BugSeverity.INFO]: 1,
};

/**
 * Category display names
 */
export const CATEGORY_DISPLAY_NAMES: Record<BugCategory, string> = {
  [BugCategory.LOGIC_ERROR]: 'Logic Error',
  [BugCategory.EDGE_CASE]: 'Edge Case',
  [BugCategory.NULL_UNDEFINED]: 'Null/Undefined',
  [BugCategory.RACE_CONDITION]: 'Race Condition',
  [BugCategory.DEADLOCK]: 'Deadlock',
  [BugCategory.MEMORY_LEAK]: 'Memory Leak',
  [BugCategory.RESOURCE_LEAK]: 'Resource Leak',
  [BugCategory.OFF_BY_ONE]: 'Off-by-One',
  [BugCategory.INFINITE_LOOP]: 'Infinite Loop',
  [BugCategory.RECURSION_ISSUE]: 'Recursion Issue',
  [BugCategory.TYPE_MISMATCH]: 'Type Mismatch',
  [BugCategory.BOOLEAN_LOGIC]: 'Boolean Logic',
  [BugCategory.COMPARISON_ERROR]: 'Comparison Error',
  [BugCategory.UNHANDLED_ERROR]: 'Unhandled Error',
  [BugCategory.INCORRECT_EXCEPTION]: 'Incorrect Exception',
  [BugCategory.BOUNDARY_ERROR]: 'Boundary Error',
  [BugCategory.DATA_RACE]: 'Data Race',
  [BugCategory.TIMING_ISSUE]: 'Timing Issue',
  [BugCategory.STATE_INCONSISTENCY]: 'State Inconsistency',
  [BugCategory.BUSINESS_LOGIC]: 'Business Logic',
  [BugCategory.VALIDATION_ERROR]: 'Validation Error',
  [BugCategory.SECURITY_BUG]: 'Security Bug',
  [BugCategory.PERFORMANCE_BUG]: 'Performance Bug',
  [BugCategory.OTHER]: 'Other',
};

/**
 * Detection type descriptions
 */
export const DETECTION_TYPE_DESCRIPTIONS: Record<BugDetectionType, string> = {
  [BugDetectionType.COMPREHENSIVE]: 'Full analysis covering all bug categories: logic errors, edge cases, null safety, concurrency, and error handling',
  [BugDetectionType.LOGIC]: 'Focused analysis on logic errors, incorrect conditions, and flawed algorithms',
  [BugDetectionType.EDGE_CASE]: 'Focused analysis on boundary conditions, corner cases, and unusual inputs',
  [BugDetectionType.NULL_SAFETY]: 'Focused analysis on null/undefined handling, optional types, and potential NPEs',
  [BugDetectionType.CONCURRENCY]: 'Focused analysis on race conditions, deadlocks, thread safety, and async issues',
  [BugDetectionType.ERROR_HANDLING]: 'Focused analysis on error handling, exception management, and failure recovery',
  [BugDetectionType.SECURITY_BUG]: 'Focused analysis on security-related bugs, input validation, and injection vulnerabilities',
  [BugDetectionType.QUICK]: 'Quick scan for obvious, high-impact bugs that need immediate attention',
};

/**
 * Common bug patterns by language
 */
export const LANGUAGE_BUG_PATTERNS: Record<string, {
  commonBugs: string[];
  patterns: Partial<Record<BugCategory, string[]>>;
}> = {
  typescript: {
    commonBugs: [
      'null/undefined access',
      'incorrect type assertions',
      'missing null checks',
      'async/await errors',
      'any type misuse',
    ],
    patterns: {
      [BugCategory.NULL_UNDEFINED]: [
        'obj?.prop?.nested',
        'if (obj)',
        'obj!',
      ],
      [BugCategory.TYPE_MISMATCH]: [
        'as Type',
        '<Type>',
        'instanceof',
      ],
      [BugCategory.LOGIC_ERROR]: [
        '==',
        '|| vs &&',
      ],
      [BugCategory.EDGE_CASE]: [
        'array[0]',
        'slice(-0)',
        'parseInt edge',
      ],
    },
  },
  javascript: {
    commonBugs: [
      'implicit type coercion',
      'this binding issues',
      'closure memory leaks',
      'event listener leaks',
      'mutation bugs',
    ],
    patterns: {
      [BugCategory.NULL_UNDEFINED]: [
        '== null',
        'typeof x === "undefined"',
      ],
      [BugCategory.BOOLEAN_LOGIC]: [
        '==',
        '||',
        '&&',
        '!',
      ],
      [BugCategory.MEMORY_LEAK]: [
        'addEventListener without remove',
        'setInterval without clear',
        'global variables',
      ],
    },
  },
  python: {
    commonBugs: [
      'mutable default arguments',
      'late binding closures',
      'incorrect exception handling',
      'shallow vs deep copy',
      'GIL concurrency issues',
    ],
    patterns: {
      [BugCategory.EDGE_CASE]: [
        'def f(x=[])',
        'for i in range(len())',
      ],
      [BugCategory.INCORRECT_EXCEPTION]: [
        'except:',
        'raise Exception()',
      ],
    },
  },
  java: {
    commonBugs: [
      'NullPointerException',
      'resource leaks',
      'concurrency issues',
      'serialization bugs',
    ],
    patterns: {
      [BugCategory.NULL_UNDEFINED]: [
        '.',
        'getClass()',
      ],
    },
  },
  go: {
    commonBugs: [
      'nil pointer dereference',
      'goroutine leaks',
      'race conditions',
      'error handling',
    ],
    patterns: {
      [BugCategory.NULL_UNDEFINED]: [
        'nil interface',
        'nil slice vs empty slice',
      ],
    },
  },
  rust: {
    commonBugs: [
      'borrow checker violations',
      'unwrap/expect misuse',
      'lifetimes',
      'thread safety',
    ],
    patterns: {
      [BugCategory.LOGIC_ERROR]: [
        '.unwrap()',
        '.expect()',
      ],
    },
  },
};

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for bug detection
 */
export const BUG_DETECTION_SYSTEM_PROMPT = `You are an expert bug detector with deep knowledge of software bugs, defects, and code quality issues across multiple programming languages. Your role is to thoroughly analyze code and identify potential bugs that could cause runtime errors, unexpected behavior, or security vulnerabilities.

## Core Principles

1. **Be Thorough**: Look for all types of bugs, not just obvious ones
2. **Be Specific**: Provide concrete examples and exact locations
3. **Be Actionable**: Suggest clear fixes for each bug
4. **Prioritize**: Focus on bugs that would cause runtime failures first
5. **Consider Context**: Take into account the language, framework, and project conventions

## Bug Categories

- **logic_error**: Flawed logic, incorrect algorithms, wrong conditions
- **edge_case**: Boundary conditions, corner cases, unusual inputs
- **null_undefined**: Null pointer dereferences, undefined access, optional handling
- **race_condition**: Concurrent access issues, timing problems
- **deadlock**: Circular wait, improper lock ordering
- **memory_leak**: Unreleased memory, retained references
- **resource_leak**: Unclosed files, connections, handles
- **off_by_one**: Index errors, boundary miscalculations
- **infinite_loop**: Loops that never terminate
- **recursion_issue**: Stack overflow, base case missing, wrong termination
- **type_mismatch**: Type casting errors, wrong type usage
- **boolean_logic**: Incorrect boolean expressions, operator precedence
- **comparison_error**: Wrong comparison operators, equality issues
- **unhandled_error**: Missing error handling, uncaught exceptions
- **incorrect_exception**: Wrong exception type, poor exception handling
- **boundary_error**: Range validation, limit violations
- **data_race**: Concurrent reads/writes to shared data
- **timing_issue**: Race conditions, async timing problems
- **state_inconsistency**: Invalid state transitions, corrupted state
- **business_logic**: Logic that doesn't match business requirements
- ** or incorrect input validation
- **security_bug**: Securityvalidation_error**: Missing vulnerabilities, injection risks
- **performance_bug**: Performance anti-patterns, inefficiency

## Severity Levels

- **critical**: Will definitely cause runtime crash, data loss, or security breach
- **high**: Likely to cause runtime error or significant incorrect behavior
- **medium**: Could cause incorrect behavior under specific conditions
- **low**: Minor issue, unlikely to cause problems but should be fixed
- **info**: Potential improvement, not a bug per se

## Output Format

You MUST respond with a valid JSON object in this exact format:

\`\`\`json
{
  "totalBugs": 5,
  "summary": "Found 5 bugs: 1 critical, 2 high, 1 medium, 1 low",
  "bugs": [
    {
      "id": "bug-001",
      "title": "Null pointer dereference in user object",
      "description": "The code accesses properties of user without checking if user is null",
      "severity": "critical",
      "category": "null_undefined",
      "file": "src/user.ts",
      "line": 42,
      "codeSnippet": "const name = user.name;",
      "expected": "Check if user exists before accessing properties",
      "actual": "Directly accesses user.name without null check",
      "reproduction": "Call the function with null/undefined user parameter",
      "fix": "Add null check: if (user?.name) { ... }",
      "relatedBugs": ["bug-002"]
    }
  ],
  "statistics": {
    "critical": 1,
    "high": 2,
    "medium": 1,
    "low": 1,
    "info": 0
  },
  "categoryStatistics": {
    "logic_error": 0,
    "edge_case": 1,
    "null_undefined": 2,
    "race_condition": 0,
    "deadlock": 0,
    "memory_leak": 0,
    "resource_leak": 0,
    "off_by_one": 0,
    "infinite_loop": 0,
    "recursion_issue": 0,
    "type_mismatch": 0,
    "boolean_logic": 0,
    "comparison_error": 0,
    "unhandled_error": 0,
    "incorrect_exception": 0,
    "boundary_error": 0,
    "data_race": 0,
    "timing_issue": 0,
    "state_inconsistency": 0,
    "business_logic": 0,
    "validation_error": 0,
    "security_bug": 0,
    "performance_bug": 0,
    "other": 0
  },
  "filesAnalyzed": ["src/user.ts", "src/auth.ts"],
  "linesOfCode": 250,
  "confidenceScore": 90,
  "recommendations": [
    "Add comprehensive null checks throughout the codebase",
    "Consider using a strict null checking mode"
  ]
}
\`\`\`

## Guidelines

1. **Always assign both severity and category** to each bug
2. **Provide exact file and line numbers** when available
3. **Include code snippets** showing the problematic code
4. **Explain expected vs actual behavior** for clarity
5. **Provide actionable fixes**, not just problem descriptions
6. **Consider edge cases**: empty inputs, large numbers, special characters
7. **Look for patterns**: repeated code, similar bugs in different files
8. **Check error handling**: are exceptions caught properly?`;

/**
 * Logic-focused bug detection prompt
 */
export const LOGIC_BUG_DETECTION_PROMPT = `${BUG_DETECTION_SYSTEM_PROMPT}

## Focus: Logic Errors

You are conducting a LOGIC-ERROR-FOCUSED bug detection. Prioritize:
- Incorrect conditional statements
- Wrong comparison operators
- Flawed algorithms
- Incorrect business logic
- State machine errors
- Invalid state transitions

Look for:
- == vs === issues (or vice versa)
- && vs || confusion
- Missing return statements
- Incorrect loop conditions
- Wrong operator precedence
- Inverse logic
- Hardcoded values that should be dynamic`;

/**
 * Edge case-focused bug detection prompt
 */
export const EDGE_CASE_BUG_DETECTION_PROMPT = `${BUG_DETECTION_SYSTEM_PROMPT}

## Focus: Edge Cases

You are conducting an EDGE CASE-FOCUSED bug detection. Prioritize:
- Boundary conditions
- Corner cases
- Empty inputs
- Maximum/minimum values
- Overflow/underflow
- Special characters
- Unicode issues
- White space handling
- Zero/negative numbers

Look for:
- Array index out of bounds
- Division by zero
- Empty string handling
- Null/empty collection handling
- Maximum integer limits
- Floating point precision
- Date/time edge cases
- Timezone issues`;

/**
 * Null safety-focused bug detection prompt
 */
export const NULL_SAFETY_BUG_DETECTION_PROMPT = `${BUG_DETECTION_SYSTEM_PROMPT}

## Focus: Null Safety

You are conducting a NULL SAFETY-FOCUSED bug detection. Prioritize:
- Null pointer exceptions
- Undefined access
- Optional type handling
- Default value handling
- Null coalescing
- Optional chaining

Look for:
- Direct property access without checks
- Array access without bounds checking
- Function parameters without null checks
- Return values assumed to be non-null
- Optional chaining missing
- Null coalescing not used where needed
- Type guards missing`;

/**
 * Concurrency-focused bug detection prompt
 */
export const CONCURRENCY_BUG_DETECTION_PROMPT = `${BUG_DETECTION_SYSTEM_PROMPT}

## Focus: Concurrency Issues

You are conducting a CONCURRENCY-FOCUSED bug detection. Prioritize:
- Race conditions
- Deadlocks
- Thread safety
- Async/await issues
- Memory consistency
- Lock ordering
- Resource contention

Look for:
- Shared mutable state
- Improper lock usage
- Missing synchronization
- Async callback issues
- Promise handling errors
- Event loop blocking
- Non-atomic operations
- Improper use of mutable data structures`;

/**
 * Error handling-focused bug detection prompt
 */
export const ERROR_HANDLING_BUG_DETECTION_PROMPT = `${BUG_DETECTION_SYSTEM_PROMPT}

## Focus: Error Handling

You are conducting an ERROR HANDLING-FOCUSED bug detection. Prioritize:
- Uncaught exceptions
- Error propagation
- Exception types
- Error recovery
- Fallback handling

Look for:
- Bare except clauses
- Swallowed exceptions
- Wrong exception types caught
- Missing error handling
- Silent failures
- Incomplete error messages
- Error logging missing
- Retry logic issues`;

/**
 * Security-focused bug detection prompt
 */
export const SECURITY_BUG_DETECTION_PROMPT = `${BUG_DETECTION_SYSTEM_PROMPT}

## Focus: Security Bugs

You are conducting a SECURITY-FOCUSED bug detection. Prioritize:
- Input validation
- Injection vulnerabilities
- Authentication issues
- Authorization flaws
- Data exposure
- Cryptographic issues
- Secret handling

Look for:
- SQL injection risks
- XSS vulnerabilities
- Command injection
- Path traversal
- XXE vulnerabilities
- Hardcoded secrets
- Weak cryptography
- Missing authentication checks
- Improper authorization`;

/**
 * Quick bug scan prompt
 */
export const QUICK_BUG_DETECTION_PROMPT = `${BUG_DETECTION_SYSTEM_PROMPT}

## Focus: Quick Scan

You are conducting a QUICK bug scan for obvious, high-impact bugs. Prioritize:
- Null pointer exceptions
- Resource leaks
- Infinite loops
- Unhandled exceptions
- Security vulnerabilities
- Logic errors in critical paths

Be concise and focus only on bugs that:
- Would cause immediate runtime failures
- Have high severity impact
- Are easily detectable
- Need immediate attention

Do not spend time on minor issues or edge cases in quick scan mode.`;

// ============================================
// User Prompt Templates
// ============================================

/**
 * Generate user prompt for bug detection
 */
export function generateBugDetectionUserPrompt(
  input: BugDetectionInput
): string {
  const { code, fileName, config, context, diff, stackTrace, errorMessage, testCases } = input;
  const {
    detectionType = BugDetectionType.COMPREHENSIVE,
    focusCategories,
    minSeverity = BugSeverity.INFO,
    includeSnippets = true,
    includeReproduction = true,
    maxBugs = 50,
    language = 'typescript',
    framework,
    hasTests,
    projectContext,
    previousBugs,
  } = config || {};

  let prompt = `## Bug Detection Request

### Code to Analyze
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

  // Add error context
  if (errorMessage) {
    prompt += `
### Error Message
\`\`\`
${errorMessage}
\`\`\`
`;
  }

  if (stackTrace) {
    prompt += `
### Stack Trace
\`\`\`
${stackTrace}
\`\`\`
`;
  }

  // Add test cases
  if (testCases) {
    prompt += `
### Test Cases
\`\`\`${language}
${testCases}
\`\`\`
`;
  }

  // Add detection configuration
  prompt += `
### Detection Configuration
- **Detection Type**: ${detectionType} - ${DETECTION_TYPE_DESCRIPTIONS[detectionType]}
- **Language**: ${language}
- **Minimum Severity**: ${minSeverity}
- **Max Bugs**: ${maxBugs}
`;

  if (framework) {
    prompt += `- **Framework**: ${framework}\n`;
  }

  if (hasTests !== undefined) {
    prompt += `- **Has Tests**: ${hasTests ? 'Yes' : 'No'}\n`;
  }

  // Add focus categories
  if (focusCategories && focusCategories.length > 0) {
    prompt += `- **Focus Categories**: ${focusCategories.map(c => CATEGORY_DISPLAY_NAMES[c]).join(', ')}\n`;
  }

  // Add previous bugs
  if (previousBugs && previousBugs.length > 0) {
    prompt += `
### Previously Reported Bugs
${previousBugs.map(b => `- ${b}`).join('\n')}
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

1. Analyze the code thoroughly for bugs based on the detection type
2. Identify each bug and categorize it appropriately
3. Assign severity levels based on potential impact
4. Provide specific code snippets showing the bugs
5. Explain expected vs actual behavior
6. Suggest concrete fixes for each bug
7. Provide confidence score for the analysis
8. List recommendations for preventing similar bugs

Respond with the JSON format specified in the system prompt.`;

  return prompt;
}

/**
 * Generate logic bug detection prompt
 */
export function generateLogicBugPrompt(
  code: string,
  options?: {
    fileName?: string;
    language?: string;
    framework?: string;
    projectContext?: string;
  }
): string {
  return generateBugDetectionUserPrompt({
    code,
    fileName: options?.fileName,
    config: {
      detectionType: BugDetectionType.LOGIC,
      language: options?.language || 'typescript',
      framework: options?.framework,
      projectContext: options?.projectContext,
    },
  });
}

/**
 * Generate edge case bug detection prompt
 */
export function generateEdgeCaseBugPrompt(
  code: string,
  options?: {
    fileName?: string;
    language?: string;
    framework?: string;
    projectContext?: string;
  }
): string {
  return generateBugDetectionUserPrompt({
    code,
    fileName: options?.fileName,
    config: {
      detectionType: BugDetectionType.EDGE_CASE,
      language: options?.language || 'typescript',
      framework: options?.framework,
      projectContext: options?.projectContext,
    },
  });
}

/**
 * Generate null safety bug detection prompt
 */
export function generateNullSafetyBugPrompt(
  code: string,
  options?: {
    fileName?: string;
    language?: string;
    framework?: string;
    projectContext?: string;
  }
): string {
  return generateBugDetectionUserPrompt({
    code,
    fileName: options?.fileName,
    config: {
      detectionType: BugDetectionType.NULL_SAFETY,
      language: options?.language || 'typescript',
      framework: options?.framework,
      projectContext: options?.projectContext,
    },
  });
}

/**
 * Generate concurrency bug detection prompt
 */
export function generateConcurrencyBugPrompt(
  code: string,
  options?: {
    fileName?: string;
    language?: string;
    framework?: string;
    projectContext?: string;
  }
): string {
  return generateBugDetectionUserPrompt({
    code,
    fileName: options?.fileName,
    config: {
      detectionType: BugDetectionType.CONCURRENCY,
      language: options?.language || 'typescript',
      framework: options?.framework,
      projectContext: options?.projectContext,
    },
  });
}

/**
 * Generate error handling bug detection prompt
 */
export function generateErrorHandlingBugPrompt(
  code: string,
  options?: {
    fileName?: string;
    language?: string;
    framework?: string;
    projectContext?: string;
  }
): string {
  return generateBugDetectionUserPrompt({
    code,
    fileName: options?.fileName,
    config: {
      detectionType: BugDetectionType.ERROR_HANDLING,
      language: options?.language || 'typescript',
      framework: options?.framework,
      projectContext: options?.projectContext,
    },
  });
}

/**
 * Generate security bug detection prompt
 */
export function generateSecurityBugPrompt(
  code: string,
  options?: {
    fileName?: string;
    language?: string;
    framework?: string;
    projectContext?: string;
  }
): string {
  return generateBugDetectionUserPrompt({
    code,
    fileName: options?.fileName,
    config: {
      detectionType: BugDetectionType.SECURITY_BUG,
      language: options?.language || 'typescript',
      framework: options?.framework,
      projectContext: options?.projectContext,
    },
  });
}

/**
 * Generate quick bug scan prompt
 */
export function generateQuickBugScanPrompt(
  code: string,
  options?: {
    fileName?: string;
    language?: string;
    framework?: string;
    errorMessage?: string;
    stackTrace?: string;
  }
): string {
  return generateBugDetectionUserPrompt({
    code,
    fileName: options?.fileName,
    errorMessage: options?.errorMessage,
    stackTrace: options?.stackTrace,
    config: {
      detectionType: BugDetectionType.QUICK,
      language: options?.language || 'typescript',
      framework: options?.framework,
      maxBugs: 15,
    },
  });
}

/**
 * Generate diff-based bug detection prompt
 */
export function generateDiffBugPrompt(
  diff: string,
  options?: {
    fileName?: string;
    language?: string;
    projectContext?: string;
  }
): string {
  return generateBugDetectionUserPrompt({
    code: '',
    diff,
    fileName: options?.fileName,
    config: {
      detectionType: BugDetectionType.COMPREHENSIVE,
      language: options?.language || 'typescript',
      projectContext: options?.projectContext,
    },
  });
}

/**
 * Generate error-context bug detection prompt
 */
export function generateErrorContextBugPrompt(
  code: string,
  errorMessage: string,
  stackTrace?: string,
  options?: {
    fileName?: string;
    language?: string;
    framework?: string;
  }
): string {
  return generateBugDetectionUserPrompt({
    code,
    fileName: options?.fileName,
    errorMessage,
    stackTrace,
    config: {
      detectionType: BugDetectionType.COMPREHENSIVE,
      language: options?.language || 'typescript',
      framework: options?.framework,
    },
  });
}

// ============================================
// Prompt Composition Functions
// ============================================

/**
 * Compose full bug detection prompt
 */
export function composeBugDetectionPrompt(
  input: BugDetectionInput,
  options?: {
    customSystemPrompt?: string;
  }
): { systemPrompt: string; userPrompt: string } {
  const { config } = input;
  let systemPrompt = BUG_DETECTION_SYSTEM_PROMPT;

  // Use specialized system prompt based on detection type
  if (config?.detectionType === BugDetectionType.LOGIC) {
    systemPrompt = LOGIC_BUG_DETECTION_PROMPT;
  } else if (config?.detectionType === BugDetectionType.EDGE_CASE) {
    systemPrompt = EDGE_CASE_BUG_DETECTION_PROMPT;
  } else if (config?.detectionType === BugDetectionType.NULL_SAFETY) {
    systemPrompt = NULL_SAFETY_BUG_DETECTION_PROMPT;
  } else if (config?.detectionType === BugDetectionType.CONCURRENCY) {
    systemPrompt = CONCURRENCY_BUG_DETECTION_PROMPT;
  } else if (config?.detectionType === BugDetectionType.ERROR_HANDLING) {
    systemPrompt = ERROR_HANDLING_BUG_DETECTION_PROMPT;
  } else if (config?.detectionType === BugDetectionType.SECURITY_BUG) {
    systemPrompt = SECURITY_BUG_DETECTION_PROMPT;
  } else if (config?.detectionType === BugDetectionType.QUICK) {
    systemPrompt = QUICK_BUG_DETECTION_PROMPT;
  }

  // Allow custom override
  if (options?.customSystemPrompt) {
    systemPrompt = options.customSystemPrompt;
  }

  const userPrompt = generateBugDetectionUserPrompt(input);

  return { systemPrompt, userPrompt };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a unique bug ID
 */
export function generateBugId(): string {
  return `bug_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Parse LLM response to bug detection result
 */
export function parseBugDetectionResponse(content: string): BugDetectionResult | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (typeof parsed.totalBugs !== 'number' || !Array.isArray(parsed.bugs)) {
      return null;
    }

    // Transform bugs to ensure proper format
    const bugs: BugIssue[] = parsed.bugs.map((bug: any) => ({
      id: bug.id || generateBugId(),
      title: bug.title || 'Untitled Bug',
      description: bug.description || '',
      severity: Object.values(BugSeverity).includes(bug.severity)
        ? bug.severity
        : BugSeverity.MEDIUM,
      category: Object.values(BugCategory).includes(bug.category)
        ? bug.category
        : BugCategory.OTHER,
      file: bug.file,
      line: bug.line,
      codeSnippet: bug.codeSnippet,
      expected: bug.expected,
      actual: bug.actual,
      reproduction: bug.reproduction,
      fix: bug.fix,
      relatedBugs: bug.relatedBugs,
      knownLimitation: bug.knownLimitation,
    }));

    // Calculate severity statistics
    const statistics = {
      critical: bugs.filter(b => b.severity === BugSeverity.CRITICAL).length,
      high: bugs.filter(b => b.severity === BugSeverity.HIGH).length,
      medium: bugs.filter(b => b.severity === BugSeverity.MEDIUM).length,
      low: bugs.filter(b => b.severity === BugSeverity.LOW).length,
      info: bugs.filter(b => b.severity === BugSeverity.INFO).length,
    };

    // Calculate category statistics
    const categoryStatistics = {} as Record<BugCategory, number>;
    Object.values(BugCategory).forEach(cat => {
      categoryStatistics[cat] = bugs.filter(b => b.category === cat).length;
    });

    return {
      totalBugs: parsed.totalBugs,
      summary: parsed.summary || '',
      bugs,
      statistics,
      categoryStatistics,
      filesAnalyzed: Array.isArray(parsed.filesAnalyzed) ? parsed.filesAnalyzed : [],
      linesOfCode: parsed.linesOfCode || 0,
      confidenceScore: parsed.confidenceScore || 0,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    console.error('Failed to parse bug detection response:', error);
    return null;
  }
}

/**
 * Filter bugs by severity
 */
export function filterByBugSeverity(
  bugs: BugIssue[],
  minSeverity: BugSeverity
): BugIssue[] {
  return bugs.filter(
    bug => SEVERITY_LEVELS[bug.severity] >= SEVERITY_LEVELS[minSeverity]
  );
}

/**
 * Filter bugs by category
 */
export function filterByBugCategory(
  bugs: BugIssue[],
  categories: BugCategory[]
): BugIssue[] {
  return bugs.filter(bug => categories.includes(bug.category));
}

/**
 * Sort bugs by severity
 */
export function sortBugsBySeverity(
  bugs: BugIssue[],
  order: 'desc' | 'asc' = 'desc'
): BugIssue[] {
  return [...bugs].sort((a, b) => {
    const diff = SEVERITY_LEVELS[b.severity] - SEVERITY_LEVELS[a.severity];
    return order === 'desc' ? diff : -diff;
  });
}

/**
 * Group bugs by category
 */
export function groupBugsByCategory(
  bugs: BugIssue[]
): Record<BugCategory, BugIssue[]> {
  return bugs.reduce((acc, bug) => {
    if (!acc[bug.category]) {
      acc[bug.category] = [];
    }
    acc[bug.category].push(bug);
    return acc;
  }, {} as Record<BugCategory, BugIssue[]>);
}

/**
 * Group bugs by file
 */
export function groupBugsByFile(bugs: BugIssue[]): Record<string, BugIssue[]> {
  return bugs.reduce((acc, bug) => {
    const file = bug.file || 'unknown';
    if (!acc[file]) {
      acc[file] = [];
    }
    acc[file].push(bug);
    return acc;
  }, {} as Record<string, BugIssue[]>);
}

/**
 * Calculate detection summary
 */
export function calculateBugDetectionSummary(result: BugDetectionResult): {
  status: 'critical' | 'warning' | 'good' | 'clean';
  priorityBugs: BugIssue[];
  mainCategories: string[];
} {
  let status: 'critical' | 'warning' | 'good' | 'clean';
  let priorityBugs: BugIssue[] = [];

  if (result.statistics.critical > 0) {
    status = 'critical';
  } else if (result.statistics.high > 0 || result.totalBugs > 10) {
    status = 'warning';
  } else if (result.totalBugs > 0) {
    status = 'good';
  } else {
    status = 'clean';
  }

  // Priority bugs are critical + high severity
  priorityBugs = result.bugs
    .filter(b => b.severity === BugSeverity.CRITICAL || b.severity === BugSeverity.HIGH)
    .slice(0, 10);

  // Get main bug categories
  const mainCategories = Object.entries(result.categoryStatistics)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => CATEGORY_DISPLAY_NAMES[cat as BugCategory]);

  return { status, priorityBugs, mainCategories };
}

/**
 * Generate markdown report
 */
export function generateBugMarkdownReport(result: BugDetectionResult): string {
  const { status, priorityBugs, mainCategories } = calculateBugDetectionSummary(result);

  const report = `# Bug Detection Report

## Summary
- **Total Bugs**: ${result.totalBugs}
- **Status**: ${status.toUpperCase()}
- **Confidence Score**: ${result.confidenceScore}%
- **Lines of Code**: ${result.linesOfCode}
- **Files Analyzed**: ${result.filesAnalyzed.join(', ')}

## Severity Statistics
- 🔴 Critical: ${result.statistics.critical}
- 🟠 High: ${result.statistics.high}
- 🟡 Medium: ${result.statistics.medium}
- 🔵 Low: ${result.statistics.low}
- ℹ️ Info: ${result.statistics.info}

${mainCategories.length > 0 ? `## Main Bug Categories
${mainCategories.map(c => `- ${c}`).join('\n')}
` : ''}

${priorityBugs.length > 0 ? `## Priority Bugs (Critical & High)
${priorityBugs.map(bug => `
### ${bug.title}
- **Severity**: ${bug.severity}
- **Category**: ${CATEGORY_DISPLAY_NAMES[bug.category]}
${bug.file ? `- **File**: ${bug.file}${bug.line ? `:${bug.line}` : ''}` : ''}
- **Description**: ${bug.description}
${bug.fix ? `- **Fix**: ${bug.fix}` : ''}
`).join('\n')}
` : ''}

${result.recommendations.length > 0 ? `## Recommendations
${result.recommendations.map(r => `- ${r}`).join('\n')}
` : ''}

## All Bugs
${result.bugs.map(bug => `
### ${bug.title}
| Field | Value |
|-------|-------|
| Severity | ${bug.severity} |
| Category | ${CATEGORY_DISPLAY_NAMES[bug.category]} |
${bug.file ? `| File | ${bug.file}${bug.line ? `:${bug.line}` : ''} |` : ''}
| Description | ${bug.description} |
${bug.expected ? `| Expected | ${bug.expected} |` : ''}
${bug.actual ? `| Actual | ${bug.actual} |` : ''}
${bug.fix ? `| Fix | ${bug.fix} |` : ''}
`).join('\n')}
`;

  return report;
}