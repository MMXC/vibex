/**
 * React Query Client 配置测试
 */

import { CACHE_CONFIG, queryClient, queryKeys } from '../query-client';

describe('query-client', () => {
  describe('CACHE_CONFIG', () => {
    it('should have valid STALE_TIME', () => {
      expect(CACHE_CONFIG.STALE_TIME).toBe(5 * 60 * 1000);
    });

    it('should have valid GC_TIME', () => {
      expect(CACHE_CONFIG.GC_TIME).toBe(30 * 60 * 1000);
    });

    it('should have valid QUERY_RETRY', () => {
      expect(CACHE_CONFIG.QUERY_RETRY).toBe(3);
    });

    it('should have valid MUTATION_RETRY', () => {
      expect(CACHE_CONFIG.MUTATION_RETRY).toBe(2);
    });

    it('should have valid RETRY_DELAY function', () => {
      expect(typeof CACHE_CONFIG.RETRY_DELAY).toBe('function');
      expect(CACHE_CONFIG.RETRY_DELAY(0)).toBe(1000);
      expect(CACHE_CONFIG.RETRY_DELAY(1)).toBe(2000);
      expect(CACHE_CONFIG.RETRY_DELAY(10)).toBe(30000); // capped at 30s
    });

    it('should have REFETCH_ON_WINDOW_FOCUS as false', () => {
      expect(CACHE_CONFIG.REFETCH_ON_WINDOW_FOCUS).toBe(false);
    });
  });

  describe('queryClient', () => {
    it('should be a QueryClient instance', () => {
      expect(queryClient).toBeDefined();
    });

    it('should have default options configured', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries).toBeDefined();
      expect(defaultOptions.queries?.retry).toBe(CACHE_CONFIG.QUERY_RETRY);
      expect(defaultOptions.queries?.staleTime).toBe(CACHE_CONFIG.STALE_TIME);
      expect(defaultOptions.queries?.gcTime).toBe(CACHE_CONFIG.GC_TIME);
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(CACHE_CONFIG.REFETCH_ON_WINDOW_FOCUS);
      expect(defaultOptions.mutations).toBeDefined();
      expect(defaultOptions.mutations?.retry).toBe(CACHE_CONFIG.MUTATION_RETRY);
    });
  });

  describe('queryKeys', () => {
    describe('boundedContexts', () => {
      it('should generate correct query key', () => {
        const key = queryKeys.boundedContexts('test requirement');
        expect(key).toEqual(['bounded-contexts', 'test requirement']);
      });
    });

    describe('domainModels', () => {
      it('should generate correct query key', () => {
        const key = queryKeys.domainModels('test requirement');
        expect(key).toEqual(['domain-models', 'test requirement']);
      });
    });

    describe('businessFlow', () => {
      it('should generate correct query key', () => {
        const key = queryKeys.businessFlow('test requirement');
        expect(key).toEqual(['business-flow', 'test requirement']);
      });
    });

    describe('projects', () => {
      it('should have static query key', () => {
        expect(queryKeys.projects).toEqual(['projects']);
      });
    });

    describe('project', () => {
      it('should generate correct query key with id', () => {
        const key = queryKeys.project('123');
        expect(key).toEqual(['project', '123']);
      });
    });

    describe('user', () => {
      it('should have static query key', () => {
        expect(queryKeys.user).toEqual(['user']);
      });
    });

    describe('templates', () => {
      it('should have static query key', () => {
        expect(queryKeys.templates).toEqual(['templates']);
      });
    });
  });
});
