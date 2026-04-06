import { safeError } from '@/lib/log-sanitizer';
/**
 * UI Analysis Prompt Templates
 * 
 * This module contains prompt templates for analyzing UI components,
 * including accessibility, responsiveness, design consistency, performance, and best practices.
 * 
 * @module lib/prompts/ui-analysis
 */

// ============================================
// Types and Interfaces
// ============================================

/**
 * UI analysis type
 */
export enum UIAnalysisType {
  /** Full comprehensive UI analysis */
  COMPREHENSIVE = 'comprehensive',
  /** Focus on accessibility */
  ACCESSIBILITY = 'accessibility',
  /** Focus on responsiveness */
  RESPONSIVENESS = 'responsiveness',
  /** Focus on design consistency */
  DESIGN_CONSISTENCY = 'design_consistency',
  /** Focus on performance */
  PERFORMANCE = 'performance',
  /** Focus on code quality */
  CODE_QUALITY = 'code_quality',
  /** Focus on best practices */
  BEST_PRACTICES = 'best_practices',
  /** Quick scan for obvious issues */
  QUICK = 'quick',
}

/**
 * Issue severity level
 */
export enum UIIssueSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

/**
 * Issue category
 */
export enum UIIssueCategory {
  // Accessibility
  ACCESSIBILITY = 'accessibility',
  ARIA_USAGE = 'aria_usage',
  KEYBOARD_NAVIGATION = 'keyboard_navigation',
  COLOR_CONTRAST = 'color_contrast',
  SCREEN_READER = 'screen_reader',
  FOCUS_MANAGEMENT = 'focus_management',
  
  // Responsiveness
  RESPONSIVENESS = 'responsiveness',
  BREAKPOINT = 'breakpoint',
  LAYOUT_BREAK = 'layout_break',
  SCROLLING = 'scrolling',
  
  // Design
  DESIGN_CONSISTENCY = 'design_consistency',
  TYPOGRAPHY = 'typography',
  SPACING = 'spacing',
  COLOR_USAGE = 'color_usage',
  VISUAL_HIERARCHY = 'visual_hierarchy',
  
  // Performance
  PERFORMANCE = 'performance',
  RENDER_OPTIMIZATION = 'render_optimization',
  IMAGE_OPTIMIZATION = 'image_optimization',
  CODE_SPLITTING = 'code_splitting',
  
  // Code Quality
  CODE_QUALITY = 'code_quality',
  STATE_MANAGEMENT = 'state_management',
  PROP_DRILLING = 'prop_drilling',
  MEMORY_LEAK = 'memory_leak',
  ERROR_HANDLING = 'error_handling',
  
  // Best Practices
  BEST_PRACTICES = 'best_practices',
  SEMANTIC_HTML = 'semantic_html',
  ACCESSIBLE_NAME = 'accessible_name',
  EVENT_HANDLER = 'event_handler',
  FORM_VALIDATION = 'form_validation',
  
  // Security
  SECURITY = 'security',
  XSS = 'xss',
  SENSITIVE_DATA = 'sensitive_data',
  
  // Other
  OTHER = 'other',
}

/**
 * Framework type
 */
export type FrameworkType = 'react' | 'vue' | 'svelte' | 'angular' | 'vanilla' | 'nextjs' | 'nuxt';

/**
 * UI library type
 */
export type UILibraryType = 'shadcn' | 'tailwind' | 'mui' | 'antd' | 'chakra' | 'bootstrap' | 'custom' | 'none';

/**
 * A single UI issue found during analysis
 */
export interface UIIssue {
  /** Unique identifier */
  id: string;
  /** Issue title/summary */
  title: string;
  /** Detailed description of the issue */
  description: string;
  /** Severity level */
  severity: UIIssueSeverity;
  /** Issue category */
  category: UIIssueCategory;
  /** File path (if applicable) */
  file?: string;
  /** Line number (if applicable) */
  line?: number;
  /** Code snippet showing the issue */
  codeSnippet?: string;
  /** Suggested fix */
  fix?: string;
  /** WCAG guideline reference (for accessibility issues) */
  wcagGuideline?: string;
  /** Related issues */
  relatedIssues?: string[];
  /** Whether it's a known limitation */
  knownLimitation?: boolean;
  /** Priority score (1-100) */
  priority?: number;
}

/**
 * UI analysis result
 */
