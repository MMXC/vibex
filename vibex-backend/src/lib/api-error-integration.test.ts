/**
 * api-error-integration.test.ts
 * E5: 统一 API 错误格式 — 集成测试
 *
 * 验证所有路由的错误返回符合统一格式: { error, code, status }
 * 以及 apiError() 函数在各场景下的行为正确性。
 */
import { apiError, ERROR_CODES } from './api-error';

describe('E5: 统一 API 错误格式 — apiError 集成验证', () => {
  describe('apiError() 返回格式', () => {
    it('返回 { error, code, status } 三字段', () => {
      const result = apiError('Not found', ERROR_CODES.NOT_FOUND);
      expect(result).toHaveProperty('error', 'Not found');
      expect(result).toHaveProperty('code', 'NOT_FOUND');
      expect(result).toHaveProperty('status', 404);
    });

    it('可选 details 字段', () => {
      const result = apiError('Validation failed', ERROR_CODES.VALIDATION_ERROR, { field: 'name' });
      expect(result.details).toEqual({ field: 'name' });
    });

    it('无 details 时不包含该字段', () => {
      const result = apiError('Error', ERROR_CODES.INTERNAL_ERROR);
      expect(result).not.toHaveProperty('details');
    });
  });

  describe('4xx 错误码 → 正确 status', () => {
    it.each([
      ['UNAUTHORIZED', 401],
      ['FORBIDDEN', 403],
      ['NOT_FOUND', 404],
      ['VALIDATION_ERROR', 422],
      ['CONFLICT', 409],
      ['BAD_REQUEST', 400],
    ])('ERROR_CODES.%s → status %i', (code, status) => {
      const result = apiError('test', ERROR_CODES[code as keyof typeof ERROR_CODES]);
      expect(result.status).toBe(status);
    });
  });

  describe('5xx 错误码 → 正确 status', () => {
    it.each([
      ['INTERNAL_ERROR', 500],
      ['SERVICE_UNAVAILABLE', 503],
      ['AI_SERVICE_ERROR', 500],
      ['DATABASE_ERROR', 500],
      ['RATE_LIMITED', 429],
    ])('ERROR_CODES.%s → status %i', (code, status) => {
      const result = apiError('test', ERROR_CODES[code as keyof typeof ERROR_CODES]);
      expect(result.status).toBe(status);
    });
  });

  describe('domain-specific 错误码', () => {
    it('FLOW_NOT_FOUND → 404', () => {
      expect(apiError('Flow not found', ERROR_CODES.FLOW_NOT_FOUND).status).toBe(404);
    });
    it('PAGE_NOT_FOUND → 404', () => {
      expect(apiError('Page not found', ERROR_CODES.PAGE_NOT_FOUND).status).toBe(404);
    });
    it('PROJECT_NOT_FOUND → 404', () => {
      expect(apiError('Project not found', ERROR_CODES.PROJECT_NOT_FOUND).status).toBe(404);
    });
    it('TEMPLATE_NOT_FOUND → 404', () => {
      expect(apiError('Template not found', ERROR_CODES.TEMPLATE_NOT_FOUND).status).toBe(404);
    });
    it('DOMAIN_MODEL_NOT_FOUND → 404', () => {
      expect(apiError('Domain model not found', ERROR_CODES.DOMAIN_MODEL_NOT_FOUND).status).toBe(404);
    });
    it('USER_NOT_FOUND → 404', () => {
      expect(apiError('User not found', ERROR_CODES.USER_NOT_FOUND).status).toBe(404);
    });
  });

  describe('所有错误码均可实例化', () => {
    it('覆盖 ERROR_CODES 枚举全部键', () => {
      const codes = Object.keys(ERROR_CODES) as Array<keyof typeof ERROR_CODES>;
      expect(codes.length).toBeGreaterThan(15);
      codes.forEach((code) => {
        const result = apiError('test', ERROR_CODES[code]);
        expect(result).toHaveProperty('code', ERROR_CODES[code]);
        expect(result.status).toBeGreaterThan(0);
      });
    });
  });
});
