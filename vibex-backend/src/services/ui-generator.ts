/**
 * UI Generator Service
 * 
 * A specialized service for generating UI components, layouts, and styles.
 * Integrates with the AI service to create production-ready UI code from requirements.
 * 
 * Features:
 * - Component generation from natural language descriptions
 * - Multi-framework support (React, Vue, Svelte, vanilla)
 * - UI library integration (Tailwind, shadcn, MUI, Ant Design)
 * - Responsive design generation
 * - Design token management
 * - Component variant generation
 * - Page layout generation
 * - Style system generation
 * 
 * @module services/ui-generator
 */

import { CloudflareEnv } from '../lib/env';
import {
  AIService,
  createAIService,
  AIResult,
} from './ai-service';

// ==================== Types ====================

/**
 * Supported UI frameworks
 */
export type UIFramework = 'react' | 'vue' | 'svelte' | 'vanilla' | 'angular';

/**
 * Supported UI libraries
 */
export type UILibrary = 'tailwind' | 'shadcn' | 'mui' | 'antd' | 'chakra' | 'none';

/**
 * UI design style
 */
export type UIDesignStyle = 
  | 'minimal'      // Clean, lots of whitespace
  | 'glassmorphism' // Frosted glass effect
  | 'bento'        // Grid-based card layout
  | 'gradient'     // Soft gradients
  | 'neumorphism'  // Soft UI with shadows
  | 'brutalist'    // Raw, bold, high contrast
  | 'neobrutalism' // Bold colors with black borders
  | 'corporate'    // Professional, conservative
  | 'playful';     // Fun, colorful, rounded

/**
 * Page type for UI generation
 */
export type PageType = 
  | 'landing'      // Marketing landing page
  | 'auth'         // Authentication (login, register)
  | 'dashboard'    // Dashboard with data visualization
  | 'chat'         // Chat interface
  | 'form'         // Form-heavy page
  | 'list'         // List/grid view
  | 'detail'       // Detail view
  | 'settings'     // Settings page
  | 'profile'      // User profile
  | 'checkout'     // E-commerce checkout
  | 'pricing'      // Pricing table
  | 'documentation' // Documentation page
  | 'error'        // Error pages (404, 500)
  | 'custom';      // Custom page type

/**
 * Platform target
 */
export type Platform = 'mobile' | 'tablet' | 'desktop' | 'responsive';

/**
 * Component type
 */
export type ComponentType = 
  | 'button'
  | 'input'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'card'
  | 'modal'
  | 'drawer'
  | 'dropdown'
  | 'tooltip'
  | 'popover'
  | 'tabs'
  | 'accordion'
  | 'breadcrumb'
  | 'pagination'
  | 'table'
  | 'list'
  | 'avatar'
  | 'badge'
  | 'tag'
  | 'alert'
  | 'toast'
  | 'skeleton'
  | 'spinner'
  | 'progress'
  | 'slider'
  | 'date-picker'
  | 'file-upload'
  | 'search'
  | 'navbar'
  | 'sidebar'
  | 'footer'
  | 'hero'
  | 'feature-card'
  | 'testimonial'
  | 'pricing-card'
  | 'form-group'
  | 'custom';

/**
 * UI Generation options
 */
export interface UIGeneratorOptions {
  /** Target framework */
  framework?: UIFramework;
  /** UI library to use */
  uiLibrary?: UILibrary;
  /** Design style */
  style?: UIDesignStyle;
  /** Target platforms */
  platforms?: Platform[];
  /** Page type hint */
  pageType?: PageType;
  /** Component types to generate */
  componentTypes?: ComponentType[];
  /** Use TypeScript */
  typescript?: boolean;
  /** Include tests */
  includeTests?: boolean;
  /** Include storybook stories */
  includeStories?: boolean;
  /** Include documentation */
  includeDocs?: boolean;
  /** Custom design tokens */
  designTokens?: Partial<DesignTokens>;
  /** Custom theme colors */
  themeColors?: Partial<ThemeColors>;
  /** Accessibility level target */
  accessibilityLevel?: 'A' | 'AA' | 'AAA';
  /** Enable animations */
  animations?: boolean;
  /** Animation style */
  animationStyle?: 'subtle' | 'moderate' | 'expressive';
  /** Custom prompt prefix */
  customPromptPrefix?: string;
}

/**
 * Design tokens for theming
 */
export interface DesignTokens {
  colors: ThemeColors;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  transitions: TransitionTokens;
  breakpoints: BreakpointTokens;
}

/**
 * Theme colors
 */
