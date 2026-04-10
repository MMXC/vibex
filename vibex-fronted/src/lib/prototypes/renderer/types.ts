/**
 * Renderer Type Definitions
 *
 * Extracted from renderer.ts — all TypeScript interfaces, types, and constants
 * for the VibeX prototype rendering engine.
 *
 * @module prototypes/renderer/types
 */

import type * as React from 'react';
import type {
  UISchema,
  UIPage,
  UIComponent,
  UITheme,
  ComponentType,
  ComponentStyle,
  ComponentInteraction,
  LayoutType,
} from '../ui-schema';

// ==================== Render Context ====================

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

// ==================== Renderer Core Types ====================

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

// ==================== Re-export from ui-schema ====================

export type {
  UISchema,
  UIPage,
  UIComponent,
  UITheme,
  ComponentType,
  ComponentStyle,
  ComponentInteraction,
  LayoutType,
};
