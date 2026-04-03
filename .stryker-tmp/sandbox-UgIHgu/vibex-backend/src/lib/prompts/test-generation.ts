/**
 * Test Generation Prompt Templates
 * 
 * This module contains prompt templates for generating comprehensive test suites
 * based on requirements, code analysis, or specifications.
 */
// @ts-nocheck


/**
 * Test Generation Input Schema
 */
export interface TestGenerationInput {
  /** Project context and name */
  project: string;
  /** Target file or component to test */
  target: string;
  /** Type of test generation */
  testType: 'unit' | 'integration' | 'e2e' | 'contract' | 'performance' | 'security' | 'comprehensive';
  /** Programming language */
  language?: 'typescript' | 'javascript' | 'python' | 'java' | 'go' | 'rust';
  /** Testing framework */
  framework?: 'jest' | 'vitest' | 'mocha' | 'pytest' | 'junit' | 'playwright' | 'cypress' | 'go-test' | 'catch2';
  /** Source code or specification to generate tests from */
  sourceCode?: string;
  /** Requirements or user stories */
  requirements?: string;
  /** API specification (OpenAPI/Swagger) */
  apiSpec?: string;
  /** Existing test patterns to follow */
  existingTests?: string;
  /** Test file path for context */
  filePath?: string;
  /** Dependencies and imports to mock */
  mocks?: string[];
  /** Fixtures or test data */
  fixtures?: Record<string, unknown>[];
  /** Edge cases to cover */
  edgeCases?: string[];
  /** Performance thresholds */
  performance?: {
    maxResponseTime?: number;
    maxMemory?: number;
    maxCpu?: number;
  };
  /** Security requirements */
  security?: {
    authRequired?: boolean;
    csrfProtection?: boolean;
    inputValidation?: boolean;
  };
  /** Coverage requirements */
  coverage?: 'basic' | 'standard' | 'thorough' | 'exhaustive';
  /** Include snapshot tests */
  snapshots?: boolean;
  /** Include mutation testing */
  mutationTesting?: boolean;
}

/**
 * Test type definitions and configurations
 */
export const TEST_TYPES = {
  unit: {
    name: 'Unit Tests',
    description: 'Test individual functions, methods, and classes in isolation',
    framework: 'vitest',
    priority: ['happy path', 'error cases', 'edge cases', 'boundary conditions'],
    coverage: 'method-level',
  },
  integration: {
    name: 'Integration Tests',
    description: 'Test interactions between components, modules, or services',
    framework: 'vitest',
    priority: ['data flow', 'component interaction', 'API contracts', 'database operations'],
    coverage: 'module-level',
  },
  e2e: {
    name: 'End-to-End Tests',
    description: 'Test complete user workflows from UI to backend',
    framework: 'playwright',
    priority: ['user journeys', 'critical paths', 'happy path', 'error recovery'],
    coverage: 'system-level',
  },
  contract: {
    name: 'Contract Tests',
    description: 'Verify API contracts between services',
    framework: 'pact',
    priority: ['request/response schema', 'status codes', 'error formats', 'versioning'],
    coverage: 'api-level',
  },
  performance: {
    name: 'Performance Tests',
    description: 'Test system performance under load',
    framework: 'k6',
    priority: ['response time', 'throughput', 'resource usage', 'scalability'],
    coverage: 'load-level',
  },
  security: {
    name: 'Security Tests',
    description: 'Test for security vulnerabilities',
    framework: 'zap',
    priority: ['authentication', 'authorization', 'input validation', 'data protection'],
    coverage: 'vulnerability-level',
  },
  comprehensive: {
    name: 'Comprehensive Test Suite',
    description: 'All test types for complete coverage',
    framework: 'multi',
    priority: ['unit', 'integration', 'e2e', 'contract', 'performance', 'security'],
    coverage: 'full',
  },
} as const;

/**
 * Programming language configurations
 */
export const LANGUAGES = {
  typescript: {
    name: 'TypeScript',
    extension: '.ts',
    frameworks: ['jest', 'vitest', 'mocha'],
    assertion: 'expect',
  },
  javascript: {
    name: 'JavaScript',
    extension: '.js',
    frameworks: ['jest', 'vitest', 'mocha'],
    assertion: 'expect',
  },
  python: {
    name: 'Python',
    extension: '.py',
    frameworks: ['pytest', 'unittest'],
    assertion: 'assert',
  },
  java: {
    name: 'Java',
    extension: '.java',
    frameworks: ['junit', 'testng'],
    assertion: 'assertEquals',
  },
  go: {
    name: 'Go',
    extension: '.go',
    frameworks: ['go-test', 'stretchr'],
    assertion: 'require',
  },
  rust: {
    name: 'Rust',
    extension: '.rs',
    frameworks: ['catch2', 'proptest'],
    assertion: 'assert_eq',
  },
} as const;

/**
 * Common test patterns by category
 */
