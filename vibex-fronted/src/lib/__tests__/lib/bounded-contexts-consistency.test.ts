/**
 * BoundedContexts Consistency Tests (Epic1 - vibex-bc-prompt-fix)
 *
 * Verifies type consistency across the SSE pipeline:
 * - Epic1: `BoundedContext` in lib/prompts/bounded-contexts.ts
 * - Canvas: `BoundedContext` in lib/canvas/api/dddApi.ts
 * - Domain: `BoundedContext` in services/api/types/prototype/domain.ts
 * - Backend SSE step_context event payload shape
 *
 * Tests T1-T6: Type shape consistency, filter compatibility, SSE event field mapping
 */

import { isNameFiltered, filterInvalidContexts, validateCoreRatio } from '../../bounded-contexts-filter';

// Import all three BoundedContext types
import type { BoundedContext as PromptBC } from '../../prompts/bounded-contexts';
import type { BoundedContext as CanvasBC } from '../../canvas/api/canvasSseApi';
import type { BoundedContext as DomainBC } from '@/services/api/types/prototype/domain';

// =============================================================================
// T1: Verify SSE step_context event payload shape
// Backend sends: { id, name, description, type }
// =============================================================================

describe('T1: SSE step_context payload shape matches frontend BoundedContext (Canvas)', () => {
  /**
   * Backend SSE step_context event sends:
   * {
   *   content: string,
   *   mermaidCode: string,
   *   confidence: number,
   *   boundedContexts: [{ id, name, description, type }]
   * }
   *
   * Canvas canvasSseApi.ts BoundedContext type: { id, name, description, type, keyResponsibilities? }
   * → All SSE fields are covered. id is required in Canvas type but optional in SSE payload (backend generates it).
   */
  test('T1a: SSE payload fields are assignable to Canvas BoundedContext', () => {
    const ssePayload = {
      id: 'ctx_abc123',
      name: '患者管理',
      description: '患者注册建档、实名认证、健康档案',
      type: 'core' as const,
    };

    // Canvas BC expects: id, name, description, type (keyResponsibilities optional)
    const canvasBC: CanvasBC = ssePayload;
    expect(canvasBC.name).toBe('患者管理');
    expect(canvasBC.type).toBe('core');
    expect(canvasBC.id).toBe('ctx_abc123');
  });

  test('T1b: SSE payload with optional keyResponsibilities', () => {
    const ssePayload = {
      id: 'ctx_xyz789',
      name: '认证授权',
      description: '登录注册、Token、JWT',
      type: 'generic' as const,
      keyResponsibilities: ['登录验证', 'Token签发', '权限校验'],
    };

    const canvasBC: CanvasBC = ssePayload;
    expect(canvasBC.keyResponsibilities).toHaveLength(3);
  });
});

// =============================================================================
// T2: Verify Epic1 BoundedContext (prompts module) vs SSE payload
// Epic1 BC: { name, type, description, ubiquitousLanguage }
// SSE payload: { id, name, description, type }
// =============================================================================

describe('T2: Epic1 BoundedContext vs SSE payload - field mismatch analysis', () => {
  /**
   * CRITICAL: Epic1 BoundedContext has ubiquitousLanguage but SSE sends id.
   * These types are NOT compatible — this is the core consistency issue.
   * The prompts module BoundedContext is used by the LLM prompt template,
   * but the SSE pipeline uses a different shape.
   *
   * Recommendation: SSE shape should add ubiquitousLanguage (preserve from LLM),
   * OR Epic1 type should be updated to match SSE shape with id.
   */

  test('T2a: Epic1 BoundedContext has ubiquitousLanguage (not in SSE)', () => {
    const epic1BC: PromptBC = {
      name: '患者管理',
      type: 'core',
      description: '患者注册建档',
      ubiquitousLanguage: ['患者', '健康档案', '实名认证'],
    };
    expect(epic1BC.ubiquitousLanguage).toHaveLength(3);
    // SSE payload has NO ubiquitousLanguage field
  });

  test('T2b: Epic1 BoundedContext is missing id (required by SSE)', () => {
    const epic1BC: PromptBC = {
      name: '患者管理',
      type: 'core',
      description: '患者注册建档',
      ubiquitousLanguage: [],
    };
    // Epic1 BC has no 'id' field — SSE backend generates it
    expect((epic1BC as unknown as { id: string }).id).toBeUndefined();
  });

  test('T2c: SSE payload has id (not in Epic1 BoundedContext)', () => {
    const sseContext = {
      id: 'ctx_12345',
      name: '患者管理',
      description: '患者注册建档',
      type: 'core' as const,
    };
    expect(sseContext.id).toBe('ctx_12345');
  });

  test('T2d: Epic1 BC cannot be directly assigned to Canvas BC (type incompatibility)', () => {
    const epic1BC: PromptBC = {
      name: '患者管理',
      type: 'core',
      description: '患者注册建档',
      ubiquitousLanguage: ['患者', '健康档案'],
    };

    // CanvasBC requires 'id', Epic1 doesn't have it
    // This test documents the type gap — TS would error here
    const hasId = 'id' in epic1BC;
    const hasUbiquitous = 'ubiquitousLanguage' in epic1BC;
    expect(hasId).toBe(false);
    expect(hasUbiquitous).toBe(true);
  });
});

