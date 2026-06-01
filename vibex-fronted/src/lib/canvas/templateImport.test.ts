/**
 * templateImport.test.ts — E4 模板导入功能测试
 */

import { describe, it, expect } from 'vitest';
import { parseImportFile, mergeTemplates, type ImportedTemplates } from '@/lib/canvas/templateImport';
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

describe('parseImportFile', () => {
  it('parses valid JSON', () => {
    const data: ImportedTemplates = {
      version: '1.0',
      exportedAt: '2026-06-01T00:00:00Z',
      templates: [mockTemplate],
    };
    const result = parseImportFile(JSON.stringify(data));
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.version).toBe('1.0');
      expect(result.templates).toHaveLength(1);
    }
  });

  it('rejects invalid JSON', () => {
    const result = parseImportFile('not json');
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Invalid JSON');
    }
  });

  it('rejects missing version', () => {
    const result = parseImportFile(JSON.stringify({ templates: [] }));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('missing version');
    }
  });

  it('rejects non-array templates', () => {
    const result = parseImportFile(JSON.stringify({ version: '1.0', templates: 'not array' }));
    expect('error' in result).toBe(true);
  });
});

describe('mergeTemplates', () => {
  it('adds new templates when no conflict', () => {
    const existing: RequirementTemplate[] = [];
    const incoming: ImportedTemplates = {
      version: '1.0',
      templates: [mockTemplate],
    };
    const result = mergeTemplates(existing, incoming, new Set());
    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.conflicts).toHaveLength(0);
  });

  it('detects conflicts', () => {
    const existing: RequirementTemplate[] = [mockTemplate];
    const incoming: ImportedTemplates = {
      version: '1.0',
      templates: [{ ...mockTemplate }],
    };
    const result = mergeTemplates(existing, incoming, new Set(['t1']));
    expect(result.conflicts).toHaveLength(1);
    expect(result.skipped).toBe(1);
  });
});
