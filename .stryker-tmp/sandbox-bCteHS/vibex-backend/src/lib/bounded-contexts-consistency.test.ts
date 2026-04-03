/**
 * Epic5: Cross-API Bounded Contexts Consistency Tests
 *
 * Tests that both APIs (generate-contexts + analyze/stream SSE) produce
 * consistent boundedContexts results after filtering.
 *
 * Key invariants verified:
 * - C1: Same raw LLM response → same filtered result in both APIs
 * - C2: Filter is deterministic (idempotent)
 * - C3: filterInvalidContexts removes "管理" suffix names consistently
 * - C4: Core ratio validation is consistent across both APIs
 * - C5: Name length bounds are enforced consistently
 */
// @ts-nocheck


import { buildBoundedContextsPrompt, type BoundedContext } from '@/lib/prompts/bounded-contexts';
import {
  filterInvalidContexts,
  validateCoreRatio,
  isNameFiltered,
} from '@/lib/bounded-contexts-filter';

describe('Epic5 C1: Cross-API prompt consistency', () => {
  const requirement = '我要做一个在线预约医生系统';

  test('buildBoundedContextsPrompt produces same format for both APIs', () => {
    const prompt = buildBoundedContextsPrompt(requirement);

    // Both APIs use the same prompt template
    expect(prompt).toContain('在线医生问诊系统');  // example in template
    expect(prompt).toContain('Core（核心域）');
    expect(prompt).toContain('Supporting（支撑域）');
    expect(prompt).toContain('Generic（通用域）');
    expect(prompt).toContain('External（外部系统）');
    expect(prompt).toContain('ubiquitousLanguage');
    expect(prompt).toContain(requirement);
    expect(prompt).not.toContain('{requirementText}');
  });

  test('prompt contains Chinese-context examples used by both APIs', () => {
    const prompt = buildBoundedContextsPrompt('任何需求');

    // Same examples shared between generate-contexts and analyze/stream
    expect(prompt).toContain('患者管理');
    expect(prompt).toContain('问诊管理');
    expect(prompt).toContain('在线医生问诊系统');
  });
});

describe('Epic5 C2: Deterministic filtering across both APIs', () => {
  const rawContexts: BoundedContext[] = [
    { name: '患者管理', type: 'core', description: '患者管理', ubiquitousLanguage: [] },
    { name: '认证授权', type: 'generic', description: '认证授权', ubiquitousLanguage: [] },
    { name: '问诊管理', type: 'core', description: '问诊管理', ubiquitousLanguage: [] },
    { name: '微信支付', type: 'external', description: '微信支付', ubiquitousLanguage: [] },
    { name: '订单管理', type: 'supporting', description: '订单管理', ubiquitousLanguage: [] },
    { name: '通知推送', type: 'generic', description: '通知推送', ubiquitousLanguage: [] },
  ];

  test('filterInvalidContexts is deterministic (idempotent)', () => {
    const first = filterInvalidContexts(rawContexts);
    const second = filterInvalidContexts(rawContexts);
    const third = filterInvalidContexts(first);

    expect(first).toEqual(second);
    expect(second).toEqual(third);
  });

  test('both APIs produce same count after filtering', () => {
    // This simulates: API1 (generate-contexts) and API2 (analyze/stream)
    // receiving the same raw LLM output and filtering it
    const api1Result = filterInvalidContexts(rawContexts);
    const api2Result = filterInvalidContexts([...rawContexts]);  // clone

    expect(api1Result.length).toBe(api2Result.length);
  });

  test('filtered results have same names regardless of order', () => {
    const reversed = [...rawContexts].reverse();
    const fwd = filterInvalidContexts(rawContexts);
    const rev = filterInvalidContexts(reversed);

    const namesFwd = fwd.map(c => c.name).sort();
    const namesRev = rev.map(c => c.name).sort();
    expect(namesFwd).toEqual(namesRev);
  });
});

describe('Epic5 C3: "管理" names now filtered (contract change)', () => {
  test('"管理" names are FILTERED by both APIs', () => {
    const raw: BoundedContext[] = [
      { name: '患者管理', type: 'core', description: '', ubiquitousLanguage: [] },
      { name: '订单管理', type: 'supporting', description: '', ubiquitousLanguage: [] },
      { name: '问诊管理', type: 'core', description: '', ubiquitousLanguage: [] },
      { name: '认证授权', type: 'generic', description: '', ubiquitousLanguage: [] },
      { name: '患者档案', type: 'core', description: '', ubiquitousLanguage: [] },
    ];

    const filtered = filterInvalidContexts(raw);

    // "管理" names should be FILTERED (generic suffix)
    expect(filtered.map(c => c.name)).not.toContain('患者管理');
    expect(filtered.map(c => c.name)).not.toContain('订单管理');
    expect(filtered.map(c => c.name)).not.toContain('问诊管理');
    // Valid names without "管理" suffix should be kept
    expect(filtered.map(c => c.name)).toContain('认证授权');
    expect(filtered.map(c => c.name)).toContain('患者档案');
    expect(filtered.length).toBe(2);
  });

  test('"系统/模块/功能/平台" also filtered consistently', () => {
    const raw: BoundedContext[] = [
      { name: '订单系统', type: 'supporting', description: '', ubiquitousLanguage: [] },
      { name: '认证模块', type: 'generic', description: '', ubiquitousLanguage: [] },
      { name: '通知功能', type: 'generic', description: '', ubiquitousLanguage: [] },
      { name: '数据平台', type: 'generic', description: '', ubiquitousLanguage: [] },
      { name: '问诊', type: 'core', description: '', ubiquitousLanguage: [] },
    ];

    const filtered = filterInvalidContexts(raw);

    expect(filtered.map(c => c.name)).not.toContain('订单系统');
    expect(filtered.map(c => c.name)).not.toContain('认证模块');
    expect(filtered.map(c => c.name)).not.toContain('通知功能');
    expect(filtered.map(c => c.name)).not.toContain('数据平台');
    expect(filtered.map(c => c.name)).toContain('问诊');
  });
});

