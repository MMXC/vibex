/**
 * Component Renderers
 *
 * Extracted from renderer.ts — all component rendering functions for the
 * VibeX prototype rendering engine.
 *
 * @module prototypes/renderer/component-renderers
 */

import * as React from 'react';
import { createElement, useState } from 'react';
import type { UIComponent, RenderContext, ComponentRegistry } from './types';
import { styleToCssProperties, shadowToCss } from './style-utils';

// ==================== Component Renderers ====================

/**
 * Container component renderer
 */
export function renderContainer(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
  const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
  return createElement(
    'div',
    {
      id: component.id,
      'data-type': 'container',
      'data-name': component.name,
      className: 'vx-container',
      style: {
        width: '100%',
        ...style,
      },
    },
    children
  );
}

/**
 * Layout component renderer
 */
export function renderLayout(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
  const layoutType = (component.props?.layoutType as 'single' | 'split' | 'grid' | 'sidebar' | 'stack') || 'single';
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
}

/**
 * Form component renderer
 */
export function renderForm(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * Input component renderer
 */
export function renderInput(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Select component renderer
 */
export function renderSelect(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Button component renderer
 */
export function renderButton(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Text component renderer
 */
export function renderText(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Heading component renderer
 */
export function renderHeading(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Image component renderer
 */
export function renderImage(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Video component renderer
 */
export function renderVideo(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Card component renderer
 */
export function renderCard(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * List component renderer
 */
export function renderList(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * Table component renderer
 */
export function renderTable(component: UIComponent, context: RenderContext): React.ReactNode {
  const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
  const columns = (component.props?.columns as Array<{ key: string; title: string; dataIndex?: string }>) || [];
  const dataSource = (component.props?.dataSource as Array<Record<string, unknown>>) || [];
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
}

/**
 * Navigation component renderer
 */
export function renderNavigation(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Sidebar component renderer
 */
export function renderSidebar(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * Header component renderer
 */
export function renderHeader(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * Footer component renderer
 */
export function renderFooter(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * Modal component renderer
 */
export function renderModal(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * Drawer component renderer
 */
export function renderDrawer(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * Tabs component renderer
 */
export function renderTabs(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * Accordion component renderer
 */
export function renderAccordion(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * Chart component renderer
 */
export function renderChart(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Spinner component renderer
 */
export function renderSpinner(component: UIComponent, context: RenderContext): React.ReactNode {
  const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
  const size = (component.props?.size as string) || 'medium';
  const color = (component.props?.color as string) || context.theme.colors.primary;

  const sizes: Record<string, number> = {
    small: 16,
    medium: 32,
    large: 48,
  };

  const spinnerSize = (sizes[size] ?? sizes.medium) as number;

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
}

/**
 * Divider component renderer
 */
export function renderDivider(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Badge component renderer
 */
export function renderBadge(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

/**
 * Avatar component renderer
 */
export function renderAvatar(component: UIComponent, context: RenderContext): React.ReactNode {
  const style = component.style ? styleToCssProperties(component.style, context.theme) : {};
  const src = component.props?.src as string;
  const name = (component.props?.name as string) || '';
  const size = (component.props?.size as string) || 'medium';

  const sizes: Record<string, number> = {
    small: 24,
    medium: 40,
    large: 56,
  };

  const avatarSize = (sizes[size] ?? sizes.medium) as number;
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
}

/**
 * Tag component renderer
 */
export function renderTag(component: UIComponent, context: RenderContext): React.ReactNode {
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
}

/**
 * Alert component renderer
 */
export function renderAlert(component: UIComponent, context: RenderContext): React.ReactNode {
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

  const typeStyle = typeStyles[type] ?? typeStyles.info;

  return createElement(
    'div',
    {
      id: component.id,
      'data-type': 'alert',
      'data-name': component.name,
      className: 'vx-alert',
      style: {
        padding: '12px 16px',
        backgroundColor: typeStyle?.bg,
        border: `1px solid ${typeStyle?.border}`,
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
}

/**
 * Tooltip component renderer
 */
export function renderTooltip(component: UIComponent, context: RenderContext, children?: React.ReactNode): React.ReactNode {
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
}

// ==================== Default Component Registry ====================

/**
 * Default component renderers registry
 */
export const defaultComponentRenderers: ComponentRegistry = {
  container: renderContainer,
  layout: renderLayout,
  form: renderForm,
  input: renderInput,
  select: renderSelect,
  button: renderButton,
  text: renderText,
  heading: renderHeading,
  image: renderImage,
  video: renderVideo,
  card: renderCard,
  list: renderList,
  table: renderTable,
  navigation: renderNavigation,
  sidebar: renderSidebar,
  header: renderHeader,
  footer: renderFooter,
  modal: renderModal,
  drawer: renderDrawer,
  tabs: renderTabs,
  accordion: renderAccordion,
  chart: renderChart,
  spinner: renderSpinner,
  divider: renderDivider,
  badge: renderBadge,
  avatar: renderAvatar,
  tag: renderTag,
  alert: renderAlert,
  tooltip: renderTooltip,
};
