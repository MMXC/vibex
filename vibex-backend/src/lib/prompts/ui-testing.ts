/**
 * UI Testing Prompt Templates
 * 
 * This module contains prompt templates for generating UI tests,
 * including component tests, integration tests, E2E tests, and accessibility tests.
 */

/**
 * UI Testing Input Schema
 */
export interface UITestingInput {
  /** Target component or page to test */
  target: string;
  /** Type of tests to generate */
  testType: 'unit' | 'integration' | 'e2e' | 'visual' | 'accessibility' | 'all';
  /** Testing framework preference */
  framework?: 'jest' | 'vitest' | 'playwright' | 'cypress' | 'rtl';
  /** Component library used */
  componentLibrary?: 'shadcn' | 'tailwind' | 'mui' | 'antd' | 'custom';
  /** Test file path (for context) */
  filePath?: string;
  /** Existing test patterns to follow */
  existingTests?: string;
  /** Test coverage requirements */
  coverage?: 'basic' | 'standard' | 'comprehensive';
  /** Include accessibility tests */
  includeA11y?: boolean;
  /** Include performance tests */
  includePerformance?: boolean;
  /** Mock data or fixtures */
  fixtures?: Record<string, unknown>[];
  /** User interactions to test */
  userInteractions?: string[];
  /** Edge cases to consider */
  edgeCases?: string[];
}

/**
 * Test type definitions
 */
export const TEST_TYPES = {
  unit: {
    name: 'Unit Tests',
    description: 'Test individual components in isolation',
    framework: 'vitest',
    focus: ['props', 'state', 'rendering', 'methods'],
  },
  integration: {
    name: 'Integration Tests',
    description: 'Test component interactions and data flow',
    framework: 'vitest + rtl',
    focus: ['component composition', 'context', 'hooks', 'events'],
  },
  e2e: {
    name: 'End-to-End Tests',
    description: 'Test complete user workflows',
    framework: 'playwright',
    focus: ['user flows', 'navigation', 'data submission', 'auth'],
  },
  visual: {
    name: 'Visual Regression Tests',
    description: 'Detect visual changes in UI',
    framework: 'playwright + chromatic',
    focus: ['layouts', 'colors', 'typography', 'spacing'],
  },
  accessibility: {
    name: 'Accessibility Tests',
    description: 'Verify WCAG compliance',
    framework: 'axe-core',
    focus: ['ARIA', 'keyboard nav', 'color contrast', 'screen reader'],
  },
  all: {
    name: 'Comprehensive Tests',
    description: 'All test types for complete coverage',
    framework: 'vitest + playwright + axe-core',
    focus: ['unit', 'integration', 'e2e', 'visual', 'accessibility'],
  },
} as const;

/**
 * Common user interactions for testing
 */
export const USER_INTERACTIONS = {
  click: { name: 'Click', description: 'Button/link clicks', events: ['onClick'] },
  hover: { name: 'Hover', description: 'Mouse hover states', events: ['onMouseEnter', 'onMouseLeave'] },
  focus: { name: 'Focus', description: 'Focus and blur events', events: ['onFocus', 'onBlur'] },
  input: { name: 'Input', description: 'Text input changes', events: ['onChange', 'onInput'] },
  submit: { name: 'Submit', description: 'Form submissions', events: ['onSubmit'] },
  select: { name: 'Select', description: 'Selection changes', events: ['onSelect', 'onChange'] },
  keyboard: { name: 'Keyboard', description: 'Keyboard navigation', events: ['onKeyDown', 'onKeyUp', 'onKeyPress'] },
  drag: { name: 'Drag', description: 'Drag and drop', events: ['onDragStart', 'onDragEnd', 'onDrop'] },
  scroll: { name: 'Scroll', description: 'Scroll behavior', events: ['onScroll'] },
  resize: { name: 'Resize', description: 'Window resize', events: ['resize'] },
} as const;

/**
 * Common edge cases for UI testing
 */
