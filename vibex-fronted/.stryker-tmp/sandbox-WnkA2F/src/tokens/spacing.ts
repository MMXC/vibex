/**
 * Spacing Tokens - 间距系统
 * 使用 CSS 变量格式，支持主题切换，TypeScript 类型安全
 */
// @ts-nocheck


// 基础间距单位 (4px base)
export const spacing = {
  0: '0',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
} as const;

// 容器最大宽度
export const container = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
} as const;

// 内边距
export const padding = {
  none: '0',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const;

// 外边距
export const margin = {
  none: '0',
  auto: 'auto',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const;

// 圆角
export const borderRadius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const;

// 阴影
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
} as const;

// Z-Index 层级
export const zIndex = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  auto: 'auto',
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

// 断点
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// 断点最小宽度 (用于 min-width 媒体查询)
export const breakpointsMin = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// 断点最大宽度 (用于 max-width 媒体查询)
export const breakpointsMax = {
  xs: '479px',
  sm: '639px',
  md: '767px',
  lg: '1023px',
  xl: '1279px',
  '2xl': '1535px',
} as const;

// CSS 变量生成器
export function getSpacingCSSVars(): Record<string, string | number> {
  return {
    // 间距
    '--spacing-0': spacing[0],
    '--spacing-1': spacing[1],
    '--spacing-2': spacing[2],
    '--spacing-3': spacing[3],
    '--spacing-4': spacing[4],
    '--spacing-5': spacing[5],
    '--spacing-6': spacing[6],
    '--spacing-8': spacing[8],
    '--spacing-10': spacing[10],
    '--spacing-12': spacing[12],
    '--spacing-16': spacing[16],

    // FE-1.2.2: Story 1.2 spec-aligned spacing aliases
    '--spacing-xs': '4px',
    '--spacing-sm': '8px',
    '--spacing-md': '16px',
    '--spacing-lg': '24px',
    '--spacing-xl': '32px',
    '--spacing-2xl': '48px',

    // 容器
    '--container-sm': container.sm,
    '--container-md': container.md,
    '--container-lg': container.lg,
    '--container-xl': container.xl,
    '--container-2xl': container['2xl'],
    '--container-full': container.full,

    // 内边距
    '--padding-none': padding.none,
    '--padding-xs': padding.xs,
    '--padding-sm': padding.sm,
    '--padding-md': padding.md,
    '--padding-lg': padding.lg,
    '--padding-xl': padding.xl,
    '--padding-2xl': padding['2xl'],

    // 外边距
    '--margin-none': margin.none,
    '--margin-auto': margin.auto,
    '--margin-xs': margin.xs,
    '--margin-sm': margin.sm,
    '--margin-md': margin.md,
    '--margin-lg': margin.lg,
    '--margin-xl': margin.xl,
    '--margin-2xl': margin['2xl'],

    // 圆角
    '--radius-none': borderRadius.none,
    '--radius-xs': borderRadius.xs,
    '--radius-sm': borderRadius.sm,
    '--radius-base': borderRadius.base,
    '--radius-md': borderRadius.md,
    '--radius-lg': borderRadius.lg,
    '--radius-xl': borderRadius.xl,
    '--radius-2xl': borderRadius['2xl'],
    '--radius-full': borderRadius.full,

    // 阴影
    '--shadow-none': shadows.none,
    '--shadow-xs': shadows.xs,
    '--shadow-sm': shadows.sm,
    '--shadow-base': shadows.base,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,
    '--shadow-xl': shadows.xl,
    '--shadow-2xl': shadows['2xl'],

    // Z-Index
    '--z-dropdown': zIndex.dropdown,
    '--z-sticky': zIndex.sticky,
    '--z-fixed': zIndex.fixed,
    '--z-modal-backdrop': zIndex.modalBackdrop,
    '--z-modal': zIndex.modal,
    '--z-popover': zIndex.popover,
    '--z-tooltip': zIndex.tooltip,
    '--z-toast': zIndex.toast,
  };
}

// 导出所有间距 token
export const spacingTokens = {
  spacing,
  container,
  padding,
  margin,
  borderRadius,
  shadows,
  zIndex,
  breakpoints,
  breakpointsMin,
  breakpointsMax,
  getSpacingCSSVars,
} as const;

// 类型导出
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
export type SpacingToken = keyof typeof spacing;