export interface UIAnalysisResult {
  /** Total issues found */
  totalIssues: number;
  /** Summary of findings */
  summary: string;
  /** All issues found */
  issues: UIIssue[];
  /** Statistics by severity */
  statistics: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  /** Statistics by category */
  categoryStatistics: Record<UIIssueCategory, number>;
  /** Accessibility score (0-100) */
  accessibilityScore: number;
  /** Responsiveness score (0-100) */
  responsivenessScore: number;
  /** Performance score (0-100) */
  performanceScore: number;
  /** Overall quality score (0-100) */
  overallScore: number;
  /** Recommendations */
  recommendations: string[];
  /** Positive findings */
  positiveFindings?: string[];
}

/**
 * UI analysis configuration
 */
export interface UIAnalysisConfig {
  /** Type of analysis */
  analysisType?: UIAnalysisType;
  /** Focus categories */
  focusCategories?: UIIssueCategory[];
  /** Target frameworks */
  frameworks?: FrameworkType[];
  /** UI library used */
  uiLibrary?: UILibraryType;
  /** Minimum severity to report */
  minSeverity?: UIIssueSeverity;
  /** Include code snippets */
  includeSnippets?: boolean;
  /** Maximum issues to report */
  maxIssues?: number;
  /** Check WCAG compliance level */
  wcagLevel?: 'a' | 'aa' | 'aaa';
  /** Check responsive breakpoints */
  breakpoints?: string[];
  /** Include performance analysis */
  includePerformance?: boolean;
  /** Include accessibility analysis */
  includeAccessibility?: boolean;
}

/**
 * UI analysis input
 */
export interface UIAnalysisInput {
  /** UI code to analyze */
  code: string;
  /** File name */
  fileName?: string;
  /** Analysis configuration */
  config?: UIAnalysisConfig;
  /** Additional context about the component */
  context?: string;
  /** Screenshot or design reference (URL or base64) */
  designReference?: string;
  /** Design system tokens */
  designTokens?: Record<string, unknown>;
  /** Component props interface */
  propsInterface?: string;
  /** State management approach */
  stateManagement?: string;
  /** Test cases or user flows to consider */
  userFlows?: string[];
}

// ============================================
// Constants
// ============================================

/**
 * Severity level numeric values for sorting
 */
export const SEVERITY_LEVELS: Record<UIIssueSeverity, number> = {
  [UIIssueSeverity.CRITICAL]: 5,
  [UIIssueSeverity.HIGH]: 4,
  [UIIssueSeverity.MEDIUM]: 3,
  [UIIssueSeverity.LOW]: 2,
  [UIIssueSeverity.INFO]: 1,
};

/**
 * Category display names
 */
export const CATEGORY_DISPLAY_NAMES: Record<UIIssueCategory, string> = {
  [UIIssueCategory.ACCESSIBILITY]: 'Accessibility',
  [UIIssueCategory.ARIA_USAGE]: 'ARIA Usage',
  [UIIssueCategory.KEYBOARD_NAVIGATION]: 'Keyboard Navigation',
  [UIIssueCategory.COLOR_CONTRAST]: 'Color Contrast',
  [UIIssueCategory.SCREEN_READER]: 'Screen Reader',
  [UIIssueCategory.FOCUS_MANAGEMENT]: 'Focus Management',
  [UIIssueCategory.RESPONSIVENESS]: 'Responsiveness',
  [UIIssueCategory.BREAKPOINT]: 'Breakpoint',
  [UIIssueCategory.LAYOUT_BREAK]: 'Layout Break',
  [UIIssueCategory.SCROLLING]: 'Scrolling',
  [UIIssueCategory.DESIGN_CONSISTENCY]: 'Design Consistency',
  [UIIssueCategory.TYPOGRAPHY]: 'Typography',
  [UIIssueCategory.SPACING]: 'Spacing',
  [UIIssueCategory.COLOR_USAGE]: 'Color Usage',
  [UIIssueCategory.VISUAL_HIERARCHY]: 'Visual Hierarchy',
  [UIIssueCategory.PERFORMANCE]: 'Performance',
  [UIIssueCategory.RENDER_OPTIMIZATION]: 'Render Optimization',
  [UIIssueCategory.IMAGE_OPTIMIZATION]: 'Image Optimization',
  [UIIssueCategory.CODE_SPLITTING]: 'Code Splitting',
  [UIIssueCategory.CODE_QUALITY]: 'Code Quality',
  [UIIssueCategory.STATE_MANAGEMENT]: 'State Management',
  [UIIssueCategory.PROP_DRILLING]: 'Prop Drilling',
  [UIIssueCategory.MEMORY_LEAK]: 'Memory Leak',
  [UIIssueCategory.ERROR_HANDLING]: 'Error Handling',
  [UIIssueCategory.BEST_PRACTICES]: 'Best Practices',
  [UIIssueCategory.SEMANTIC_HTML]: 'Semantic HTML',
  [UIIssueCategory.ACCESSIBLE_NAME]: 'Accessible Name',
  [UIIssueCategory.EVENT_HANDLER]: 'Event Handler',
  [UIIssueCategory.FORM_VALIDATION]: 'Form Validation',
  [UIIssueCategory.SECURITY]: 'Security',
  [UIIssueCategory.XSS]: 'XSS Vulnerability',
  [UIIssueCategory.SENSITIVE_DATA]: 'Sensitive Data Exposure',
  [UIIssueCategory.OTHER]: 'Other',
};

