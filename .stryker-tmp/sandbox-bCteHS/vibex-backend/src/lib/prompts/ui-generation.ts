/**
 * UI Generation Prompt Templates
 * 
 * This module contains prompt templates for generating UI components,
 * layouts, and responsive designs based on user requirements.
 */
// @ts-nocheck


/**
 * UI Generation Input Schema
 */
export interface UIGenerationInput {
  /** User's natural language description of the desired UI */
  description: string;
  /** Target framework (react, vue, svelte, etc.) */
  framework?: 'react' | 'vue' | 'svelte' | 'vanilla';
  /** UI library preference */
  uiLibrary?: 'shadcn' | 'tailwind' | 'mui' | 'antd' | 'none';
  /** Target platforms for responsive design */
  platforms?: ('mobile' | 'tablet' | 'desktop')[];
  /** Color scheme preference */
  colorScheme?: 'light' | 'dark' | 'auto' | 'custom';
  /** Custom color palette (if custom scheme) */
  customColors?: Record<string, string>;
  /** Design style preference */
  style?: 'modern' | 'classic' | 'minimal' | 'corporate' | 'playful';
  /** Accessibility requirements */
  accessibility?: 'basic' | 'wcag-aa' | 'wcag-aaa';
  /** Existing component library to extend */
  existingComponents?: string[];
}

/**
 * Component metadata for selection guidance
 */
export interface ComponentMeta {
  name: string;
  category: 'layout' | 'navigation' | 'data-display' | 'forms' | 'feedback' | 'data-entry';
  description: string;
  requiredProps?: string[];
  optionalProps?: string[];
  responsive?: boolean;
}

/**
 * Predefined component library for selection
 */
export const COMPONENT_LIBRARY: ComponentMeta[] = [
  // Layout
  { name: 'Container', category: 'layout', description: 'Main content wrapper with max-width', responsive: true },
  { name: 'Grid', category: 'layout', description: 'CSS Grid layout system', responsive: true },
  { name: 'Flex', category: 'layout', description: 'Flexbox layout container', responsive: true },
  { name: 'Stack', category: 'layout', description: 'Vertical or horizontal stacking', responsive: true },
  { name: 'SplitView', category: 'layout', description: 'Two-panel split layout', responsive: true },
  { name: 'Card', category: 'layout', description: 'Content container with shadow/border', responsive: true },
  
  // Navigation
  { name: 'Navbar', category: 'navigation', description: 'Top navigation bar', responsive: true },
  { name: 'Sidebar', category: 'navigation', description: 'Side navigation menu', responsive: true },
  { name: 'Tabs', category: 'navigation', description: 'Tabbed navigation', responsive: false },
  { name: 'Breadcrumb', category: 'navigation', description: 'Navigation breadcrumb trail', responsive: false },
  { name: 'Pagination', category: 'navigation', description: 'Page navigation controls', responsive: false },
  
  // Data Display
  { name: 'Table', category: 'data-display', description: 'Tabular data display', responsive: true },
  { name: 'List', category: 'data-display', description: 'Vertical list of items', responsive: true },
  { name: 'Tree', category: 'data-display', description: 'Hierarchical tree view', responsive: false },
  { name: 'Timeline', category: 'data-display', description: 'Chronological event display', responsive: false },
  { name: 'Statistic', category: 'data-display', description: 'Numerical data with label', responsive: false },
  
  // Forms
  { name: 'Input', category: 'forms', description: 'Text input field', responsive: true },
  { name: 'Select', category: 'forms', description: 'Dropdown selection', responsive: true },
  { name: 'Checkbox', category: 'forms', description: 'Boolean checkbox', responsive: false },
  { name: 'Radio', category: 'forms', description: 'Radio button group', responsive: false },
  { name: 'Switch', category: 'forms', description: 'Toggle switch', responsive: false },
  { name: 'DatePicker', category: 'forms', description: 'Date selection input', responsive: true },
  { name: 'Upload', category: 'forms', description: 'File upload component', responsive: true },
  { name: 'Form', category: 'forms', description: 'Form container with validation', responsive: true },
  
  // Feedback
  { name: 'Alert', category: 'feedback', description: 'Notification message', responsive: false },
  { name: 'Toast', category: 'feedback', description: 'Transient notification', responsive: false },
  { name: 'Modal', category: 'feedback', description: 'Dialog overlay', responsive: true },
  { name: 'Drawer', category: 'feedback', description: 'Slide-out panel', responsive: true },
  { name: 'Skeleton', category: 'feedback', description: 'Loading placeholder', responsive: true },
  { name: 'Progress', category: 'feedback', description: 'Progress indicator', responsive: false },
  { name: 'Spin', category: 'feedback', description: 'Loading spinner', responsive: false },
  
  // Data Entry
  { name: 'Button', category: 'data-entry', description: 'Clickable action button', responsive: false },
  { name: 'Link', category: 'data-entry', description: 'Hyperlink', responsive: false },
  { name: 'IconButton', category: 'data-entry', description: 'Icon-only button', responsive: false },
  { name: 'Dropdown', category: 'data-entry', description: 'Menu dropdown', responsive: false },
  { name: 'Tag', category: 'data-entry', description: 'Label tag', responsive: false },
  { name: 'Badge', category: 'data-entry', description: 'Status badge', responsive: false },
];