export const EDGE_CASES = {
  empty: { name: 'Empty State', description: 'Component with no data' },
  loading: { name: 'Loading State', description: 'Component while loading' },
  error: { name: 'Error State', description: 'Component with error' },
  disabled: { name: 'Disabled State', description: 'Disabled component interaction' },
  readonly: { name: 'Read-only', description: 'Read-only input fields' },
  partial: { name: 'Partial Data', description: 'Incomplete or partial data' },
  overflow: { name: 'Overflow', description: 'Content overflow handling' },
  long: { name: 'Long Content', description: 'Very long text/content' },
  unicode: { name: 'Unicode', description: 'Unicode characters and emojis' },
  rtl: { name: 'RTL', description: 'Right-to-left language support' },
  mobile: { name: 'Mobile View', description: 'Touch-only interactions' },
  offline: { name: 'Offline', description: 'Network offline state' },
} as const;

/**
 * Accessibility testing requirements by level
 */
export const A11Y_LEVELS = {
  basic: {
    name: 'Basic A11y',
    requirements: ['HTML structure', 'alt text', 'form labels'],
  },
  wcag_a: {
    name: 'WCAG Level A',
    requirements: ['Non-text content', 'info and relationships', 'meaningful sequence'],
  },
  wcag_aa: {
    name: 'WCAG Level AA',
    requirements: ['Level A +', 'contrast ratio (4.5:1)', 'keyboard access', 'focus visibility'],
  },
  wcag_aaa: {
    name: 'WCAG Level AAA',
    requirements: ['Level AA +', 'contrast ratio (7:1)', 'reading level', 'sign language'],
  },
} as const;

/**
 * Generate the main UI testing prompt
 */
export function generateUITestingPrompt(input: UITestingInput): string {
  const {
    target,
    testType,
    framework = 'vitest',
    componentLibrary = 'tailwind',
    filePath,
    existingTests,
    coverage = 'standard',
    includeA11y = false,
    includePerformance = false,
    fixtures = [],
    userInteractions = [],
    edgeCases = [],
  } = input;

  const testTypeInfo = TEST_TYPES[testType];
  const testCoverage = getCoverageRequirements(coverage);

  return `## UI Testing Request

### Target
- **Component/Page**: ${target}
- **Test Type**: ${testTypeInfo.name}
- **Framework**: ${framework}

### Context
- **Component Library**: ${componentLibrary}
- **File Path**: ${filePath || 'New file'}
- **Coverage Level**: ${coverage}

### Existing Tests (for reference)
${existingTests || 'No existing tests - generate from scratch'}

### Test Coverage Requirements
${testCoverage.map(c => `- ${c}`).join('\n')}

### User Interactions to Test
${userInteractions.length > 0 
  ? userInteractions.map(i => `- ${USER_INTERACTIONS[i as keyof typeof USER_INTERACTIONS]?.name || i}`).join('\n')
  : '- All standard interactions based on component type'}

### Edge Cases to Consider
${edgeCases.length > 0
  ? edgeCases.map(e => `- ${EDGE_CASES[e as keyof typeof EDGE_CASES]?.name || e}`).join('\n')
  : '- Empty, loading, error, disabled states'}

### Fixtures/Mock Data
${fixtures.length > 0
  ? fixtures.map(f => `- ${JSON.stringify(f)}`).join('\n')
  : 'Generate appropriate mock data'}

### Additional Requirements
${includeA11y ? '- Include accessibility tests (WCAG compliance)' : '- No accessibility tests required'}
${includePerformance ? '- Include performance benchmarks' : ''}

---

## Testing Guidelines

### 1. Test Structure
Follow the standard testing pattern:
- **Arrange**: Set up test data, mocks, and component
- **Act**: Perform the user interaction
- **Assert**: Verify the expected behavior

### 2. Test Naming
Use descriptive test names that explain the scenario:
- \`should render correctly with default props\`
- \`should show error state when API fails\`
- \`should call onClick handler when button is clicked\`

### 3. Test Isolation
- Each test should be independent
- Use \`beforeEach\` for common setup
- Clean up after each test
- Mock external dependencies

### 4. Component-Specific Guidelines
${getComponentTestingGuidelines(target)}

### 5. Best Practices
- Test behavior, not implementation
- Use semantic queries (byRole, byLabelText)
- Avoid testing internal state
- Test error boundaries
- Include async/await for async operations

---

## Output Format

Provide the generated tests as:
1. **Test File**: Complete test file with proper imports
2. **Fixtures**: Mock data if needed
3. **Helpers**: Utility functions if needed
4. **Assertions**: Expected behaviors with clear messages

### Framework-Specific Notes
${getFrameworkNotes(framework, testType)}`;
}

