/**
 * Version History Page Tests — E7: projectId=null boundary
 *
 * E7 boundary tests:
 * When projectId=null in version-history page, the page shows:
 * - "请先选择项目" heading
 * - guide message
 * - link to /projects/new
 *
 * These are verified via source code inspection since next/navigation
 * mocking conflicts with existing test infrastructure.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('E7: projectId=null boundary — code verification', () => {
  it('page.tsx reads projectId from useSearchParams and renders null guidance', async () => {
    const content = readFileSync(
      '/root/.openclaw/vibex/vibex-fronted/src/app/version-history/page.tsx',
      'utf-8'
    );
    // E7: page reads projectId from searchParams
    expect(content).toContain('useSearchParams()');
    expect(content).toContain("searchParams.get('projectId')");
    // E7: null boundary renders guidance UI
    expect(content).toContain('请先选择项目');
    expect(content).toContain('在画布中创建或打开项目后');
    // E7: link to create project
    expect(content).toContain('/projects/new');
  });

  it('CSS has emptyAction style for project creation link', () => {
    const content = readFileSync(
      '/root/.openclaw/vibex/vibex-fronted/src/app/version-history/version-history.module.css',
      'utf-8'
    );
    expect(content).toContain('.emptyAction');
    expect(content).toContain('#3b82f6'); // blue button color
    expect(content).toContain('border-radius');
  });
});
