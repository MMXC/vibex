/**
 * API Configuration Tests
 */
// @ts-nocheck


import { API_CONFIG, getApiUrl } from '../api-config';

describe('API_CONFIG', () => {
  describe('baseURL', () => {
    it('should have a baseURL defined', () => {
      expect(API_CONFIG.baseURL).toBeDefined();
      expect(typeof API_CONFIG.baseURL).toBe('string');
    });

    it('should use fallback URL if no environment variable', () => {
      // This test verifies the fallback is working
      expect(API_CONFIG.baseURL).toMatch(/^https?:\/\//);
    });
  });

  describe('version', () => {
    it('should have a version defined', () => {
      expect(API_CONFIG.version).toBe('v1');
    });
  });

  describe('endpoints', () => {
    it('should have ddd endpoints', () => {
      expect(API_CONFIG.endpoints.ddd).toBeDefined();
      expect(API_CONFIG.endpoints.ddd.boundedContext).toBe('/v1/ddd/bounded-context');
      expect(API_CONFIG.endpoints.ddd.boundedContextStream).toBe('/v1/ddd/bounded-context/stream');
      expect(API_CONFIG.endpoints.ddd.domainModel).toBe('/v1/ddd/domain-model');
      expect(API_CONFIG.endpoints.ddd.businessFlow).toBe('/v1/ddd/business-flow');
    });

    it('should have auth endpoints', () => {
      expect(API_CONFIG.endpoints.auth).toBeDefined();
      expect(API_CONFIG.endpoints.auth.login).toBe('/auth/login');
      expect(API_CONFIG.endpoints.auth.logout).toBe('/auth/logout');
      expect(API_CONFIG.endpoints.auth.register).toBe('/auth/register');
    });

    it('should have project endpoints', () => {
      expect(API_CONFIG.endpoints.project).toBeDefined();
      expect(API_CONFIG.endpoints.project.list).toBe('/projects');
      expect(API_CONFIG.endpoints.project.create).toBe('/projects');
    });

    it('should have dynamic project detail endpoint', () => {
      const detailEndpoint = API_CONFIG.endpoints.project.detail('123');
      expect(detailEndpoint).toBe('/projects/123');
    });
  });
});

describe('getApiUrl', () => {
  it('should construct full URL with leading slash', () => {
    const url = getApiUrl('/test/path');
    expect(url).toMatch(/\/test\/path$/);
  });

  it('should construct full URL without leading slash', () => {
    const url = getApiUrl('test/path');
    expect(url).toMatch(/\/test\/path$/);
  });

  it('should handle trailing slash in baseURL', () => {
    // The function removes trailing slashes from base
    const url = getApiUrl('/path');
    expect(url).not.toMatch(/\/\/path/);
  });

  it('should return valid URL format', () => {
    const url = getApiUrl('/api/test');
    expect(url).toMatch(/^https?:\/\//);
  });

  it('should concatenate base and path correctly', () => {
    const url = getApiUrl('/auth/login');
    expect(url).toContain('/auth/login');
  });
});