/**
 * Prototype Renderer Engine
 * 
 * This module provides the rendering engine for the VibeX AI Prototype Builder.
 * It transforms UI Schema definitions into React components with proper styling,
 * interactions, and theme support.
 * 
 * @module prototypes/renderer
 */

import * as React from 'react';
import { createElement, isValidElement, cloneElement, useCallback, useMemo, useRef, useState, useEffect, forwardRef } from 'react';
import type {
  UISchema,
  UIPage,
  UIComponent,
  UITheme,
  ComponentType,
  ComponentStyle,
  ComponentInteraction,
  LayoutType,
  ColorPalette,
  Typography,
} from './ui-schema';

// ==================== Types ====================

/**
 * Render context for the renderer
 */
export interface RenderContext {
  theme: UITheme;
  currentPageId?: string;
  navigation?: NavigationContext;
  state?: Record<string, unknown>;
  onStateChange?: (key: string, value: unknown) => void;
  onInteraction?: (event: InteractionEvent) => void;
  responsive?: ResponsiveContext;
}

/**
 * Navigation context
 */
export interface NavigationContext {
  navigate: (route: string, params?: Record<string, unknown>) => void;
  currentRoute: string;
  params?: Record<string, string>;
}

/**
 * Interaction event
 */
export interface InteractionEvent {
  componentId: string;
  event: ComponentInteraction['event'];
  action: ComponentInteraction['action'];
  params?: Record<string, unknown>;
  target?: string;
  timestamp: number;
}

/**
 * Responsive context
 */
export interface ResponsiveContext {
  breakpoint: string;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Component renderer function type
 */
export type ComponentRenderer = (
  component: UIComponent,
  context: RenderContext,
  children?: React.ReactNode
) => React.ReactNode;

/**
 * Component renderer registry
 */
export type ComponentRegistry = Partial<Record<ComponentType, ComponentRenderer>>;

/**
 * Renderer options
 */
export interface RendererOptions {
  componentRegistry?: ComponentRegistry;
  defaultStyles?: boolean;
  classNamePrefix?: string;
  generateId?: (component: UIComponent) => string;
  onComponentRender?: (component: UIComponent, element: React.ReactNode) => void;
  onError?: (error: Error, component: UIComponent) => void;
}

/**
 * Render result
 */
export interface RenderResult {
  element: React.ReactNode;
  styles: string[];
  scripts: string[];
  meta: RenderMeta;
}

/**
 * Render metadata
 */
export interface RenderMeta {
  componentCount: number;
  depth: number;
  hasInteractions: boolean;
  usedComponents: ComponentType[];
}

// ==================== Style Utilities ====================

/**
 * Convert a style value to CSS string
 */
function styleValueToString(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
}

/**
 * Convert spacing object to CSS
 */
function spacingToCss(spacing: string | number | Record<string, string | number> | undefined, prefix: string): string {
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

/**
 * Convert shadow to CSS
 */
function shadowToCss(shadow: string | ComponentStyle['shadow']): string {
  if (!shadow) return '';
  if (typeof shadow === 'string') return shadow;
  
  const { x = 0, y = 4, blur = 8, spread = 0, color = 'rgba(0,0,0,0.1)' } = shadow;
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
}

/**
 * Convert ComponentStyle to React CSS properties
 */
function styleToCssProperties(style: ComponentStyle, theme: UITheme): React.CSSProperties {
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

// ==================== Component Renderers ====================

/**
 * Default component renderers
 */
const defaultComponentRenderers: ComponentRegistry = {
  // Container component
  container: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'container',
        'data-name': component.name,
        className: `vx-container`,
        style: {
          width: '100%',
          ...style,
        },
      },
      children
    );
  },
  
