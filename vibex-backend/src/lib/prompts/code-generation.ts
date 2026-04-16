import { analyzeCodeSecurity, generateSecurityWarnings } from '@/lib/security/codeAnalyzer';

/**
 * Code Generation Prompt Templates
 * 
 * This module contains prompt templates for generating code snippets,
 * functions, classes, and complete modules based on user requirements.
 */

/**
 * Code Generation Input Schema
 */
export interface CodeGenerationInput {
  /** User's natural language description of the desired code */
  description: string;
  /** Target programming language */
  language?: 'typescript' | 'javascript' | 'python' | 'java' | 'go' | 'rust' | 'cpp' | 'csharp' | 'sql';
  /** Type of code to generate */
  codeType?: 'function' | 'class' | 'interface' | 'module' | 'component' | 'hook' | 'utility' | 'api' | 'test';
  /** Framework or library context */
  framework?: string;
  /** Existing code context for reference */
  existingCode?: string;
  /** Dependencies or imports to include */
  dependencies?: string[];
  /** Code complexity level */
  complexity?: 'simple' | 'medium' | 'complex';
  /** Whether to include error handling */
  errorHandling?: boolean;
  /** Whether to include documentation/comments */
  documentation?: boolean;
  /** Whether to include unit tests */
  includeTests?: boolean;
  /** Performance requirements */
  performance?: 'optimized' | 'standard' | 'readability-priority';
  /** Security requirements */
  security?: 'none' | 'basic' | 'strict';
}

/**
 * Supported programming languages with metadata
 */
export const SUPPORTED_LANGUAGES: Record<string, {
  name: string;
  extension: string;
  commentStyle: { single: string; multi: [string, string] };
  typescript: boolean;
}> = {
  typescript: {
    name: 'TypeScript',
    extension: '.ts',
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    typescript: true,
  },
  javascript: {
    name: 'JavaScript',
    extension: '.js',
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    typescript: false,
  },
  python: {
    name: 'Python',
    extension: '.py',
    commentStyle: { single: '#', multi: ['"""', '"""'] },
    typescript: false,
  },
  java: {
    name: 'Java',
    extension: '.java',
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    typescript: false,
  },
  go: {
    name: 'Go',
    extension: '.go',
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    typescript: false,
  },
  rust: {
    name: 'Rust',
    extension: '.rs',
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    typescript: false,
  },
  cpp: {
    name: 'C++',
    extension: '.cpp',
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    typescript: false,
  },
  csharp: {
    name: 'C#',
    extension: '.cs',
    commentStyle: { single: '//', multi: ['/*', '*/'] },
    typescript: false,
  },
  sql: {
    name: 'SQL',
    extension: '.sql',
    commentStyle: { single: '--', multi: ['/*', '*/'] },
    typescript: false,
  },
};

/**
 * Code type templates with patterns
 */
export const CODE_TYPE_TEMPLATES: Record<string, {
  description: string;
  structure: string[];
  requiredPatterns: string[];
}> = {
  function: {
    description: 'A reusable function or method',
    structure: ['function signature', 'parameters', 'return value', 'function body'],
    requiredPatterns: ['input validation', 'error handling', 'return statement'],
  },
  class: {
    description: 'An object-oriented class with methods and properties',
    structure: ['class declaration', 'constructor', 'properties', 'methods'],
    requiredPatterns: ['constructor', 'property definitions', 'method implementations'],
  },
  interface: {
    description: 'A type definition or interface',
    structure: ['interface declaration', 'properties', 'method signatures'],
    requiredPatterns: ['type definitions', 'property types'],
  },
  module: {
    description: 'A complete module with multiple exports',
    structure: ['imports', 'exports', 'implementations'],
    requiredPatterns: ['module exports', 'public API', 'internal utilities'],
  },
  component: {
    description: 'A UI component (React/Vue/etc.)',
    structure: ['component declaration', 'props', 'state', 'render'],
    requiredPatterns: ['props interface', 'render method', 'event handlers'],
  },
  hook: {
    description: 'A custom React/Vue hook',
    structure: ['hook declaration', 'state management', 'side effects', 'return values'],
    requiredPatterns: ['useState/useEffect', 'cleanup', 'return API'],
  },
  utility: {
    description: 'A utility function or helper',
    structure: ['function signature', 'implementation', 'exports'],
    requiredPatterns: ['pure function', 'edge case handling'],
  },
  api: {
    description: 'An API endpoint or route handler',
    structure: ['route definition', 'request handling', 'response formatting'],
    requiredPatterns: ['request validation', 'error responses', 'status codes'],
  },
  test: {
    description: 'Unit tests or integration tests',
    structure: ['test suite', 'test cases', 'assertions', 'setup/teardown'],
    requiredPatterns: ['describe blocks', 'it/test blocks', 'expect assertions'],
  },
};

