/**
 * templateExport.test.ts — E4 模板导出功能测试
 */

import { describe, it, expect } from 'vitest';
import { exportTemplatesToBlob } from '@/lib/canvas/templateExport';
import type { RequirementTemplate } from '@/data/templates';

const mockTemplate: RequirementTemplate = {
  id: 't1',
  name: 'Test Template',
  description: 'A test template',
  category: 'flow',
  icon: '⚙️',
  version: 1,
  metadata: { tags: ['test'], author: 'test' },
  nodes: [],
  edges: [],
};

describe('templateExport', () => {
  it('exportTemplatesToBlob returns correct version', () => {
    const blob = exportTemplatesToBlob([mockTemplate]);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('exportTemplatesToBlob contains valid JSON', async () => {
    const blob = exportTemplatesToBlob([mockTemplate]);
    const text = await blob.text();
    const data = JSON.parse(text);
    expect(data.version).toBe('1.0');
    expect(data.templates).toHaveLength(1);
    expect(data.templates[0].id).toBe('t1');
    expect(data.exportedAt).toBeDefined();
  });

  it('exportTemplatesToBlob handles empty array', async () => {
    const blob = exportTemplatesToBlob([]);
    const text = await blob.text();
    const data = JSON.parse(text);
    expect(data.version).toBe('1.0');
    expect(data.templates).toHaveLength(0);
  });
});
