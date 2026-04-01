/**
 * Unit tests for React2Svelte mappings
 */

import {
  React2SvelteMappings,
  getSvelteComponent,
  getSveltePropName,
} from '../mappings';

describe('React2SvelteMappings', () => {
  describe('Button mapping', () => {
    it('should have Button in mappings', () => {
      expect(React2SvelteMappings.Button).toBeDefined();
    });

    it('should use on: event syntax', () => {
      expect(React2SvelteMappings.Button.eventSyntax).toBe('on:');
    });

    it('should map onClick to on:click', () => {
      expect(React2SvelteMappings.Button.props.onClick).toBe('on:click');
    });

    it('should pass through disabled prop', () => {
      expect(React2SvelteMappings.Button.props.disabled).toBe('disabled');
    });
  });

  describe('Input mapping', () => {
    it('should have Input in mappings', () => {
      expect(React2SvelteMappings.Input).toBeDefined();
    });

    it('should use bind:value for binding', () => {
      expect(React2SvelteMappings.Input.binding).toBe('bind:value');
    });
  });

  describe('Card mapping', () => {
    it('should have Card in mappings', () => {
      expect(React2SvelteMappings.Card).toBeDefined();
    });

    it('should use <slot /> for children', () => {
      expect(React2SvelteMappings.Card.children).toBe('<slot />');
    });
  });

  describe('Modal mapping', () => {
    it('should have Modal in mappings', () => {
      expect(React2SvelteMappings.Modal).toBeDefined();
    });

    it('should map onClose to on:close', () => {
      expect(React2SvelteMappings.Modal.eventMappings?.onClose).toBe('on:close');
    });
  });
});

describe('getSvelteComponent', () => {
  it('should return Svelte component name for Button', () => {
    expect(getSvelteComponent('Button')).toBe('VibeXButton');
  });

  it('should return original name for unknown component', () => {
    expect(getSvelteComponent('Unknown')).toBe('Unknown');
  });
});

describe('getSveltePropName', () => {
  it('should transform onClick to on:click for Button', () => {
    expect(getSveltePropName('Button', 'onClick')).toBe('on:click');
  });

  it('should return original prop for unknown component', () => {
    expect(getSveltePropName('Button', 'unknownProp')).toBe('unknownProp');
  });

  it('should handle event mappings for Modal', () => {
    expect(getSveltePropName('Modal', 'onClose')).toBe('on:close');
  });
});
