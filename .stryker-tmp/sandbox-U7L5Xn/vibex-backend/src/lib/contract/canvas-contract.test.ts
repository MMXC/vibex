/**
 * @fileoverview Canvas API Contract Tests
 *
 * Epic 4: CI Contract Testing
 * 基于 canvas-validation.ts 和 packages/types/api/canvas.ts
 *
 * 测试目标: generate-flows API 契约
 * - valid contexts (1+ core) → success
 * - empty contexts → 400
 * - no core context → 400
 * - invalid context fields → 400
 */
// @ts-nocheck

import { validateContexts } from '../canvas-validation';

describe('Canvas API Contract Tests', () => {
  describe('POST /api/v1/canvas/generate-flows', () => {
    describe('Request Validation', () => {
      it('F4.1: should accept valid request with at least one core context', () => {
        const request = {
          contexts: [
            { id: 'ctx1', name: '用户管理', type: 'core' as const },
            { id: 'ctx2', name: '日志服务', type: 'generic' as const },
          ],
        };
        const result = validateContexts(request.contexts);
        expect(result.valid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('F4.2: should accept single core context', () => {
        const request = {
          contexts: [{ id: 'ctx1', name: '用户管理', type: 'core' as const }],
        };
        const result = validateContexts(request.contexts);
        expect(result.valid).toBe(true);
      });

      it('F4.3: should reject empty contexts array', () => {
        const result = validateContexts([]);
        expect(result.valid).toBe(false);
        expect(result.issues.some((i) => i.message.includes('不能为空'))).toBe(true);
      });

      it('F4.4: should reject non-array contexts', () => {
        expect(validateContexts(null as any).valid).toBe(false);
        expect(validateContexts('string' as any).valid).toBe(false);
        expect(validateContexts(123 as any).valid).toBe(false);
      });

      it('F4.5: should reject contexts without a core type', () => {
        const request = {
          contexts: [
            { id: 'ctx1', name: '日志', type: 'generic' as const },
            { id: 'ctx2', name: '配置', type: 'supporting' as const },
          ],
        };
        const result = validateContexts(request.contexts);
        expect(result.valid).toBe(false);
        expect(result.issues.some((i) => i.message.includes('core'))).toBe(true);
      });

      it('F4.6: should reject context missing id', () => {
        const request = {
          contexts: [{ name: '用户管理', type: 'core' as const }],
        };
        const result = validateContexts(request.contexts);
        expect(result.valid).toBe(false);
        expect(result.issues.some((i) => i.field === 'contexts[0].id')).toBe(true);
      });

      it('F4.7: should reject context missing name', () => {
        const request = {
          contexts: [{ id: 'ctx1', type: 'core' as const }],
        };
        const result = validateContexts(request.contexts);
        expect(result.valid).toBe(false);
        expect(result.issues.some((i) => i.field === 'contexts[0].name')).toBe(true);
      });

      it('F4.8: should reject invalid context type', () => {
        const request = {
          contexts: [
            { id: 'ctx1', name: '用户管理', type: 'core' as const },
            { id: 'ctx2', name: '无效类型', type: 'invalid_type' as const },
          ],
        };
        const result = validateContexts(request.contexts);
        expect(result.valid).toBe(false);
        expect(result.issues.some((i) => i.field === 'contexts[1].type')).toBe(true);
      });

      it('F4.9: should accept all valid context types', () => {
        const request = {
          contexts: [
            { id: 'ctx1', name: '核心域', type: 'core' as const },
            { id: 'ctx2', name: '支撑域', type: 'supporting' as const },
            { id: 'ctx3', name: '通用域', type: 'generic' as const },
            { id: 'ctx4', name: '外部域', type: 'external' as const },
          ],
        };
        const result = validateContexts(request.contexts);
        expect(result.valid).toBe(true);
      });

      it('F4.10: should accumulate multiple validation errors', () => {
        const request = {
          contexts: [
            { name: '无id', type: 'invalid' as const },
            { id: 'ctx2', type: 'supporting' as const },
          ],
        };
        const result = validateContexts(request.contexts);
        expect(result.valid).toBe(false);
        expect(result.issues.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('Response Shape', () => {
      it('F4.11: error response should contain issues array with field and message', () => {
        const result = validateContexts([]);
        expect(result.valid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        result.issues.forEach((issue) => {
          expect(typeof issue.field).toBe('string');
          expect(typeof issue.message).toBe('string');
        });
      });
    });
  });
});