export const TEST_PATTERNS = {
  happyPath: {
    name: 'Happy Path',
    description: 'Test with valid input and expected output',
  },
  errorHandling: {
    name: 'Error Handling',
    description: 'Test error conditions and exceptions',
  },
  boundaryValues: {
    name: 'Boundary Values',
    description: 'Test edge of valid ranges',
  },
  equivalence: {
    name: 'Equivalence Partitioning',
    description: 'Test representative values from each partition',
  },
  stateTransitions: {
    name: 'State Transitions',
    description: 'Test state machine transitions',
  },
  dataDriven: {
    name: 'Data-Driven',
    description: 'Test with multiple input/output pairs',
  },
  asyncOperations: {
    name: 'Async Operations',
    description: 'Test promises, callbacks, and async/await',
  },
  concurrent: {
    name: 'Concurrent Operations',
    description: 'Test parallel execution and race conditions',
  },
} as const;

/**
 * Coverage level requirements
 */
export const COVERAGE_LEVELS = {
  basic: {
    name: 'Basic Coverage',
    threshold: 60,
    focus: ['happy path', 'main error cases'],
  },
  standard: {
    name: 'Standard Coverage',
    threshold: 80,
    focus: ['happy path', 'error cases', 'edge cases', 'boundary values'],
  },
  thorough: {
    name: 'Thorough Coverage',
    threshold: 90,
    focus: ['all test patterns', 'branch coverage', 'path coverage'],
  },
  exhaustive: {
    name: 'Exhaustive Coverage',
    threshold: 100,
    focus: ['mutation testing', 'property-based testing', 'fuzzing'],
  },
} as const;

/**
 * Common edge cases for test generation
 */
export const EDGE_CASES = {
  null: { name: 'Null/None', input: 'null', expected: 'null handling or error' },
  undefined: { name: 'Undefined', input: 'undefined', expected: 'undefined handling' },
  empty: { name: 'Empty', input: '"" or []', expected: 'empty state handling' },
  zero: { name: 'Zero', input: '0', expected: 'zero handling' },
  negative: { name: 'Negative', input: '-1', expected: 'negative number handling' },
  maxValue: { name: 'Max Value', input: 'MAX_VALUE', expected: 'overflow handling' },
  overflow: { name: 'Overflow', input: 'MAX_VALUE + 1', expected: 'overflow handling' },
  unicode: { name: 'Unicode', input: '"你好🌍"', expected: 'unicode handling' },
  specialChars: { name: 'Special Characters', input: '"<script>"', expected: 'sanitization' },
  sqlInjection: { name: 'SQL Injection', input: '"\' OR 1=1 --"', expected: 'input validation' },
  xss: { name: 'XSS', input: '"<img src=x onerror=alert(1)>"', expected: 'XSS prevention' },
  whitespace: { name: 'Whitespace', input: '"   "', expected: 'trim handling' },
  veryLong: { name: 'Very Long', input: 'a'.repeat(10000), expected: 'length handling' },
} as const;

/**
 * Performance test scenarios
 */
export const PERFORMANCE_SCENARIOS = {
  baseline: { name: 'Baseline', users: 1, duration: '1m' },
  load: { name: 'Load Test', users: 10, duration: '5m' },
  stress: { name: 'Stress Test', users: 100, duration: '5m' },
  spike: { name: 'Spike Test', users: '10→100', duration: '30s' },
  soak: { name: 'Soak Test', users: 10, duration: '1h' },
} as const;

/**
 * Security test scenarios
 */
export const SECURITY_TESTS = {
  auth: {
    name: 'Authentication',
    tests: ['invalid credentials', 'expired tokens', 'missing auth', 'brute force'],
  },
  authorization: {
    name: 'Authorization',
    tests: ['privilege escalation', 'idot', 'horizontal privilege', 'vertical privilege'],
  },
  input: {
    name: 'Input Validation',
    tests: ['sql injection', 'xss', 'csrf', 'path traversal', 'command injection'],
  },
  data: {
    name: 'Data Protection',
    tests: ['sensitive data exposure', 'weak encryption', 'hardcoded secrets'],
  },
} as const;

/**
 * Generate the main test generation prompt
 */