/**
 * Security patterns based on security level
 */
export const SECURITY_PATTERNS: Record<string, string[]> = {
  none: [
    'No specific security measures required',
  ],
  basic: [
    'Input sanitization',
    'Avoid eval() or similar dangerous functions',
    'Use parameterized queries for database operations',
  ],
  strict: [
    'Input validation with strict types',
    'Output encoding/escaping',
    'CSRF protection',
    'XSS prevention',
    'SQL injection prevention with ORM or parameterized queries',
    'Authentication/authorization checks',
    'Rate limiting considerations',
    'Secure random number generation',
    'Cryptographic best practices',
  ],
};

/**
 * Complexity-based guidelines
 */
export const COMPLEXITY_GUIDELINES: Record<string, {
  maxLines: number;
  nestingDepth: number;
  cognitiveComplexity: string;
  patterns: string[];
}> = {
  simple: {
    maxLines: 50,
    nestingDepth: 2,
    cognitiveComplexity: 'Low - straightforward logic',
    patterns: ['single function', 'no complex conditionals', 'linear flow'],
  },
  medium: {
    maxLines: 150,
    nestingDepth: 3,
    cognitiveComplexity: 'Moderate - some branching and loops',
    patterns: ['multiple functions', 'error handling', 'moderate complexity'],
  },
  complex: {
    maxLines: 500,
    nestingDepth: 4,
    cognitiveComplexity: 'High - complex business logic',
    patterns: ['multiple modules', 'advanced patterns', 'optimization'],
  },
};

/**
 * Generate a code generation prompt
 */
export function generateCodePrompt(input: CodeGenerationInput): string {
  const language = input.language || 'typescript';
  const codeType = input.codeType || 'function';
  const complexity = input.complexity || 'medium';
  const errorHandling = input.errorHandling !== false;
  const documentation = input.documentation !== false;
  const security = input.security || 'none';
  const performance = input.performance || 'standard';
  const includeTests = input.includeTests || false;

  const lang = SUPPORTED_LANGUAGES[language];
  const codeTemplate = CODE_TYPE_TEMPLATES[codeType];
  const complexityGuide = COMPLEXITY_GUIDELINES[complexity];
  const securityPatterns = SECURITY_PATTERNS[security];

  // --- E6-U1: AST Security Analysis for existing code ---
  const existingCodeAnalysis = input.existingCode
    ? generateSecurityWarnings(input.existingCode)
    : '';

  return `## Code Generation Request

### Requirements
${input.description}

### Language & Type
- **Language**: ${lang.name}
- **Code Type**: ${codeType} - ${codeTemplate.description}
- **Framework**: ${input.framework || 'None specified'}

### Complexity Guidelines
- **Complexity Level**: ${complexity}
- **Max Lines**: ${complexityGuide.maxLines}
- **Nesting Depth**: ${complexityGuide.nestingDepth}
- **Cognitive Complexity**: ${complexityGuide.cognitiveComplexity}

### Requirements Checklist
${errorHandling ? '- [x] Include error handling' : '- [ ] Include error handling'}
${documentation ? '- [x] Include documentation/comments' : '- [ ] Include documentation/comments'}
${includeTests ? '- [x] Include unit tests' : '- [ ] Include unit tests'}
- **Performance**: ${performance}
- **Security Level**: ${security}

### Dependencies
${input.dependencies?.map(d => `- \`${d}\``).join('\n') || 'None specified'}

