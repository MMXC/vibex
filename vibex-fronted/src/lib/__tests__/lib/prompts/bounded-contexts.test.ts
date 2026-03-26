/**
 * Unit tests for bounded-contexts prompt module (Epic 1, S1.3)
 *
 * Verifies:
 * - T1: BOUNDED_CONTEXTS_PROMPT has required sections
 * - T2: All 4 type definitions present (core, supporting, generic, external)
 * - T3: Real example (在线医生问诊系统) included
 * - T4: buildBoundedContextsPrompt replaces placeholder correctly
 * - T5: buildBoundedContextsPrompt does not leave placeholder unreplaced
 */

import {
  BOUNDED_CONTEXTS_PROMPT,
  buildBoundedContextsPrompt,
  type BoundedContext,
} from '../../../prompts/bounded-contexts';
import {
  isNameFiltered,
  filterInvalidContexts,
  validateCoreRatio,
} from '../../../bounded-contexts-filter';

describe('BOUNDED_CONTEXTS_PROMPT content (T1-T3)', () => {
  test('T1: contains 4 required sections', () => {
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('资深 DDD');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('判断标准');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('在线医生问诊系统');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('ubiquitousLanguage');
  });

  test('T2: all 4 type definitions present', () => {
    ['core', 'supporting', 'generic', 'external'].forEach(t =>
      expect(BOUNDED_CONTEXTS_PROMPT).toContain(t)
    );
  });

  test('T3: contains real Chinese-context examples', () => {
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('患者管理');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('问诊管理');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('商品管理');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('认证授权');
  });

  test('T3: includes good and bad examples for learning', () => {
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('好的限界上下文划分');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('坏的划分');
  });
});

describe('buildBoundedContextsPrompt (T4-T5)', () => {
  test('T4: replaces {requirementText} placeholder', () => {
    const prompt = buildBoundedContextsPrompt('我要做一个电商系统');
    expect(prompt).toContain('我要做一个电商系统');
  });

  test('T5: does not leave placeholder unreplaced', () => {
    const prompt = buildBoundedContextsPrompt('test');
    expect(prompt).not.toContain('{requirementText}');
  });

  test('handles empty requirement gracefully', () => {
    const prompt = buildBoundedContextsPrompt('');
    expect(prompt).not.toContain('{requirementText}');
    expect(prompt).toContain(BOUNDED_CONTEXTS_PROMPT.replace('{requirementText}', ''));
  });

  test('handles long requirement text', () => {
    const longReq = 'a'.repeat(500);
    const prompt = buildBoundedContextsPrompt(longReq);
    expect(prompt).toContain(longReq);
  });
});

describe('isNameFiltered (filter module)', () => {
  test('filters names that are too short', () => {
    expect(isNameFiltered('A')).toBe(true);
    expect(isNameFiltered('认证')).toBe(false);
  });

  test('filters names that are too long', () => {
    expect(isNameFiltered('管理系统平台模块功能')).toBe(true);
  });

  test('filters forbidden pattern "管理"', () => {
    expect(isNameFiltered('患者管理')).toBe(true);
    expect(isNameFiltered('患者')).toBe(false);
  });

  test('filters forbidden pattern "系统"', () => {
    expect(isNameFiltered('订单系统')).toBe(true);
    expect(isNameFiltered('订单')).toBe(false);
  });

  test('accepts valid Chinese context names', () => {
    expect(isNameFiltered('患者管理', { forbiddenNames: [] })).toBe(false);
    expect(isNameFiltered('问诊', { minNameLength: 2 })).toBe(false);
    expect(isNameFiltered('问诊管理', { forbiddenNames: [] })).toBe(false);
  });

  test('custom options override defaults', () => {
    expect(isNameFiltered('问诊', { minNameLength: 3 })).toBe(true);
    expect(isNameFiltered('问诊', { forbiddenNames: ['问诊'] })).toBe(true);
  });
});

describe('filterInvalidContexts', () => {
  const contexts: BoundedContext[] = [
    { name: '患者管理', type: 'core', description: 'test', ubiquitousLanguage: [] },
    { name: '患者', type: 'core', description: 'test', ubiquitousLanguage: [] },
    { name: '问诊管理', type: 'core', description: 'test', ubiquitousLanguage: [] },
    { name: '认证授权', type: 'generic', description: 'test', ubiquitousLanguage: [] },
    { name: '模块X', type: 'supporting', description: 'test', ubiquitousLanguage: [] },
  ];

  test('filters out "管理" suffix by default', () => {
    const filtered = filterInvalidContexts(contexts);
    expect(filtered.map(c => c.name)).not.toContain('患者管理');
    expect(filtered.map(c => c.name)).not.toContain('问诊管理');
  });

  test('keeps valid names', () => {
    const filtered = filterInvalidContexts(contexts);
    expect(filtered.map(c => c.name)).toContain('患者');
    expect(filtered.map(c => c.name)).toContain('认证授权');
  });

  test('empty array returns empty', () => {
    expect(filterInvalidContexts([])).toHaveLength(0);
  });

  test('with custom options', () => {
    const filtered = filterInvalidContexts(contexts, { forbiddenNames: ['患者'] });
    expect(filtered.map(c => c.name)).not.toContain('患者');
  });
});

describe('validateCoreRatio', () => {
  const validContexts: BoundedContext[] = [
    { name: 'A', type: 'core', description: '', ubiquitousLanguage: [] },
    { name: 'B', type: 'core', description: '', ubiquitousLanguage: [] },
    { name: 'C', type: 'supporting', description: '', ubiquitousLanguage: [] },
  ];

  test('valid ratio within bounds', () => {
    const result = validateCoreRatio(validContexts);
    expect(result.valid).toBe(true);
    expect(result.ratio).toBeCloseTo(0.667, 2);
  });

  test('empty contexts is valid', () => {
    const result = validateCoreRatio([]);
    expect(result.valid).toBe(true);
    expect(result.ratio).toBe(0);
  });

  test('too few core contexts invalid', () => {
    const contexts: BoundedContext[] = [
      { name: 'A', type: 'generic', description: '', ubiquitousLanguage: [] },
      { name: 'B', type: 'generic', description: '', ubiquitousLanguage: [] },
      { name: 'C', type: 'generic', description: '', ubiquitousLanguage: [] },
    ];
    const result = validateCoreRatio(contexts, { minCoreRatio: 0.4 });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('core 占比');
  });

  test('too many core contexts invalid', () => {
    const contexts: BoundedContext[] = [
      { name: 'A', type: 'core', description: '', ubiquitousLanguage: [] },
      { name: 'B', type: 'core', description: '', ubiquitousLanguage: [] },
      { name: 'C', type: 'core', description: '', ubiquitousLanguage: [] },
    ];
    const result = validateCoreRatio(contexts, { maxCoreRatio: 0.5 });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('core 占比');
  });
});