export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  surfaceHover: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  border: string;
  borderHover: string;
  divider: string;
}

/**
 * Spacing tokens
 */
export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

/**
 * Typography tokens
 */
export interface TypographyTokens {
  fontFamily: string;
  fontFamilyMono: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeMd: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontSize2xl: string;
  fontSize3xl: string;
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightSemibold: number;
  fontWeightBold: number;
  lineHeight: number;
  lineHeightHeading: number;
}

/**
 * Border radius tokens
 */
export interface BorderRadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * Shadow tokens
 */
export interface ShadowTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

/**
 * Transition tokens
 */
export interface TransitionTokens {
  fast: string;
  normal: string;
  slow: string;
}

/**
 * Breakpoint tokens for responsive design
 */
export interface BreakpointTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

/**
 * Component specification for generation
 */
export interface ComponentSpec {
  /** Component name */
  name: string;
  /** Component type */
  type: ComponentType;
  /** Component description */
  description?: string;
  /** Component props */
  props?: ComponentProp[];
  /** Component variants */
  variants?: ComponentVariant[];
  /** Component slots */
  slots?: ComponentSlot[];
  /** Component events */
  events?: ComponentEvent[];
  /** Accessibility requirements */
  accessibility?: AccessibilitySpec;
  /** Responsive requirements */
  responsive?: ResponsiveSpec;
}

/**
 * Component prop definition
 */
export interface ComponentProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'enum' | 'node';
  required?: boolean;
  default?: unknown;
  description?: string;
  enumValues?: string[];
}

/**
 * Component variant definition
 */
export interface ComponentVariant {
  name: string;
  description?: string;
  props: Record<string, unknown>;
}

/**
 * Component slot definition
 */
export interface ComponentSlot {
  name: string;
  description?: string;
  required?: boolean;
}

/**
 * Component event definition
 */
export interface ComponentEvent {
  name: string;
  description?: string;
  payload?: string;
}

/**
 * Accessibility specification
 */
export interface AccessibilitySpec {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaModal?: boolean;
  role?: string;
  tabIndex?: number;
  keyboardNavigable?: boolean;
  focusVisible?: boolean;
  screenReaderText?: string;
}

/**
 * Responsive specification
 */
export interface ResponsiveSpec {
  mobile?: Partial<ComponentLayout>;
  tablet?: Partial<ComponentLayout>;
  desktop?: Partial<ComponentLayout>;
}

/**
 * Component layout specification
 */
export interface ComponentLayout {
  width?: string;
  height?: string;
  padding?: string;
  margin?: string;
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
}

/**
 * Generated component result
 */
export interface GeneratedComponent {
  /** Component name */
  name: string;
  /** Component type */
  type: ComponentType;
  /** Generated code */
  code: string;
  /** CSS/styling code */
  styles?: string;
  /** TypeScript types */
  types?: string;
  /** Test code */
  tests?: string;
  /** Storybook story */
  story?: string;
  /** Documentation */
  documentation?: string;
  /** Usage example */
  usageExample?: string;
  /** Component props interface */
  propsInterface?: string;
  /** Dependencies */
  dependencies?: string[];
  /** Dev dependencies */
  devDependencies?: string[];
}

/**
 * Page generation result
 */
export interface GeneratedPage {
  /** Page name */
  name: string;
  /** Page type */
  type: PageType;
  /** Main page component */
  component: GeneratedComponent;
  /** Sub-components */
  components?: GeneratedComponent[];
  /** Layout configuration */
  layout: PageLayout;
  /** Design tokens */
  tokens?: DesignTokens;
  /** File structure */
  fileStructure?: FileStructure;
}

/**
 * Page layout configuration
 */
export interface PageLayout {
  type: 'full-width' | 'boxed' | 'centered' | 'sidebar' | 'split';
  maxWidth?: string;
  background?: string;
  padding?: string;
  header?: LayoutSection;
  sidebar?: LayoutSection;
  main?: LayoutSection;
  footer?: LayoutSection;
}

/**
 * Layout section definition
 */
export interface LayoutSection {
  name: string;
  width?: string;
  height?: string;
  position?: 'fixed' | 'sticky' | 'static';
  components?: string[];
}

/**
 * File structure for generated output
 */
export interface FileStructure {
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileStructure[];
}

/**
 * UI generation result with metadata
 */
export interface UIGenerationResult {
  success: boolean;
  data?: GeneratedPage | GeneratedComponent;
  error?: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency?: number;
}

// ==================== Default Design Tokens ====================

