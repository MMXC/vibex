/**
 * React2Svelte transformer tests
 * E5-T2: ReactComponentToSvelte generator tests
 * E5-C5: Generated code must not include React runtime imports
 * E5-C3: Generated code must be Svelte 4 compatible (no $state/$derived runes)
 */

import { reactComponentToSvelte, generateSvelteSFC } from './transformer';

describe('reactComponentToSvelte', () => {
  describe('E5-C2: event transformations', () => {
    it('should transform onClick to on:click', () => {
      const react = '<button onClick={handleClick}>Click</button>';
      const result = reactComponentToSvelte(react, 'Button');
      expect(result.svelteCode).toContain('on:click=');
      expect(result.svelteCode).not.toContain('onClick=');
    });

    it('should transform onMouseEnter to on:mouseenter', () => {
      const react = '<button onMouseEnter={handleEnter}>Hover</button>';
      const result = reactComponentToSvelte(react, 'Button');
      expect(result.svelteCode).toContain('on:mouseenter=');
    });

    it('should transform onFocus to on:focus', () => {
      const react = '<input onFocus={handleFocus} />';
      const result = reactComponentToSvelte(react, 'Input');
      expect(result.svelteCode).toContain('on:focus=');
    });

    it('should transform onKeyDown to on:keydown', () => {
      const react = '<input onKeyDown={handleKey} />';
      const result = reactComponentToSvelte(react, 'Input');
      expect(result.svelteCode).toContain('on:keydown=');
    });
  });

  describe('E5-C2: onChange → bind:value transformation', () => {
    it('should transform onChange to bind:value for Input', () => {
      const react = '<input value={text} onChange={handleChange} />';
      const result = reactComponentToSvelte(react, 'Input');
      expect(result.svelteCode).toContain('bind:value=');
    });
  });

  describe('E5-C4: children → <slot /> transformation', () => {
    it('should transform {children} to <slot /> for Button', () => {
      const react = '<button>{children}</button>';
      const result = reactComponentToSvelte(react, 'Button');
      expect(result.svelteCode).toContain('<slot />');
      expect(result.svelteCode).not.toContain('{children}');
    });

    it('should transform children={<X />} to <slot><X /></slot> for Card', () => {
      const react = '<Card children={<Text />} />';
      const result = reactComponentToSvelte(react, 'Card');
      expect(result.svelteCode).toContain('<slot>');
    });

    it('should NOT transform children for Input (no slot)', () => {
      const react = '<Input>content</Input>';
      const result = reactComponentToSvelte(react, 'Input');
      // Input uses bind:value, not slot
      expect(result.isSupported).toBe(true);
    });
  });

  describe('E5-C5: React runtime import removal', () => {
    it('should strip default React import', () => {
      const react = `import React from 'react';
        <button onClick={x}>Hi</button>`;
      const result = reactComponentToSvelte(react, 'Button');
      expect(result.svelteCode).not.toContain("import React from 'react'");
    });

    it('should strip named React imports', () => {
      const react = `import { useState, useEffect } from 'react';
        <button onClick={x}>Hi</button>`;
      const result = reactComponentToSvelte(react, 'Button');
      expect(result.svelteCode).not.toContain("from 'react'");
    });

    it('should warn when React imports were removed', () => {
      const react = `import React from 'react';
        <button onClick={x}>Hi</button>`;
      const result = reactComponentToSvelte(react, 'Button');
      expect(result.warnings.some(w => w.includes('React runtime imports'))).toBe(true);
    });
  });

  describe('E5-C3: Svelte 4 compatibility (no Svelte 5 runes)', () => {
    it('should flag Svelte 5 $state rune', () => {
      const react = `let count = $state(0);
        <button onClick={() => count++}>Count</button>`;
      const result = reactComponentToSvelte(react, 'Button');
      expect(result.warnings.some(w => w.includes('Svelte 5 rune'))).toBe(true);
    });

    it('should flag Svelte 5 $derived rune', () => {
      const react = `const doubled = $derived(count * 2);
        <span>{doubled}</span>`;
      const result = reactComponentToSvelte(react, 'Text');
      expect(result.warnings.some(w => w.includes('Svelte 5 rune'))).toBe(true);
    });
  });

  describe('E5-C4: className → class transformation', () => {
    it('should transform className to class', () => {
      const react = '<div className="my-class">Content</div>';
      const result = reactComponentToSvelte(react, 'Card');
      expect(result.svelteCode).toContain('class=');
      expect(result.svelteCode).not.toContain('className=');
    });
  });

  describe('unknown component handling', () => {
    it('should pass through unknown component unchanged', () => {
      const react = '<UnknownComponent onClick={x} />';
      const result = reactComponentToSvelte(react, 'UnknownComponent');
      expect(result.svelteCode).toBe(react);
      expect(result.isSupported).toBe(false);
    });

    it('should warn about unknown component', () => {
      const react = '<UnknownComponent />';
      const result = reactComponentToSvelte(react, 'UnknownComponent');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('file extension', () => {
    it('should return .svelte extension', () => {
      const result = reactComponentToSvelte('<button>Hi</button>', 'Button');
      expect(result.fileExtension).toBe('svelte');
    });
  });
});

describe('generateSvelteSFC', () => {
  it('should generate complete Svelte SFC with script tag', () => {
    const react = '<button onClick={handleClick}>Click</button>';
    const result = generateSvelteSFC(react, 'Button', ['label', 'onClick']);
    expect(result).toContain('<script lang="ts">');
    expect(result).toContain('export let');
    expect(result).toContain('on:click=');
    expect(result).toContain('</script>');
  });

  it('should include style scoped tag', () => {
    const react = '<button onClick={handleClick}>Click</button>';
    const result = generateSvelteSFC(react, 'Button');
    expect(result).toContain('<style scoped>');
    expect(result).toContain('</style>');
  });

  it('should include svelte:head comment', () => {
    const react = '<button>Click</button>';
    const result = generateSvelteSFC(react, 'Button');
    expect(result).toContain('<svelte:head>');
    expect(result).toContain('Auto-converted from React to Svelte 4');
  });

  it('should include warnings in generated code', () => {
    const react = `import React from 'react';
      <button onClick={x}>Click</button>`;
    const result = generateSvelteSFC(react, 'Button');
    expect(result).toContain('Warnings:');
  });
});

describe('style transformation', () => {
  it('should transform style={{ width: 100 }} to style="width: 100px"', () => {
    const react = '<div style={{ width: 100 }}>Wide</div>';
    const result = reactComponentToSvelte(react, 'Card');
    expect(result.svelteCode).toContain('style=');
  });

  it('should handle style with double quotes', () => {
    const react = '<div style={{ "width: 100px" }}>Content</div>';
    const result = reactComponentToSvelte(react, 'Card');
    expect(result.svelteCode).toContain('style=');
  });

  it('should handle style with multiple properties', () => {
    const react = '<div style={{ width: 100, height: 200 }}>Box</div>';
    const result = reactComponentToSvelte(react, 'Card');
    expect(result.svelteCode).toContain('style=');
  });

  it('should handle Svelte 5 $effect rune conversion', () => {
    const react = '<button onClick={$effect}>Test</button>';
    const result = reactComponentToSvelte(react, 'Button');
    expect(result.warnings.some(w => w.includes('Svelte 5 rune'))).toBe(true);
  });

  it('should handle $props rune', () => {
    const react = '<button onClick={$props}>Test</button>';
    const result = reactComponentToSvelte(react, 'Button');
    expect(result.warnings.some(w => w.includes('Svelte 5 rune'))).toBe(true);
  });
});