// =============================================================================
// T3: filterInvalidContexts compatibility with SSE payload shape
// filterInvalidContexts checks name/description/type fields.
// SSE shape has: id, name, description, type (extra id field should not break filter).
// =============================================================================

describe('T3: filterInvalidContexts handles SSE payload shape (with extra id field)', () => {
  /**
   * The filter function only inspects 'name', 'type' fields.
   * SSE payload adds 'id' — this should NOT affect filtering.
   * However, Epic1 BoundedContext has 'ubiquitousLanguage' which
   * filterInvalidContexts does NOT validate (by design).
   */

  test('T3a: filterInvalidContexts ignores extra id field', () => {
    const contextsWithId = [
      { id: 'ctx_1', name: '患者', type: 'core' as const, description: '患者管理', ubiquitousLanguage: [] },
      { id: 'ctx_2', name: '认证授权', type: 'generic' as const, description: '认证', ubiquitousLanguage: [] },
    ];

    // Should filter nothing — all names are valid
    const filtered = filterInvalidContexts(contextsWithId as unknown as PromptBC[]);
    expect(filtered).toHaveLength(2);
  });

  test('T3b: filterInvalidContexts correctly filters SSE-style payloads', () => {
    const sseStyleContexts = [
      { id: 'ctx_1', name: '患者', type: 'core' as const, description: 'd', ubiquitousLanguage: [] },
      { id: 'ctx_2', name: '患者管理', type: 'core' as const, description: 'd', ubiquitousLanguage: [] }, // "管理" is VALID — not filtered
      { id: 'ctx_3', name: '认证授权', type: 'generic' as const, description: 'd', ubiquitousLanguage: [] },
      { id: 'ctx_4', name: 'X', type: 'core' as const, description: 'd', ubiquitousLanguage: [] }, // 过滤: 太短
      { id: 'ctx_5', name: '订单系统', type: 'supporting' as const, description: 'd', ubiquitousLanguage: [] }, // 过滤: 含"系统"
    ];

    const filtered = filterInvalidContexts(sseStyleContexts as unknown as PromptBC[]);
    expect(filtered.map(c => c.name)).toContain('患者管理'); // "管理" is valid, kept
    expect(filtered.map(c => c.name)).toContain('患者');  // valid, kept
    expect(filtered.map(c => c.name)).toContain('认证授权'); // valid, kept
    expect(filtered.map(c => c.name)).not.toContain('X');  // too short
    expect(filtered.map(c => c.name)).not.toContain('订单系统'); // contains "系统"
  });

  test('T3c: filterInvalidContexts does NOT validate ubiquitousLanguage (by design)', () => {
    // Filter only checks name length + forbidden patterns, NOT ubiquitousLanguage
    const withEmptyUbiquitous: PromptBC[] = [
      { name: '患者', type: 'core', description: 'd', ubiquitousLanguage: [] },
    ];
    expect(filterInvalidContexts(withEmptyUbiquitous)).toHaveLength(1);

    // Even with lots of ubiquitousLanguage terms, no filtering happens
    const withManyTerms: PromptBC[] = [
      { name: '患者', type: 'core', description: 'd', ubiquitousLanguage: ['a', 'b', 'c', 'd', 'e'] },
    ];
    expect(filterInvalidContexts(withManyTerms)).toHaveLength(1);
  });
});

