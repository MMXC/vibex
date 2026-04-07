/**
 * UI Refinement Prompt Templates
 * 
 * This module contains prompt templates for refining and improving
 * existing UI components, including visual enhancements, accessibility
 * improvements, performance optimization, and UX refinements.
 */
// @ts-nocheck


/**
 * UI Refinement Input Schema
 */
export interface UIRefinementInput {
  /** Current UI code or description */
  currentUI: string;
  /** Type of refinement requested */
  refinementType: 'visual' | 'accessibility' | 'performance' | 'responsive' | 'ux' | 'comprehensive';
  /** Specific issues or areas to improve */
  issues?: string[];
  /** Target framework */
  framework?: 'react' | 'vue' | 'svelte' | 'vanilla';
  /** UI library used */
  uiLibrary?: 'shadcn' | 'tailwind' | 'mui' | 'antd' | 'none';
  /** Design constraints or requirements */
  constraints?: {
    /** Color scheme to maintain */
    colorScheme?: 'light' | 'dark' | 'auto';
    /** Design style to follow */
    style?: 'modern' | 'classic' | 'minimal' | 'corporate' | 'playful';
    /** Accessibility level target */
    accessibility?: 'basic' | 'wcag-a' | 'wcag-aa' | 'wcag-aaa';
    /** Performance budget */
    performance?: 'fast' | 'balanced' | 'rich';
  };
  /** User feedback or requirements */
  userFeedback?: string;
  /** Competitive analysis or reference designs */
  references?: string[];
  /** Priority areas for improvement */
  priorities?: string[];
}

/**
 * Refinement type definitions
 */
export const REFINEMENT_TYPES = {
  visual: {
    name: 'Visual Refinement',
    description: 'Improve visual aesthetics, spacing, typography, and visual hierarchy',
    focusAreas: [
      'Color contrast and harmony',
      'Typography scale and readability',
      'Spacing and padding consistency',
      'Shadow and depth effects',
      'Border radius and rounded corners',
      'Visual hierarchy and grouping',
      'Animation and transitions',
      'Iconography and imagery',
    ],
  },
  accessibility: {
    name: 'Accessibility Improvement',
    description: 'Enhance accessibility for users with disabilities',
    focusAreas: [
      'WCAG compliance (Level A/AA/AAA)',
      'Keyboard navigation',
      'Screen reader support',
      'Focus management',
      'Color contrast ratios',
      'ARIA labels and roles',
      'Skip links and landmarks',
      'Error identification and announcements',
    ],
  },
  performance: {
    name: 'Performance Optimization',
    description: 'Improve rendering performance and load times',
    focusAreas: [
      'Component lazy loading',
      'Memoization strategies',
      'Image optimization',
      'CSS containment',
      'Virtual scrolling for lists',
      'Debouncing and throttling',
      'Code splitting',
      'Bundle size reduction',
    ],
  },
  responsive: {
    name: 'Responsive Design Refinement',
    description: 'Improve responsive behavior across all breakpoints',
    focusAreas: [
      'Mobile-first approach',
      'Touch target sizing',
      'Breakpoint optimization',
      'Fluid typography',
      'Adaptive layouts',
      'Orientation handling',
      'Viewport meta tags',
      'Print styles if applicable',
    ],
  },
  ux: {
    name: 'User Experience Enhancement',
    description: 'Improve overall user experience and interaction patterns',
    focusAreas: [
      'User feedback and loading states',
      'Error handling and recovery',
      'Form validation and feedback',
      'Navigation patterns',
      'Content discoverability',
      'Task efficiency',
      'Consistency across components',
      'Micro-interactions',
    ],
  },
  comprehensive: {
    name: 'Comprehensive UI Refinement',
    description: 'Full UI improvement across all aspects',
    focusAreas: [
      'All visual improvements',
      'Full accessibility audit and fixes',
      'Performance optimization',
      'Responsive behavior across devices',
      'UX best practices',
      'Code quality and maintainability',
      'Consistency with design system',
      'Edge case handling',
    ],
  },
} as const;

/**
 * Common UI issues for quick reference
 */
