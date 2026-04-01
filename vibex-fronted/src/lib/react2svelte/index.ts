/**
 * React → Svelte conversion library
 * E5: Svelte Framework Export
 */

export { React2SvelteMappings } from './mappings';
export type { SvelteMapping, SvelteComponentName } from './mappings';
export {
  getSvelteMapping,
  usesSlot,
  getSupportedComponents,
} from './mappings';

export { reactComponentToSvelte, generateSvelteSFC } from './transformer';
export type { TransformResult } from './transformer';