const DEFAULT_THEME_COLORS: ThemeColors = {
  primary: '#1890ff',
  primaryHover: '#40a9ff',
  primaryActive: '#096dd9',
  secondary: '#667eea',
  secondaryHover: '#7c8ef0',
  secondaryActive: '#5a67d8',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceHover: '#fafafa',
  textPrimary: '#333333',
  textSecondary: '#666666',
  textDisabled: '#999999',
  border: '#d9d9d9',
  borderHover: '#40a9ff',
  divider: '#f0f0f0',
};

const DEFAULT_SPACING: SpacingTokens = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

const DEFAULT_TYPOGRAPHY: TypographyTokens = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMono: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  fontSizeXs: '12px',
  fontSizeSm: '14px',
  fontSizeMd: '16px',
  fontSizeLg: '18px',
  fontSizeXl: '20px',
  fontSize2xl: '24px',
  fontSize3xl: '30px',
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
  lineHeight: 1.5,
  lineHeightHeading: 1.2,
};

const DEFAULT_BORDER_RADIUS: BorderRadiusTokens = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

const DEFAULT_SHADOWS: ShadowTokens = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 2px 8px rgba(0, 0, 0, 0.08)',
  lg: '0 4px 16px rgba(0, 0, 0, 0.12)',
  xl: '0 8px 32px rgba(0, 0, 0, 0.16)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
};

const DEFAULT_TRANSITIONS: TransitionTokens = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
};

const DEFAULT_BREAKPOINTS: BreakpointTokens = {
  xs: '320px',
  sm: '576px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  xxl: '1536px',
};

const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  colors: DEFAULT_THEME_COLORS,
  spacing: DEFAULT_SPACING,
  typography: DEFAULT_TYPOGRAPHY,
  borderRadius: DEFAULT_BORDER_RADIUS,
  shadows: DEFAULT_SHADOWS,
  transitions: DEFAULT_TRANSITIONS,
  breakpoints: DEFAULT_BREAKPOINTS,
};

// ==================== Prompt Templates ====================

const PROMPTS = {
  componentGeneration: `You are an expert frontend developer and UI/UX designer specializing in creating production-ready, accessible components.

Generate a complete UI component based on the provided specification. Consider:
1. Clean, maintainable code
2. Proper TypeScript types
3. Accessibility (WCAG 2.1 AA compliance)
4. Responsive design
5. Proper component composition
6. Error handling and edge cases
7. Loading and disabled states
8. Proper prop naming conventions

Respond with a JSON object containing:
{
  "name": "ComponentName",
  "type": "button|input|card|...",
  "code": "Complete component code",
  "styles": "CSS styles if needed (empty if using CSS-in-JS)",
  "types": "TypeScript interfaces if needed",
  "propsInterface": "Props interface definition",
  "usageExample": "Example usage code",
  "dependencies": ["package names"],
  "devDependencies": ["dev package names"],
  "documentation": "Component documentation"
}`,

  pageGeneration: `You are an expert frontend developer specializing in creating complete, production-ready pages.

Generate a complete page component with all necessary sub-components based on the provided requirements. Consider:
1. Page layout and structure
2. Component hierarchy
3. State management
4. Data flow
5. User interactions
6. Responsive design for mobile, tablet, and desktop
7. Loading and error states
8. SEO considerations
9. Performance optimization

Respond with a JSON object containing:
{
  "name": "PageName",
  "type": "landing|auth|dashboard|...",
  "component": {
    "name": "PageComponent",
    "code": "Complete page code",
    "styles": "CSS styles if needed",
    "types": "TypeScript interfaces"
  },
  "components": [
    {
      "name": "SubComponentName",
      "code": "Component code",
      "styles": "CSS styles"
    }
  ],
  "layout": {
    "type": "full-width|boxed|centered|...",
    "maxWidth": "1200px",
    "background": "#f5f5f5",
    "padding": "24px"
  },
  "fileStructure": {
    "path": "/",
    "type": "directory",
    "children": [
      { "path": "ComponentName.tsx", "type": "file", "content": "..." }
    ]
  }
}`,

  styleGeneration: `You are an expert CSS/styling specialist.

Generate complete, production-ready styles based on the provided requirements. Consider:
1. CSS specificity and cascade
2. Responsive breakpoints
3. Dark mode support if requested
4. Animation performance
5. Accessibility (prefers-reduced-motion)
6. Browser compatibility

Respond with a JSON object containing:
{
  "styles": "Complete CSS or styled-components code",
  "tokens": {
    "colors": { ... },
    "spacing": { ... },
    "typography": { ... }
  }
}`,

  designTokens: `You are a design system expert.

Generate design tokens for a cohesive design system based on the provided requirements. Consider:
1. Color palette (primary, secondary, semantic colors)
2. Typography scale
3. Spacing scale
4. Border radius scale
5. Shadow scale
6. Transition timing
7. Breakpoints for responsive design

Respond with a JSON object containing the complete design token system:
{
  "colors": { ... },
  "spacing": { ... },
  "typography": { ... },
  "borderRadius": { ... },
  "shadows": { ... },
  "transitions": { ... },
  "breakpoints": { ... }
}`,
};

