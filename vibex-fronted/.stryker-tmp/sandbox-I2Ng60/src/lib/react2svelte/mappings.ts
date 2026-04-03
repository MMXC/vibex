/**
 * React → Svelte component mapping table
 * E5-T1: React2Svelte mappings
 * Defines prop/event/style transformations when converting React components to Svelte 4
 */
// @ts-nocheck


export type SvelteComponentName = 'Button' | 'Input' | 'Card' | 'Container' | 'Text';

export interface SvelteMapping {
  /** The Svelte equivalent tag */
  svelteTag: string;
  /** Prop transformations: React prop → Svelte equivalent */
  props: Record<string, string>;
  /** Event transformations: React event → Svelte event */
  events: Record<string, string>;
  /** Whether children should become <slot /> */
  usesSlot: boolean;
}

export const React2SvelteMappings: Record<string, SvelteMapping> = {
  Button: {
    svelteTag: 'button',
    props: {
      disabled: 'disabled',
      type: 'type',
    },
    events: {
      onClick: 'on:click',
      onMouseEnter: 'on:mouseenter',
      onMouseLeave: 'on:mouseleave',
      onFocus: 'on:focus',
      onBlur: 'on:blur',
    },
    usesSlot: true,
  },
  Input: {
    svelteTag: 'input',
    props: {
      type: 'type',
      placeholder: 'placeholder',
      disabled: 'disabled',
      readonly: 'readonly',
      required: 'required',
    },
    events: {
      onInput: 'on:input',
      onChange: 'bind:value',
      onFocus: 'on:focus',
      onBlur: 'on:blur',
      onKeyDown: 'on:keydown',
      onKeyUp: 'on:keyup',
    },
    usesSlot: false,
  },
  Card: {
    svelteTag: 'div',
    props: {
      class: 'class',
    },
    events: {},
    usesSlot: true,
  },
  Container: {
    svelteTag: 'div',
    props: {
      class: 'class',
    },
    events: {},
    usesSlot: true,
  },
  Text: {
    svelteTag: 'span',
    props: {
      class: 'class',
    },
    events: {},
    usesSlot: false,
  },
} as const;

/**
 * Get Svelte mapping for a React component name
 */
export function getSvelteMapping(
  reactName: string
): SvelteMapping | undefined {
  return React2SvelteMappings[reactName];
}

/**
 * Check if a React component uses slot (for children)
 */
export function usesSlot(reactName: string): boolean {
  return React2SvelteMappings[reactName]?.usesSlot ?? false;
}

/**
 * Get all supported React component names
 */
export function getSupportedComponents(): SvelteComponentName[] {
  return Object.keys(React2SvelteMappings) as SvelteComponentName[];
}