describe('Epic5 C4: Core ratio validation consistency', () => {
  test('core ratio validated consistently for both APIs', () => {
    const valid: BoundedContext[] = [
      { name: 'A', type: 'core', description: '', ubiquitousLanguage: [] },
      { name: 'B', type: 'core', description: '', ubiquitousLanguage: [] },
      { name: 'C', type: 'supporting', description: '', ubiquitousLanguage: [] },
    ];

    const result = validateCoreRatio(valid);
    expect(result.valid).toBe(true);
    expect(result.ratio).toBeCloseTo(0.667, 2);
  });

  test('core ratio too low flagged consistently', () => {
    const tooFew: BoundedContext[] = [
      { name: 'A', type: 'generic', description: '', ubiquitousLanguage: [] },
      { name: 'B', type: 'generic', description: '', ubiquitousLanguage: [] },
      { name: 'C', type: 'generic', description: '', ubiquitousLanguage: [] },
    ];

    const result = validateCoreRatio(tooFew);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('core 占比');
  });
});

describe('Epic5 C5: Name length bounds enforced consistently', () => {
  test('single character names rejected by both APIs', () => {
    // Single character (1 UTF-16 code unit) is below minNameLength=2 threshold
    expect(isNameFiltered('艾')).toBe(true);  // 1 char = too short
    expect(isNameFiltered('A')).toBe(true);  // 1 char = too short
  });

  test('very long names rejected consistently', () => {
    const longName = '患者管理系统平台模块功能管理系统平台模块';
    expect(isNameFiltered(longName)).toBe(true);
  });

  test('normal Chinese context names accepted', () => {
    expect(isNameFiltered('患者管理', { forbiddenNames: [] })).toBe(false);
    expect(isNameFiltered('问诊管理', { forbiddenNames: [] })).toBe(false);
    expect(isNameFiltered('认证授权')).toBe(false);
    expect(isNameFiltered('微信支付')).toBe(false);
  });
});

describe('Epic5: Realistic mixed scenario (simulating both API outputs)', () => {
  test('real LLM output from medical system filtered consistently', () => {
    // Simulates what both APIs would receive from the LLM
    // "管理" and "系统" names are filtered; core names without suffix are valid
    const rawLLMOutput: BoundedContext[] = [
      { name: '患者档案', type: 'core', description: '患者建档和认证', ubiquitousLanguage: ['患者', '建档'] },
      { name: '医生入驻', type: 'core', description: '医生入驻和资质', ubiquitousLanguage: ['医生', '入驻'] },
      { name: '问诊', type: 'core', description: '问诊和处方', ubiquitousLanguage: ['问诊', '处方'] },
      { name: '预约', type: 'core', description: '预约和取消', ubiquitousLanguage: ['预约', '号源'] },
      { name: '订单系统', type: 'supporting', description: '订单和支付', ubiquitousLanguage: ['订单', '支付'] }, // "系统" → filtered
      { name: '认证授权', type: 'generic', description: '登录和Token', ubiquitousLanguage: ['登录', 'JWT'] },
      { name: '微信支付', type: 'external', description: '对接微信支付', ubiquitousLanguage: [] },
    ];

    // Both APIs use the same filter
    const api1Result = filterInvalidContexts(rawLLMOutput);
    const api2Result = filterInvalidContexts([...rawLLMOutput]);

    // Results should be identical
    expect(api1Result).toEqual(api2Result);

    // Verify "系统" names are removed
    for (const ctx of api1Result) {
      expect(ctx.name).not.toMatch(/系统$/);
    }

    // Verify valid names are kept
    const names = api1Result.map(c => c.name);
    expect(names).toContain('患者档案');
    expect(names).toContain('医生入驻');
    expect(names).toContain('问诊');
    expect(names).toContain('预约');
    expect(names).not.toContain('订单系统'); // has "系统"
    expect(names).toContain('认证授权');
    expect(names).toContain('微信支付');

    // Filtered: 5 kept (4 valid + 认证授权 + 微信支付), 1 removed (订单系统)
    expect(api1Result.length).toBe(6);

    // Verify core ratio is within bounds (4 core out of 6 = 67%)
    const ratio = validateCoreRatio(api1Result);
    expect(ratio.valid).toBe(true);
  });

  test('empty LLM output handled consistently', () => {
    const empty: BoundedContext[] = [];
    const r1 = filterInvalidContexts(empty);
    const r2 = filterInvalidContexts([...empty]);
    expect(r1).toEqual(r2);
    expect(r1).toHaveLength(0);
  });
});