// ==================== UI Generator Service Class ====================

/**
 * Main UI Generator Service class
 */
export class UIGeneratorService {
  private aiService: AIService;
  private config: Required<UIGeneratorOptions>;
  private env: CloudflareEnv;

  constructor(env: CloudflareEnv, options?: UIGeneratorOptions) {
    this.env = env;
    this.aiService = createAIService(env);
    
    // Default configuration
    this.config = {
      framework: options?.framework || 'react',
      uiLibrary: options?.uiLibrary || 'tailwind',
      style: options?.style || 'minimal',
      platforms: options?.platforms || ['desktop', 'tablet', 'mobile'],
      pageType: options?.pageType || 'custom',
      componentTypes: options?.componentTypes || [],
      typescript: options?.typescript ?? true,
      includeTests: options?.includeTests ?? false,
      includeStories: options?.includeStories ?? false,
      includeDocs: options?.includeDocs ?? true,
      designTokens: options?.designTokens || DEFAULT_DESIGN_TOKENS,
      themeColors: options?.themeColors || DEFAULT_THEME_COLORS,
      accessibilityLevel: options?.accessibilityLevel || 'AA',
      animations: options?.animations ?? true,
      animationStyle: options?.animationStyle || 'subtle',
      customPromptPrefix: options?.customPromptPrefix || '',
    };
  }

  // ==================== Component Generation ====================