export const COMMON_ISSUES = {
  spacing: {
    id: 'spacing',
    name: 'Inconsistent Spacing',
    description: 'Padding/margin values are not consistent',
    suggestion: 'Use a consistent spacing scale (e.g., 4px base: 4, 8, 12, 16, 24, 32, 48, 64)',
  },
  contrast: {
    id: 'contrast',
    name: 'Low Color Contrast',
    description: 'Text or UI elements have insufficient contrast',
    suggestion: 'Ensure 4.5:1 for normal text, 3:1 for large text (WCAG AA)',
  },
  touch_targets: {
    id: 'touch_targets',
    name: 'Small Touch Targets',
    description: 'Interactive elements too small for touch',
    suggestion: 'Minimum 44x44px for touch targets (WCAG), 48px recommended',
  },
  focus_states: {
    id: 'focus_states',
    name: 'Missing Focus States',
    description: 'No visible focus indicators for keyboard navigation',
    suggestion: 'Add visible focus outlines (2px solid, high contrast, offset 2px)',
  },
  loading_states: {
    id: 'loading_states',
    name: 'Missing Loading States',
    description: 'No feedback during async operations',
    suggestion: 'Add skeleton loaders, spinners, or progress indicators',
  },
  error_handling: {
    id: 'error_handling',
    name: 'Poor Error Handling',
    description: 'Errors not clearly communicated to users',
    suggestion: 'Use clear error messages, inline validation, and error summaries',
  },
  responsiveness: {
    id: 'responsiveness',
    name: 'Responsive Issues',
    description: 'Layout breaks or is unusable on certain devices',
    suggestion: 'Test at all breakpoints, use fluid units, ensure horizontal scroll is avoided',
  },
  keyboard_nav: {
    id: 'keyboard_nav',
    name: 'Keyboard Navigation Issues',
    description: 'Components not accessible via keyboard',
    suggestion: 'Ensure all interactive elements are focusable and have logical tab order',
  },
  aria_labels: {
    id: 'aria_labels',
    name: 'Missing ARIA Labels',
    description: 'Components lack proper accessibility labels',
    suggestion: 'Add aria-label, aria-labelledby, or aria-describedby as appropriate',
  },
  animations: {
    id: 'animations',
    name: 'Excessive or Missing Animations',
    description: 'Animations either missing or causing motion sensitivity',
    suggestion: 'Include reduced-motion media query support, purposeful animations only',
  },
} as const;

/**
 * Design system tokens for consistency
 */