/**
 * Generate a component unit test prompt
 */
export function generateUnitTestPrompt(
  componentName: string,
  props: Record<string, unknown>,
  options?: {
    framework?: 'jest' | 'vitest' | 'rtl';
    coverage?: 'basic' | 'standard' | 'comprehensive';
    includeSnapshots?: boolean;
    includeHandlers?: boolean;
  }
): string {
  const framework = options?.framework || 'vitest';
  const coverage = options?.coverage || 'standard';
  const testCoverage = getCoverageRequirements(coverage);

  return `## Unit Test Generation: ${componentName}

### Component Props
${Object.entries(props).map(([key, value]) => `- \`${key}\`: ${JSON.stringify(value)}`).join('\n')}

### Test Configuration
- Framework: ${framework}
- Coverage: ${coverage}
- Snapshots: ${options?.includeSnapshots ? 'Yes' : 'No'}
- Event Handlers: ${options?.includeHandlers ? 'Yes' : 'No'}

### Required Test Cases
${testCoverage.map(c => `- ${c}`).join('\n')}

---

Generate unit tests for ${componentName} that:
1. Test all props variations
2. Test all render states (default, loading, error, empty)
3. Test user interactions (click, input, focus, etc.)
4. Test edge cases
5. Follow ${framework} best practices
6. Use React Testing Library for queries`;
}

/**
 * Generate an integration test prompt
 */
export function generateIntegrationTestPrompt(
  scenario: string,
  components: string[],
  options?: {
    framework?: 'vitest' | 'playwright';
    includeRouting?: boolean;
    includeContext?: boolean;
  }
): string {
  const framework = options?.framework || 'vitest';

  return `## Integration Test Generation

### Scenario
${scenario}

### Components Involved
${components.map(c => `- ${c}`).join('\n')}

### Context
- Framework: ${framework}
- Routing: ${options?.includeRouting ? 'Yes - test navigation' : 'No'}
- Context: ${options?.includeContext ? 'Yes - test context providers' : 'No'}

---

Generate integration tests that:
1. Test component composition and data flow
2. Test shared state between components
3. Test parent-child interactions
4. Test context providers if applicable
5. Test navigation/routing if applicable
6. Verify proper cleanup on unmount`;
}

/**
 * Generate an E2E test prompt
 */
export function generateE2ETestPrompt(
  userFlow: string,
  options?: {
    framework?: 'playwright' | 'cypress';
    viewport?: 'desktop' | 'tablet' | 'mobile';
    authRequired?: boolean;
    apiMocks?: string[];
  }
): string {
  const framework = options?.framework || 'playwright';

  return `## E2E Test Generation

### User Flow
${userFlow}

### Configuration
- Framework: ${framework}
- Viewport: ${options?.viewport || 'desktop'}
- Authentication: ${options?.authRequired ? 'Required - mock auth' : 'Not required'}
${options?.apiMocks ? `- API Mocks:\n${options.apiMocks.map(m => `  - ${m}`).join('\n')}` : ''}

---

Generate E2E tests that:
1. Navigate through the complete user flow
2. Verify all UI elements appear correctly
3. Test form submissions and validations
4. Verify data persistence
5. Test error handling and recovery
6. Include appropriate wait strategies
7. Take screenshots on failure`;
}

/**
 * Generate an accessibility test prompt
 */
export function generateAccessibilityTestPrompt(
  target: string,
  level: 'basic' | 'wcag_a' | 'wcag_aa' | 'wcag_aaa' = 'wcag_aa'
): string {
  const a11yRequirements = A11Y_LEVELS[level];

  return `## Accessibility Test Generation