/**
 * Analysis type descriptions
 */
export const ANALYSIS_TYPE_DESCRIPTIONS: Record<UIAnalysisType, string> = {
  [UIAnalysisType.COMPREHENSIVE]: 'Full analysis covering accessibility, responsiveness, design consistency, performance, code quality, and best practices',
  [UIAnalysisType.ACCESSIBILITY]: 'Focused analysis on WCAG compliance, ARIA usage, keyboard navigation, color contrast, and screen reader compatibility',
  [UIAnalysisType.RESPONSIVENESS]: 'Focused analysis on responsive design, breakpoint handling, layout adaptation, and mobile-first approach',
  [UIAnalysisType.DESIGN_CONSISTENCY]: 'Focused analysis on typography, spacing, color usage, and visual hierarchy consistency',
  [UIAnalysisType.PERFORMANCE]: 'Focused analysis on render optimization, memo usage, lazy loading, and bundle size considerations',
  [UIAnalysisType.CODE_QUALITY]: 'Focused analysis on component structure, state management, prop handling, and error boundaries',
  [UIAnalysisType.BEST_PRACTICES]: 'Focused analysis on semantic HTML, proper event handling, form validation, and security considerations',
  [UIAnalysisType.QUICK]: 'Quick scan for critical and high severity issues that need immediate attention',
};

/**
 * WCAG guidelines by level
 */
export const WCAG_GUIDELINES = {
  '1.1.1': { name: 'Non-text Content', level: 'A', description: 'All non-text content has text alternative' },
  '1.3.1': { name: 'Info and Relationships', level: 'A', description: 'Information and relationships conveyed programmatically' },
  '1.3.2': { name: 'Meaningful Sequence', level: 'A', description: 'Reading order is correct' },
  '1.4.1': { name: 'Use of Color', level: 'A', description: 'Color is not only means of conveying information' },
  '1.4.3': { name: 'Contrast (Minimum)', level: 'AA', description: 'Text has 4.5:1 contrast ratio' },
  '1.4.4': { name: 'Resize Text', level: 'AA', description: 'Text can resize to 200%' },
  '1.4.10': { name: 'Reflow', level: 'AA', description: 'Content reflows without horizontal scrolling' },
  '1.4.11': { name: 'Non-text Contrast', level: 'AA', description: 'UI components have 3:1 contrast' },
  '2.1.1': { name: 'Keyboard', level: 'A', description: 'All functionality available from keyboard' },
  '2.1.2': { name: 'No Keyboard Trap', level: 'A', description: 'Keyboard focus can be moved away' },
  '2.4.1': { name: 'Bypass Blocks', level: 'A', description: 'Skip navigation links provided' },
  '2.4.2': { name: 'Page Titled', level: 'A', description: 'Pages have descriptive titles' },
  '2.4.3': { name: 'Focus Order', level: 'A', description: 'Focus order is logical' },
  '2.4.4': { name: 'Link Purpose', level: 'A', description: 'Link purpose is clear' },
  '2.4.6': { name: 'Headings and Labels', level: 'AA', description: 'Headings and labels describe topic/purpose' },
  '2.4.7': { name: 'Focus Visible', level: 'AA', description: 'Keyboard focus indicator is visible' },
  '2.5.3': { name: 'Label in Name', level: 'A', description: 'Accessible name matches visible label' },
  '3.1.1': { name: 'Language of Page', level: 'A', description: 'Page language is identified' },
  '3.2.1': { name: 'On Focus', level: 'A', description: 'No context changes on focus' },
  '3.2.2': { name: 'On Input', level: 'A', description: 'No context changes on input' },
  '3.3.1': { name: 'Error Identification', level: 'A', description: 'Errors are identified' },
  '3.3.2': { name: 'Labels or Instructions', level: 'A', description: 'Labels or instructions provided' },
  '4.1.1': { name: 'Parsing', level: 'A', description: 'No duplicate IDs, proper nesting' },
  '4.1.2': { name: 'Name, Role, Value', level: 'A', description: 'Components have proper ARIA attributes' },
};

