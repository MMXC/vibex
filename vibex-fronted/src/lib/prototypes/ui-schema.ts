/**
 * UI Schema Definition and Validation
 * 
 * This module provides TypeScript types and validation functions for the VibeX
 * AI Prototype Builder's UI Schema system.
 * 
 * @module prototypes/ui-schema
 */

// ==================== Core Type Definitions ====================

/**
 * UI Schema version
 */
export const UI_SCHEMA_VERSION = '1.0.0';
export type UISchemaVersion = typeof UI_SCHEMA_VERSION;

/**
 * Component type enumeration
 */
export type ComponentType = 
  | 'container'
  | 'layout'
  | 'form'
  | 'input'
  | 'select'
  | 'button'
  | 'text'
  | 'heading'
  | 'image'
  | 'video'
  | 'card'
  | 'list'
  | 'table'
  | 'navigation'
  | 'sidebar'
  | 'header'
  | 'footer'
  | 'modal'
  | 'drawer'
  | 'tabs'
  | 'accordion'
  | 'chart'
  | 'spinner'
  | 'divider'
  | 'badge'
  | 'avatar'
  | 'tag'
  | 'alert'
  | 'tooltip';

/**
 * Component category
 */
export type ComponentCategory = 
  | 'basic'
  | 'form'
  | 'display'
  | 'layout'
  | 'navigation'
  | 'feedback'
  | 'data'
  | 'media';

/**
 * Layout type
 */
export type LayoutType = 
  | 'single'
  | 'split'
  | 'grid'
  | 'sidebar'
  | 'masonry'
  | 'stack';

/**
 * Responsive breakpoint
 */
export interface Breakpoint {
  name: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
}

/**
 * Spacing scale
 */
export interface SpacingScale {
  unit: number;
  scale: number[];
  names: string[];
}

/**
 * Color palette
 */
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  [key: string]: string;
}

/**
 * Typography definition
 */
export interface Typography {
  fontFamily: {
    primary: string;
    secondary: string;
    mono: string;
  };
  fontSize: Record<string, string>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, number | string>;
  letterSpacing?: Record<string, string>;
}

/**
 * Animation definition
 */
export interface Animation {
  name: string;
  duration: number;
  easing: string;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

/**
 * Component interaction
 */
export interface ComponentInteraction {
  event: 'click' | 'hover' | 'focus' | 'blur' | 'input' | 'change' | 'submit' | 'keypress';
  action: 'navigate' | 'toggle' | 'submit' | 'scroll' | 'open' | 'close' | 'animate' | 'track';
  params?: Record<string, any>;
  target?: string;
}

/**
 * Component prop schema
 */
export interface PropSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum';
  required: boolean;
  default?: unknown;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

/**
 * Component style
 */
export interface ComponentStyle {
  size?: {
    width?: string | number;
    height?: string | number;
    minWidth?: string | number;
    minHeight?: string | number;
    maxWidth?: string | number;
    maxHeight?: string | number;
  };
  spacing?: {
    margin?: string | number | Record<string, string | number>;
    padding?: string | number | Record<string, string | number>;
  };
  colors?: {
    background?: string;
    foreground?: string;
    border?: string;
    [key: string]: string | undefined;
  };
  border?: {
    radius?: string | number;
    width?: string | number;
    style?: 'solid' | 'dashed' | 'dotted';
    color?: string;
  };
  shadow?: string | {
    x?: number;
    y?: number;
    blur?: number;
    spread?: number;
    color?: string;
  };
  typography?: {
    fontSize?: string | number;
    fontWeight?: number;
    lineHeight?: string | number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
  };
  flex?: {
    direction?: 'row' | 'column';
    justify?: string;
    align?: string;
    wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
    gap?: string | number;
  };
  position?: {
    type?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
    zIndex?: number;
  };
}

/**
 * Component variant
 */
export interface ComponentVariant {
  name: string;
  props?: Record<string, any>;
  style?: ComponentStyle;
  interactions?: ComponentInteraction[];
}

/**
 * Component definition
 */
export interface ComponentDefinition {
  name: string;
  category: ComponentCategory;
  description?: string;
  props?: PropSchema[];
  variants?: ComponentVariant[];
  defaultVariant?: string;
  replaceable?: boolean;
  alternatives?: string[];
  children?: boolean;
}

/**
 * UI Component instance
 */
export interface UIComponent {
  id: string;
  type: ComponentType;
  name?: string;
  props?: Record<string, any>;
  style?: ComponentStyle;
  children?: UIComponent[];
  interactions?: ComponentInteraction[];
  condition?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'includes' | 'startsWith' | 'endsWith';
    value: unknown;
  };
}