### Target
${target}

### WCAG Level
${a11yRequirements.name}

### Requirements to Test
${a11yRequirements.requirements.map(r => `- ${r}`).join('\n')}

---

Generate accessibility tests that:
1. Verify proper semantic HTML structure
2. Test keyboard navigation and focus management
3. Check ARIA labels and roles
4. Verify color contrast ratios
5. Test screen reader compatibility
6. Check focus visible indicators
7. Verify form label associations
8. Test skip links if applicable`;
}

/**
 * Helper function to get coverage requirements
 */
function getCoverageRequirements(coverage: 'basic' | 'standard' | 'comprehensive'): string[] {
  const base = [
    'Component renders without crashing',
    'Default props render correctly',
    'All prop variations work as expected',
  ];

  const standard = [
    'User interactions trigger correct behavior',
    'Loading state displays correctly',
    'Error state displays correctly',
    'Empty state displays correctly',
  ];

  const comprehensive = [
    'Edge cases handled properly',
    'Accessibility requirements met',
    'Performance under various conditions',
    'Memory leaks and cleanup verified',
    'Async operations handled correctly',
  ];

  switch (coverage) {
    case 'basic':
      return base;
    case 'standard':
      return [...base, ...standard];
    case 'comprehensive':
      return [...base, ...standard, ...comprehensive];
    default:
      return base;
  }
}

/**
 * Get component-specific testing guidelines
 */
function getComponentTestingGuidelines(target: string): string {
  const lowerTarget = target.toLowerCase();
  
  if (lowerTarget.includes('form')) {
    return `- Test all field types (text, select, checkbox, radio, etc.)
- Test form validation (required, pattern, custom validators)
- Test form submission and data payload
- Test form reset functionality
- Test disabled state during submission`;
  }
  
  if (lowerTarget.includes('table') || lowerTarget.includes('list')) {
    return `- Test empty state
- Test loading state
- Test pagination controls
- Test sorting functionality
- Test selection (if applicable)`;
  }
  
  if (lowerTarget.includes('modal') || lowerTarget.includes('dialog')) {
    return `- Test modal opens/closes
- Test keyboard escape closes modal
- Test click outside closes modal
- Test focus trap within modal
- Test body scroll lock when open`;
  }
  
  if (lowerTarget.includes('nav') || lowerTarget.includes('menu')) {
    return `- Test navigation links
- Test active state
- Test mobile responsive behavior
- Test keyboard navigation
- Test dropdown menus (if applicable)`;
  }

  return `- Test default render
- Test all prop variations
- Test user interactions
- Test error handling
- Test accessibility`;
}

/**
 * Get framework-specific notes
 */
function getFrameworkNotes(framework: string, testType: string): string {
  const notes: Record<string, string> = {
    'vitest': '- Use \`describe\`, \`it\`, \`expect\` from vitest\n- Use \`vi.fn()\` for mocking\n- Use \`cleanup()\` from @testing-library/react',
    'jest': '- Use \`describe\`, \`it\`, \`expect\` from jest\n- Use \`jest.fn()\` for mocking\n- Use \`toMatchSnapshot\` for snapshot testing',
    'playwright': '- Use \`test\`, \`expect\` from @playwright/test\n- Use \`page.locator()\` for element selection\n- Use \`await\` for all async operations',
    'cypress': '- Use \`describe\`, \`it\` from cypress\n- Use \`cy.get()\` for element selection\n- Use \`.should()\` for assertions',
    'rtl': '- Use \`render\` from @testing-library/react\n- Use query methods: \`getBy\`, \`findBy\`, \`queryBy\`\n- Use \`fireEvent\` or \`userEvent\` for interactions',
  };

  return notes[framework] || notes['vitest'];
}

export default {
  TEST_TYPES,
  USER_INTERACTIONS,
  EDGE_CASES,
  A11Y_LEVELS,
  generateUITestingPrompt,
  generateUnitTestPrompt,
  generateIntegrationTestPrompt,
  generateE2ETestPrompt,
  generateAccessibilityTestPrompt,
};