export const DESIGN_TOKENS = {
  spacing: {
    '0': '0',
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '24px',
    '6': '32px',
    '8': '48px',
    '10': '64px',
    '12': '96px',
  },
  typography: {
    'xs': '12px',
    'sm': '14px',
    'base': '16px',
    'lg': '18px',
    'xl': '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  borderRadius: {
    'none': '0',
    'sm': '2px',
    'default': '4px',
    'md': '6px',
    'lg': '8px',
    'xl': '12px',
    '2xl': '16px',
    'full': '9999px',
  },
  shadows: {
    'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'default': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },
};

/**
 * Animation presets
 */
export const ANIMATION_PRESETS = {
  fast: {
    duration: '150ms',
    easing: 'ease-out',
  },
  default: {
    duration: '200ms',
    easing: 'ease-in-out',
  },
  slow: {
    duration: '300ms',
    easing: 'ease-in-out',
  },
  bounce: {
    duration: '500ms',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

/**
 * Generate the main UI refinement prompt
 */
export function generateUIRefinementPrompt(input: UIRefinementInput): string {
  const {
    currentUI,
    refinementType,
    issues = [],
    framework = 'react',
    uiLibrary = 'tailwind',
    constraints = {},
    userFeedback,
    references = [],
    priorities = [],
  } = input;

  const refinement = REFINEMENT_TYPES[refinementType];
  const issueList = issues.length > 0 
    ? issues 
    : Object.values(COMMON_ISSUES).map(i => i.id);

  return `## UI Refinement Request

### Current UI
\`\`\`
${currentUI}
\`\`\`

### Refinement Type
- **Type**: ${refinement.name}
- **Description**: ${refinement.description}

### Focus Areas
${refinement.focusAreas.map(area => `- ${area}`).join('\n')}

### Technical Context
- **Framework**: ${framework}
- **UI Library**: ${uiLibrary}
${constraints.colorScheme ? `- **Color Scheme**: ${constraints.colorScheme}` : ''}
${constraints.style ? `- **Design Style**: ${constraints.style}` : ''}
${constraints.accessibility ? `- **Accessibility Target**: ${constraints.accessibility}` : ''}
${constraints.performance ? `- **Performance Budget**: ${constraints.performance}` : ''}

### Issues to Address
${issueList.map(id => {
  const issue = COMMON_ISSUES[id as keyof typeof COMMON_ISSUES];
  return issue ? `- **${issue.name}**: ${issue.description}\n  → ${issue.suggestion}` : `- ${id}`;
}).join('\n')}

${userFeedback ? `### User Feedback
${userFeedback}` : ''}

${references.length > 0 ? `### Reference Designs
${references.map(ref => `- ${ref}`).join('\n')}` : ''}

${priorities.length > 0 ? `### Priority Areas
${priorities.map(p => `- ${p}`).join('\n')}` : ''}

---

## Refinement Guidelines

### 1. Analyze Current Issues
- Review the provided UI code carefully
- Identify specific problems in the current implementation
- Consider accessibility, performance, and user experience implications

### 2. Apply Design System Principles
Use consistent design tokens:
- **Spacing**: ${Object.entries(DESIGN_TOKENS.spacing).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')}...
- **Typography**: ${Object.entries(DESIGN_TOKENS.typography).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')}...
- **Border Radius**: ${Object.entries(DESIGN_TOKENS.borderRadius).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')}...

### 3. Implement Improvements

For **Visual Refinement**:
- Ensure consistent spacing using the spacing scale
- Verify color contrast ratios meet WCAG AA (4.5:1 for text)
- Apply appropriate shadows and depth
- Use consistent border radius values

For **Accessibility**:
- Add proper ARIA labels and roles
- Ensure keyboard navigation works correctly
- Add visible focus states (2px solid, high contrast)
- Implement proper focus management for modals/dialogs

For **Performance**:
- Use React.memo for static components
- Implement lazy loading for heavy components
- Optimize images and assets
- Use CSS containment where appropriate

For **Responsive Design**:
- Use mobile-first approach
- Ensure touch targets are at least 44x44px
- Test at all breakpoints
- Use fluid typography and spacing

For **UX Enhancement**:
- Add loading states for async operations
- Provide clear error messages
- Add hover/focus/active states
- Implement smooth transitions

### 4. Code Quality
- Maintain component composition patterns
- Use proper TypeScript types
- Keep code DRY and maintainable
- Add comments for complex logic

---

## Output Format

Provide the refined UI with:
1. **Summary of Changes**: List of what was improved
2. **Before/After Comparison**: Key changes made
3. **Refined Code**: Complete, working ${framework} code using ${uiLibrary}
4. **Additional Recommendations**: Further improvements to consider`;
}

/**
 * Generate a focused refinement prompt for specific issues
 */
export function generateFocusedRefinementPrompt(
  currentUI: string,
  specificIssues: string[],
  options?: {
    framework?: string;
    uiLibrary?: string;
    preserveStyles?: boolean;
  }
): string {
  const framework = options?.framework || 'react';
  const uiLibrary = options?.uiLibrary || 'tailwind';

  return `## Focused UI Refinement

### Current UI
\`\`\`
${currentUI}
\`\`\`

### Specific Issues to Fix
${specificIssues.map(issue => `- ${issue}`).join('\n')}

### Constraints
- Framework: ${framework}
- UI Library: ${uiLibrary}
- Preserve existing styles: ${options?.preserveStyles !== false}

---

Please fix ONLY the specified issues while maintaining:
1. Overall layout and structure
2. Existing functionality
3. Current color scheme and typography (unless explicitly asked to change)

Provide the corrected code with brief explanations of the changes made.`;
}

/**
 * Generate accessibility audit and fix prompt
 */
export function generateAccessibilityAuditPrompt(
  currentUI: string,
  targetLevel: 'basic' | 'wcag-a' | 'wcag-aa' | 'wcag-aaa' = 'wcag-aa',
  options?: {
    framework?: string;
    uiLibrary?: string;
  }
): string {
  const framework = options?.framework || 'react';
  const uiLibrary = options?.uiLibrary || 'tailwind';

  const levelRequirements = {
    basic: ['Semantic HTML', 'Alt text for images', 'Form labels'],
    'wcag-a': ['Non-text content', 'Info and relationships', 'Meaningful sequence', 'Keyboard access'],
    'wcag-aa': ['Level A +', 'Contrast ratio 4.5:1', 'Focus visible', 'Error identification'],
    'wcag-aaa': ['Level AA +', 'Contrast ratio 7:1', 'Reading level', 'Sign language interpretation'],
  };

  return `## Accessibility Audit & Remediation

### Current UI
\`\`\`
${currentUI}
\`\`\`

### Target WCAG Level
${targetLevel.toUpperCase()}

### Requirements for ${targetLevel.toUpperCase()}
${levelRequirements[targetLevel].map(req => `- ${req}`).join('\n')}

### Framework & Library
- Framework: ${framework}
- UI Library: ${uiLibrary}

---

## Audit Checklist

Please audit the provided UI and fix all accessibility issues:

### 1. Semantic Structure
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Landmark regions (header, nav, main, footer, aside)
- [ ] Proper list structure for lists

### 2. Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Logical tab order
- [ ] Skip links for main content
- [ ] Focus trap for modals

### 3. Screen Reader Support
- [ ] ARIA labels for interactive elements
- [ ] ARIA live regions for dynamic content
- [ ] Form error announcements
- [ ] Decorative elements hidden from AT

### 4. Visual Accessibility
- [ ] Color contrast meets ${targetLevel} (4.5:1 normal, 3:1 large)
- [ ] Focus indicators visible
- [ ] Text resizable to 200%
- [ ] No information conveyed by color alone

### 5. Forms
- [ ] Labels associated with inputs
- [ ] Error messages linked to fields
- [ ] Required fields marked
- [ ] Clear instructions

---

## Output Format

1. **Audit Report**: List all issues found with severity (critical/major/minor)
2. **Fixes Applied**: Specific code changes made
3. **Remediated Code**: Complete accessible ${framework} code using ${uiLibrary}
4. **Remaining Issues**: Any issues that couldn't be fully addressed`;
}

/**
 * Generate responsive design improvement prompt
 */
export function generateResponsiveRefinementPrompt(
  currentUI: string,
  targetBreakpoints: { name: string; width: number }[] = [
    { name: 'mobile', width: 375 },
    { name: 'tablet', width: 768 },
    { name: 'desktop', width: 1280 },
  ],
  options?: {
    framework?: string;
    uiLibrary?: string;
    includeOrientation?: boolean;
  }
): string {
  const framework = options?.framework || 'react';
  const uiLibrary = options?.uiLibrary || 'tailwind';

  return `## Responsive Design Refinement

### Current UI
\`\`\`
${currentUI}
\`\`\`

### Target Breakpoints
${targetBreakpoints.map(bp => `- **${bp.name}**: ${bp.width}px`).join('\n')}

### Framework & Library
- Framework: ${framework}
- UI Library: ${uiLibrary}
${options?.includeOrientation ? '- Include orientation handling: yes' : ''}

---

## Responsive Design Guidelines

### 1. Mobile-First Approach
- Start with mobile styles as base
- Use min-width media queries for larger screens
- Progressive enhancement over graceful degradation

### 2. Layout Adaptations
- Stack vertically on mobile
- Side-by-side on tablet/desktop as appropriate
- Use appropriate containers for each breakpoint

### 3. Touch Optimization
- Minimum touch targets: 44x44px (WCAG), 48px recommended
- Adequate spacing between interactive elements (8px minimum)
- No hover-only interactions

### 4. Typography
- Use fluid typography or breakpoint-specific sizes
- Ensure readability at all sizes
- Test line length (45-75 characters ideal)

### 5. Images and Media
- Responsive images with srcset
- Appropriate sizing for each breakpoint
- Lazy loading for below-fold content

### 6. Performance
- Optimize for mobile networks
- Minimize layout shifts (CLS)
- Consider reduced motion preferences

---

## Output Format

Provide responsive code that:
1. Works flawlessly at all target breakpoints
2. Handles orientation changes gracefully
3. Maintains visual hierarchy across sizes
4. Provides optimal user experience on each device`;
}

export default {
  REFINEMENT_TYPES,
  COMMON_ISSUES,
  DESIGN_TOKENS,
  ANIMATION_PRESETS,
  generateUIRefinementPrompt,
  generateFocusedRefinementPrompt,
  generateAccessibilityAuditPrompt,
  generateResponsiveRefinementPrompt,
};
