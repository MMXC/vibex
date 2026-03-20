/**
 * Color Tokens
 * 颜色设计令牌 - 使用 CSS 变量格式
 */

export const colors = {
  // 主色 (FE-1.2.1)
  primary: 'var(--color-primary, #3B82F6)',
  primaryHover: 'var(--color-primary-hover, #2563eb)',
  primaryActive: 'var(--color-primary-active, #1d4ed8)',
  primaryLight: 'var(--color-primary-light, #eff6ff)',
  primaryDark: 'var(--color-primary-dark, #1e40af)',

  // 辅助色 (FE-1.2.1)
  secondary: 'var(--color-secondary, #6366F1)',
  secondaryHover: 'var(--color-secondary-hover, #4f46e5)',
  secondaryLight: 'var(--color-secondary-light, #eef2ff)',

  // 语义色
  success: 'var(--color-success, #10b981)',
  successHover: 'var(--color-success-hover, #059669)',
  successLight: 'var(--color-success-light, #d1fae5)',

  warning: 'var(--color-warning, #f59e0b)',
  warningHover: 'var(--color-warning-hover, #d97706)',
  warningLight: 'var(--color-warning-light, #fef3c7)',

  error: 'var(--color-error, #ef4444)',
  errorHover: 'var(--color-error-hover, #dc2626)',
  errorLight: 'var(--color-error-light, #fee2e2)',

  info: 'var(--color-info, #0ea5e9)',
  infoHover: 'var(--color-info-hover, #0284c7)',
  infoLight: 'var(--color-info-light, #e0f2fe)',

  // 中性色 - 背景 (FE-1.2.1)
  bg: 'var(--color-bg, #0F172A)',
  bgPrimary: 'var(--color-bg-primary, #ffffff)',
  bgSecondary: 'var(--color-bg-secondary, #f9fafb)',
  bgTertiary: 'var(--color-bg-tertiary, #f3f4f6)',
  bgElevated: 'var(--color-bg-elevated, #ffffff)',
  bgOverlay: 'var(--color-bg-overlay, rgba(0, 0, 0, 0.5))',
  surface: 'var(--color-surface, #1E293B)',

  // 中性色 - 边框
  border: 'var(--color-border, #e5e7eb)',
  borderHover: 'var(--color-border-hover, #d1d5db)',
  borderFocus: 'var(--color-border-focus, #3b82f6)',
  borderError: 'var(--color-border-error, #ef4444)',

  // 中性色 - 文本 (FE-1.2.1)
  text: 'var(--color-text, #F8FAFC)',
  textMuted: 'var(--color-text-muted, #94A3B8)',
  textPrimary: 'var(--color-text-primary, #111827)',
  textSecondary: 'var(--color-text-secondary, #6b7280)',
  textTertiary: 'var(--color-text-tertiary, #9ca3af)',
  textDisabled: 'var(--color-text-disabled, #d1d5db)',
  textInverse: 'var(--color-text-inverse, #ffffff)',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * 主题颜色配置
 */
export const themeColors = {
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f9fafb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
  },
  dark: {
    bgPrimary: '#111827',
    bgSecondary: '#1f2937',
    textPrimary: '#f9fafb',
    textSecondary: '#9ca3af',
  },
} as const;

export default colors;