/**
 * Layout patterns for common UI scenarios
 */
export const LAYOUT_PATTERNS = {
  dashboard: {
    name: 'Dashboard Layout',
    description: 'Sidebar + header + main content area',
    components: ['Sidebar', 'Navbar', 'Container', 'Grid'],
  },
  landing: {
    name: 'Landing Page',
    description: 'Hero + features + CTA sections',
    components: ['Container', 'SplitView', 'Card', 'Button'],
  },
  list: {
    name: 'List View',
    description: 'Header + filterable list + pagination',
    components: ['Navbar', 'Input', 'List', 'Pagination', 'Select'],
  },
  detail: {
    name: 'Detail View',
    description: 'Header + content + sidebar actions',
    components: ['Navbar', 'Card', 'SplitView', 'Button'],
  },
  form: {
    name: 'Form Page',
    description: 'Form fields + validation + submit',
    components: ['Container', 'Form', 'Input', 'Button', 'Alert'],
  },
  settings: {
    name: 'Settings Panel',
    description: 'Sidebar navigation + settings content',
    components: ['Sidebar', 'Container', 'Card', 'Switch', 'Input'],
  },
};

/**
 * Responsive breakpoints configuration
 */
export const BREAKPOINTS = {
  mobile: { min: 0, max: 767, default: 375 },
  tablet: { min: 768, max: 1023, default: 768 },
  desktop: { min: 1024, max: Infinity, default: 1280 },
};

/**
 * Generate the main UI generation prompt
 */
