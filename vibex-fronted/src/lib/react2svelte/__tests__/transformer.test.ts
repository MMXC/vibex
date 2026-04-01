/**
 * Unit tests for React → Svelte transformer
 */

import {
  transformReactToSvelte,
  generateSvelteSFC,
  reactComponentToSvelte,
} from '../transformer';

describe('transformReactToSvelte', () => {
  describe('Button transformation', () => {
    it('should transform onClick to on:click', () => {
      const reactCode = '<Button onClick={handleClick}>Click me</Button>';
      const result = transformReactToSvelte(reactCode, 'Button');

      expect(result.svelteCode).toContain('on:click=');
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      expect(result.isSupported).toBe(true);
    });

    it('should transform className to class', () => {
      const reactCode = '<div className="my-class">Content</div>';
      const result = transformReactToSvelte(reactCode, 'Button');

      expect(result.svelteCode).toContain('class=');
      expect(result.svelteCode).not.toContain('className=');
    });

    it('should handle disabled prop', () => {
      const reactCode = '<Button disabled={true}>Disabled</Button>';
      const result = transformReactToSvelte(reactCode, 'Button');

      expect(result.svelteCode).toContain('disabled=');
      expect(result.isSupported).toBe(true);
    });
  });

  describe('Input transformation', () => {
    it('should handle value binding for Input', () => {
      const reactCode = '<Input value={text} placeholder="Enter text" />';
      const result = transformReactToSvelte(reactCode, 'Input');

      expect(result.isSupported).toBe(true);
    });
  });

  describe('Card transformation', () => {
    it('should warn about children → slot conversion', () => {
      const reactCode = '<Card>Some content</Card>';
      const result = transformReactToSvelte(reactCode, 'Card');

      const hasSlotWarning = result.warnings.some((w) =>
        w.includes('slot')
      );
      expect(hasSlotWarning).toBe(true);
    });
  });

  describe('Event handlers', () => {
    it('should transform multiple event handlers', () => {
      const reactCode = `
        <button
          onClick={handleClick}
          onMouseEnter={handleEnter}
          onBlur={handleBlur}
        >
          Button
        </button>
      `;
      const result = transformReactToSvelte(reactCode, 'Button');

      expect(result.svelteCode).toContain('on:click=');
      expect(result.svelteCode).toContain('on:mouseenter=');
      expect(result.svelteCode).toContain('on:blur=');
    });
  });

  describe('Unknown component', () => {
    it('should pass through code unchanged for unknown component', () => {
      const reactCode = '<UnknownComponent />';
      const result = transformReactToSvelte(reactCode, 'UnknownComponent');

      expect(result.svelteCode).toBe(reactCode);
      expect(result.isSupported).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('JSX comments removal', () => {
    it('should remove JSX comments', () => {
      const reactCode = '{/* This is a comment */}<div>Content</div>';
      const result = transformReactToSvelte(reactCode, 'Button');

      expect(result.svelteCode).not.toContain('This is a comment');
    });
  });

  describe('Modal transformation', () => {
    it('should transform onClose event', () => {
      const reactCode = '<Modal onClose={handleClose} title="Modal">Content</Modal>';
      const result = transformReactToSvelte(reactCode, 'Modal');

      expect(result.svelteCode).toContain('on:close=');
      expect(result.isSupported).toBe(true);
    });
  });
});

describe('generateSvelteSFC', () => {
  it('should generate complete Svelte SFC structure', () => {
    const reactCode = '<Button onClick={handleClick}>Click</Button>';
    const sfc = generateSvelteSFC(reactCode, 'Button');

    expect(sfc).toContain('<script lang="ts">');
    expect(sfc).toContain('<template>');
    expect(sfc).toContain('</template>');
    expect(sfc).toContain('<style scoped>');
    expect(sfc).toContain('</style>');
  });

  it('should include component name in comment', () => {
    const reactCode = '<Button>Test</Button>';
    const sfc = generateSvelteSFC(reactCode, 'Button');

    expect(sfc).toContain('Button');
  });
});

describe('reactComponentToSvelte', () => {
  it('should be an alias for generateSvelteSFC', () => {
    const reactCode = '<Card>Content</Card>';
    const result1 = reactComponentToSvelte(reactCode, 'Card');
    const result2 = generateSvelteSFC(reactCode, 'Card');

    expect(result1).toBe(result2);
  });
});