// =============================================================================
// T4: Domain BoundedContext vs Canvas BoundedContext
// Domain BC: { id, name, description, type, keyResponsibilities?, relationships }
// Canvas BC: { id, name, description, type, keyResponsibilities? }
// =============================================================================

describe('T4: Domain BoundedContext has relationships field (Canvas missing)', () => {
  test('T4a: Domain BoundedContext requires relationships array', () => {
    const domainBC: DomainBC = {
      id: 'ctx_1',
      name: '患者管理',
      description: '患者注册建档',
      type: 'core',
      relationships: [], // required field in domain.ts
    };
    expect(domainBC.relationships).toHaveLength(0);
  });

  test('T4b: Canvas BoundedContext does not have relationships field', () => {
    const canvasBC: CanvasBC = {
      id: 'ctx_1',
      name: '患者管理',
      description: '患者注册建档',
      type: 'core',
    };
    expect('relationships' in canvasBC).toBe(false);
  });

  test('T4c: Domain BC requires relationships; Canvas BC omits it', () => {
    // Create actual objects matching each type
    const domainObj = { id: 'x', name: 'x', description: 'x', type: 'core' as const, relationships: [] } as DomainBC;
    const canvasObj = { id: 'x', name: 'x', description: 'x', type: 'core' as const } as CanvasBC;
    expect('relationships' in domainObj).toBe(true);
    expect('relationships' in canvasObj).toBe(false);
  });
});

// =============================================================================
// T5: validateCoreRatio consistency across all BoundedContext shapes
// =============================================================================

describe('T5: validateCoreRatio works consistently for all BC shapes', () => {
  test('T5a: SSE-style payload with id — ratio validation works', () => {
    const sseContexts = [
      { id: 'ctx_1', name: 'A', type: 'core' as const, description: 'd', ubiquitousLanguage: [] },
      { id: 'ctx_2', name: 'B', type: 'core' as const, description: 'd', ubiquitousLanguage: [] },
      { id: 'ctx_3', name: 'C', type: 'generic' as const, description: 'd', ubiquitousLanguage: [] },
    ];

    const result = validateCoreRatio(sseContexts as unknown as PromptBC[]);
    expect(result.ratio).toBeCloseTo(0.667, 2);
    expect(result.valid).toBe(true); // 66.7% within 40%-70% range
  });

  test('T5b: SSE-style with too many generic — ratio invalid', () => {
    const sseContexts = [
      { id: 'ctx_1', name: 'A', type: 'generic' as const, description: 'd', ubiquitousLanguage: [] },
      { id: 'ctx_2', name: 'B', type: 'generic' as const, description: 'd', ubiquitousLanguage: [] },
      { id: 'ctx_3', name: 'C', type: 'generic' as const, description: 'd', ubiquitousLanguage: [] },
      { id: 'ctx_4', name: 'D', type: 'core' as const, description: 'd', ubiquitousLanguage: [] },
    ];

    const result = validateCoreRatio(sseContexts as unknown as PromptBC[]);
    expect(result.ratio).toBeCloseTo(0.25, 2);
    expect(result.valid).toBe(false); // 25% < 40% min
  });
});

// =============================================================================
// T6: SSE event type field enum consistency
// Backend emits 'step_context' event with boundedContexts array.
// All BC types accept type: 'core' | 'supporting' | 'generic' | 'external'
// =============================================================================

describe('T6: BoundedContext type field accepts all 4 valid DDD types', () => {
  const allTypes = ['core', 'supporting', 'generic', 'external'] as const;

  test('T6a: Epic1 BC accepts all 4 type values', () => {
    allTypes.forEach(t => {
      const bc: PromptBC = {
        name: '测试',
        type: t,
        description: '测试描述',
        ubiquitousLanguage: [],
      };
      expect(bc.type).toBe(t);
    });
  });

  test('T6b: Canvas BC accepts all 4 type values', () => {
    allTypes.forEach(t => {
      const bc: CanvasBC = {
        id: 'ctx_test',
        name: '测试',
        description: '测试描述',
        type: t,
      };
      expect(bc.type).toBe(t);
    });
  });

  test('T6c: Domain BC accepts all 4 type values', () => {
    allTypes.forEach(t => {
      const bc: DomainBC = {
        id: 'ctx_test',
        name: '测试',
        description: '测试描述',
        type: t,
        relationships: [],
      };
      expect(bc.type).toBe(t);
    });
  });
});