/**
 * Common accessibility issues by framework
 */
export const ACCESSIBILITY_PATTERNS: Record<FrameworkType, {
  commonIssues: string[];
  patterns: Partial<Record<UIIssueCategory, string[]>>;
}> = {
  react: {
    commonIssues: [
      'missing alt text on images',
      'incorrect ARIA attributes',
      'missing form labels',
      'missing keyboard navigation',
      'missing focus management',
    ],
    patterns: {
      [UIIssueCategory.ARIA_USAGE]: [
        'aria-',
        'role="',
        'aria-label',
        'aria-describedby',
      ],
      [UIIssueCategory.KEYBOARD_NAVIGATION]: [
        'onKeyDown',
        'onKeyUp',
        'tabIndex',
        'role="button"',
      ],
      [UIIssueCategory.FOCUS_MANAGEMENT]: [
        'useRef',
        'focus()',
        'autofocus',
      ],
    },
  },
  vue: {
    commonIssues: [
      'missing v-model labels',
      'missing .lazy modifier',
      'incorrect slot usage',
    ],
    patterns: {
      [UIIssueCategory.ARIA_USAGE]: [
        'aria-',
        'v-bind:aria',
        ':aria-label',
      ],
      [UIIssueCategory.KEYBOARD_NAVIGATION]: [
        '@keydown',
        'tabindex',
        '@keyup.enter',
      ],
    },
  },
  svelte: {
    commonIssues: [
      'missing alt text',
      'missing keyboard handlers',
    ],
    patterns: {
      [UIIssueCategory.ARIA_USAGE]: [
        'aria-',
      ],
    },
  },
  angular: {
    commonIssues: [
      'missing ARIA directives',
      'incorrect form validation',
      'missing router focus',
    ],
    patterns: {
      [UIIssueCategory.ARIA_USAGE]: [
        'aria-',
        'cdkA11y',
      ],
    },
  },
  vanilla: {
    commonIssues: [
      'missing semantic HTML',
      'missing alt text',
      'missing keyboard navigation',
    ],
    patterns: {},
  },
  nextjs: {
    commonIssues: [
      'missing Image alt',
      'missing Link focus styles',
    ],
    patterns: {
      [UIIssueCategory.IMAGE_OPTIMIZATION]: [
        'next/image',
        'priority',
        'placeholder',
      ],
    },
  },
  nuxt: {
    commonIssues: [
      'missing NuxtImg alt',
    ],
    patterns: {
      [UIIssueCategory.IMAGE_OPTIMIZATION]: [
        'NuxtImg',
      ],
    },
  },
};

/**
 * Responsive breakpoints
 */
export const DEFAULT_BREAKPOINTS = {
  mobile: '320px',
  tablet: '768px',
  laptop: '1024px',
  desktop: '1280px',
  wide: '1536px',
};

// ============================================
// Prompt Generation Functions
// ============================================

/**
 * Generate comprehensive UI analysis prompt
 */
