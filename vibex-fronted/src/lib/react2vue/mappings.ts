/**
 * React → Vue component mapping table
 * Defines prop transformations when converting React components to Vue 3 Composition API
 */

// React → Vue component mapping
export const React2VueMappings = {
  Button: {
    vueComponent: 'VibeXButton',
    props: { variant: 'type', size: 'size', disabled: 'disabled', onClick: '@click' },
  },
  Input: {
    vueComponent: 'VibeXInput',
    props: { value: 'modelValue', placeholder: 'placeholder', disabled: 'disabled' },
  },
  Card: {
    vueComponent: 'VibeXCard',
    props: { title: 'title', content: 'content', footer: 'footer' },
  },
  Modal: {
    vueComponent: 'VibeXModal',
    props: { visible: 'v-model', title: 'title', onClose: '@close' },
  },
} as const;

export type ReactComponentName = keyof typeof React2VueMappings;

/**
 * Get Vue component name for a React component
 */
export function getVueComponent(reactName: ReactComponentName): string {
  return React2VueMappings[reactName]?.vueComponent ?? reactName;
}

/**
 * Transform a React prop name to its Vue equivalent
 */
export function getVuePropName(
  reactName: ReactComponentName,
  reactProp: string
): string {
  const mapping = React2VueMappings[reactName]?.props;
  if (!mapping) return reactProp;
  return (mapping as Record<string, string>)[reactProp] ?? reactProp;
}