export function generateTestGenerationPrompt(input: TestGenerationInput): string {
  const {
    project,
    target,
    testType,
    language = 'typescript',
    framework,
    sourceCode,
    requirements,
    apiSpec,
    existingTests,
    filePath,
    mocks = [],
    fixtures = [],
    edgeCases = [],
    performance,
    security,
    coverage = 'standard',
    snapshots = false,
    mutationTesting = false,
  } = input;

  const langConfig = LANGUAGES[language];
  const testConfig = TEST_TYPES[testType];
  const coverageConfig = COVERAGE_LEVELS[coverage];

  const parts: string[] = [];

  // Header
  parts.push(`## Test Generation Request

### Project Information
- **Project**: ${project}
- **Target**: ${target}
- **Test Type**: ${testConfig.name}
- **Language**: ${langConfig.name}
${framework ? `- **Framework**: ${framework}` : ''}
${filePath ? `- **File Path**: ${filePath}` : ''}
`);

  // Requirements section
  if (requirements) {
    parts.push(`### Requirements
${requirements}
`);
  }

  // Source code section
  if (sourceCode) {
    parts.push(`### Source Code
\`\`\`${language}
${sourceCode}
\`\`\`
`);
  }

  // API specification
  if (apiSpec) {
    parts.push(`### API Specification
\`\`\`yaml
${apiSpec}
\`\`\`
`);
  }

  // Existing tests
  if (existingTests) {
    parts.push(`### Existing Tests (Follow Patterns)
\`\`\`${language}
${existingTests}
\`\`\`
`);
  }

  // Test coverage requirements
  parts.push(`### Coverage Requirements
- **Level**: ${coverageConfig.name}
- **Threshold**: ${coverageConfig.threshold}%
- **Focus Areas**: ${coverageConfig.focus.join(', ')}
${mutationTesting ? '- **Mutation Testing**: Required' : ''}
${snapshots ? '- **Snapshot Testing**: Required' : ''}
`);

  // Edge cases
  if (edgeCases.length > 0) {
    parts.push(`### Edge Cases to Cover
${edgeCases.map(e => `- ${e}`).join('\n')}
`);
  } else {
    parts.push(`### Edge Cases to Cover
${Object.values(EDGE_CASES).slice(0, 6).map(e => `- ${e.name}: ${e.expected}`).join('\n')}
`);
  }

  // Mocks
  if (mocks.length > 0) {
    parts.push(`### Required Mocks
${mocks.map(m => `- \`${m}\``).join('\n')}
`);
  }

  // Fixtures
  if (fixtures.length > 0) {
    parts.push(`### Test Fixtures
\`\`\`json
${JSON.stringify(fixtures, null, 2)}
\`\`\`
`);
  }

  // Performance requirements
  if (performance) {
    parts.push(`### Performance Requirements
${performance.maxResponseTime ? `- Max Response Time: ${performance.maxResponseTime}ms` : ''}
${performance.maxMemory ? `- Max Memory: ${performance.maxMemory}MB` : ''}
${performance.maxCpu ? `- Max CPU: ${performance.maxCpu}%` : ''}
`);
  }

  // Security requirements
  if (security) {
    parts.push(`### Security Requirements
${security.authRequired ? '- Authentication: Required' : ''}
${security.csrfProtection ? '- CSRF Protection: Required' : ''}
${security.inputValidation ? '- Input Validation: Required' : ''}
`);
  }

  // Output format
  parts.push(`### Output Format

Generate comprehensive test code that:
1. Follows ${langConfig.name} best practices
2. Uses ${framework || testConfig.framework} testing framework
3. Includes descriptive test names following \`describe_[module]_[should_behavior]\` convention
4. Covers all specified requirements and edge cases
5. Includes proper setup/teardown where needed
6. Uses appropriate assertions from \`${langConfig.assertion}\`
${mutationTesting ? '7. Is mutation-resistant (meaningful assertions)' : ''}

Provide the complete test file content.`);
  return parts.join('\n');
}

/**
 * Generate unit test prompt
 */
export function generateUnitTestPrompt(input: TestGenerationInput): string {
  return generateTestGenerationPrompt({
    ...input,
    testType: 'unit',
  });
}

/**
 * Generate integration test prompt
 */
export function generateIntegrationTestPrompt(input: TestGenerationInput): string {
  return generateTestGenerationPrompt({
    ...input,
    testType: 'integration',
  });
}

/**
 * Generate E2E test prompt
 */
export function generateE2ETestPrompt(input: TestGenerationInput): string {
  return generateTestGenerationPrompt({
    ...input,
    testType: 'e2e',
  });
}

/**
 * Generate contract test prompt
 */
export function generateContractTestPrompt(input: TestGenerationInput): string {
  return generateTestGenerationPrompt({
    ...input,
    testType: 'contract',
  });
}

/**
 * Generate performance test prompt
 */
export function generatePerformanceTestPrompt(input: TestGenerationInput): string {
  return generateTestGenerationPrompt({
    ...input,
    testType: 'performance',
  });
}

/**
 * Generate security test prompt
 */
export function generateSecurityTestPrompt(input: TestGenerationInput): string {
  return generateTestGenerationPrompt({
    ...input,
    testType: 'security',
  });
}

/**
 * Generate comprehensive test suite prompt
 */
export function generateComprehensiveTestPrompt(input: TestGenerationInput): string {
  return generateTestGenerationPrompt({
    ...input,
    testType: 'comprehensive',
    coverage: input.coverage || 'thorough',
  });
}

export default {
  generateTestGenerationPrompt,
  generateUnitTestPrompt,
  generateIntegrationTestPrompt,
  generateE2ETestPrompt,
  generateContractTestPrompt,
  generatePerformanceTestPrompt,
  generateSecurityTestPrompt,
  generateComprehensiveTestPrompt,
  TEST_TYPES,
  LANGUAGES,
  TEST_PATTERNS,
  COVERAGE_LEVELS,
  EDGE_CASES,
  PERFORMANCE_SCENARIOS,
  SECURITY_TESTS,
};