/**
 * UI Section
 */
export interface UISection {
  id: string;
  name?: string;
  components: string[];
  layout?: {
    type: LayoutType;
    ratio?: number;
    gap?: string | number;
  };
  style?: ComponentStyle;
}

/**
 * UI Page layout
 */
export interface UIPageLayout {
  type: LayoutType;
  sections: UISection[];
  gap?: string | number;
  padding?: string | number;
  background?: string;
}

/**
 * UI Page
 */
export interface UIPage {
  id: string;
  name: string;
  route: string;
  description?: string;
  components: UIComponent[];
  layout?: UIPageLayout;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  theme?: Partial<UITheme>;
}

/**
 * UI Theme
 */
export interface UITheme {
  version: string;
  name: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: SpacingScale;
  breakpoints: Breakpoint[];
  animations?: {
    default: Animation;
    variants?: Record<string, Animation>;
  };
  components?: Record<string, ComponentDefinition>;
}

/**
 * Root UI Schema
 */
export interface UISchema {
  version: string;
  name: string;
  description?: string;
  pages: UIPage[];
  theme?: UITheme;
  metadata?: {
    author?: string;
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
  };
}

// ==================== Validation Functions ====================

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
}

export interface ValidationWarning {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Check if value is a string
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a number
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is an object (not null, not array)
 */
function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is an array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Validate ColorPalette
 */
function validateColorPalette(value: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Colors must be an object', value });
    return errors;
  }
  
  const requiredColors = ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'textSecondary', 'border', 'success', 'warning', 'error', 'info'];
  
  for (const color of requiredColors) {
    if (!(color in value)) {
      errors.push({ path: `${path}.${color}`, message: `Missing required color: ${color}` });
    } else if (!isString(value[color])) {
      errors.push({ path: `${path}.${color}`, message: `Color must be a string`, value: value[color] });
    }
  }
  
  return errors;
}

/**
 * Validate Typography
 */
function validateTypography(value: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Typography must be an object', value });
    return errors;
  }
  
  const fontFamily = (value as Record<string, any>).fontFamily;
  if (!isObject(fontFamily)) {
    errors.push({ path: `${path}.fontFamily`, message: 'fontFamily must be an object' });
  } else {
    if (!fontFamily?.primary) errors.push({ path: `${path}.fontFamily.primary`, message: 'fontFamily.primary is required' });
    if (!fontFamily?.secondary) errors.push({ path: `${path}.fontFamily.secondary`, message: 'fontFamily.secondary is required' });
    if (!fontFamily?.mono) errors.push({ path: `${path}.fontFamily.mono`, message: 'fontFamily.mono is required' });
  }
  
  return errors;
}

/**
 * Validate SpacingScale
 */
function validateSpacingScale(value: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Spacing must be an object', value });
    return errors;
  }
  
  const spacing = value as Record<string, any>;
  
  if (!isNumber(spacing.unit) || spacing.unit <= 0) {
    errors.push({ path: `${path}.unit`, message: 'unit must be a positive number' });
  }
  
  if (!isArray(spacing.scale)) {
    errors.push({ path: `${path}.scale`, message: 'scale must be an array' });
  }
  
  if (!isArray(spacing.names)) {
    errors.push({ path: `${path}.names`, message: 'names must be an array' });
  }
  
  return errors;
}

/**
 * Validate Breakpoint
 */
function validateBreakpoint(value: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Breakpoint must be an object', value });
    return errors;
  }
  
  const bp = value as Record<string, any>;
  
  if (!isString(bp.name)) {
    errors.push({ path: `${path}.name`, message: 'name must be a string' });
  }
  
  if (!isNumber(bp.width) || bp.width <= 0) {
    errors.push({ path: `${path}.width`, message: 'width must be a positive number' });
  }
  
  return errors;
}

/**
 * Validate ComponentStyle
 */
function validateComponentStyle(value: unknown, path: string): ValidationError[] {
  if (value === undefined || value === null) return [];
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Style must be an object', value });
    return errors;
  }
  
  return errors;
}

/**
 * Validate ComponentInteraction
 */