  // Layout component
  layout: (component, context, children) => {
    const layoutType = (component.props?.layoutType as LayoutType) || 'single';
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    
    const layoutStyles: React.CSSProperties = {
      display: 'flex',
      width: '100%',
      ...style,
    };
    
    switch (layoutType) {
      case 'split':
        layoutStyles.flexDirection = 'row';
        layoutStyles.gap = '16px';
        break;
      case 'grid':
        layoutStyles.display = 'grid';
        layoutStyles.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        layoutStyles.gap = '16px';
        break;
      case 'sidebar':
        layoutStyles.flexDirection = 'row';
        break;
      case 'stack':
        layoutStyles.flexDirection = 'column';
        layoutStyles.gap = '16px';
        break;
      default:
        layoutStyles.flexDirection = 'column';
    }
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'layout',
        'data-layout': layoutType,
        'data-name': component.name,
        className: 'vx-layout',
        style: layoutStyles,
      },
      children
    );
  },
  
  // Form component
  form: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (context.onInteraction && component.interactions) {
        const submitInteraction = component.interactions.find(i => i.event === 'submit');
        if (submitInteraction) {
          context.onInteraction({
            componentId: component.id,
            event: 'submit',
            action: submitInteraction.action,
            params: submitInteraction.params,
            target: submitInteraction.target,
            timestamp: Date.now(),
          });
        }
      }
    };
    
    return createElement(
      'form',
      {
        id: component.id,
        'data-type': 'form',
        'data-name': component.name,
        className: 'vx-form',
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          ...style,
        },
        onSubmit: handleSubmit,
      },
      children
    );
  },
  
  // Input component
  input: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (context.onStateChange) {
        context.onStateChange(component.id, e.target.value);
      }
      if (context.onInteraction && component.interactions) {
        const changeInteraction = component.interactions.find(i => i.event === 'change');
        if (changeInteraction) {
          context.onInteraction({
            componentId: component.id,
            event: 'change',
            action: changeInteraction.action,
            params: { value: e.target.value, ...changeInteraction.params },
            target: changeInteraction.target,
            timestamp: Date.now(),
          });
        }
      }
    };
    
    return createElement('input', {
      id: component.id,
      'data-type': 'input',
      'data-name': component.name,
      className: 'vx-input',
      type: (component.props?.type as string) || 'text',
      placeholder: component.props?.placeholder as string,
      value: (context.state?.[component.id] as string) || (component.props?.value as string) || '',
      disabled: component.props?.disabled as boolean,
      required: component.props?.required as boolean,
      style: {
        padding: '8px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
        ...style,
      },
      onChange: handleChange,
    });
  },
  
  // Select component
  select: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const options = (component.props?.options as Array<{ label: string; value: string }>) || [];
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (context.onStateChange) {
        context.onStateChange(component.id, e.target.value);
      }
    };
    
    return createElement(
      'select',
      {
        id: component.id,
        'data-type': 'select',
        'data-name': component.name,
        className: 'vx-select',
        value: (context.state?.[component.id] as string) || (component.props?.value as string) || '',
        disabled: component.props?.disabled as boolean,
        style: {
          padding: '8px 12px',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          fontSize: '14px',
          outline: 'none',
          backgroundColor: '#fff',
          ...style,
        },
        onChange: handleChange,
      },
      options.map((opt) =>
        createElement('option', { key: opt.value, value: opt.value }, opt.label)
      )
    );
  },
  
  // Button component
  button: (component, context) => {
    const variant = (component.props?.variant as string) || 'primary';
    const size = (component.props?.size as string) || 'medium';
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    
    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: context.theme.colors.primary,
        color: '#fff',
        border: 'none',
      },
      secondary: {
        backgroundColor: context.theme.colors.secondary,
        color: '#fff',
        border: 'none',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: context.theme.colors.primary,
        border: `1px solid ${context.theme.colors.primary}`,
      },
      link: {
        backgroundColor: 'transparent',
        color: context.theme.colors.primary,
        border: 'none',
        textDecoration: 'underline',
      },
    };
    
    const sizeStyles: Record<string, React.CSSProperties> = {
      small: { padding: '4px 8px', fontSize: '12px' },
      medium: { padding: '8px 16px', fontSize: '14px' },
      large: { padding: '12px 24px', fontSize: '16px' },
    };
    
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (component.props?.disabled || component.props?.loading) return;
      
      if (context.onInteraction && component.interactions) {
        const clickInteraction = component.interactions.find(i => i.event === 'click');
        if (clickInteraction) {
          context.onInteraction({
            componentId: component.id,
            event: 'click',
            action: clickInteraction.action,
            params: clickInteraction.params,
            target: clickInteraction.target,
            timestamp: Date.now(),
          });
        }
      }
    };
    
    return createElement(
      'button',
      {
        id: component.id,
        'data-type': 'button',
        'data-variant': variant,
        'data-size': size,
        'data-name': component.name,
        className: 'vx-button',
        disabled: component.props?.disabled as boolean || component.props?.loading as boolean,
        style: {
          cursor: component.props?.disabled ? 'not-allowed' : 'pointer',
          borderRadius: '4px',
          fontWeight: 500,
          opacity: component.props?.disabled ? 0.6 : 1,
          ...variantStyles[variant] || variantStyles.primary,
          ...sizeStyles[size] || sizeStyles.medium,
          ...style,
        },
        onClick: handleClick,
      },
      component.props?.loading ? 'Loading...' : (component.props?.label as string) || 'Button'
    );
  },
  
  // Text component
  text: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const textType = (component.props?.textType as string) || 'paragraph';
    
    if (textType === 'span') {
      return createElement(
        'span',
        {
          id: component.id,
          'data-type': 'text',
          'data-name': component.name,
          className: 'vx-text',
          style: {
            ...style,
          },
        },
        (component.props?.content as string) || ''
      );
    }
    
    return createElement(
      'p',
      {
        id: component.id,
        'data-type': 'text',
        'data-name': component.name,
        className: 'vx-text',
        style: {
          margin: 0,
          lineHeight: 1.5,
          ...style,
        },
      },
      (component.props?.content as string) || ''
    );
  },
  
  // Heading component
  heading: (component, context) => {
    const level = (component.props?.level as number) || 1;
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const tag = `h${Math.min(Math.max(level, 1), 6)}`;
    
    const headingSizes: Record<number, React.CSSProperties> = {
      1: { fontSize: '32px', fontWeight: 700, lineHeight: 1.2 },
      2: { fontSize: '24px', fontWeight: 600, lineHeight: 1.3 },
      3: { fontSize: '20px', fontWeight: 600, lineHeight: 1.4 },
      4: { fontSize: '18px', fontWeight: 600, lineHeight: 1.4 },
      5: { fontSize: '16px', fontWeight: 600, lineHeight: 1.5 },
      6: { fontSize: '14px', fontWeight: 600, lineHeight: 1.5 },
    };
    
    return createElement(
      tag,
      {
        id: component.id,
        'data-type': 'heading',
        'data-level': level,
        'data-name': component.name,
        className: 'vx-heading',
        style: {
          margin: 0,
          ...headingSizes[level] || headingSizes[1],
          ...style,
        },
      },
      (component.props?.content as string) || ''
    );
  },
  
  // Image component
  image: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const fit = (component.props?.fit as string) || 'cover';
    
    const fitStyles: Record<string, string> = {
      cover: 'cover',
      contain: 'contain',
      fill: 'fill',
      none: 'none',
    };
    
    return createElement('img', {
      id: component.id,
      'data-type': 'image',
      'data-name': component.name,
      className: 'vx-image',
      src: component.props?.src as string,
      alt: (component.props?.alt as string) || '',
      loading: component.props?.lazy !== false ? 'lazy' : 'eager',
      style: {
        maxWidth: '100%',
        height: 'auto',
        objectFit: fitStyles[fit] || 'cover',
        ...style,
      },
    });
  },
  
  // Video component
  video: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    
    return createElement(
      'video',
      {
        id: component.id,
        'data-type': 'video',
        'data-name': component.name,
        className: 'vx-video',
        src: component.props?.src as string,
        controls: component.props?.controls !== false,
        autoPlay: component.props?.autoPlay as boolean,
        loop: component.props?.loop as boolean,
        muted: component.props?.muted as boolean,
        poster: component.props?.poster as string,
        style: {
          maxWidth: '100%',
          ...style,
        },
      }
    );
  },
  
  // Card component
  card: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const hoverable = component.props?.hoverable as boolean;
    const bordered = component.props?.bordered !== false;
    const title = component.props?.title as string;
    
    const [isHovered, setIsHovered] = useState(false);
    
    const cardStyle: React.CSSProperties = {
      backgroundColor: context.theme.colors.surface,
      borderRadius: '8px',
      padding: '16px',
      transition: 'box-shadow 0.3s, transform 0.3s',
      ...(bordered && { border: `1px solid ${context.theme.colors.border}` }),
      ...(hoverable && isHovered && {
        boxShadow: shadowToCss({ x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' }),
        transform: 'translateY(-2px)',
      }),
      ...style,
    };
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'card',
        'data-name': component.name,
        className: 'vx-card',
        style: cardStyle,
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      },
      title && createElement(
        'div',
        {
          className: 'vx-card-header',
          style: {
            marginBottom: '12px',
            fontWeight: 600,
            fontSize: '16px',
          },
        },
        title
      ),
      createElement(
        'div',
        { className: 'vx-card-content' },
        children
      )
    );
  },
  
  // List component
  list: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const listType = (component.props?.listType as string) || 'unordered';
    const tag = listType === 'ordered' ? 'ol' : 'ul';
    
    return createElement(
      tag,
      {
        id: component.id,
        'data-type': 'list',
        'data-name': component.name,
        className: 'vx-list',
        style: {
          padding: '0 0 0 24px',
          margin: 0,
          ...style,
        },
      },
      children
    );
  },
  
  // Table component
  table: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const columns = (component.props?.columns as Array<{ key: string; title: string; dataIndex?: string }>) || [];
    const dataSource = (component.props?.dataSource as Array<Record<string, unknown>>) || [];
    const pagination = component.props?.pagination !== false;
    const loading = component.props?.loading as boolean;
    
    if (loading) {
      return createElement(
        'div',
        {
          id: component.id,
          'data-type': 'table',
          'data-name': component.name,
          className: 'vx-table',
          style: {
            border: `1px solid ${context.theme.colors.border}`,
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            ...style,
          },
        },
        'Loading...'
      );
    }
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'table',
        'data-name': component.name,
        className: 'vx-table',
        style: {
          overflowX: 'auto',
          ...style,
        },
      },
      createElement(
        'table',
        {
          style: {
            width: '100%',
            borderCollapse: 'collapse',
          },
        },
        createElement(
          'thead',
          null,
          createElement(
            'tr',
            null,
            columns.map((col) =>
              createElement(
                'th',
                {
                  key: col.key,
                  style: {
                    padding: '12px 16px',
                    textAlign: 'left',
                    borderBottom: `2px solid ${context.theme.colors.border}`,
                    fontWeight: 600,
                  },
                },
                col.title
              )
            )
          )
        ),
        createElement(
          'tbody',
          null,
          dataSource.map((row, rowIndex) =>
            createElement(
              'tr',
              {
                key: rowIndex,
                style: {
                  borderBottom: `1px solid ${context.theme.colors.border}`,
                },
              },
              columns.map((col) =>
                createElement(
                  'td',
                  {
                    key: col.key,
                    style: {
                      padding: '12px 16px',
                    },
                  },
                  String(row[col.dataIndex || col.key] ?? '')
                )
              )
            )
          )
        )
      )
    );
  },
  
  // Navigation component
  navigation: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const items = (component.props?.items as Array<{ key: string; label: string; route?: string }>) || [];
    const orientation = (component.props?.orientation as string) || 'horizontal';
    
    return createElement(
      'nav',
      {
        id: component.id,
        'data-type': 'navigation',
        'data-name': component.name,
        className: 'vx-navigation',
        style: {
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          gap: '8px',
          ...style,
        },
      },
      items.map((item) =>
        createElement(
          'a',
          {
            key: item.key,
            href: item.route || '#',
            onClick: (e: React.MouseEvent) => {
              e.preventDefault();
              if (item.route && context.navigation) {
                context.navigation.navigate(item.route);
              }
            },
            style: {
              padding: '8px 16px',
              color: context.theme.colors.text,
              textDecoration: 'none',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            },
          },
          item.label
        )
      )
    );
  },
  
  // Sidebar component
  sidebar: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const width = (component.props?.width as string) || '240px';
    const collapsible = component.props?.collapsible as boolean;
    
    const [collapsed, setCollapsed] = useState(false);
    
    return createElement(
      'aside',
      {
        id: component.id,
        'data-type': 'sidebar',
        'data-name': component.name,
        className: 'vx-sidebar',
        style: {
          width: collapsed ? '64px' : width,
          minWidth: collapsed ? '64px' : width,
          height: '100%',
          backgroundColor: context.theme.colors.surface,
          borderRight: `1px solid ${context.theme.colors.border}`,
          transition: 'width 0.3s',
          ...style,
        },
      },
      collapsible && createElement(
        'button',
        {
          onClick: () => setCollapsed(!collapsed),
          style: {
            position: 'absolute',
            right: '-12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: `1px solid ${context.theme.colors.border}`,
            backgroundColor: '#fff',
            cursor: 'pointer',
          },
        },
        collapsed ? '>' : '<'
      ),
      children
    );
  },
  
  // Header component
  header: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const fixed = component.props?.fixed as boolean;
    const transparent = component.props?.transparent as boolean;
    const title = component.props?.title as string;
    
    return createElement(
      'header',
      {
        id: component.id,
        'data-type': 'header',
        'data-name': component.name,
        className: 'vx-header',
        style: {
          position: fixed ? 'fixed' : 'relative',
          top: fixed ? 0 : undefined,
          left: fixed ? 0 : undefined,
          right: fixed ? 0 : undefined,
          zIndex: fixed ? 100 : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '64px',
          backgroundColor: transparent ? 'transparent' : context.theme.colors.surface,
          borderBottom: transparent ? 'none' : `1px solid ${context.theme.colors.border}`,
          ...style,
        },
      },
      title && createElement('h1', { style: { fontSize: '20px', margin: 0 } }, title),
      children
    );
  },
  
  // Footer component
  footer: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    
    return createElement(
      'footer',
      {
        id: component.id,
        'data-type': 'footer',
        'data-name': component.name,
        className: 'vx-footer',
        style: {
          padding: '24px',
          backgroundColor: context.theme.colors.surface,
          borderTop: `1px solid ${context.theme.colors.border}`,
          ...style,
        },
      },
      children
    );
  },
  
  // Modal component
  modal: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const open = (context.state?.[`${component.id}_open`] as boolean) ?? (component.props?.open as boolean) ?? false;
    const title = component.props?.title as string;
    const closable = component.props?.closable !== false;
    const maskClosable = component.props?.maskClosable !== false;
    
    if (!open) return null;
    
    const handleClose = () => {
      if (context.onStateChange) {
        context.onStateChange(`${component.id}_open`, false);
      }
    };
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'modal',
        'data-name': component.name,
        className: 'vx-modal',
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        },
        onClick: maskClosable ? handleClose : undefined,
      },
      createElement(
        'div',
        {
          className: 'vx-modal-content',
          style: {
            backgroundColor: context.theme.colors.background,
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            boxShadow: shadowToCss({ x: 0, y: 8, blur: 24, color: 'rgba(0,0,0,0.2)' }),
            ...style,
          },
          onClick: (e: React.MouseEvent) => e.stopPropagation(),
        },
        closable && createElement(
          'button',
          {
            onClick: handleClose,
            style: {
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
            },
          },
          '×'
        ),
        title && createElement(
          'h2',
          { style: { margin: '0 0 16px 0', fontSize: '18px' } },
          title
        ),
        children
      )
    );
  },
  
  // Drawer component
  drawer: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const open = (context.state?.[`${component.id}_open`] as boolean) ?? (component.props?.open as boolean) ?? false;
    const placement = (component.props?.placement as string) || 'right';
    const title = component.props?.title as string;
    
    if (!open) return null;
    
    const placementStyles: Record<string, React.CSSProperties> = {
      left: { left: 0, top: 0, bottom: 0, transform: 'translateX(0)' },
      right: { right: 0, top: 0, bottom: 0, transform: 'translateX(0)' },
      top: { left: 0, top: 0, right: 0, transform: 'translateY(0)' },
      bottom: { left: 0, bottom: 0, right: 0, transform: 'translateY(0)' },
    };
    
    const handleClose = () => {
      if (context.onStateChange) {
        context.onStateChange(`${component.id}_open`, false);
      }
    };
    
    return createElement(
      'div',
      null,
      createElement('div', {
        className: 'vx-drawer-mask',
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        },
        onClick: handleClose,
      }),
      createElement(
        'div',
        {
          id: component.id,
          'data-type': 'drawer',
          'data-name': component.name,
          className: 'vx-drawer',
          style: {
            position: 'fixed',
            width: placement === 'left' || placement === 'right' ? '300px' : '100%',
            height: placement === 'top' || placement === 'bottom' ? '300px' : '100%',
            backgroundColor: context.theme.colors.background,
            zIndex: 1001,
            ...placementStyles[placement],
            ...style,
          },
        },
        title && createElement(
          'div',
          {
            className: 'vx-drawer-header',
            style: {
              padding: '16px 24px',
              borderBottom: `1px solid ${context.theme.colors.border}`,
              fontWeight: 600,
            },
          },
          title
        ),
        createElement(
          'div',
          { className: 'vx-drawer-content', style: { padding: '16px 24px' } },
          children
        )
      )
    );
  },
  
  // Tabs component
  tabs: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const items = (component.props?.items as Array<{ key: string; label: string }>) || [];
    const activeKey = (context.state?.[`${component.id}_activeKey`] as string) || (items[0]?.key);
    
    const handleTabChange = (key: string) => {
      if (context.onStateChange) {
        context.onStateChange(`${component.id}_activeKey`, key);
      }
    };
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'tabs',
        'data-name': component.name,
        className: 'vx-tabs',
        style: {
          width: '100%',
          ...style,
        },
      },
      createElement(
        'div',
        {
          className: 'vx-tabs-nav',
          style: {
            display: 'flex',
            borderBottom: `1px solid ${context.theme.colors.border}`,
          },
        },
        items.map((item) =>
          createElement(
            'div',
            {
              key: item.key,
              className: `vx-tabs-tab ${activeKey === item.key ? 'active' : ''}`,
              onClick: () => handleTabChange(item.key),
              style: {
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: activeKey === item.key ? `2px solid ${context.theme.colors.primary}` : '2px solid transparent',
                color: activeKey === item.key ? context.theme.colors.primary : context.theme.colors.text,
                fontWeight: activeKey === item.key ? 500 : 400,
                transition: 'color 0.2s, border-color 0.2s',
              },
            },
            item.label
          )
        )
      ),
      createElement(
        'div',
        { className: 'vx-tabs-content', style: { padding: '16px 0' } },
        children
      )
    );
  },
  
  // Accordion component
  accordion: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const items = (component.props?.items as Array<{ key: string; title: string }>) || [];
    const activeKeys = (context.state?.[`${component.id}_activeKeys`] as string[]) || [];
    const allowMultiple = component.props?.allowMultiple as boolean;
    
    const handleToggle = (key: string) => {
      if (context.onStateChange) {
        let newKeys: string[];
        if (activeKeys.includes(key)) {
          newKeys = activeKeys.filter(k => k !== key);
        } else {
          newKeys = allowMultiple ? [...activeKeys, key] : [key];
        }
        context.onStateChange(`${component.id}_activeKeys`, newKeys);
      }
    };
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'accordion',
        'data-name': component.name,
        className: 'vx-accordion',
        style: {
          width: '100%',
          ...style,
        },
      },
      items.map((item, index) =>
        createElement(
          'div',
          {
            key: item.key,
            className: 'vx-accordion-item',
            style: {
              borderBottom: `1px solid ${context.theme.colors.border}`,
            },
          },
          createElement(
            'div',
            {
              className: 'vx-accordion-header',
              onClick: () => handleToggle(item.key),
              style: {
                padding: '16px 0',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 500,
              },
            },
            item.title,
            createElement('span', null, activeKeys.includes(item.key) ? '−' : '+')
          ),
          activeKeys.includes(item.key) && createElement(
            'div',
            {
              className: 'vx-accordion-content',
              style: { paddingBottom: '16px' },
            },
            Array.isArray(children) ? children[index] : children
          )
        )
      )
    );
  },
  
  // Chart component (placeholder)
  chart: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const chartType = (component.props?.chartType as string) || 'bar';
    const data = (component.props?.data as Array<Record<string, unknown>>) || [];
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'chart',
        'data-chart-type': chartType,
        'data-name': component.name,
        className: 'vx-chart',
        style: {
          padding: '20px',
          border: `1px solid ${context.theme.colors.border}`,
          borderRadius: '8px',
          backgroundColor: context.theme.colors.surface,
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        },
      },
      `Chart: ${chartType} (${data.length} data points)`
    );
  },
  
  // Spinner component
  spinner: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const size = (component.props?.size as string) || 'medium';
    const color = (component.props?.color as string) || context.theme.colors.primary;
    
    const sizes: Record<string, number> = {
      small: 16,
      medium: 32,
      large: 48,
    };
    
    const spinnerSize = sizes[size] || sizes.medium;
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'spinner',
        'data-name': component.name,
        className: 'vx-spinner',
        style: {
          width: spinnerSize,
          height: spinnerSize,
          border: `${spinnerSize / 8}px solid ${context.theme.colors.border}`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          ...style,
        },
      }
    );
  },
  
  // Divider component
  divider: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const orientation = (component.props?.orientation as string) || 'horizontal';
    
    return createElement('div', {
      id: component.id,
      'data-type': 'divider',
      'data-name': component.name,
      className: 'vx-divider',
      style: {
        border: 'none',
        backgroundColor: context.theme.colors.border,
        ...(orientation === 'horizontal'
          ? { height: '1px', width: '100%' }
          : { width: '1px', height: '100%' }),
        ...style,
      },
    });
  },
  
  // Badge component
  badge: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const count = component.props?.count as number;
    const dot = component.props?.dot as boolean;
    const color = (component.props?.color as string) || context.theme.colors.error;
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'badge',
        'data-name': component.name,
        className: 'vx-badge',
        style: {
          position: 'relative',
          display: 'inline-block',
          ...style,
        },
      },
      children,
      (count !== undefined || dot) && createElement(
        'span',
        {
          className: 'vx-badge-count',
          style: {
            position: 'absolute',
            top: 0,
            right: 0,
            transform: 'translate(50%, -50%)',
            backgroundColor: color,
            color: '#fff',
            borderRadius: '10px',
            padding: dot ? '4px' : '0 6px',
            fontSize: '12px',
            lineHeight: 1,
            minWidth: dot ? undefined : '18px',
            textAlign: 'center',
          },
        },
        dot ? '' : count
      )
    );
  },
  
  // Avatar component
  avatar: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const src = component.props?.src as string;
    const name = (component.props?.name as string) || '';
    const size = (component.props?.size as string) || 'medium';
    
    const sizes: Record<string, number> = {
      small: 24,
      medium: 40,
      large: 56,
    };
    
    const avatarSize = sizes[size] || sizes.medium;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    if (src) {
      return createElement('img', {
        id: component.id,
        'data-type': 'avatar',
        'data-name': component.name,
        className: 'vx-avatar',
        src,
        alt: name,
        style: {
          width: avatarSize,
          height: avatarSize,
          borderRadius: '50%',
          objectFit: 'cover',
          ...style,
        },
      });
    }
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'avatar',
        'data-name': component.name,
        className: 'vx-avatar',
        style: {
          width: avatarSize,
          height: avatarSize,
          borderRadius: '50%',
          backgroundColor: context.theme.colors.primary,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: avatarSize / 2.5,
          fontWeight: 500,
          ...style,
        },
      },
      initials
    );
  },
  
  // Tag component
  tag: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const label = (component.props?.label as string) || '';
    const color = (component.props?.color as string) || context.theme.colors.primary;
    const closable = component.props?.closable as boolean;
    
    const [visible, setVisible] = useState(true);
    
    if (!visible) return null;
    
    return createElement(
      'span',
      {
        id: component.id,
        'data-type': 'tag',
        'data-name': component.name,
        className: 'vx-tag',
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          backgroundColor: `${color}20`,
          color: color,
          borderRadius: '4px',
          fontSize: '12px',
          ...style,
        },
      },
      label,
      closable && createElement(
        'span',
        {
          onClick: () => setVisible(false),
          style: {
            marginLeft: '4px',
            cursor: 'pointer',
            opacity: 0.7,
          },
        },
        '×'
      )
    );
  },
  
  // Alert component
  alert: (component, context) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const type = (component.props?.type as string) || 'info';
    const message = (component.props?.message as string) || '';
    const description = component.props?.description as string;
    const closable = component.props?.closable as boolean;
    
    const [visible, setVisible] = useState(true);
    
    if (!visible) return null;
    
    const typeStyles: Record<string, { bg: string; border: string }> = {
      success: { bg: '#f6ffed', border: context.theme.colors.success },
      warning: { bg: '#fffbe6', border: context.theme.colors.warning },
      error: { bg: '#fff2f0', border: context.theme.colors.error },
      info: { bg: '#e6f7ff', border: context.theme.colors.info },
    };
    
    const typeStyle = typeStyles[type] || typeStyles.info;
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'alert',
        'data-name': component.name,
        className: 'vx-alert',
        style: {
          padding: '12px 16px',
          backgroundColor: typeStyle.bg,
          border: `1px solid ${typeStyle.border}`,
          borderLeftWidth: '4px',
          borderRadius: '4px',
          ...style,
        },
      },
      createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } },
        createElement(
          'div',
          null,
          message && createElement('div', { style: { fontWeight: 500, marginBottom: description ? '4px' : 0 } }, message),
          description && createElement('div', { style: { fontSize: '14px', opacity: 0.8 } }, description)
        ),
        closable && createElement(
          'span',
          {
            onClick: () => setVisible(false),
            style: { cursor: 'pointer', marginLeft: '16px' },
          },
          '×'
        )
      )
    );
  },
  
  // Tooltip component
  tooltip: (component, context, children) => {
    const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
    const title = (component.props?.title as string) || '';
    const placement = (component.props?.placement as string) || 'top';
    
    const [visible, setVisible] = useState(false);
    
    const placementStyles: Record<string, React.CSSProperties> = {
      top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
      bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
      left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
      right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
    };
    
    return createElement(
      'div',
      {
        id: component.id,
        'data-type': 'tooltip',
        'data-name': component.name,
        className: 'vx-tooltip',
        style: {
          position: 'relative',
          display: 'inline-block',
          ...style,
        },
        onMouseEnter: () => setVisible(true),
        onMouseLeave: () => setVisible(false),
      },
      children,
      visible && createElement(
        'div',
        {
          className: 'vx-tooltip-content',
          style: {
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            ...placementStyles[placement],
          },
        },
        title
      )
    );
  },
};