export function generateUIPrompt(input: UIGenerationInput): string {
  const {
    description,
    framework = 'react',
    uiLibrary = 'tailwind',
    platforms = ['desktop', 'tablet', 'mobile'],
    colorScheme = 'light',
    style = 'modern',
    accessibility = 'wcag-aa',
  } = input;

  return `## UI Generation Request

### User Requirements
${description}

### Technical Constraints
- **Framework**: ${framework}
- **UI Library**: ${uiLibrary}
- **Target Platforms**: ${platforms.join(', ')}
- **Color Scheme**: ${colorScheme}
- **Design Style**: ${style}
- **Accessibility Level**: ${accessibility}

### Available Components
${COMPONENT_LIBRARY.map(c => `- **${c.name}** (${c.category}): ${c.description}`).join('\n')}

### Layout Patterns
${Object.entries(LAYOUT_PATTERNS).map(([key, pattern]) => 
  `- **${pattern.name}** (${key}): ${pattern.description}`
).join('\n')}

### Responsive Breakpoints
- Mobile: ${BREAKPOINTS.mobile.min}px - ${BREAKPOINTS.mobile.max}px
- Tablet: ${BREAKPOINTS.tablet.min}px - ${BREAKPOINTS.tablet.max}px
- Desktop: ${BREAKPOINTS.desktop.min}px+

---

## Generation Guidelines

### 1. Component Selection
Select appropriate components based on the user description. Consider:
- Functional requirements (what the UI should do)
- User interaction patterns
- Data flow and state management
- Reusability and composition

### 2. Layout Design
Design the layout considering:
- Visual hierarchy and information architecture
- Consistent spacing (use 4px/8px grid system)
- Proper alignment and grouping
- Efficient use of available space per breakpoint

### 3. Styling Guidelines
Apply styles based on the selected design style:
- **Modern**: Clean lines, generous whitespace, subtle shadows, rounded corners
- **Classic**: Traditional elements, defined borders, familiar patterns
- **Minimal**: Maximum simplicity, essential elements only, monochrome倾向
- **Corporate**: Professional, trustworthy, balanced, blue/gray tones
- **Playful**: Bright colors, animations, friendly shapes, personality

### 4. Responsive Behavior
For each breakpoint:
- Mobile: Stack vertically, simplify navigation, touch-friendly targets (min 44px)
- Tablet: Adaptive layout, balanced whitespace
- Desktop: Full feature display, optimal information density

### 5. Accessibility Requirements
- WCAG ${accessibility} compliance
- Proper ARIA labels where needed
- Keyboard navigation support
- Sufficient color contrast ratios
- Focus indicators

---

## Output Format

Provide the generated UI as:
1. **Component Structure**: Tree of components with props
2. **Layout Specification**: Grid/flex layout rules per breakpoint
3. **Styling Rules**: CSS/Tailwind classes with responsive variants
4. **Code**: Complete, runnable ${framework} code using ${uiLibrary}`;
}

/**
 * Generate a component-specific prompt
 */
export function generateComponentPrompt(
  componentName: string,
  props: Record<string, unknown>,
  context?: {
    framework?: string;
    uiLibrary?: string;
    parentComponent?: string;
  }
): string {
  const framework = context?.framework || 'react';
  const uiLibrary = context?.uiLibrary || 'tailwind';

  const component = COMPONENT_LIBRARY.find(c => c.name === componentName);

  return `## Component Generation: ${componentName}

### Component Info
- **Category**: ${component?.category || 'unknown'}
- **Description**: ${component?.description || 'Custom component'}

### Required Props
${component?.requiredProps?.map(p => `- \`${p}\``).join('\n') || 'None specified'}

### Provided Props
${Object.entries(props).map(([key, value]) => `- \`${key}\`: ${JSON.stringify(value)}`).join('\n')}

### Context
- Framework: ${framework}
- UI Library: ${uiLibrary}
- Parent: ${context?.parentComponent || 'None (root)'}

---

Generate the ${componentName} component with:
1. Proper TypeScript types
2. Responsive behavior
3. Accessibility attributes
4. Error handling
5. Loading states if applicable`;
}

/**
 * Generate a responsive layout prompt
 */
export function generateLayoutPrompt(
  layoutType: keyof typeof LAYOUT_PATTERNS,
  options?: {
    sidebarCollapsible?: boolean;
    headerSticky?: boolean;
    contentFullWidth?: boolean;
  }
): string {
  const pattern = LAYOUT_PATTERNS[layoutType];

  return `## Layout Generation: ${pattern.name}

### Layout Type
${pattern.description}

### Components Required
${pattern.components.join(', ')}

### Options
${Object.entries(options || {}).map(([key, value]) => `- **${key}**: ${value}`).join('\n') || 'None'}

---

Generate a responsive ${layoutType} layout that:
1. Adapts gracefully across all breakpoints
2. Maintains consistent visual rhythm
3. Provides proper spacing and alignment
4. Includes smooth transitions between states
5. Follows ${pattern.name} best practices`;
}

export default {
  COMPONENT_LIBRARY,
  LAYOUT_PATTERNS,
  BREAKPOINTS,
  generateUIPrompt,
  generateComponentPrompt,
  generateLayoutPrompt,
};