export function generateUIAnalysisUserPrompt(
  input: UIAnalysisInput
): string {
  const { code, fileName, config, context, designReference, designTokens, propsInterface, stateManagement, userFlows } = input;
  const {
    analysisType = UIAnalysisType.COMPREHENSIVE,
    focusCategories,
    frameworks = ['react'],
    uiLibrary = 'none',
    minSeverity = UIIssueSeverity.INFO,
    includeSnippets = true,
    maxIssues = 50,
    wcagLevel = 'aa',
    breakpoints = ['320px', '768px', '1024px', '1280px'],
    includePerformance = true,
    includeAccessibility = true,
  } = config || {};

  let prompt = `## UI Analysis Request

### Code to Analyze
`;

  prompt += `\`\`\`tsx
${code}
\`\`\`
`;

  // Add file information
  if (fileName) {
    prompt += `
### File Information
- **File Name**: ${fileName}
`;
  }

  // Add context
  if (context) {
    prompt += `
### Context
${context}
`;
  }

  // Add design reference
  if (designReference) {
    prompt += `
### Design Reference
${designReference}
`;
  }

  // Add design tokens
  if (designTokens) {
    prompt += `
### Design Tokens
\`\`\`json
${JSON.stringify(designTokens, null, 2)}
\`\`\`
`;
  }

  // Add props interface
  if (propsInterface) {
    prompt += `
### Component Props Interface
\`\`\`typescript
${propsInterface}
\`\`\`
`;
  }

  // Add state management
  if (stateManagement) {
    prompt += `
### State Management
${stateManagement}
`;
  }

  // Add user flows
  if (userFlows && userFlows.length > 0) {
    prompt += `
### User Flows to Consider
${userFlows.map((flow, i) => `${i + 1}. ${flow}`).join('\n')}
`;
  }

  // Add analysis configuration
  prompt += `
### Analysis Configuration
- **Analysis Type**: ${analysisType} - ${ANALYSIS_TYPE_DESCRIPTIONS[analysisType]}
- **Target Frameworks**: ${frameworks.join(', ')}
- **UI Library**: ${uiLibrary}
- **Minimum Severity**: ${minSeverity}
- **WCAG Level**: ${wcagLevel.toUpperCase()}
- **Breakpoints**: ${breakpoints.join(', ')}
- **Include Performance**: ${includePerformance}
- **Include Accessibility**: ${includeAccessibility}
`;

  // Add focus categories if specified
  if (focusCategories && focusCategories.length > 0) {
    prompt += `
### Focus Categories
${focusCategories.map(cat => `- ${CATEGORY_DISPLAY_NAMES[cat]}`).join('\n')}
`;
  }

  // Add analysis instructions
  prompt += `

## Analysis Instructions

Please analyze the UI code and provide a comprehensive report with the following:

### 1. Accessibility Analysis
- WCAG ${wcagLevel.toUpperCase()} compliance
- ARIA attributes usage
- Keyboard navigation support
- Color contrast ratios
- Screen reader compatibility
- Focus management

### 2. Responsiveness Analysis
- Breakpoint handling
- Mobile-first approach
- Layout adaptation
- Touch target sizes

### 3. Design Consistency
- Typography consistency
- Spacing patterns
- Color usage
- Visual hierarchy

### 4. Performance Analysis
- Render optimization opportunities
- Memoization candidates
- Lazy loading potential
- Bundle size considerations

### 5. Code Quality
- Component structure
- State management patterns
- Prop handling
- Error handling

### 6. Best Practices
- Semantic HTML
- Proper event handling
- Form validation
- Security considerations

## Output Format

Please provide the analysis in the following JSON format:

\`\`\`json
{
  "summary": "Brief summary of findings",
  "issues": [
    {
      "id": "unique-id",
      "title": "Issue title",
      "description": "Detailed description",
      "severity": "critical|high|medium|low|info",
      "category": "accessibility|responsiveness|design_consistency|...",
      "file": "optional file path",
      "line": 123,
      "codeSnippet": "optional code snippet",
      "fix": "suggested fix",
      "wcagGuideline": "optional WCAG reference (e.g., 1.4.3)"
    }
  ],
  "statistics": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "info": 0
  },
  "accessibilityScore": 85,
  "responsivenessScore": 90,
  "performanceScore": 80,
  "overallScore": 85,
  "recommendations": ["recommendation 1", "recommendation 2"],
  "positiveFindings": ["good practice 1", "good practice 2"]
}
\`\`\`

Only include issues with severity >= ${minSeverity}. Maximum ${maxIssues} issues.
`;

  return prompt;
}

/**
 * Generate accessibility-focused analysis prompt
 */
export function generateAccessibilityAnalysisPrompt(input: UIAnalysisInput): string {
  const config: UIAnalysisConfig = {
    ...input.config,
    analysisType: UIAnalysisType.ACCESSIBILITY,
    includeAccessibility: true,
  };
  
  return generateUIAnalysisUserPrompt({
    ...input,
    config,
  });
}