// ==================== Core Renderer ====================

/**
 * Create a renderer instance
 */
export function createRenderer(options: RendererOptions = {}) {
  const {
    componentRegistry = {},
    defaultStyles = true,
    classNamePrefix = 'vx',
    onError,
  } = options;
  
  // Merge custom renderers with defaults
  const renderers: ComponentRegistry = {
    ...defaultComponentRenderers,
    ...componentRegistry,
  };
  
  /**
   * Render a component recursively
   */
  function renderComponent(
    component: UIComponent,
    context: RenderContext
  ): React.ReactNode {
    const renderer = renderers[component.type];
    
    if (!renderer) {
      // Fallback renderer for unknown types
      const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
      return createElement(
        'div',
        {
          id: component.id,
          'data-type': component.type,
          'data-name': component.name,
          className: `${classNamePrefix}-${component.type}`,
          style: {
            padding: '16px',
            border: '1px dashed #ccc',
            borderRadius: '4px',
            ...style,
          },
        },
        `[Unknown component: ${component.type}]`
      );
    }
    
    // Render children
    const children = component.children?.map((child) =>
      renderComponent(child, context)
    );
    
    try {
      return renderer(component, context, children);
    } catch (error) {
      if (onError) {
        onError(error as Error, component);
      }
      return createElement(
        'div',
        {
          id: component.id,
          style: { padding: '8px', backgroundColor: '#ff4d4f20', color: '#ff4d4f' },
        },
        `Error rendering component: ${component.type}`
      );
    }
  }
  
  /**
   * Render a page
   */
  function renderPage(page: UIPage, context: RenderContext): React.ReactNode {
    const pageContext: RenderContext = {
      ...context,
      currentPageId: page.id,
    };
    
    const children = page.components.map((component) =>
      renderComponent(component, pageContext)
    );
    
    // Wrap with page layout if specified
    if (page.layout) {
      return renderPageLayout(page.layout, children, pageContext);
    }
    
    return createElement(
      'div',
      {
        id: page.id,
        'data-page': page.name,
        'data-route': page.route,
        className: `${classNamePrefix}-page`,
        style: {
          minHeight: '100vh',
          backgroundColor: context.theme.colors.background,
        },
      },
      children
    );
  }
  
  /**
   * Render page layout
   */
  function renderPageLayout(
    layout: UIPage['layout'],
    children: React.ReactNode,
    context: RenderContext
  ): React.ReactNode {
    if (!layout) return children;
    
    const layoutStyles: React.CSSProperties = {
      minHeight: '100vh',
      backgroundColor: context.theme.colors.background,
    };
    
    switch (layout.type) {
      case 'grid':
        return createElement(
          'div',
          {
            className: `${classNamePrefix}-layout-grid`,
            style: {
              ...layoutStyles,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: typeof layout.gap === 'number' ? `${layout.gap}px` : layout.gap || '16px',
              padding: typeof layout.padding === 'number' ? `${layout.padding}px` : layout.padding || '16px',
            },
          },
          children
        );
      case 'sidebar':
        return createElement(
          'div',
          {
            className: `${classNamePrefix}-layout-sidebar`,
            style: {
              ...layoutStyles,
              display: 'flex',
            },
          },
          children
        );
      case 'split':
        return createElement(
          'div',
          {
            className: `${classNamePrefix}-layout-split`,
            style: {
              ...layoutStyles,
              display: 'flex',
              flexDirection: 'row',
              gap: typeof layout.gap === 'number' ? `${layout.gap}px` : layout.gap || '16px',
            },
          },
          children
        );
      case 'stack':
        return createElement(
          'div',
          {
            className: `${classNamePrefix}-layout-stack`,
            style: {
              ...layoutStyles,
              display: 'flex',
              flexDirection: 'column',
              gap: typeof layout.gap === 'number' ? `${layout.gap}px` : layout.gap || '16px',
            },
          },
          children
        );
      default:
        return createElement(
          'div',
          {
            className: `${classNamePrefix}-layout-single`,
            style: layoutStyles,
          },
          children
        );
    }
  }
  
  /**
   * Render a complete schema
   */
  function renderSchema(
    schema: UISchema,
    options: {
      pageId?: string;
      context?: Partial<RenderContext>;
    } = {}
  ): RenderResult {
    const theme = schema.theme || createDefaultTheme();
    const pages = options.pageId
      ? schema.pages.filter((p) => p.id === options.pageId)
      : schema.pages;
    
    const context: RenderContext = {
      theme,
      state: {},
      ...options.context,
    };
    
    let componentCount = 0;
    let maxDepth = 0;
    let hasInteractions = false;
    const usedComponents = new Set<ComponentType>();
    
    function countComponents(components: UIComponent[], depth: number) {
      maxDepth = Math.max(maxDepth, depth);
      for (const component of components) {
        componentCount++;
        usedComponents.add(component.type);
        if (component.interactions && component.interactions.length > 0) {
          hasInteractions = true;
        }
        if (component.children) {
          countComponents(component.children, depth + 1);
        }
      }
    }
    
    pages.forEach((page) => countComponents(page.components, 1));
    
    const element = pages.map((page) => renderPage(page, context));
    
    // Generate styles
    const styles: string[] = [];
    if (defaultStyles) {
      styles.push(generateDefaultStyles(theme, classNamePrefix));
    }
    
    return {
      element,
      styles,
      scripts: [],
      meta: {
        componentCount,
        depth: maxDepth,
        hasInteractions,
        usedComponents: Array.from(usedComponents),
      },
    };
  }
  
  return {
    renderComponent,
    renderPage,
    renderSchema,
    renderers,
  };
}