function validateComponentInteraction(value: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Interaction must be an object', value });
    return errors;
  }
  
  const interaction = value as Record<string, any>;
  const validEvents = ['click', 'hover', 'focus', 'blur', 'input', 'change', 'submit', 'keypress'];
  const validActions = ['navigate', 'toggle', 'submit', 'scroll', 'open', 'close', 'animate', 'track'];
  
  if (!validEvents.includes(interaction.event as string)) {
    errors.push({ path: `${path}.event`, message: `Invalid event: ${interaction.event}` });
  }
  
  if (!validActions.includes(interaction.action as string)) {
    errors.push({ path: `${path}.action`, message: `Invalid action: ${interaction.action}` });
  }
  
  return errors;
}

/**
 * Validate UIComponent recursively
 */
function validateUIComponentInternal(value: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Component must be an object', value });
    return errors;
  }
  
  const component = value as Record<string, any>;
  
  if (!isString(component.id) || component.id.length === 0) {
    errors.push({ path: `${path}.id`, message: 'id is required and must be a non-empty string' });
  }
  
  if (!isString(component.type) || component.type.length === 0) {
    errors.push({ path: `${path}.type`, message: 'type is required and must be a non-empty string' });
  }
  
  if (component.style) {
    errors.push(...validateComponentStyle(component.style, `${path}.style`));
  }
  
  if (component.interactions && isArray(component.interactions)) {
    component.interactions.forEach((interaction, index) => {
      errors.push(...validateComponentInteraction(interaction, `${path}.interactions[${index}]`));
    });
  }
  
  if (component.children && isArray(component.children)) {
    component.children.forEach((child, index) => {
      errors.push(...validateUIComponentInternal(child, `${path}.children[${index}]`));
    });
  }
  
  return errors;
}

/**
 * Validate UISection
 */
function validateUISection(value: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Section must be an object', value });
    return errors;
  }
  
  const section = value as Record<string, any>;
  
  if (!isString(section.id) || section.id.length === 0) {
    errors.push({ path: `${path}.id`, message: 'id is required and must be a non-empty string' });
  }
  
  if (!isArray(section.components)) {
    errors.push({ path: `${path}.components`, message: 'components must be an array' });
  }
  
  return errors;
}

/**
 * Validate UIPageLayout
 */
function validateUIPageLayout(value: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Layout must be an object', value });
    return errors;
  }
  
  const layout = value as Record<string, any>;
  const validLayoutTypes = ['single', 'split', 'grid', 'sidebar', 'masonry', 'stack'];
  
  if (!validLayoutTypes.includes(layout.type as string)) {
    errors.push({ path: `${path}.type`, message: `Invalid layout type: ${layout.type}` });
  }
  
  if (isArray(layout.sections)) {
    layout.sections.forEach((section, index) => {
      errors.push(...validateUISection(section, `${path}.sections[${index}]`));
    });
  }
  
  return errors;
}

/**
 * Validate UIPage
 */
function validateUIPageInternal(value: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Page must be an object', value });
    return errors;
  }
  
  const page = value as Record<string, any>;
  
  if (!isString(page.id) || page.id.length === 0) {
    errors.push({ path: `${path}.id`, message: 'id is required and must be a non-empty string' });
  }
  
  if (!isString(page.name) || page.name.length === 0) {
    errors.push({ path: `${path}.name`, message: 'name is required and must be a non-empty string' });
  }
  
  if (!isString(page.route) || page.route.length === 0) {
    errors.push({ path: `${path}.route`, message: 'route is required and must be a non-empty string' });
  }
  
  if (!isArray(page.components)) {
    errors.push({ path: `${path}.components`, message: 'components must be an array' });
  } else {
    page.components.forEach((component, index) => {
      errors.push(...validateUIComponentInternal(component, `${path}.components[${index}]`));
    });
  }
  
  if (page.layout) {
    errors.push(...validateUIPageLayout(page.layout, `${path}.layout`));
  }
  
  return errors;
}

/**
 * Validate UITheme
 */
