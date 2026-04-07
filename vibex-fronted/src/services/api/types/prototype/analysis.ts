// ==================== UI Schema 类型 ====================

export interface UISchema {
  version: string;
  pages: UIPage[];
  theme?: UITheme;
}

export interface UIPage {
  id: string;
  name: string;
  route: string;
  components: UIComponent[];
  layout?: UILayout;
}

export interface UIComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: UIComponent[];
}

export type ComponentType =
  | 'form'
  | 'table'
  | 'list'
  | 'card'
  | 'navigation'
  | 'chart'
  | 'media'
  | 'layout'
  | 'input'
  | 'button'
  | 'text'
  | 'image'
  | 'container';

export interface UILayout {
  type: 'single' | 'split' | 'grid' | 'sidebar';
  sections?: UISection[];
}

export interface UISection {
  id: string;
  components: string[];
  ratio?: number;
}

// UI Theme
export interface UITheme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  responsive: ThemeResponsive;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  [key: string]: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: Record<string, string>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, number>;
}

export interface ThemeSpacing {
  unit: number;
  scale: number[];
}

export interface ThemeResponsive {
  breakpoints: Record<string, number>;
}