${input.existingCode ? `### Existing Code Context
\`\`\`${language}
${input.existingCode}
\`\`\`
${existingCodeAnalysis ? existingCodeAnalysis + '\n' : ''}` : ''}

---

## Generation Guidelines

### 1. Structure Requirements
${codeTemplate.structure.map(s => `- ${s}`).join('\n')}

### 2. Required Patterns
${codeTemplate.requiredPatterns.map(p => `- ${p}`).join('\n')}

### 3. Security Requirements (${security} level)
${securityPatterns.map(p => `- ${p}`).join('\n')}

### 4. Performance Considerations
${performance === 'optimized' ? '- Use efficient algorithms and data structures\n- Minimize allocations\n- Consider lazy evaluation' : performance === 'readability-priority' ? '- Prioritize clear, readable code\n- Use descriptive variable names\n- Add comments for complex logic' : '- Balance between performance and readability'}

${errorHandling ? `### 5. Error Handling
- Use try-catch blocks where appropriate
- Provide meaningful error messages
- Handle edge cases and boundary conditions
- Consider logging errors for debugging` : ''}

${documentation ? `### 6. Documentation
- Add JSDoc/TSDoc comments for public APIs
- Document function parameters and return types
- Include usage examples where helpful` : ''}

---

## Output Format

Provide the generated code as:
1. **Complete Code**: Full implementation in ${lang.name}
2. **Type Definitions**: Interfaces/types if applicable
3. **Tests**: Unit tests (${includeTests ? 'included' : 'not requested'})
4. **Documentation**: Usage examples and API docs`;
}

/**
 * Generate a function-specific prompt
 */
export function generateFunctionPrompt(
  functionName: string,
  params: Array<{ name: string; type: string; required: boolean; description?: string }>,
  returnType: string,
  options?: {
    language?: string;
    async?: boolean;
    generator?: boolean;
    variadic?: boolean;
  }
): string {
  const language = options?.language || 'typescript';
  const lang = SUPPORTED_LANGUAGES[language];

  const paramsStr = params
    .map(p => {
      const optional = p.required ? '' : '?';
      return `  ${p.name}${optional}: ${p.type}`;
    })
    .join(',\n');

  return `## Function Generation: ${functionName}

### Function Signature
\`\`\`${language}
${options?.async ? 'async ' : ''}${options?.generator ? 'function* ' : ''}${functionName}(
${paramsStr}
): ${returnType}
\`\`\`

### Parameters
${params.map(p => `- **${p.name}** (${p.type}${p.required ? '' : ' (optional)'}): ${p.description || 'No description'}`).join('\n')}

### Return Type
${returnType}

### Options
- Async: ${options?.async || false}
- Generator: ${options?.generator || false}
- Variadic: ${options?.variadic || false}

---

Generate a ${options?.async ? 'asynchronous ' : ''}function "${functionName}" that:
1. Validates all input parameters
2. Handles edge cases appropriately
3. Returns the correct ${returnType}
4. Includes proper error handling
5. Is well-documented with comments`;
}

/**
 * Generate a class prompt
 */
export function generateClassPrompt(
  className: string,
  options: {
    properties?: Array<{ name: string; type: string; access: 'public' | 'private' | 'protected'; readonly?: boolean }>;
    methods?: Array<{ name: string; params: string; returnType: string; access: 'public' | 'private' | 'protected' }>;
    implements?: string[];
    extends?: string;
    abstract?: boolean;
    language?: string;
  }
): string {
  const language = options.language || 'typescript';
  const lang = SUPPORTED_LANGUAGES[language];

  return `## Class Generation: ${className}

### Class Declaration
${options.extends ? `**Extends**: ${options.extends}` : ''}
${options.implements?.length ? `**Implements**: ${options.implements.join(', ')}` : ''}
${options.abstract ? '**Abstract**: Yes' : ''}

### Properties
${options.properties?.map(p => 
  `- **${p.access}** ${p.readonly ? 'readonly ' : ''}${p.name}: ${p.type}`
).join('\n') || 'None specified'}

### Methods
${options.methods?.map(m => 
  `- **${m.access}** ${m.name}(${m.params}): ${m.returnType}`
).join('\n') || 'None specified'}

---

Generate a${options.abstract ? 'n abstract ' : ' '}class "${className}" that:
1. Implements all specified properties and methods
2. Uses proper encapsulation (${options.properties?.every(p => p.access !== 'public') ? 'all private' : 'appropriate access modifiers'})
3. Includes a constructor if needed
4. Follows SOLID principles
5. Is well-documented`;
}

