/**
 * Main Renderer
 *
 * Core renderer module that coordinates all sub-modules for the
 * VibeX prototype rendering engine.
 *
 * @module prototypes/renderer/main-renderer
 */

import * as React from 'react';
import { createElement, useCallback, useMemo, useEffect, useState } from 'react';
import type {
  UISchema,
  UIPage,
  UIComponent,
  UITheme,
  ComponentType,
  ComponentInteraction,
  RenderContext,
  RenderResult,
  RendererOptions,
  ComponentRegistry,
  ResponsiveContext,
  InteractionEvent,
} from './types';
import {
  defaultComponentRenderers,
  renderContainer,
  renderLayout,
  renderForm,
  renderInput,
  renderSelect,
  renderButton,
  renderText,
  renderHeading,
  renderImage,
  renderVideo,
  renderCard,
  renderList,
  renderTable,
  renderNavigation,
  renderSidebar,
  renderHeader,
  renderFooter,
  renderModal,
  renderDrawer,
  renderTabs,
  renderAccordion,
  renderChart,
  renderSpinner,
  renderDivider,
  renderBadge,
  renderAvatar,
  renderTag,
  renderAlert,
  renderTooltip,
} from './component-renderers';
import { styleToCssProperties } from './style-utils';
import { resolveTheme } from './theme-resolver';
import { createDefaultTheme } from '../ui-schema';

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

  // Map component type to renderer function
  const rendererMap: Record<string, (component: UIComponent, context: RenderContext, children?: React.ReactNode) => React.ReactNode> = {
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

  // Merge custom renderers with defaults
  const renderers: Record<string, (component: UIComponent, context: RenderContext, children?: React.ReactNode) => React.ReactNode> = {
    ...rendererMap,
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

// Re-export types and components for convenience
export { styleToCssProperties } from './style-utils';
export { resolveTheme, mapToCSSVars, getCSSVariable, themeToCSSString } from './theme-resolver';
export * from './component-renderers';
