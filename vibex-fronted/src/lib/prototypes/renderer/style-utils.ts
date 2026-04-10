/**
 * Style Utility Functions
 *
 * Extracted from renderer.ts — CSS conversion, style merging, and
 * utility functions for component styling.
 *
 * @module prototypes/renderer/style-utils
 */

import type * as React from 'react';
import type { ComponentStyle, UITheme } from './types';

// ==================== Style Value Conversion ====================

/**
 * Convert a style value to CSS string
 */
export function styleValueToString(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
}

// ==================== Spacing Utilities ====================

/**
 * Convert spacing object to CSS
 */
export function spacingToCss(spacing: string | number | Record<string, string | number> | undefined, prefix: string): string {
  if (!spacing) return '';

  if (typeof spacing === 'string' || typeof spacing === 'number') {
    const value = styleValueToString(spacing);
    return `${prefix}: ${value};`;
  }

  const parts: string[] = [];
  if (spacing.top !== undefined) parts.push(`${prefix}-top: ${styleValueToString(spacing.top as string | number)};`);
  if (spacing.right !== undefined) parts.push(`${prefix}-right: ${styleValueToString(spacing.right as string | number)};`);
  if (spacing.bottom !== undefined) parts.push(`${prefix}-bottom: ${styleValueToString(spacing.bottom as string | number)};`);
  if (spacing.left !== undefined) parts.push(`${prefix}-left: ${styleValueToString(spacing.left as string | number)};`);

  return parts.join(' ');
}

// ==================== Shadow Utilities ====================

/**
 * Shadow configuration
 */
export interface ShadowConfig {
  x?: number;
  y?: number;
  blur?: number;
  spread?: number;
  color?: string;
}

/**
 * Convert shadow to CSS string
 */
export function shadowToCss(shadow: string | ShadowConfig): string {
  if (!shadow) return '';
  if (typeof shadow === 'string') return shadow;

  const { x = 0, y = 4, blur = 8, spread = 0, color = 'rgba(0,0,0,0.1)' } = shadow;
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
}

// ==================== CSS Properties Conversion ====================

/**
 * Convert ComponentStyle to React CSS properties
 */
export function styleToCssProperties(style: ComponentStyle, theme: UITheme): React.CSSProperties {
  const css: React.CSSProperties = {};

  // Size
  if (style.size) {
    if (style.size.width !== undefined) {
      css.width = typeof style.size.width === 'number' ? `${style.size.width}px` : style.size.width;
    }
    if (style.size.height !== undefined) {
      css.height = typeof style.size.height === 'number' ? `${style.size.height}px` : style.size.height;
    }
    if (style.size.minWidth !== undefined) {
      css.minWidth = typeof style.size.minWidth === 'number' ? `${style.size.minWidth}px` : style.size.minWidth;
    }
    if (style.size.minHeight !== undefined) {
      css.minHeight = typeof style.size.minHeight === 'number' ? `${style.size.minHeight}px` : style.size.minHeight;
    }
    if (style.size.maxWidth !== undefined) {
      css.maxWidth = typeof style.size.maxWidth === 'number' ? `${style.size.maxWidth}px` : style.size.maxWidth;
    }
    if (style.size.maxHeight !== undefined) {
      css.maxHeight = typeof style.size.maxHeight === 'number' ? `${style.size.maxHeight}px` : style.size.maxHeight;
    }
  }

  // Spacing
  if (style.spacing) {
    if (style.spacing.margin !== undefined) {
      if (typeof style.spacing.margin === 'object') {
        const m = style.spacing.margin as Record<string, string | number>;
        css.marginTop = typeof m.top === 'number' ? `${m.top}px` : m.top as string;
        css.marginRight = typeof m.right === 'number' ? `${m.right}px` : m.right as string;
        css.marginBottom = typeof m.bottom === 'number' ? `${m.bottom}px` : m.bottom as string;
        css.marginLeft = typeof m.left === 'number' ? `${m.left}px` : m.left as string;
      } else {
        css.margin = typeof style.spacing.margin === 'number' ? `${style.spacing.margin}px` : style.spacing.margin;
      }
    }
    if (style.spacing.padding !== undefined) {
      if (typeof style.spacing.padding === 'object') {
        const p = style.spacing.padding as Record<string, string | number>;
        css.paddingTop = typeof p.top === 'number' ? `${p.top}px` : p.top as string;
        css.paddingRight = typeof p.right === 'number' ? `${p.right}px` : p.right as string;
        css.paddingBottom = typeof p.bottom === 'number' ? `${p.bottom}px` : p.bottom as string;
        css.paddingLeft = typeof p.left === 'number' ? `${p.left}px` : p.left as string;
      } else {
        css.padding = typeof style.spacing.padding === 'number' ? `${style.spacing.padding}px` : style.spacing.padding;
      }
    }
  }

  // Colors
  if (style.colors) {
    if (style.colors.background) css.backgroundColor = style.colors.background;
    if (style.colors.foreground) css.color = style.colors.foreground;
  }

  // Border
  if (style.border) {
    if (style.border.radius !== undefined) {
      css.borderRadius = typeof style.border.radius === 'number' ? `${style.border.radius}px` : style.border.radius;
    }
    if (style.border.width !== undefined) {
      css.borderWidth = typeof style.border.width === 'number' ? `${style.border.width}px` : style.border.width;
    }
    if (style.border.style) css.borderStyle = style.border.style;
    if (style.border.color) css.borderColor = style.border.color;
  }

  // Shadow
  if (style.shadow) {
    css.boxShadow = shadowToCss(style.shadow);
  }

  // Typography
  if (style.typography) {
    if (style.typography.fontSize !== undefined) {
      css.fontSize = typeof style.typography.fontSize === 'number' ? `${style.typography.fontSize}px` : style.typography.fontSize;
    }
    if (style.typography.fontWeight !== undefined) {
      css.fontWeight = style.typography.fontWeight;
    }
    if (style.typography.lineHeight !== undefined) {
      css.lineHeight = style.typography.lineHeight;
    }
    if (style.typography.textAlign) css.textAlign = style.typography.textAlign;
    if (style.typography.color) css.color = style.typography.color;
  }

  // Flex
  if (style.flex) {
    if (style.flex.direction) css.display = 'flex';
    if (style.flex.direction) css.flexDirection = style.flex.direction;
    if (style.flex.justify) css.justifyContent = style.flex.justify;
    if (style.flex.align) css.alignItems = style.flex.align;
    if (style.flex.wrap) css.flexWrap = style.flex.wrap;
    if (style.flex.gap !== undefined) {
      css.gap = typeof style.flex.gap === 'number' ? `${style.flex.gap}px` : style.flex.gap;
    }
  }

  // Position
  if (style.position) {
    if (style.position.type) css.position = style.position.type;
    if (style.position.top !== undefined) css.top = typeof style.position.top === 'number' ? `${style.position.top}px` : style.position.top;
    if (style.position.right !== undefined) css.right = typeof style.position.right === 'number' ? `${style.position.right}px` : style.position.right;
    if (style.position.bottom !== undefined) css.bottom = typeof style.position.bottom === 'number' ? `${style.position.bottom}px` : style.position.bottom;
    if (style.position.left !== undefined) css.left = typeof style.position.left === 'number' ? `${style.position.left}px` : style.position.left;
    if (style.position.zIndex !== undefined) css.zIndex = style.position.zIndex;
  }

  return css;
}
