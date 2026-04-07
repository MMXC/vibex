/**
 * @fileoverview Canvas Validation Middleware Tests
 *
 * Epic 2: BackendMiddleware
 */
// @ts-nocheck

import { validateContexts, validateGenerateFlowsRequest } from './canvas-validation';

describe('canvas-validation', () => {
  describe('validateContexts', () => {
    it('should accept valid contexts with at least one core', () => {
      const contexts = [
        { id: 'ctx1', name: '用户管理', type: 'core' },
        { id: 'ctx2', name: '日志', type: 'generic' },
      ];
      const result = validateContexts(contexts);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject empty array', () => {
      const result = validateContexts([]);
      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual({
        field: 'contexts',
        message: 'contexts 不能为空',
      });
    });

    it('should reject non-array input', () => {
      expect(validateContexts(null).valid).toBe(false);
      expect(validateContexts('string').valid).toBe(false);
      expect(validateContexts(123).valid).toBe(false);
    });

    it('should reject contexts without a core type', () => {
      const contexts = [
        { id: 'ctx1', name: '日志', type: 'generic' },
        { id: 'ctx2', name: '配置', type: 'supporting' },
      ];
      const result = validateContexts(contexts);
      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual({
        field: 'contexts',
        message: '至少需要一个 type 为 core 的上下文',
      });
    });

    it('should reject context without id', () => {
      const contexts = [{ name: '用户管理', type: 'core' }];
      const result = validateContexts(contexts);
      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual({
        field: 'contexts[0].id',
        message: 'contexts[0].id 必须是非空字符串',
      });
    });

    it('should reject context without name', () => {
      const contexts = [{ id: 'ctx1', type: 'core' }];
      const result = validateContexts(contexts);
      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual({
        field: 'contexts[0].name',
        message: 'contexts[0].name 必须是字符串',
      });
    });

    it('should reject context with invalid type', () => {
      const contexts = [
        { id: 'ctx1', name: '测试', type: 'core' },
        { id: 'ctx2', name: '无效', type: 'invalid_type' },
      ];
      const result = validateContexts(contexts);
      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual({
        field: 'contexts[1].type',
        message: 'contexts[1].type 必须是 core|supporting|generic|external 之一',
      });
    });

    it('should reject empty string id', () => {
      const contexts = [{ id: '', name: '用户管理', type: 'core' }];
      const result = validateContexts(contexts);
      expect(result.valid).toBe(false);
    });

    it('should accept context with optional description', () => {
      const contexts = [
        { id: 'ctx1', name: '用户管理', description: '用户注册登录', type: 'core' },
      ];
      const result = validateContexts(contexts);
      expect(result.valid).toBe(true);
    });

    it('should accumulate multiple issues', () => {
      const contexts = [
        { name: '无id', type: 'invalid' },
        { id: 'ctx2', type: 'supporting' },
      ];
      const result = validateContexts(contexts);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('validateGenerateFlowsRequest', () => {
    it('should accept valid request body', () => {
      const body = {
        contexts: [{ id: 'ctx1', name: '用户管理', type: 'core' }],
      };
      const result = validateGenerateFlowsRequest(body);
      expect(result.valid).toBe(true);
    });

    it('should reject null body', () => {
      const result = validateGenerateFlowsRequest(null);
      expect(result.valid).toBe(false);
      expect(result.issues[0].field).toBe('body');
    });

    it('should reject non-object body', () => {
      const result = validateGenerateFlowsRequest('string');
      expect(result.valid).toBe(false);
    });

    it('should reject body without contexts', () => {
      const result = validateGenerateFlowsRequest({});
      expect(result.valid).toBe(false);
    });
  });
});
