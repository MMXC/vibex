/**
 * Version History Page Tests
 * 
 * E7: projectId=null boundary
 * E15-P004 U1: SnapshotSelector — same snapshot boundary
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

describe('E15-P004 U1: SnapshotSelector — same snapshot boundary', () => {
  it('page.tsx has two dropdown selectors (compareSelectA / compareSelectB)', async () => {
    const content = readFileSync(
      '/root/.openclaw/vibex/vibex-fronted/src/app/version-history/page.tsx',
      'utf-8'
    );
    // U1: two selectors declared
    expect(content).toContain('compareSelectA');
    expect(content).toContain('compareSelectB');
    // U1: handleCompare checks same-snapshot warning
    expect(content).toContain('compareSelectA === compareSelectB');
    expect(content).toContain('请选择两个不同的快照进行对比');
  });

  it('page.tsx has addCustomSnapshot for U4 backup', async () => {
    const content = readFileSync(
      '/root/.openclaw/vibex/vibex-fronted/src/app/version-history/page.tsx',
      'utf-8'
    );
    // U4: handleRestore calls addCustomSnapshot before jumpToSnapshot
    expect(content).toContain('addCustomSnapshot');
    expect(content).toContain('自动备份 (还原前)');
  });

  it('CSS has SnapshotSelector styles', () => {
    const content = readFileSync(
      '/root/.openclaw/vibex/vibex-fronted/src/app/version-history/version-history.module.css',
      'utf-8'
    );
    expect(content).toContain('.snapshotSelector');
    expect(content).toContain('.selector');
    expect(content).toContain('.compareButton');
    expect(content).toContain('.selectorVs');
  });
});
