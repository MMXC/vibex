/**
 * Testing Library 选择器模式规范
 *
 * 记录 Epic 3 中验证过的正确选择器模式，防止同类问题回归。
 * 基于 dashboard/export/page 测试修复经验。
 *
 * Ref: prd.md Epic 3 S3.1-S3.3
 *
 * 验证策略: axe() 将 HTML 渲染到 document.body，screen/within 查询可用。
 */

import { screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Testing Library Selector Patterns (Epic 3 Reference)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });
  // ─── Pattern 1: "Found multiple" — use getAllByText + count ───────────────
  it('S3.2 Pattern: getAllByText with count — when same text appears multiple times', async () => {
    // WRONG: screen.getByText throws "Found multiple" when text appears >1 time
    // CORRECT: screen.getAllByText + count assertion
    const html =
      '<h2>Project 1</h2>' +
      '<div><span>Project 1</span></div>';
    await axe(document.body.innerHTML = html, { runOnly: { type: 'tag', values: ['wcag2a'] } });
    document.body.innerHTML = html;
    const all = screen.getAllByText('Project 1');
    expect(all.length).toBeGreaterThan(0);
    expect(all[0]).toBeInTheDocument();
  });

  it('S3.2 Pattern: within() — scope query to specific container', async () => {
    // CORRECT: scope query to a specific region to avoid "Found multiple"
    document.body.innerHTML =
      '<h2>Project 1</h2>' +
      '<div data-testid="card-area"><span>Project 1</span></div>';
    const cardArea = screen.getByTestId('card-area');
    expect(within(cardArea).getByText('Project 1')).toBeInTheDocument();
  });

  // ─── Pattern 2: Dynamic text (dates) — use regex ───────────────────────────
  it('S3.2 Pattern: regex for date formatting — "X月X日" locale format', async () => {
    // Dashboard renders dates as "4月12日" via toLocaleDateString('zh-CN')
    // WRONG: getByText('/更新于/') — this text does not exist in DOM
    // CORRECT: match the actual rendered date format with regex
    document.body.innerHTML = '<span>4月12日</span>';
    expect(screen.getByText(/\d+月\d+日/)).toBeInTheDocument();
  });

  it('S3.2 Pattern: regex — match multiple date patterns', async () => {
    document.body.innerHTML = '<span>1月1日</span><span>12月31日</span>';
    const all = screen.getAllByText(/\d+月\d+日/);
    expect(all.length).toBe(2);
  });

  // ─── Pattern 3: Multiple elements with same text — data-testid ─────────────
  it('S3.3 Pattern: getByTestId — unique identifier when text appears multiple times', async () => {
    // Export page: "Vue 3" appears in both format card label AND selected tab
    // WRONG: screen.getByText('Vue 3') throws "Found multiple"
    // CORRECT: use data-testid for unique identification
    document.body.innerHTML =
      '<button data-testid="format-card-vue">Vue 3</button>' +
      '<span>Vue 3</span>';
    expect(screen.getByTestId('format-card-vue')).toBeInTheDocument();
  });

  it('S3.3 Pattern: getByRole — prefer semantic role when available', async () => {
    // CORRECT: role + name is semantic and robust
    document.body.innerHTML =
      '<button role="tab" aria-selected="true">Vue 3</button>' +
      '<span>Vue 3</span>';
    expect(screen.getByRole('tab', { name: 'Vue 3' })).toBeInTheDocument();
  });

  it('S3.3 Pattern: data-testid convention — format-card-{id}', async () => {
    // Convention: format cards use data-testid="format-card-{id}"
    document.body.innerHTML =
      '<button data-testid="format-card-react-next">React + Next.js</button>' +
      '<button data-testid="format-card-vue">Vue 3</button>' +
      '<button data-testid="format-card-html">原生 HTML/CSS/JS</button>';
    expect(screen.getByTestId('format-card-react-next')).toBeInTheDocument();
    expect(screen.getByTestId('format-card-vue')).toBeInTheDocument();
    expect(screen.getByTestId('format-card-html')).toBeInTheDocument();
  });

  // ─── Pattern 4: Server Component redirect — no content to assert ────────────
  it('S3.1 Pattern: redirect-only Server Component — no content to assert', async () => {
    // HomePage (/app/page.tsx) calls redirect('/canvas') — renders <div /> in jsdom
    // WRONG: assert specific content (none exists in redirect-only component)
    // CORRECT: verify component renders without throwing (redirect tested at routing layer)
    document.body.innerHTML = ''; // empty render from redirect()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('S3.1 Pattern: redirect — tested at routing layer, not component layer', async () => {
    // Redirect behavior is verified by router integration tests, not component tests
    document.body.innerHTML = '<div data-testid="page-content" />';
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  // ─── Pattern 5: axe() + screen combination ─────────────────────────────────
  it('Pattern: axe() detects violations and screen queries work on rendered HTML', async () => {
    // axe() renders into document.body; screen queries then work globally
    document.body.innerHTML =
      '<button data-testid="submit">Submit</button>' +
      '<button data-testid="cancel">Cancel</button>';
    const results = await axe(document.body.innerHTML);
    expect(results.violations).toHaveLength(0);
    expect(screen.getByTestId('submit')).toBeInTheDocument();
    expect(screen.getByTestId('cancel')).toBeInTheDocument();
  });

  it('Pattern: getAllByRole — when multiple elements share the same role', async () => {
    document.body.innerHTML = '<button>Action</button><button>Action</button>';
    const buttons = screen.getAllByRole('button', { name: 'Action' });
    expect(buttons.length).toBe(2);
  });
});
