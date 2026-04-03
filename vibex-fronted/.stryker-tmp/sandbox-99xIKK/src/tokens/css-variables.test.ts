/**
 * Story 1.2 CSS Variables Test
 * 验证 tokens.css 中的 CSS 变量正确定义 (FE-1.2.1 ~ FE-1.2.5)
 */
// @ts-nocheck


import * as fs from 'fs';
import * as path from 'path';

const tokensCssPath = path.resolve(__dirname, '../styles/tokens.css');
let tokensCss: string;

beforeAll(() => {
  tokensCss = fs.readFileSync(tokensCssPath, 'utf-8');
});

function getVar(css: string, name: string): string | null {
  // 匹配 CSS 变量值，支持含空格的值（如 shadow）
  const regex = new RegExp(`--${name}:\\s*([^;]+)`);
  const match = css.match(regex);
  return match ? match[1].trim() : null;
}

// FE-1.2.1 颜色变量定义
describe('FE-1.2.1: 颜色变量', () => {
  it('--color-primary should be #3B82F6', () => {
    expect(getVar(tokensCss, 'color-primary')).toBe('#3B82F6');
  });

  it('--color-secondary should be #6366F1', () => {
    expect(getVar(tokensCss, 'color-secondary')).toBe('#6366F1');
  });

  it('--color-bg should be #0F172A', () => {
    expect(getVar(tokensCss, 'color-bg')).toBe('#0F172A');
  });

  it('--color-surface should be #1E293B', () => {
    expect(getVar(tokensCss, 'color-surface')).toBe('#1E293B');
  });

  it('--color-text should be #F8FAFC', () => {
    expect(getVar(tokensCss, 'color-text')).toBe('#F8FAFC');
  });

  it('--color-text-muted should be #94A3B8', () => {
    expect(getVar(tokensCss, 'color-text-muted')).toBe('#94A3B8');
  });
});

// FE-1.2.2 间距变量定义
describe('FE-1.2.2: 间距变量', () => {
  it('--spacing-xs should be 4px', () => {
    expect(getVar(tokensCss, 'spacing-xs')).toBe('4px');
  });

  it('--spacing-md should be 16px', () => {
    expect(getVar(tokensCss, 'spacing-md')).toBe('16px');
  });
});

// FE-1.2.3 字体变量定义
describe('FE-1.2.3: 字体变量', () => {
  it('--font-sans should contain system-ui', () => {
    const val = getVar(tokensCss, 'font-sans');
    expect(val).toContain('system-ui');
  });

  it('--font-size-base should be 1rem (16px)', () => {
    expect(getVar(tokensCss, 'font-size-base')).toBe('1rem');
  });
});

// FE-1.2.4 圆角与阴影变量
describe('FE-1.2.4: 圆角与阴影', () => {
  it('--radius-md should be 0.5rem (8px)', () => {
    expect(getVar(tokensCss, 'radius-md')).toBe('0.5rem');
  });

  it('--shadow-lg should contain 0 10px', () => {
    const val = getVar(tokensCss, 'shadow-lg');
    expect(val).toContain('0 10px');
  });
});

// FE-1.2.5 过渡动画变量
describe('FE-1.2.5: 过渡动画', () => {
  it('--transition-fast should be 150ms', () => {
    expect(getVar(tokensCss, 'transition-fast')).toBe('150ms');
  });

  it('--ease-out should contain cubic-bezier', () => {
    const val = getVar(tokensCss, 'ease-out');
    expect(val).toContain('cubic-bezier');
  });
});

// TEST-1.2.1 综合验证
describe('TEST-1.2.1: CSS变量综合验证', () => {
  it('所有必需变量都已定义', () => {
    const requiredVars = [
      'color-primary',
      'color-secondary',
      'color-bg',
      'color-surface',
      'color-text',
      'color-text-muted',
      'spacing-xs',
      'spacing-md',
      'font-sans',
      'font-size-base',
      'font-weight-normal',
      'font-weight-medium',
      'font-weight-bold',
      'radius-md',
      'radius-full',
      'shadow-md',
      'shadow-lg',
      'transition-fast',
      'transition-normal',
      'ease-out',
      'ease-in-out',
    ];
    for (const v of requiredVars) {
      expect(getVar(tokensCss, v)).not.toBeNull();
    }
  });

  it('暗色主题覆盖了 Story 1.2 关键变量', () => {
    // 提取 [data-theme="dark"] 块
    const darkMatch = tokensCss.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/);
    expect(darkMatch).not.toBeNull();
    const darkCss = darkMatch![1];
    expect(getVar(darkCss, 'color-bg')).toBe('#0F172A');
    expect(getVar(darkCss, 'color-surface')).toBe('#1E293B');
    expect(getVar(darkCss, 'color-text')).toBe('#F8FAFC');
    expect(getVar(darkCss, 'color-text-muted')).toBe('#94A3B8');
  });
});
