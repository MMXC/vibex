/**
 * @fileoverview Canvas API Response Validation Tests
 *
 * Epic 3: FrontendValidation
 */
import type { GenerateContextsOutput, GenerateFlowsOutput, GenerateComponentsOutput } from '../types';

// Re-implement validators for testing (same logic as canvasApi.ts)
function isValidGenerateContextsResponse(value: unknown): value is GenerateContextsOutput {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.success === 'boolean' &&
    Array.isArray(obj.contexts) &&
    typeof obj.generationId === 'string' &&
    typeof obj.confidence === 'number'
  );
}

function isValidGenerateFlowsResponse(value: unknown): value is GenerateFlowsOutput {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.success === 'boolean' &&
    Array.isArray(obj.flows) &&
    typeof obj.confidence === 'number'
  );
}

function isValidGenerateComponentsResponse(value: unknown): value is GenerateComponentsOutput {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.success === 'boolean' && Array.isArray(obj.components);
}

describe('canvasApi response validation', () => {
  describe('isValidGenerateContextsResponse', () => {
    it('should accept valid response', () => {
      const response = {
        success: true,
        contexts: [{ id: 'ctx1', name: '用户管理', description: '用户注册登录', type: 'core' as const }],
        generationId: 'sess_123',
        confidence: 0.85,
      };
      expect(isValidGenerateContextsResponse(response)).toBe(true);
    });

    it('should accept error response', () => {
      const response = {
        success: false,
        contexts: [],
        generationId: 'sess_123',
        confidence: 0,
        error: 'some error',
      };
      expect(isValidGenerateContextsResponse(response)).toBe(true);
    });

    it('should reject null', () => {
      expect(isValidGenerateContextsResponse(null)).toBe(false);
    });

    it('should reject missing success field', () => {
      expect(isValidGenerateContextsResponse({ contexts: [], generationId: 's', confidence: 0 })).toBe(false);
    });

    it('should reject missing generationId field', () => {
      expect(isValidGenerateContextsResponse({ success: true, contexts: [], confidence: 0 })).toBe(false);
    });

    it('should reject non-array contexts', () => {
      expect(isValidGenerateContextsResponse({ success: true, contexts: 'not-array', generationId: 's', confidence: 0 })).toBe(false);
    });
  });

  describe('isValidGenerateFlowsResponse', () => {
    it('should accept valid response', () => {
      const response = {
        success: true,
        flows: [
          {
            name: '用户注册流程',
            contextId: 'ctx1',
            description: '用户注册',
            steps: [
              { name: '填写表单', actor: '用户', description: '输入信息', order: 0 },
            ],
          },
        ],
        confidence: 0.8,
      };
      expect(isValidGenerateFlowsResponse(response)).toBe(true);
    });

    it('should accept error response', () => {
      expect(isValidGenerateFlowsResponse({ success: false, flows: [], confidence: 0 })).toBe(true);
    });

    it('should reject null', () => {
      expect(isValidGenerateFlowsResponse(null)).toBe(false);
    });

    it('should reject missing flows field', () => {
      expect(isValidGenerateFlowsResponse({ success: true, confidence: 0.8 })).toBe(false);
    });

    it('should reject non-boolean success', () => {
      expect(isValidGenerateFlowsResponse({ success: 'true', flows: [], confidence: 0 })).toBe(false);
    });
  });

  describe('isValidGenerateComponentsResponse', () => {
    it('should accept valid response', () => {
      const response = {
        success: true,
        components: [
          {
            name: '注册页面',
            flowId: 'flow1',
            type: 'page' as const,
            description: '用户注册表单',
          },
        ],
      };
      expect(isValidGenerateComponentsResponse(response)).toBe(true);
    });

    it('should accept empty components', () => {
      expect(isValidGenerateComponentsResponse({ success: false, components: [] })).toBe(true);
    });

    it('should reject null', () => {
      expect(isValidGenerateComponentsResponse(null)).toBe(false);
    });

    it('should reject non-object', () => {
      expect(isValidGenerateComponentsResponse('string')).toBe(false);
    });

    it('should reject missing components field', () => {
      expect(isValidGenerateComponentsResponse({ success: true })).toBe(false);
    });
  });
});