function validateUIThemeInternal(value: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!isObject(value)) {
    errors.push({ path, message: 'Theme must be an object', value });
    return errors;
  }
  
  const theme = value as Record<string, any>;
  
  if (!isString(theme.version) || theme.version.length === 0) {
    errors.push({ path: `${path}.version`, message: 'version is required and must be a non-empty string' });
  }
  
  if (!isString(theme.name) || theme.name.length === 0) {
    errors.push({ path: `${path}.name`, message: 'name is required and must be a non-empty string' });
  }
  
  if (theme.colors) {
    errors.push(...validateColorPalette(theme.colors, `${path}.colors`));
  }
  
  if (theme.typography) {
    errors.push(...validateTypography(theme.typography, `${path}.typography`));
  }
  
  if (theme.spacing) {
    errors.push(...validateSpacingScale(theme.spacing, `${path}.spacing`));
  }
  
  if (theme.breakpoints && isArray(theme.breakpoints)) {
    theme.breakpoints.forEach((bp, index) => {
      errors.push(...validateBreakpoint(bp, `${path}.breakpoints[${index}]`));
    });
  }
  
  return errors;
}

/**
 * Validate a complete UI Schema
 */
export function validateUISchema(schema: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (!isObject(schema)) {
    return {
      valid: false,
      errors: [{ path: 'root', message: 'Schema must be an object' }],
      warnings: [],
    };
  }
  
  const s = schema as Record<string, any>;
  
  if (!isString(s.version) || s.version.length === 0) {
    errors.push({ path: 'version', message: 'version is required and must be a non-empty string' });
  }
  
  if (!isString(s.name) || s.name.length === 0) {
    errors.push({ path: 'name', message: 'name is required and must be a non-empty string' });
  }
  
  if (!isArray(s.pages)) {
    errors.push({ path: 'pages', message: 'pages must be an array' });
  } else {
    if (s.pages.length === 0) {
      warnings.push({ path: 'pages', message: 'No pages defined in schema' });
    }
    
    s.pages.forEach((page, index) => {
      errors.push(...validateUIPageInternal(page, `pages[${index}]`));
    });
    
    const pageIds = s.pages.map((p: unknown) => (p as Record<string, any>).id).filter((id): id is string => isString(id));
    const duplicates = pageIds.filter((id: string, i: number) => pageIds.indexOf(id) !== i);
    if (duplicates.length > 0) {
      const uniqueDuplicates = Array.from(new Set(duplicates));
      warnings.push({ path: 'pages', message: `Duplicate page IDs found: ${uniqueDuplicates.join(', ')}` });
    }
  }
  
  if (s.theme) {
    errors.push(...validateUIThemeInternal(s.theme, 'theme'));
  } else {
    warnings.push({ path: 'theme', message: 'No theme defined, using defaults' });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single UI Component
 */
export function validateUIComponent(component: unknown): ValidationResult {
  const errors = validateUIComponentInternal(component, '');
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Validate a UI Page
 */
export function validateUIPage(page: unknown): ValidationResult {
  const errors = validateUIPageInternal(page, '');
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Validate a UI Theme
 */
export function validateUITheme(theme: unknown): ValidationResult {
  const errors = validateUIThemeInternal(theme, '');
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

// ==================== Utility Functions ====================

/**
 * Generate a unique component ID
 */
export function generateComponentId(type: ComponentType, prefix?: string): string {
  const idPrefix = prefix || type;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${idPrefix}_${timestamp}_${random}`;
}

/**
 * Generate a unique page ID
 */
export function generatePageId(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const timestamp = Date.now().toString(36);
  return `${slug}_${timestamp}`;
}

/**
 * Create a default UI Schema
 */
export function createDefaultUISchema(name: string, description?: string): UISchema {
  return {
    version: UI_SCHEMA_VERSION,
    name,
    description,
    pages: [],
    theme: createDefaultTheme(),
    metadata: {
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Create a default UI Theme
 */
export function createDefaultTheme(name: string = 'default'): UITheme {
  return {
    version: UI_SCHEMA_VERSION,
    name,
    colors: {
      primary: '#1890ff',
      secondary: '#52c41a',
      accent: '#722ed1',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#333333',
      textSecondary: '#666666',
      border: '#d9d9d9',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff',
    },
    typography: {
      fontFamily: {
        primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        secondary: 'Georgia, serif',
        mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    spacing: {
      unit: 4,
      scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96],
      names: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
    breakpoints: [
      { name: 'xs', width: 480 },
      { name: 'sm', width: 576 },
      { name: 'md', width: 768 },
      { name: 'lg', width: 992 },
      { name: 'xl', width: 1200 },
      { name: '2xl', width: 1400 },
    ],
  };
}

/**
 * Create a basic UI Component
 */
export function createUIComponent(
  type: ComponentType,
  props?: Record<string, any>,
  options?: {
    id?: string;
    name?: string;
    style?: ComponentStyle;
    children?: UIComponent[];
    interactions?: ComponentInteraction[];
  }
): UIComponent {
  return {
    id: options?.id || generateComponentId(type),
    type,
    name: options?.name,
    props: props || {},
    style: options?.style,
    children: options?.children,
    interactions: options?.interactions,
  };
}

/**
 * Create a basic UI Page
 */
export function createUIPage(
  name: string,
  route: string,
  options?: {
    id?: string;
    description?: string;
    components?: UIComponent[];
    layout?: UIPageLayout;
  }
): UIPage {
  return {
    id: options?.id || generatePageId(name),
    name,
    route,
    description: options?.description,
    components: options?.components || [],
    layout: options?.layout,
  };
}

/**
 * Deep clone a UI Schema
 */
export function cloneUISchema(schema: UISchema): UISchema {
  return JSON.parse(JSON.stringify(schema));
}

/**
 * Find component by ID in schema
 */
export function findComponentById(schema: UISchema, componentId: string): UIComponent | null {
  for (const page of schema.pages) {
    const found = findComponentInArray(page.components, componentId);
    if (found) return found;
  }
  return null;
}

function findComponentInArray(components: UIComponent[], id: string): UIComponent | null {
  for (const component of components) {
    if (component.id === id) return component;
    if (component.children) {
      const found = findComponentInArray(component.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Add component to page
 */
export function addComponentToPage(
  schema: UISchema,
  pageId: string,
  component: UIComponent,
  position?: { index?: number; parentId?: string }
): UISchema {
  const cloned = cloneUISchema(schema);
  const page = cloned.pages.find(p => p.id === pageId);
  
  if (!page) {
    throw new Error(`Page not found: ${pageId}`);
  }

  if (position?.parentId) {
    const parent = findComponentInArray(page.components, position.parentId);
    if (!parent) {
      throw new Error(`Parent component not found: ${position.parentId}`);
    }
    if (!parent.children) parent.children = [];
    
    if (position.index !== undefined) {
      parent.children.splice(position.index, 0, component);
    } else {
      parent.children.push(component);
    }
  } else {
    if (position?.index !== undefined) {
      page.components.splice(position.index, 0, component);
    } else {
      page.components.push(component);
    }
  }

  return cloned;
}

/**
 * Remove component from page
 */
export function removeComponentFromPage(
  schema: UISchema,
  pageId: string,
  componentId: string
): UISchema {
  const cloned = cloneUISchema(schema);
  const page = cloned.pages.find(p => p.id === pageId);
  
  if (!page) {
    throw new Error(`Page not found: ${pageId}`);
  }

  page.components = removeComponentFromArray(page.components, componentId);
  
  return cloned;
}

function removeComponentFromArray(components: UIComponent[], id: string): UIComponent[] {
  return components
    .filter(c => c.id !== id)
    .map(c => ({
      ...c,
      children: c.children ? removeComponentFromArray(c.children, id) : undefined,
    }));
}

/**
 * Convert component to JSON schema for documentation
 */
export function componentToJsonSchema(component: UIComponent): object {
  return {
    type: 'object',
    properties: {
      id: { type: 'string', const: component.id },
      type: { type: 'string', const: component.type },
      props: {
        type: 'object',
        properties: component.props || {},
      },
    },
    required: component.props ? Object.keys(component.props) : [],
  };
}

// ==================== Default Component Library ====================

/**
 * Default component library
 */
export const DEFAULT_COMPONENTS: ComponentDefinition[] = [
  {
    name: 'Button',
    category: 'basic',
    description: 'Interactive button component',
    props: [
      { name: 'label', type: 'string', required: true },
      { name: 'variant', type: 'enum', required: false, default: 'primary', validation: { options: ['primary', 'secondary', 'ghost', 'link'] } },
      { name: 'size', type: 'enum', required: false, default: 'medium', validation: { options: ['small', 'medium', 'large'] } },
      { name: 'disabled', type: 'boolean', required: false, default: false },
      { name: 'loading', type: 'boolean', required: false, default: false },
    ],
    variants: [
      { name: 'primary', props: { variant: 'primary' } },
      { name: 'secondary', props: { variant: 'secondary' } },
      { name: 'ghost', props: { variant: 'ghost' } },
    ],
    children: false,
    replaceable: true,
    alternatives: ['Ant Design Button', 'Radix UI Button'],
  },
  {
    name: 'Input',
    category: 'form',
    description: 'Text input field',
    props: [
      { name: 'placeholder', type: 'string', required: false },
      { name: 'label', type: 'string', required: false },
      { name: 'type', type: 'enum', required: false, default: 'text', validation: { options: ['text', 'password', 'email', 'number', 'tel', 'url'] } },
      { name: 'disabled', type: 'boolean', required: false, default: false },
      { name: 'required', type: 'boolean', required: false, default: false },
    ],
    children: false,
    replaceable: true,
    alternatives: ['Ant Design Input', 'Radix UI Input'],
  },
  {
    name: 'Card',
    category: 'display',
    description: 'Container card component',
    props: [
      { name: 'title', type: 'string', required: false },
      { name: 'hoverable', type: 'boolean', required: false, default: false },
      { name: 'bordered', type: 'boolean', required: false, default: true },
    ],
    children: true,
    replaceable: true,
    alternatives: ['Ant Design Card', 'Radix UI Card'],
  },
  {
    name: 'Container',
    category: 'layout',
    description: 'Layout container',
    props: [
      { name: 'fluid', type: 'boolean', required: false, default: false },
      { name: 'centered', type: 'boolean', required: false, default: true },
    ],
    children: true,
    replaceable: false,
  },
  {
    name: 'Header',
    category: 'layout',
    description: 'Page header',
    props: [
      { name: 'title', type: 'string', required: false },
      { name: 'fixed', type: 'boolean', required: false, default: false },
      { name: 'transparent', type: 'boolean', required: false, default: false },
    ],
    children: true,
    replaceable: false,
  },
  {
    name: 'Navigation',
    category: 'navigation',
    description: 'Navigation menu',
    props: [
      { name: 'items', type: 'array', required: true },
      { name: 'orientation', type: 'enum', required: false, default: 'horizontal', validation: { options: ['horizontal', 'vertical'] } },
    ],
    children: false,
    replaceable: true,
  },
  {
    name: 'Modal',
    category: 'feedback',
    description: 'Modal dialog',
    props: [
      { name: 'title', type: 'string', required: false },
      { name: 'open', type: 'boolean', required: true },
      { name: 'closable', type: 'boolean', required: false, default: true },
      { name: 'maskClosable', type: 'boolean', required: false, default: true },
    ],
    children: true,
    replaceable: true,
    alternatives: ['Ant Design Modal', 'Radix UI Dialog'],
  },
  {
    name: 'Table',
    category: 'data',
    description: 'Data table',
    props: [
      { name: 'columns', type: 'array', required: true },
      { name: 'dataSource', type: 'array', required: true },
      { name: 'pagination', type: 'boolean', required: false, default: true },
      { name: 'loading', type: 'boolean', required: false, default: false },
    ],
    children: false,
    replaceable: true,
    alternatives: ['Ant Design Table', 'TanStack Table'],
  },
  {
    name: 'Form',
    category: 'form',
    description: 'Form container',
    props: [
      { name: 'layout', type: 'enum', required: false, default: 'vertical', validation: { options: ['horizontal', 'vertical', 'inline'] } },
      { name: 'requiredMark', type: 'boolean', required: false, default: true },
    ],
    children: true,
    replaceable: true,
    alternatives: ['Ant Design Form', 'React Hook Form'],
  },
  {
    name: 'Image',
    category: 'media',
    description: 'Image component',
    props: [
      { name: 'src', type: 'string', required: true },
      { name: 'alt', type: 'string', required: true },
      { name: 'fit', type: 'enum', required: false, default: 'cover', validation: { options: ['cover', 'contain', 'fill', 'none'] } },
      { name: 'lazy', type: 'boolean', required: false, default: true },
    ],
    children: false,
    replaceable: true,
    alternatives: ['Ant Design Image', 'Next.js Image'],
  },
];

// ==================== Exports ====================

export default {
  UI_SCHEMA_VERSION,
  validateUISchema,
  validateUIComponent,
  validateUIPage,
  validateUITheme,
  createDefaultUISchema,
  createDefaultTheme,
  createUIComponent,
  createUIPage,
  cloneUISchema,
  findComponentById,
  addComponentToPage,
  removeComponentFromPage,
  generateComponentId,
  generatePageId,
  DEFAULT_COMPONENTS,
};
