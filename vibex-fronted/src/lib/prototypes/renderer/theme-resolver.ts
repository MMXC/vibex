/**
 * Theme Resolver
 *
 * Extracted from renderer.ts — theme resolution and CSS variable mapping
 * utilities for the VibeX prototype rendering engine.
 *
 * @module prototypes/renderer/theme-resolver
 */

import type { UITheme } from './types';
import { createDefaultTheme } from '../ui-schema';

// ==================== Theme Resolution ====================

/**
 * Resolve a theme with defaults applied
 */
export function resolveTheme(theme?: Partial<UITheme>): UITheme {
  if (!theme) {
    return createDefaultTheme();
  }
  return {
    ...createDefaultTheme(),
    ...theme,
  };
}

/**
 * Map theme colors to CSS variables
 */
export function mapToCSSVars(theme: UITheme): Record<string, string> {
  const vars: Record<string, string> = {};

  // Map colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    vars[`--color-${key}`] = value;
  });

  // Map typography
  if (theme.typography) {
    vars['--font-family-primary'] = theme.typography.fontFamily.primary;
    vars['--font-family-secondary'] = theme.typography.fontFamily.secondary;
    vars['--font-family-mono'] = theme.typography.fontFamily.mono;

    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      vars[`--font-size-${key}`] = value;
    });

    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      vars[`--font-weight-${key}`] = String(value);
    });

    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      vars[`--line-height-${key}`] = String(value);
    });
  }

  // Map spacing
  if (theme.spacing) {
    vars['--spacing-unit'] = String(theme.spacing.unit);
    theme.spacing.scale.forEach((value, index) => {
      const name = theme.spacing.names[index] || index;
      vars[`--spacing-${name}`] = `${value}px`;
    });
  }

  return vars;
}

/**
 * Get CSS variable value
 */
export function getCSSVariable(name: string, fallback: string, theme?: UITheme): string {
  if (theme) {
    const vars = mapToCSSVars(theme);
    return vars[name] || fallback;
  }
  return fallback;
}

/**
 * Generate theme-aware CSS string
 */
export function themeToCSSString(theme: UITheme): string {
  const vars = mapToCSSVars(theme);
  const cssParts: string[] = [];

  Object.entries(vars).forEach(([key, value]) => {
    cssParts.push(`${key}: ${value};`);
  });

  return `:root {\n  ${cssParts.join('\n  ')}\n}`;
}
