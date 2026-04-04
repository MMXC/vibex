/**
 * @fileoverview Canvas API Response Validation Tests
 *
 * Epic: Zod Schema 统一 (E1)
 * Tests the Zod-based validators from canvasApiValidation.ts.
 */
import type { GenerateContextsOutput, GenerateFlowsOutput, GenerateComponentsOutput } from '../types';
import {
  isValidGenerateContextsResponse,
  isValidGenerateFlowsResponse,
  isValidGenerateComponentsResponse,
} from '../canvasApiValidation';

describe('isValidGenerateContextsResponse', () => {
  it('should accept valid response', () => {
    const response: GenerateContextsOutput = {
      success: true,
      contexts: [{ id: 'ctx1', name: '用户管理', description: '用户注册登录', type: 'core' }],
      generationId: 'sess_123',
      confidence: 0.85,
    };
    expect(isValidGenerateContextsResponse(response)).toBe(true);
  });

  it('should accept error response', () => {
    const response: GenerateContextsOutput = {
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

  // E1-T2: Reverse test — validator must reject sessionId field
  it('should reject sessionId field (wrong field name)', () => {
    expect(isValidGenerateContextsResponse({
      success: true,
      contexts: [],
      sessionId: 'gen_123', // ❌ wrong field name
      confidence: 0.85,
    })).toBe(false);
  });

  it('should reject non-array contexts', () => {
    expect(isValidGenerateContextsResponse({ success: true, contexts: 'not-array', generationId: 's', confidence: 0 })).toBe(false);
  });

  it('should reject wrong context type', () => {
    expect(isValidGenerateContextsResponse({ success: true, contexts: [{ id: 1 }], generationId: 's', confidence: 0 })).toBe(false);
  });
});

describe('isValidGenerateFlowsResponse', () => {
  it('should accept valid response', () => {
    const response: GenerateFlowsOutput = {
      success: true,
      flows: [{ name: '登录流程', contextId: 'ctx1', steps: [{ name: '输入账号', actor: '用户', description: '', order: 1 }] }],
      confidence: 0.9,
    };
    expect(isValidGenerateFlowsResponse(response)).toBe(true);
  });

  it('should accept error response', () => {
    const response: GenerateFlowsOutput = {
      success: false,
      flows: [],
      confidence: 0,
      error: 'no contexts',
    };
    expect(isValidGenerateFlowsResponse(response)).toBe(true);
  });

  it('should reject null', () => {
    expect(isValidGenerateFlowsResponse(null)).toBe(false);
  });

  it('should reject missing flows field', () => {
    expect(isValidGenerateFlowsResponse({ success: true, confidence: 0.9 })).toBe(false);
  });

  it('should reject non-boolean success', () => {
    expect(isValidGenerateFlowsResponse({ flows: [], confidence: 0.9 })).toBe(false);
  });
});

describe('isValidGenerateComponentsResponse', () => {
  it('should accept valid response', () => {
    const response: GenerateComponentsOutput = {
      success: true,
      components: [{ name: '登录页', flowId: 'flow1', type: 'page', description: '' }],
      confidence: 0.88,
    };
    expect(isValidGenerateComponentsResponse(response)).toBe(true);
  });

  it('should accept empty components', () => {
    const response: GenerateComponentsOutput = {
      success: true,
      components: [],
      confidence: 0.88,
    };
    expect(isValidGenerateComponentsResponse(response)).toBe(true);
  });

  it('should reject null', () => {
    expect(isValidGenerateComponentsResponse(null)).toBe(false);
  });

  it('should reject non-object', () => {
    expect(isValidGenerateComponentsResponse('string' as unknown)).toBe(false);
  });

  it('should reject missing components field', () => {
    expect(isValidGenerateComponentsResponse({ success: true, confidence: 0.88 })).toBe(false);
  });

  it('should reject wrong component type', () => {
    expect(isValidGenerateComponentsResponse({ success: true, components: [{ name: 1 }], confidence: 0.88 })).toBe(false);
  });
});
