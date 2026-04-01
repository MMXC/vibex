/**
 * React → Svelte component mapping table
 * Defines prop transformations when converting React components to Svelte 4
 *
 * Reference: components/react2vue/ for the React → Vue mapping pattern
 */

// React → Svelte component mapping
export const React2SvelteMappings = {
  Button: {
    svelteComponent: 'VibeXButton',
    eventSyntax: 'on:',
    props: {
      onClick: 'on:click',
      disabled: 'disabled',
      variant: 'variant',
      size: 'size',
    },
    children: null, // Svelte uses slot
  },
  Input: {
    svelteComponent: 'VibeXInput',
    binding: 'bind:value',
    props: {
      placeholder: 'placeholder',
      disabled: 'disabled',
    },
    children: null,
  },
  Card: {
    svelteComponent: 'VibeXCard',
    props: {
      title: 'title',
      content: 'content',
      footer: 'footer',
    },
    children: '<slot />', // React children → Svelte slot
  },
  Modal: {
    svelteComponent: 'VibeXModal',
    props: {
      visible: 'open',
      title: 'title',
    },
    eventSyntax: 'on:',
    eventMappings: {
      onClose: 'on:close',
    },
    children: '<slot />',
  },
} as const;

export type ReactComponentName = keyof typeof React2SvelteMappings;

/**
 * Get Svelte component name for a React component
 */
export function getSvelteComponent(reactName: ReactComponentName): string {
  return React2SvelteMappings[reactName]?.svelteComponent ?? reactName;
}

/**
 * Transform a React prop/event name to its Svelte equivalent
 */
export function getSveltePropName(
  reactName: ReactComponentName,
  reactProp: string
): string {
  const mapping = React2SvelteMappings[reactName as keyof typeof React2SvelteMappings];
  if (!mapping) return reactProp;

  // Check event mappings first
  if ('eventMappings' in mapping && mapping.eventMappings) {
    const eventMapping = (mapping.eventMappings as Record<string, string>)[reactProp];
    if (eventMapping) return eventMapping;
  }

  // Check regular prop mappings
  const propMapping = (mapping.props as Record<string, string>)[reactProp];
  if (propMapping) return propMapping;

  return reactProp;
}
