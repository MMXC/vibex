/**
 * Typography Tokens - 字体排版系统
 * 使用 CSS 变量格式，支持主题切换，TypeScript 类型安全
 */

// 字体家族
export const fontFamily = {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
  display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

// 字体大小
export const fontSize = {
  xs: '12px',
  sm: '13px',
  base: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '20px',
  '3xl': '24px',
  '4xl': '30px',
  '5xl': '36px',
} as const;

// 字体粗细
export const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

// 行高
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// 字间距
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// 段落间距
export const paragraphSpacing = {
  none: '0',
  tight: '0.625rem',
  normal: '1rem',
  relaxed: '1.5rem',
  loose: '2rem',
} as const;

// 标题字体大小
export const headingFontSize = {
  h1: '2.5rem',    // 40px
  h2: '2rem',      // 32px
  h3: '1.75rem',   // 28px
  h4: '1.5rem',    // 24px
  h5: '1.25rem',   // 20px
  h6: '1.125rem',  // 18px
} as const;

// 标题行高
export const headingLineHeight = {
  h1: 1.2,
  h2: 1.25,
  h3: 1.3,
  h4: 1.35,
  h5: 1.4,
  h6: 1.5,
} as const;

// 标题字重
export const headingFontWeight = {
  h1: fontWeight.bold,
  h2: fontWeight.bold,
  h3: fontWeight.semibold,
  h4: fontWeight.semibold,
  h5: fontWeight.medium,
  h6: fontWeight.medium,
} as const;

// CSS 变量生成器
export function getTypographyCSSVars(): Record<string, string | number> {
  return {
    // 字体家族
    '--font-family-sans': fontFamily.sans,
    '--font-family-mono': fontFamily.mono,
    '--font-family-display': fontFamily.display,
    '--font-family-body': fontFamily.body,

    // 字体大小
    '--font-size-xs': fontSize.xs,
    '--font-size-sm': fontSize.sm,
    '--font-size-base': fontSize.base,
    '--font-size-lg': fontSize.lg,
    '--font-size-xl': fontSize.xl,
    '--font-size-2xl': fontSize['2xl'],
    '--font-size-3xl': fontSize['3xl'],
    '--font-size-4xl': fontSize['4xl'],
    '--font-size-5xl': fontSize['5xl'],

    // 字体粗细
    '--font-weight-thin': fontWeight.thin,
    '--font-weight-extralight': fontWeight.extralight,
    '--font-weight-light': fontWeight.light,
    '--font-weight-normal': fontWeight.normal,
    '--font-weight-medium': fontWeight.medium,
    '--font-weight-semibold': fontWeight.semibold,
    '--font-weight-bold': fontWeight.bold,
    '--font-weight-extrabold': fontWeight.extrabold,
    '--font-weight-black': fontWeight.black,

    // 行高
    '--line-height-none': lineHeight.none,
    '--line-height-tight': lineHeight.tight,
    '--line-height-snug': lineHeight.snug,
    '--line-height-normal': lineHeight.normal,
    '--line-height-relaxed': lineHeight.relaxed,
    '--line-height-loose': lineHeight.loose,

    // 字间距
    '--letter-spacing-tighter': letterSpacing.tighter,
    '--letter-spacing-tight': letterSpacing.tight,
    '--letter-spacing-normal': letterSpacing.normal,
    '--letter-spacing-wide': letterSpacing.wide,
    '--letter-spacing-wider': letterSpacing.wider,
    '--letter-spacing-widest': letterSpacing.widest,

    // 标题
    '--font-size-h1': headingFontSize.h1,
    '--font-size-h2': headingFontSize.h2,
    '--font-size-h3': headingFontSize.h3,
    '--font-size-h4': headingFontSize.h4,
    '--font-size-h5': headingFontSize.h5,
    '--font-size-h6': headingFontSize.h6,

    '--line-height-h1': headingLineHeight.h1,
    '--line-height-h2': headingLineHeight.h2,
    '--line-height-h3': headingLineHeight.h3,
    '--line-height-h4': headingLineHeight.h4,
    '--line-height-h5': headingLineHeight.h5,
    '--line-height-h6': headingLineHeight.h6,

    '--font-weight-h1': headingFontWeight.h1,
    '--font-weight-h2': headingFontWeight.h2,
    '--font-weight-h3': headingFontWeight.h3,
    '--font-weight-h4': headingFontWeight.h4,
    '--font-weight-h5': headingFontWeight.h5,
    '--font-weight-h6': headingFontWeight.h6,
  };
}

// 导出所有排版 token
export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  paragraphSpacing,
  headingFontSize,
  headingLineHeight,
  headingFontWeight,
  getTypographyCSSVars,
} as const;

// 类型导出
export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
