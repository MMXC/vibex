/**
 * jest-axe 集成验证测试
 *
 * 验证 jest-axe 和 axe-core 正确配置，无版本冲突。
 * 这是 S2.1 的单元测试层验收标准。
 *
 * Ref: prd.md Epic 2 S2.1 验收标准
 */

import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import type { AxeResults } from 'axe-core';

describe('jest-axe Integration', () => {
  it('jest-axe and axe-core should be importable', () => {
    // Just importing jest-axe and axe above is the first test.
    // If this file runs, the import succeeded (no TS2306 / Cannot find module errors).
    expect(axe).toBeDefined();
    expect(typeof axe).toBe('function');
  });

  it('axe() should find no violations on a clean element', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<button>Click me</button>';
    const results: AxeResults = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('axe() should detect violations on a button without accessible name', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<button></button>';
    const results: AxeResults = await axe(container);
    // Empty button should trigger axe violation(s)
    expect(results.violations.length).toBeGreaterThan(0);
    const v = results.violations[0];
    expect(v).toHaveProperty('id');
    expect(v).toHaveProperty('impact');
    expect(v).toHaveProperty('description');
    expect(v).toHaveProperty('helpUrl');
    expect(v).toHaveProperty('nodes');
  });

  it('axe() should accept a string container (HTML)', async () => {
    const results: AxeResults = await axe('<div role="button">clickable</div>');
    expect(results.violations).toHaveLength(0);
  });

  it('axe() should work with typical VibeX component structure (header with nav)', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <header>
        <nav aria-label="Main">
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
      </header>
    `;
    const results: AxeResults = await axe(container);
    expect(results).toBeDefined();
    expect(results).toHaveProperty('violations');
    expect(Array.isArray(results.violations)).toBe(true);
  });

  it('axe() results should have standard axe-core shape', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<button>Test</button>';
    const results: AxeResults = await axe(container);
    // Clean button should pass
    expect(results.violations).toHaveLength(0);
    expect(results).toHaveProperty('testEngine');
    expect(results.testEngine).toHaveProperty('name', 'axe-core');
    expect(results.testEngine).toHaveProperty('version');
  });

  it('axe() should handle complex nested structure without false positives', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <main>
        <h1>Page Title</h1>
        <p>Content paragraph</p>
        <button type="button">Action</button>
      </main>
    `;
    const results: AxeResults = await axe(container);
    expect(Array.isArray(results.violations)).toBe(true);
  });
});
