/**
 * DDD API Tests
 */

import { dddApi, DddApi } from '../ddd';

// Mock httpClient
vi.mock('../../client', () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

import { httpClient } from '../../client';
const mockHttpClient = httpClient as any;

describe('DddApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateBoundedContext', () => {
    // Note: httpClient.post already extracts .data from axios response,
    // so mock should return the inner data directly (not axios response format)
    const mockResponse = {
      contexts: [
        {
          name: 'UserContext',
          boundedContext: 'user',
          description: 'User management',
          entities: [],
        },
      ],
    };

    it('should call httpClient.post with correct params', async () => {
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await dddApi.generateBoundedContext('build a user system');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/ddd/bounded-context',
        { requirementText: 'build a user system', projectId: undefined }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should pass projectId when provided', async () => {
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await dddApi.generateBoundedContext('test', 'project-123');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/ddd/bounded-context',
        { requirementText: 'test', projectId: 'project-123' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle error response', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'));

      await expect(dddApi.generateBoundedContext('test')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('generateDomainModel', () => {
    // httpClient.post already extracts .data, so mock returns inner data directly
    const mockResponse = {
      success: true,
      domainModels: [{ name: 'User' }],
      mermaidCode: 'graph TD',
    };

    it('should call httpClient.post with boundedContexts', async () => {
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const contexts = [{ name: 'UserContext', boundedContext: 'user' }];
      const result = await dddApi.generateDomainModel(
        contexts,
        'create user model'
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith('/ddd/domain-model', {
        boundedContexts: contexts,
        requirementText: 'create user model',
        projectId: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass all params including projectId', async () => {
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const contexts = [{ name: 'TestContext' }];
      const result = await dddApi.generateDomainModel(
        contexts,
        'test',
        'proj-456'
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith('/ddd/domain-model', {
        boundedContexts: contexts,
        requirementText: 'test',
        projectId: 'proj-456',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle error response', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('API error'));

      await expect(
        dddApi.generateDomainModel([], 'test')
      ).rejects.toThrow('API error');
    });
  });

  describe('generateBusinessFlow', () => {
    // httpClient.post already extracts .data, so mock returns inner data directly
    const mockResponse = {
      success: true,
      businessFlow: { steps: [] },
      mermaidCode: 'graph LR',
    };

    it('should call httpClient.post with domainModels', async () => {
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const domainModels = [{ name: 'User' }];
      const result = await dddApi.generateBusinessFlow(
        domainModels,
        'create flow'
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith('/ddd/business-flow', {
        domainModels: domainModels,
        requirementText: 'create flow',
        projectId: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass projectId when provided', async () => {
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const models = [{ name: 'Test' }];
      const result = await dddApi.generateBusinessFlow(
        models,
        'test',
        'proj-789'
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith('/ddd/business-flow', {
        domainModels: models,
        requirementText: 'test',
        projectId: 'proj-789',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle error response', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Server error'));

      await expect(
        dddApi.generateBusinessFlow([], 'test')
      ).rejects.toThrow('Server error');
    });
  });

  describe('createDddApi', () => {
    it('should create DddApi instance', () => {
      const api = dddApi;
      expect(api).toBeDefined();
      expect(typeof api.generateBoundedContext).toBe('function');
      expect(typeof api.generateDomainModel).toBe('function');
      expect(typeof api.generateBusinessFlow).toBe('function');
    });
  });
});