/**
 * Generate a test prompt
 */
export function generateTestPrompt(
  targetCode: string,
  options: {
    testFramework?: 'jest' | 'mocha' | 'vitest' | 'pytest' | 'unittest';
    language?: string;
    testType?: 'unit' | 'integration' | 'e2e';
    coverage?: 'basic' | 'comprehensive';
  }
): string {
  const language = options.language || 'typescript';
  const framework = options.testFramework || (language === 'python' ? 'pytest' : 'jest');
  const testType = options.testType || 'unit';
  const coverage = options.coverage || 'basic';

  return `## Test Generation Request

### Target Code
\`\`\`${language}
${targetCode}
\`\`\`

### Test Configuration
- **Test Framework**: ${framework}
- **Test Type**: ${testType}
- **Coverage Level**: ${coverage}

---

## Test Requirements

### 1. Test Structure
- Use ${framework} describe/it (or equivalent) blocks
- Include setup and teardown if needed
- Group related tests together

### 2. Test Cases
${coverage === 'comprehensive' ? '- Happy path tests\n- Edge cases\n- Error cases\n- Boundary conditions\n- Performance considerations' : '- Primary functionality\n- Basic error handling'}

### 3. Assertions
- Use appropriate assertions for the framework
- Include descriptive error messages
- Verify both positive and negative cases

### 4. Best Practices
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated
- Use meaningful test names
- Avoid test interdependencies

---

## Output Format

Provide the generated tests as:
1. **Test Suite**: Complete test file
2. **Coverage**: ${coverage} level
3. **Documentation**: Test descriptions`;
}

/**
 * Generate a prompt for code conversion between languages
 */
export function generateConversionPrompt(
  sourceCode: string,
  sourceLanguage: string,
  targetLanguage: string,
  options?: {
    preserveComments?: boolean;
    adaptPatterns?: boolean;
    includeTests?: boolean;
  }
): string {
  const sourceLang = SUPPORTED_LANGUAGES[sourceLanguage];
  const targetLang = SUPPORTED_LANGUAGES[targetLanguage];

  return `## Code Conversion Request

### Source Code (${sourceLang.name})
\`\`\`${sourceLanguage}
${sourceCode}
\`\`\`

### Target Language
${targetLang.name}

### Options
- Preserve Comments: ${options?.preserveComments !== false}
- Adapt Patterns: ${options?.adaptPatterns !== false}
- Include Tests: ${options?.includeTests || false}

---

## Conversion Guidelines

### 1. Language-Specific Differences
- Handle ${sourceLanguage} → ${targetLanguage} syntax differences
- Adapt idioms and patterns to ${targetLanguage} best practices
- Convert types appropriately

### 2. Library/Framework Equivalents
- Find equivalent libraries/frameworks in ${targetLanguage}
- Map built-in functions to target language equivalents

### 3. Testing
${options?.includeTests ? '- Include unit tests in the target language\n- Verify functionality matches source' : '- No tests requested'}

### 4. Documentation
- Maintain inline comments if ${options?.preserveComments !== false}
- Add notes about any behavioral differences

---

## Output Format

Provide the converted code as:
1. **Converted Code**: Complete implementation in ${targetLang.name}
2. **Differences**: Notes on any behavioral changes
3. **Tests**: Unit tests (if requested)`;
}

export default {
  SUPPORTED_LANGUAGES,
  CODE_TYPE_TEMPLATES,
  SECURITY_PATTERNS,
  COMPLEXITY_GUIDELINES,
  generateCodePrompt,
  generateFunctionPrompt,
  generateClassPrompt,
  generateTestPrompt,
  generateConversionPrompt,
};

// Re-export generateSecurityWarnings from the single canonical implementation
export { generateSecurityWarnings } from '@/lib/security/codeAnalyzer';
