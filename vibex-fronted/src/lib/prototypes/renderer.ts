/**
 * Prototype Renderer Engine
 *
 * @deprecated Use sub-modules instead:
 *   import { createRenderer } from './renderer/main-renderer';
 *   import type { RenderContext, RenderResult, RendererOptions } from './renderer/types';
 *   import { styleToCssProperties } from './renderer/style-utils';
 *   import { resolveTheme } from './renderer/theme-resolver';
 *
 * This module re-exports from the new sub-module structure for backward compatibility.
 *
 * @module prototypes/renderer
 */

export * from './renderer/types';
export * from './renderer/style-utils';
export * from './renderer/theme-resolver';
export * from './renderer/component-renderers';
export * from './renderer/main-renderer';