  /**
   * Generate a single component
   */
  async generateComponent(
    spec: ComponentSpec,
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult> {
    const mergedOptions = { ...this.config, ...options };
    const startTime = Date.now();

    try {
      const prompt = this.buildComponentPrompt(spec, mergedOptions);
      
      const result = await this.aiService.generateJSON<GeneratedComponent>(
        prompt,
        undefined,
        {
          temperature: 0.3,
          maxTokens: 4096,
        }
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate component');
      }

      return {
        success: true,
        data: result.data,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        provider: 'unknown',
        model: 'unknown',
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate multiple components in batch
   */
  async generateComponents(
    specs: ComponentSpec[],
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult[]> {
    return Promise.all(specs.map(spec => this.generateComponent(spec, options)));
  }

  // ==================== Page Generation ====================

  /**
   * Generate a complete page with all components
   */
  async generatePage(
    description: string,
    pageType: PageType,
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult> {
    const mergedOptions = { ...this.config, ...options, pageType };
    const startTime = Date.now();

    try {
      const prompt = this.buildPagePrompt(description, mergedOptions);
      
      const result = await this.aiService.generateJSON<GeneratedPage>(
        prompt,
        undefined,
        {
          temperature: 0.4,
          maxTokens: 8192,
        }
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate page');
      }

      return {
        success: true,
        data: result.data,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        provider: 'unknown',
        model: 'unknown',
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate a landing page
   */
  async generateLandingPage(
    description: string,
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult> {
    return this.generatePage(description, 'landing', options);
  }

  /**
   * Generate an authentication page
   */
  async generateAuthPage(
    type: 'login' | 'register' | 'forgot-password' | 'reset-password',
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult> {
    const description = `Create a ${type} page with:
      - Clean, modern design
      - Form validation
      - Social login options
      - Password strength indicator (if applicable)
      - Remember me option
      - Forgot password link
      - Loading and error states
      - Mobile-first responsive design`;
    
    return this.generatePage(description, 'auth', options);
  }

  /**
   * Generate a dashboard page
   */
  async generateDashboard(
    description: string,
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult> {
    return this.generatePage(description, 'dashboard', options);
  }

  // ==================== Style Generation ====================

  /**
   * Generate styles for a component
   */
  async generateStyles(
    componentDescription: string,
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult> {
    const mergedOptions = { ...this.config, ...options };
    const startTime = Date.now();

    try {
      const prompt = this.buildStylePrompt(componentDescription, mergedOptions);
      
      const result = await this.aiService.generateJSON<{ styles: string; tokens: Partial<DesignTokens> }>(
        prompt,
        undefined,
        {
          temperature: 0.2,
          maxTokens: 2048,
        }
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate styles');
      }

      return {
        success: true,
        data: {
          name: 'GeneratedStyles',
          type: 'custom',
          code: result.data.styles,
          styles: result.data.styles,
        } as GeneratedComponent,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        provider: 'unknown',
        model: 'unknown',
        latency: Date.now() - startTime,
      };
    }
  }

  // ==================== Design Tokens ====================

  /**
   * Generate design tokens
   */
  async generateDesignTokens(
    description: string,
    options?: Partial<UIGeneratorOptions>
  ): Promise<AIResult<DesignTokens>> {
    const mergedOptions = { ...this.config, ...options };

    const prompt = `${PROMPTS.designTokens}

Based on the following requirements:
${description}

${mergedOptions.customPromptPrefix ? `Additional context: ${mergedOptions.customPromptPrefix}` : ''}

Generate a complete design token system.`;

    return this.aiService.generateJSON<DesignTokens>(prompt, undefined, {
      temperature: 0.3,
      maxTokens: 2048,
    });
  }

  /**
   * Get default design tokens
   */
  getDefaultDesignTokens(): DesignTokens {
    return DEFAULT_DESIGN_TOKENS;
  }

  /**
   * Merge custom tokens with defaults
   */
  mergeTokens(customTokens: Partial<DesignTokens>): DesignTokens {
    return {
      colors: { ...DEFAULT_DESIGN_TOKENS.colors, ...customTokens.colors },
      spacing: { ...DEFAULT_DESIGN_TOKENS.spacing, ...customTokens.spacing },
      typography: { ...DEFAULT_DESIGN_TOKENS.typography, ...customTokens.typography },
      borderRadius: { ...DEFAULT_DESIGN_TOKENS.borderRadius, ...customTokens.borderRadius },
      shadows: { ...DEFAULT_DESIGN_TOKENS.shadows, ...customTokens.shadows },
      transitions: { ...DEFAULT_DESIGN_TOKENS.transitions, ...customTokens.transitions },
      breakpoints: { ...DEFAULT_DESIGN_TOKENS.breakpoints, ...customTokens.breakpoints },
    };
  }

  // ==================== UI Variant Generation ====================

  /**
   * Generate component variants
   */
  async generateVariants(
    componentName: string,
    baseCode: string,
    variants: string[],
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult[]> {
    const results: UIGenerationResult[] = [];

    for (const variant of variants) {
      const startTime = Date.now();
      
      try {
        const prompt = `Generate a "${variant}" variant of the following component.

Component Name: ${componentName}
Base Code:
\`\`\`
${baseCode}
\`\`\`

Create the variant while maintaining:
1. Consistent API and props
2. Same accessibility features
3. Similar structure and patterns

${PROMPTS.componentGeneration}`;

        const result = await this.aiService.generateJSON<GeneratedComponent>(
          prompt,
          undefined,
          {
            temperature: 0.4,
            maxTokens: 2048,
          }
        );

        if (result.success && result.data) {
          results.push({
            success: true,
            data: result.data,
            provider: result.provider,
            model: result.model,
            usage: result.usage,
            latency: Date.now() - startTime,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          error: errorMessage,
          provider: 'unknown',
          model: 'unknown',
          latency: Date.now() - startTime,
        });
      }
    }

    return results;
  }

  // ==================== Utility Methods ====================

  /**
   * Build a component generation prompt
   */
  private buildComponentPrompt(
    spec: ComponentSpec,
    options: Required<UIGeneratorOptions>
  ): string {
    const frameworkHint = this.getFrameworkHint(options.framework);
    const libraryHint = this.getLibraryHint(options.uiLibrary);
    const styleHint = this.getStyleHint(options.style);
    const platformHint = this.getPlatformHint(options.platforms);
    const accessibilityHint = this.getAccessibilityHint(options.accessibilityLevel);

    return `${options.customPromptPrefix ? options.customPromptPrefix + '\n\n' : ''}${PROMPTS.componentGeneration}

${frameworkHint}
${libraryHint}
${styleHint}
${platformHint}
${accessibilityHint}

Component Specification:
- Name: ${spec.name}
- Type: ${spec.type}
${spec.description ? `- Description: ${spec.description}` : ''}
${spec.props ? `- Props: ${JSON.stringify(spec.props, null, 2)}` : ''}
${spec.variants ? `- Variants: ${JSON.stringify(spec.variants.map(v => v.name), null, 2)}` : ''}
${spec.slots ? `- Slots: ${JSON.stringify(spec.slots.map(s => s.name), null, 2)}` : ''}
${spec.events ? `- Events: ${JSON.stringify(spec.events.map(e => e.name), null, 2)}` : ''}

Generate the complete component.`;
  }

  /**
   * Build a page generation prompt
   */
  private buildPagePrompt(
    description: string,
    options: Required<UIGeneratorOptions>
  ): string {
    const frameworkHint = this.getFrameworkHint(options.framework);
    const libraryHint = this.getLibraryHint(options.uiLibrary);
    const styleHint = this.getStyleHint(options.style);
    const platformHint = this.getPlatformHint(options.platforms);

    return `${options.customPromptPrefix ? options.customPromptPrefix + '\n\n' : ''}${PROMPTS.pageGeneration}

${frameworkHint}
${libraryHint}
${styleHint}
${platformHint}

Page Requirements:
${description}

Page Type: ${options.pageType}

Generate the complete page with all necessary components.`;
  }

  /**
   * Build a style generation prompt
   */
  private buildStylePrompt(
    description: string,
    options: Required<UIGeneratorOptions>
  ): string {
    return `${PROMPTS.styleGeneration}

Style Requirements:
${description}

Design Style: ${options.style}
UI Library: ${options.uiLibrary}
Animation Style: ${options.animationStyle}

Generate complete styles with design tokens.`;
  }

  /**
   * Get framework-specific hints
   */
  private getFrameworkHint(framework: UIFramework): string {
    const hints: Record<UIFramework, string> = {
      react: `
Framework: React
- Use functional components with hooks
- Use TypeScript interfaces for props
- Follow React best practices
- Use proper React patterns (compound components, render props if needed)`,
      vue: `
Framework: Vue 3
- Use Composition API with <script setup>
- Use TypeScript interfaces for props
- Follow Vue 3 best practices
- Use proper Vue patterns (slots, emits)`,
      svelte: `
Framework: Svelte
- Use Svelte 4 syntax
- Use proper reactivity declarations
- Follow Svelte best practices
- Use slots and dispatch for events`,
      vanilla: `
Framework: Vanilla JavaScript
- Use modern JavaScript (ES2020+)
- Use Web Components if appropriate
- Follow progressive enhancement
- Ensure cross-browser compatibility`,
      angular: `
Framework: Angular 17+
- Use standalone components
- Use signals for reactivity
- Use TypeScript interfaces
- Follow Angular style guide`,
    };
    return hints[framework];
  }

  /**
   * Get library-specific hints
   */
  private getLibraryHint(library: UILibrary): string {
    const hints: Record<UILibrary, string> = {
      tailwind: `
UI Library: Tailwind CSS
- Use Tailwind utility classes
- Follow mobile-first approach
- Use Tailwind's responsive prefixes
- Use Tailwind's state variants (hover:, focus:, etc.)`,
      shadcn: `
UI Library: shadcn/ui
- Use shadcn/ui components as base
- Follow shadcn patterns
- Use Tailwind CSS for styling
- Use Radix UI primitives`,
      mui: `
UI Library: Material-UI (MUI)
- Use MUI components
- Follow Material Design guidelines
- Use MUI's theming system
- Use proper MUI patterns`,
      antd: `
UI Library: Ant Design
- Use Ant Design components
- Follow Ant Design guidelines
- Use proper Ant Design patterns
- Use Ant Design's theming`,
      chakra: `
UI Library: Chakra UI
- Use Chakra UI components
- Follow Chakra UI patterns
- Use Chakra's theming
- Use Chakra's style props`,
      none: `
UI Library: None (Custom CSS)
- Write custom CSS/CSS-in-JS
- Use BEM or similar naming
- Ensure consistent styling
- Consider CSS modules`,
    };
    return hints[library];
  }

  /**
   * Get style-specific hints
   */
  private getStyleHint(style: UIDesignStyle): string {
    const hints: Record<UIDesignStyle, string> = {
      minimal: `
Design Style: Minimal
- Clean, lots of whitespace
- Simple color palette
- Subtle shadows
- Focus on content`,
      glassmorphism: `
Design Style: Glassmorphism
- Frosted glass effect (backdrop-filter: blur)
- Semi-transparent backgrounds
- Subtle borders with gradient
- Layered elements`,
      bento: `
Design Style: Bento Grid
- Grid-based card layout
- Clear content sections
- Rounded corners
- Subtle shadows`,
      gradient: `
Design Style: Soft Gradient
- Soft gradients (pink, blue, purple)
- Smooth color transitions
- Modern, vibrant look
- Gradient borders and backgrounds`,
      neumorphism: `
Design Style: Neumorphism
- Soft UI with shadows
- Monochromatic colors
- Subtle 3D effect
- Minimal color contrast`,
      brutalist: `
Design Style: Brutalist
- Raw, bold design
- High contrast
- No rounded corners
- Bold typography`,
      neobrutalism: `
Design Style: Neobrutalism
- Bold colors
- Black borders
- Hard shadows
- Playful yet bold`,
      corporate: `
Design Style: Corporate
- Professional, conservative
- Blue color scheme
- Clean layouts
- Business-appropriate`,
      playful: `
Design Style: Playful
- Fun, colorful
- Rounded corners
- Whimsical elements
- Vibrant colors`,
    };
    return hints[style];
  }

  /**
   * Get platform-specific hints
   */
  private getPlatformHint(platforms: Platform[]): string {
    if (platforms.length === 1 && platforms[0] !== 'responsive') {
      return `Target Platform: ${platforms[0]}
- Optimize for ${platforms[0]} only
- Consider ${platforms[0]}-specific patterns`;
    }
    return `Target Platforms: ${platforms.join(', ')}
- Responsive design for all platforms
- Mobile-first approach
- Breakpoints: 320px (mobile), 768px (tablet), 1024px (desktop)
- Touch-friendly interactions`;
  }

  /**
   * Get accessibility hints
   */
  private getAccessibilityHint(level: 'A' | 'AA' | 'AAA'): string {
    return `Accessibility: WCAG 2.1 Level ${level}
- Proper semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus indicators
- Color contrast ratios
- Screen reader support
- Reduced motion support`;
  }

  // ==================== Quick Generation Methods ====================

  /**
   * Quick generate a button component
   */
  async quickButton(
    variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary',
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult> {
    return this.generateComponent(
      {
        name: 'Button',
        type: 'button',
        description: `A ${variant} button component with proper states (hover, active, disabled, loading)`,
        props: [
          { name: 'children', type: 'node', required: true },
          { name: 'variant', type: 'enum', enumValues: ['primary', 'secondary', 'outline', 'ghost', 'danger'], default: variant },
          { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], default: 'md' },
          { name: 'disabled', type: 'boolean', default: false },
          { name: 'loading', type: 'boolean', default: false },
          { name: 'fullWidth', type: 'boolean', default: false },
          { name: 'leftIcon', type: 'node' },
          { name: 'rightIcon', type: 'node' },
          { name: 'onClick', type: 'function' },
        ],
        variants: [
          { name: 'Primary', props: { variant: 'primary' } },
          { name: 'Secondary', props: { variant: 'secondary' } },
          { name: 'Outline', props: { variant: 'outline' } },
          { name: 'Ghost', props: { variant: 'ghost' } },
          { name: 'Danger', props: { variant: 'danger' } },
        ],
        events: [
          { name: 'onClick', description: 'Called when button is clicked' },
        ],
        accessibility: {
          role: 'button',
          keyboardNavigable: true,
          focusVisible: true,
        },
      },
      options
    );
  }

  /**
   * Quick generate an input component
   */
  async quickInput(
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult> {
    return this.generateComponent(
      {
        name: 'Input',
        type: 'input',
        description: 'A flexible input component with validation states and icons',
        props: [
          { name: 'type', type: 'enum', enumValues: ['text', 'password', 'email', 'number', 'tel', 'url'], default: 'text' },
          { name: 'placeholder', type: 'string' },
          { name: 'value', type: 'string' },
          { name: 'defaultValue', type: 'string' },
          { name: 'disabled', type: 'boolean', default: false },
          { name: 'readOnly', type: 'boolean', default: false },
          { name: 'error', type: 'string' },
          { name: 'helperText', type: 'string' },
          { name: 'label', type: 'string' },
          { name: 'required', type: 'boolean', default: false },
          { name: 'leftIcon', type: 'node' },
          { name: 'rightIcon', type: 'node' },
          { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'], default: 'md' },
          { name: 'fullWidth', type: 'boolean', default: false },
          { name: 'onChange', type: 'function' },
          { name: 'onBlur', type: 'function' },
          { name: 'onFocus', type: 'function' },
        ],
        events: [
          { name: 'onChange', description: 'Called when input value changes', payload: 'string' },
          { name: 'onBlur', description: 'Called when input loses focus' },
          { name: 'onFocus', description: 'Called when input gains focus' },
        ],
        accessibility: {
          ariaLabel: 'Input field',
          keyboardNavigable: true,
          focusVisible: true,
        },
      },
      options
    );
  }

  /**
   * Quick generate a card component
   */
  async quickCard(
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult> {
    return this.generateComponent(
      {
        name: 'Card',
        type: 'card',
        description: 'A versatile card component with header, body, and footer sections',
        props: [
          { name: 'title', type: 'string' },
          { name: 'subtitle', type: 'string' },
          { name: 'children', type: 'node', required: true },
          { name: 'footer', type: 'node' },
          { name: 'image', type: 'string' },
          { name: 'imageAlt', type: 'string' },
          { name: 'variant', type: 'enum', enumValues: ['elevated', 'outlined', 'filled'], default: 'elevated' },
          { name: 'padding', type: 'enum', enumValues: ['none', 'sm', 'md', 'lg'], default: 'md' },
          { name: 'hoverable', type: 'boolean', default: false },
          { name: 'clickable', type: 'boolean', default: false },
          { name: 'onClick', type: 'function' },
        ],
        slots: [
          { name: 'header', description: 'Card header content' },
          { name: 'default', description: 'Card body content', required: true },
          { name: 'footer', description: 'Card footer content' },
        ],
        events: [
          { name: 'onClick', description: 'Called when card is clicked (if clickable)' },
        ],
        accessibility: {
          role: 'article',
          keyboardNavigable: true,
        },
      },
      options
    );
  }

  /**
   * Quick generate a modal component
   */
  async quickModal(
    options?: Partial<UIGeneratorOptions>
  ): Promise<UIGenerationResult> {
    return this.generateComponent(
      {
        name: 'Modal',
        type: 'modal',
        description: 'A modal dialog component with backdrop, animations, and focus trap',
        props: [
          { name: 'isOpen', type: 'boolean', required: true },
          { name: 'onClose', type: 'function', required: true },
          { name: 'title', type: 'string' },
          { name: 'children', type: 'node', required: true },
          { name: 'footer', type: 'node' },
          { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg', 'xl', 'full'], default: 'md' },
          { name: 'closeOnOverlayClick', type: 'boolean', default: true },
          { name: 'closeOnEsc', type: 'boolean', default: true },
          { name: 'showCloseButton', type: 'boolean', default: true },
          { name: 'centered', type: 'boolean', default: true },
        ],
        slots: [
          { name: 'header', description: 'Modal header content' },
          { name: 'default', description: 'Modal body content', required: true },
          { name: 'footer', description: 'Modal footer content' },
        ],
        events: [
          { name: 'onClose', description: 'Called when modal should close' },
        ],
        accessibility: {
          role: 'dialog',
          ariaModal: true,
          keyboardNavigable: true,
          focusVisible: true,
        },
      },
      options
    );
  }
}

// ==================== Factory Functions ====================

/**
 * Create a UI Generator service instance
 */
export function createUIGeneratorService(
  env: CloudflareEnv,
  options?: UIGeneratorOptions
): UIGeneratorService {
  return new UIGeneratorService(env, options);
}

// ==================== Singleton Instance ====================

let defaultInstance: UIGeneratorService | null = null;

/**
 * Get or create the default UI Generator service instance
 */
export function getUIGeneratorService(
  env: CloudflareEnv,
  options?: UIGeneratorOptions
): UIGeneratorService {
  if (!defaultInstance) {
    defaultInstance = new UIGeneratorService(env, options);
  }
  return defaultInstance;
}

/**
 * Reset the default instance (useful for testing)
 */
export function resetUIGeneratorService(): void {
  defaultInstance = null;
}

// ==================== Convenience Functions ====================

/**
 * Quick generate a component
 */
export async function quickGenerateComponent(
  env: CloudflareEnv,
  type: ComponentType,
  name: string,
  description?: string,
  options?: Partial<UIGeneratorOptions>
): Promise<UIGenerationResult> {
  const service = getUIGeneratorService(env, options);
  return service.generateComponent({ name, type, description }, options);
}

/**
 * Quick generate a page
 */
export async function quickGeneratePage(
  env: CloudflareEnv,
  description: string,
  pageType: PageType,
  options?: Partial<UIGeneratorOptions>
): Promise<UIGenerationResult> {
  const service = getUIGeneratorService(env, options);
  return service.generatePage(description, pageType, options);
}

// ==================== Re-exports ====================

export type { CloudflareEnv } from '../lib/env';