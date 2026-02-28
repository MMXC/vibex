/**
 * VibeX Design Tokens
 * 视觉设计和品牌统一系统
 */

// 颜色系统
export const colors = {
  // 主色
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
  
  // 中性色
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
  
  // 功能色
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

// 暗色模式颜色
export const darkColors = {
  primary: {
    ...colors.primary,
    50: '#1e293b',
    100: '#1e3a5f',
  },
  neutral: {
    50: '#0a0a0a',
    100: '#171717',
    200: '#262626',
    300: '#404040',
    400: '#525252',
    500: '#737373',
    600: '#a3a3a3',
    700: '#d4d4d4',
    800: '#e5e5e5',
    900: '#fafafa',
  },
} as const;

// 字体系统
export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// 间距系统
export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

// 圆角系统
export const borderRadius = {
  none: '0',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// 阴影系统
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
} as const;

// 动画系统
export const transitions = {
  fast: '150ms ease',
  base: '200ms ease',
  slow: '300ms ease',
} as const;

export const animations = {
  fadeIn: 'fadeIn 0.2s ease-out',
  slideUp: 'slideUp 0.3s ease-out',
  slideDown: 'slideDown 0.3s ease-out',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
} as const;

// Z-Index 层级
export const zIndex = {
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
} as const;

// 断点系统
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// 导出 CSS 变量
export function generateCSSVariables(isDark = false): Record<string, string> {
  const palette = isDark ? darkColors : colors;
  
  return {
    // 颜色
    '--color-primary': palette.primary[500],
    '--color-primary-hover': palette.primary[600],
    '--color-primary-light': palette.primary[100],
    '--color-primary-alpha': 'rgba(59, 130, 246, 0.1)',
    
    // 中性色
    '--color-text': isDark ? '#e5e5e5' : '#1a1a1a',
    '--color-text-secondary': isDark ? '#a3a3a3' : '#666666',
    '--color-text-tertiary': isDark ? '#737373' : '#999999',
    '--color-bg-primary': isDark ? '#1a1a1a' : '#ffffff',
    '--color-bg-secondary': isDark ? '#262626' : '#f5f5f5',
    '--color-bg-tertiary': isDark ? '#404040' : '#eeeeee',
    '--color-border': isDark ? '#404040' : '#e5e5e5',
    '--color-border-light': isDark ? '#262626' : '#f0f0f0',
    
    // 功能色
    '--color-success': colors.success,
    '--color-warning': colors.warning,
    '--color-error': colors.error,
    '--color-info': colors.info,
    
    // 圆角
    '--radius-sm': borderRadius.sm,
    '--radius-base': borderRadius.base,
    '--radius-md': borderRadius.md,
    '--radius-lg': borderRadius.lg,
    '--radius-xl': borderRadius.xl,
    '--radius-full': borderRadius.full,
    
    // 阴影
    '--shadow-sm': shadows.sm,
    '--shadow-base': shadows.base,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,
    '--shadow-xl': shadows.xl,
    
    // 间距
    '--spacing-1': spacing[1],
    '--spacing-2': spacing[2],
    '--spacing-3': spacing[3],
    '--spacing-4': spacing[4],
    '--spacing-6': spacing[6],
    '--spacing-8': spacing[8],
  };
}
