/**
 * MermaidInitializer.spec.tsx — E1: Hydration root cause fix
 *
 * Tests verify:
 * - E1-F1: No setInterval (was causing hydration mismatch)
 * - E1-F1: No setTick state (was causing SSR/CSR mismatch)
 * - E1-F1: Returns null (no UI rendered)
 */
import React from 'react';
import { render } from '@testing-library/react';
import { MermaidInitializer } from '../MermaidInitializer';
import * as fs from 'fs';
import * as path from 'path';

describe('MermaidInitializer — E1: Hydration root cause fix', () => {
  const srcPath = path.join(__dirname, '..', 'MermaidInitializer.tsx');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(srcPath, 'utf-8');
  });

  it('E1-F1: 无 setInterval 关键字', () => {
    expect(src).not.toMatch(/setInterval/);
  });

  it('E1-F1: 无 setTick 关键字', () => {
    expect(src).not.toMatch(/setTick/);
  });

  it('E1-F1: 无 useState 导入（MermaidInitializer 不需要状态）', () => {
    expect(src).not.toMatch(/useState/);
  });

  it('E1-F1: 直接在 useEffect 中调用 initialize()', () => {
    expect(src).toMatch(/useEffect\(\(\) => \{[\s\S]*mermaidManager\.initialize\(\)/);
  });

  it('E1-F1: 组件返回 null（无 UI）', () => {
    const { container } = render(<MermaidInitializer />);
    expect(container.firstChild).toBeNull();
  });
});