/**
 * Generate default styles for the rendered output
 */
function generateDefaultStyles(theme: UITheme, prefix: string): string {
  return `
/* VibeX Prototype Renderer Default Styles */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.${prefix}-page {
  font-family: ${theme.typography.fontFamily.primary};
  color: ${theme.colors.text};
  line-height: ${theme.typography.lineHeight.normal || 1.5};
}

.${prefix}-button {
  cursor: pointer;
  transition: all 0.2s;
}

.${prefix}-button:hover {
  opacity: 0.85;
}

.${prefix}-input:focus {
  border-color: ${theme.colors.primary};
  box-shadow: 0 0 0 2px ${theme.colors.primary}20;
}

.${prefix}-card {
  transition: box-shadow 0.3s, transform 0.3s;
}

.${prefix}-navigation a:hover {
  background-color: ${theme.colors.primary}10;
}

.${prefix}-tabs-tab:hover {
  color: ${theme.colors.primary};
}

.${prefix}-spinner {
  animation: spin 1s linear infinite;
}
`;
}

// ==================== Utility Functions ====================

/**
 * Create a default render context
 */
export function createDefaultRenderContext(
  theme?: UITheme,
  overrides?: Partial<RenderContext>
): RenderContext {
  return {
    theme: theme || createDefaultTheme(),
    state: {},
    onStateChange: () => {},
    onInteraction: () => {},
    navigation: {
      navigate: () => {},
      currentRoute: '/',
    },
    responsive: {
      breakpoint: 'md',
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    },
    ...overrides,
  };
}

