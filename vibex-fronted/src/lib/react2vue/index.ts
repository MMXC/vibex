/**
 * React → Vue component conversion library
 * Provides mappings and transformation utilities for multi-framework export
 */

export {
  React2VueMappings,
  getVueComponent,
  getVuePropName,
  type ReactComponentName,
} from './mappings';

export {
  transformReactToVue,
  generateVueTemplate,
  type TransformResult,
} from './transformer';
