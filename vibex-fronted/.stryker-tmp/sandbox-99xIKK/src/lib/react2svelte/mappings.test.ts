/**
 * React2Svelte mappings tests
 * E5-T1: React2Svelte mappings tests
 */
// @ts-nocheck


import {
  React2SvelteMappings,
  getSvelteMapping,
  usesSlot,
  getSupportedComponents,
} from './mappings';

describe('React2SvelteMappings', () => {
  it('should export mappings for Button component', () => {
    const mapping = React2SvelteMappings.Button;
    expect(mapping).toBeDefined();
    expect(mapping.svelteTag).toBe('button');
    expect(mapping.usesSlot).toBe(true);
  });

  it('should export mappings for Input component', () => {
    const mapping = React2SvelteMappings.Input;
    expect(mapping).toBeDefined();
    expect(mapping.svelteTag).toBe('input');
    expect(mapping.usesSlot).toBe(false);
  });

  it('should export mappings for Card component', () => {
    const mapping = React2SvelteMappings.Card;
    expect(mapping).toBeDefined();
    expect(mapping.svelteTag).toBe('div');
    expect(mapping.usesSlot).toBe(true);
  });

  it('should export mappings for Container component', () => {
    const mapping = React2SvelteMappings.Container;
    expect(mapping).toBeDefined();
    expect(mapping.svelteTag).toBe('div');
    expect(mapping.usesSlot).toBe(true);
  });

  it('should export mappings for Text component', () => {
    const mapping = React2SvelteMappings.Text;
    expect(mapping).toBeDefined();
    expect(mapping.svelteTag).toBe('span');
    expect(mapping.usesSlot).toBe(false);
  });

  describe('Button mapping', () => {
    it('should map onClick event to on:click', () => {
      const mapping = React2SvelteMappings.Button;
      expect(mapping.events.onClick).toBe('on:click');
    });

    it('should preserve disabled prop', () => {
      const mapping = React2SvelteMappings.Button;
      expect(mapping.props.disabled).toBe('disabled');
    });

    it('should support mouse events', () => {
      const mapping = React2SvelteMappings.Button;
      expect(mapping.events.onMouseEnter).toBe('on:mouseenter');
      expect(mapping.events.onMouseLeave).toBe('on:mouseleave');
    });
  });

  describe('Input mapping', () => {
    it('should support onInput event', () => {
      const mapping = React2SvelteMappings.Input;
      expect(mapping.events.onInput).toBe('on:input');
    });

    it('should support onChange binding via bind:value', () => {
      const mapping = React2SvelteMappings.Input;
      expect(mapping.events.onChange).toBe('bind:value');
    });

    it('should preserve common props', () => {
      const mapping = React2SvelteMappings.Input;
      expect(mapping.props.placeholder).toBe('placeholder');
      expect(mapping.props.disabled).toBe('disabled');
    });
  });

  describe('Card mapping', () => {
    it('should use slot for children', () => {
      const mapping = React2SvelteMappings.Card;
      expect(mapping.usesSlot).toBe(true);
    });
  });
});

describe('getSvelteMapping', () => {
  it('should return mapping for known component', () => {
    const mapping = getSvelteMapping('Button');
    expect(mapping).toBeDefined();
    expect(mapping?.svelteTag).toBe('button');
  });

  it('should return undefined for unknown component', () => {
    const mapping = getSvelteMapping('UnknownComponent');
    expect(mapping).toBeUndefined();
  });
});

describe('usesSlot', () => {
  it('should return true for components with slot', () => {
    expect(usesSlot('Button')).toBe(true);
    expect(usesSlot('Card')).toBe(true);
    expect(usesSlot('Container')).toBe(true);
  });

  it('should return false for components without slot', () => {
    expect(usesSlot('Input')).toBe(false);
    expect(usesSlot('Text')).toBe(false);
  });
});

describe('getSupportedComponents', () => {
  it('should return all supported component names', () => {
    const components = getSupportedComponents();
    expect(components).toContain('Button');
    expect(components).toContain('Input');
    expect(components).toContain('Card');
    expect(components).toContain('Container');
    expect(components).toContain('Text');
    expect(components.length).toBeGreaterThanOrEqual(5);
  });
});