/**
 * Create a responsive context
 */
export function createResponsiveContext(): ResponsiveContext {
  if (typeof window === 'undefined') {
    return {
      breakpoint: 'md',
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  let breakpoint = 'xs';
  let isMobile = true;
  let isTablet = false;
  let isDesktop = false;
  
  if (width >= 1400) {
    breakpoint = '2xl';
    isDesktop = true;
    isMobile = false;
  } else if (width >= 1200) {
    breakpoint = 'xl';
    isDesktop = true;
    isMobile = false;
  } else if (width >= 992) {
    breakpoint = 'lg';
    isDesktop = true;
    isMobile = false;
  } else if (width >= 768) {
    breakpoint = 'md';
    isTablet = true;
    isMobile = false;
  } else if (width >= 576) {
    breakpoint = 'sm';
    isTablet = true;
    isMobile = false;
  } else if (width >= 480) {
    breakpoint = 'xs';
    isMobile = true;
  }
  
  return {
    breakpoint,
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Hook for responsive context
 */
export function useResponsiveContext(): ResponsiveContext {
  const [context, setContext] = useState<ResponsiveContext>(createResponsiveContext());
  
  useEffect(() => {
    const handleResize = () => {
      setContext(createResponsiveContext());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return context;
}

/**
 * Hook for component state
 */
export function useComponentState(
  componentId: string,
  initialValue: unknown
): [unknown, (value: unknown) => void] {
  const [state, setState] = useState(initialValue);
  
  const updateState = useCallback((value: unknown) => {
    setState(value);
  }, []);
  
  return [state, updateState];
}

/**
 * Hook for interactions
 */
export function useInteractions(
  componentId: string,
  interactions: ComponentInteraction[] | undefined,
  onInteraction?: (event: InteractionEvent) => void
) {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  
  if (!interactions || !onInteraction) return handlers;
  
  interactions.forEach((interaction) => {
    switch (interaction.event) {
      case 'click':
        handlers.onClick = () => {
          onInteraction({
            componentId,
            event: 'click',
            action: interaction.action,
            params: interaction.params,
            target: interaction.target,
            timestamp: Date.now(),
          });
        };
        break;
      case 'hover':
        handlers.onMouseEnter = () => {
          onInteraction({
            componentId,
            event: 'hover',
            action: interaction.action,
            params: interaction.params,
            target: interaction.target,
            timestamp: Date.now(),
          });
        };
        break;
      case 'focus':
        handlers.onFocus = () => {
          onInteraction({
            componentId,
            event: 'focus',
            action: interaction.action,
            params: interaction.params,
            target: interaction.target,
            timestamp: Date.now(),
          });
        };
        break;
      case 'blur':
        handlers.onBlur = () => {
          onInteraction({
            componentId,
            event: 'blur',
            action: interaction.action,
            params: interaction.params,
            target: interaction.target,
            timestamp: Date.now(),
          });
        };
        break;
      case 'change':
        handlers.onChange = (value: unknown) => {
          onInteraction({
            componentId,
            event: 'change',
            action: interaction.action,
            params: { value, ...interaction.params },
            target: interaction.target,
            timestamp: Date.now(),
          });
        };
        break;
      case 'submit':
        handlers.onSubmit = ((e: React.FormEvent) => {
          e.preventDefault();
          onInteraction({
            componentId,
            event: 'submit',
            action: interaction.action,
            params: interaction.params,
            target: interaction.target,
            timestamp: Date.now(),
          });
        }) as unknown as (...args: unknown[]) => void;
        break;
    }
  });
  
  return handlers;
}

// ==================== Default Theme Import ====================

import { createDefaultTheme } from './ui-schema';

// ==================== Exports ====================

export default {
  createRenderer,
  createDefaultRenderContext,
  createResponsiveContext,
  useResponsiveContext,
  useComponentState,
  useInteractions,
  styleToCssProperties,
  defaultComponentRenderers,
};