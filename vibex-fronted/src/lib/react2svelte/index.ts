/**
 * React → Svelte converter library
 * Converts React JSX components to Svelte 4 Single File Components (SFC)
 *
 * Usage:
 *   import { reactComponentToSvelte } from '@/lib/react2svelte';
 *   const svelteCode = reactComponentToSvelte(buttonReactCode, 'Button');
 */

// Re-export types and mapping utilities
export {
  React2SvelteMappings,
  type ReactComponentName,
} from './mappings';
export { getSvelteComponent, getSveltePropName } from './mappings';

// Re-export transformer
export {
  transformReactToSvelte,
  generateSvelteSFC,
  reactComponentToSvelte,
  type TransformResult,
} from './transformer';
