/**
 * Unit tests for React → Svelte transformer
 * E5-C2: onClick → on:click, onChange → bind:value
 * E5-C3: Svelte 4 compatible (no Svelte 5 runes)
 * E5-C4: children → <slot />
 * E5-C5: No React runtime imports in generated code
 */
// @ts-nocheck


import {
  reactComponentToSvelte,
  generateSvelteSFC,
} from '../transformer';

describe('reactComponentToSvelte', () => {
  describe('E5-C2: Event handling mappings', () => {
    it('should transform onClick to on:click', () => {
      const result = reactComponentToSvelte(
        '<Button onClick={handleClick}>Click</Button>',
        'Button'
      );
      expect(result.svelteCode).toContain('on:click=');
    });

    it('should transform onInput for Input', () => {
      const result = reactComponentToSvelte(
        '<Input onInput={handleInput} />',
        'Input'
      );
      // onInput is directly mapped via PATTERN_REPLACEMENTS
      expect(result.svelteCode).toContain('on:input=');
    });

    it('should transform className to class', () => {
      const result = reactComponentToSvelte(
        '<div className="my-class">Content</div>',
        'Button'
      );
      expect(result.svelteCode).toContain('class=');
      expect(result.svelteCode).not.toContain('className=');
    });
  });

  describe('E5-C4: children → slot conversion', () => {
    it('should use slot for components with usesSlot=true', () => {
      const result = reactComponentToSvelte(
        '<Card>Some content</Card>',
        'Card'
      );
      // Card has usesSlot=true
      expect(result.isSupported).toBe(true);
    });

    it('should transform {children} to <slot />', () => {
      const result = reactComponentToSvelte(
        '<Button>{children}</Button>',
        'Button'
      );
      expect(result.svelteCode).toContain('<slot />');
    });
  });

  describe('E5-C5: React runtime removal', () => {
    it('should remove React default import', () => {
      const result = reactComponentToSvelte(
        "import React from 'react';\n<Button>Click</Button>",
        'Button'
      );
      expect(result.svelteCode).not.toContain("from 'react'");
    });

    it('should remove React named imports', () => {
      const result = reactComponentToSvelte(
        "import { useState } from 'react';\n<Button>Click</Button>",
        'Button'
      );
      expect(result.svelteCode).not.toContain("from 'react'");
    });
  });

  describe('E5-C3: Svelte 5 rune detection', () => {
    it('should warn about $state rune', () => {
      const result = reactComponentToSvelte(
        '<script>let count = $state(0);</script><div>{count}</div>',
        'Button'
      );
      expect(result.warnings.some((w) => w.includes('Svelte 5 rune'))).toBe(true);
    });
  });

  describe('Unknown component', () => {
    it('should pass through unchanged with warning', () => {
      const result = reactComponentToSvelte(
        '<UnknownComponent />',
        'Unknown'
      );
      expect(result.svelteCode).toContain('<UnknownComponent');
      expect(result.isSupported).toBe(false);
    });
  });
});

describe('generateSvelteSFC', () => {
  it('should generate complete Svelte SFC structure', () => {
    const sfc = generateSvelteSFC(
      '<Button onClick={handleClick}>Click</Button>',
      'Button',
      ['label', 'onClick']
    );

    expect(sfc).toContain('<script lang="ts">');
    expect(sfc).toContain('<svelte:head>');
    expect(sfc).toContain('on:click=');
    expect(sfc).toContain('<style scoped>');
  });

  it('should include props export', () => {
    const sfc = generateSvelteSFC(
      '<Button>Test</Button>',
      'Button',
      ['label', 'onClick']
    );
    expect(sfc).toContain('export let');
  });

  it('should include auto-conversion comment', () => {
    const sfc = generateSvelteSFC('<Button>Test</Button>', 'Button');
    expect(sfc).toContain('Auto-converted from React to Svelte 4');
  });

  it('should return .svelte file extension', () => {
    const result = reactComponentToSvelte('<Button>Click</Button>', 'Button');
    expect(result.fileExtension).toBe('svelte');
  });
});