/**
 * Generate responsiveness-focused analysis prompt
 */
export function generateResponsivenessAnalysisPrompt(input: UIAnalysisInput): string {
  const config: UIAnalysisConfig = {
    ...input.config,
    analysisType: UIAnalysisType.RESPONSIVENESS,
  };
  
  return generateUIAnalysisUserPrompt({
    ...input,
    config,
  });
}

/**
 * Generate performance-focused analysis prompt
 */
export function generatePerformanceAnalysisPrompt(input: UIAnalysisInput): string {
  const config: UIAnalysisConfig = {
    ...input.config,
    analysisType: UIAnalysisType.PERFORMANCE,
    includePerformance: true,
  };
  
  return generateUIAnalysisUserPrompt({
    ...input,
    config,
  });
}

/**
 * Generate quick scan analysis prompt
 */
export function generateQuickScanPrompt(input: UIAnalysisInput): string {
  const config: UIAnalysisConfig = {
    ...input.config,
    analysisType: UIAnalysisType.QUICK,
    minSeverity: UIIssueSeverity.HIGH,
    maxIssues: 20,
  };
  
  return generateUIAnalysisUserPrompt({
    ...input,
    config,
  });
}

/**
 * Compose UI analysis prompt based on configuration
 */
export function composeUIAnalysisPrompt(input: UIAnalysisInput): string {
  const { config } = input;
  const analysisType = config?.analysisType || UIAnalysisType.COMPREHENSIVE;

  switch (analysisType) {
    case UIAnalysisType.ACCESSIBILITY:
      return generateAccessibilityAnalysisPrompt(input);
    case UIAnalysisType.RESPONSIVENESS:
      return generateResponsivenessAnalysisPrompt(input);
    case UIAnalysisType.PERFORMANCE:
      return generatePerformanceAnalysisPrompt(input);
    case UIAnalysisType.QUICK:
      return generateQuickScanPrompt(input);
    default:
      return generateUIAnalysisUserPrompt(input);
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate unique issue ID
 */
export function generateUIIssueId(): string {
  return `ui-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse UI analysis response
 */
export function parseUIAnalysisResponse(content: string): UIAnalysisResult | null {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : content;
    
    const parsed = JSON.parse(jsonContent);
    
    return {
      totalIssues: parsed.issues?.length || 0,
      summary: parsed.summary || 'No summary provided',
      issues: parsed.issues || [],
      statistics: parsed.statistics || {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
      categoryStatistics: parsed.categoryStatistics || {} as Record<UIIssueCategory, number>,
      accessibilityScore: parsed.accessibilityScore || 0,
      responsivenessScore: parsed.responsivenessScore || 0,
      performanceScore: parsed.performanceScore || 0,
      overallScore: parsed.overallScore || 0,
      recommendations: parsed.recommendations || [],
      positiveFindings: parsed.positiveFindings || [],
    };
  } catch (error) {
    safeError('Failed to parse UI analysis response:', error);
    return null;
  }
}

/**
 * Filter issues by severity
 */
export function filterBySeverity(
  issues: UIIssue[],
  minSeverity: UIIssueSeverity
): UIIssue[] {
  const minLevel = SEVERITY_LEVELS[minSeverity];
  return issues.filter(issue => SEVERITY_LEVELS[issue.severity] >= minLevel);
}

/**
 * Filter issues by category
 */
export function filterByCategory(
  issues: UIIssue[],
  categories: UIIssueCategory[]
): UIIssue[] {
  return issues.filter(issue => categories.includes(issue.category));
}

/**
 * Sort issues by severity
 */
export function sortIssuesBySeverity(issues: UIIssue[]): UIIssue[] {
  return [...issues].sort((a, b) => 
    SEVERITY_LEVELS[b.severity] - SEVERITY_LEVELS[a.severity]
  );
}

/**
 * Group issues by category
 */
export function groupIssuesByCategory(issues: UIIssue[]): Record<UIIssueCategory, UIIssue[]> {
  return issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<UIIssueCategory, UIIssue[]>);
}

/**
 * Group issues by file
 */
export function groupIssuesByFile(issues: UIIssue[]): Record<string, UIIssue[]> {
  return issues.reduce((acc, issue) => {
    const file = issue.file || 'unknown';
    if (!acc[file]) {
      acc[file] = [];
    }
    acc[file].push(issue);
    return acc;
  }, {} as Record<string, UIIssue[]>);
}

/**
 * Calculate summary statistics
 */
export function calculateAnalysisSummary(result: UIAnalysisResult): {
  total: number;
  bySeverity: Record<UIIssueSeverity, number>;
  byCategory: Record<UIIssueCategory, number>;
  criticalIssues: UIIssue[];
  highPriorityIssues: UIIssue[];
} {
  const bySeverity: Record<UIIssueSeverity, number> = {
    [UIIssueSeverity.CRITICAL]: 0,
    [UIIssueSeverity.HIGH]: 0,
    [UIIssueSeverity.MEDIUM]: 0,
    [UIIssueSeverity.LOW]: 0,
    [UIIssueSeverity.INFO]: 0,
  };

  result.issues.forEach(issue => {
    bySeverity[issue.severity]++;
  });

  return {
    total: result.totalIssues,
    bySeverity,
    byCategory: result.categoryStatistics,
    criticalIssues: result.issues.filter(i => i.severity === UIIssueSeverity.CRITICAL),
    highPriorityIssues: result.issues.filter(i => 
      i.severity === UIIssueSeverity.CRITICAL || i.severity === UIIssueSeverity.HIGH
    ),
  };
}

/**
 * Generate markdown report from analysis result
 */
export function generateUIMarkdownReport(result: UIAnalysisResult): string {
  const summary = calculateAnalysisSummary(result);
  
  let report = `# UI Analysis Report

## Summary
${result.summary}

## Scores
| Category | Score |
|----------|-------|
| Overall | ${result.overallScore}/100 |
| Accessibility | ${result.accessibilityScore}/100 |
| Responsiveness | ${result.responsivenessScore}/100 |
| Performance | ${result.performanceScore}/100 |

## Statistics
- **Critical**: ${summary.bySeverity[UIIssueSeverity.CRITICAL]}
- **High**: ${summary.bySeverity[UIIssueSeverity.HIGH]}
- **Medium**: ${summary.bySeverity[UIIssueSeverity.MEDIUM]}
- **Low**: ${summary.bySeverity[UIIssueSeverity.LOW]}
- **Info**: ${summary.bySeverity[UIIssueSeverity.INFO]}

## Issues

`;

  if (result.issues.length === 0) {
    report += '*No issues found.*\n';
  } else {
    const sortedIssues = sortIssuesBySeverity(result.issues);
    
    for (const issue of sortedIssues) {
      report += `### ${issue.title} \`${issue.severity}\`
      
**Category**: ${CATEGORY_DISPLAY_NAMES[issue.category]}

${issue.description}

`;
      if (issue.codeSnippet) {
        report += `\`\`\`tsx
${issue.codeSnippet}
\`\`\`

`;
      }
      if (issue.fix) {
        report += `**Suggested Fix**: ${issue.fix}

`;
      }
      if (issue.wcagGuideline) {
        const guideline = WCAG_GUIDELINES[issue.wcagGuideline as keyof typeof WCAG_GUIDELINES];
        if (guideline) {
          report += `**WCAG**: [${issue.wcagGuideline}] ${guideline.name} (Level ${guideline.level})

`;
        }
      }
      report += '---\n\n';
    }
  }

  if (result.positiveFindings && result.positiveFindings.length > 0) {
    report += `## Positive Findings

${result.positiveFindings.map(f => `- ${f}`).join('\n')}

`;
  }

  if (result.recommendations && result.recommendations.length > 0) {
    report += `## Recommendations

${result.recommendations.map(r => `- ${r}`).join('\n')}

`;
  }

  return report;
}

/**
 * Get WCAG guideline by code
 */
export function getWCAGGuideline(code: string): {
  name: string;
  level: string;
  description: string;
} | null {
  return WCAG_GUIDELINES[code as keyof typeof WCAG_GUIDELINES] || null;
}

/**
 * Check if issue meets WCAG level
 */
export function meetsWCAGLevel(issue: UIIssue, level: 'a' | 'aa' | 'aaa'): boolean {
  if (!issue.wcagGuideline) return true;
  
  const guideline = getWCAGGuideline(issue.wcagGuideline);
  if (!guideline) return true;
  
  const levels = { a: 1, aa: 2, aaa: 3 };
  return levels[guideline.level as 'a' | 'aa' | 'aaa'] <= levels[level];
}
